"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import AppHeader from "@/components/AppHeader";
import AnalysisResultView from "@/components/AnalysisResult";
import BottomNav from "@/components/BottomNav";
import ImageCapture from "@/components/ImageCapture";
import ImagePreview from "@/components/ImagePreview";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatAnalysisError } from "@/lib/errors";
import { saveAnalysis } from "@/lib/storage";
import type {
  AnalyzeErrorResponse,
  AnalyzeResponse,
  SavedAnalysis,
  SafetyAnalysisResult,
} from "@/lib/types";

type AppState = "idle" | "ready" | "analyzing" | "result" | "error";

export default function HomePage() {
  const [state, setState] = useState<AppState>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [result, setResult] = useState<SafetyAnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleImageSelect = (file: File, dataUrl: string, mimeType: string) => {
    setImageFile(file);
    setImageDataUrl(dataUrl);
    setImageMimeType(mimeType);
    setResult(null);
    setSavedId(null);
    setErrorMessage("");
    setState("ready");
  };

  const handleClear = () => {
    setImageFile(null);
    setImageDataUrl("");
    setImageMimeType("image/jpeg");
    setResult(null);
    setSavedId(null);
    setErrorMessage("");
    setState("idle");
  };

  const handleAnalyze = async () => {
    if (!imageFile || !imageDataUrl) return;

    setState("analyzing");
    setErrorMessage("");

    try {
      const base64 = imageDataUrl.split(",")[1];
      if (!base64) throw new Error("이미지 데이터를 읽을 수 없습니다.");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType: imageMimeType,
        }),
      });

      const data = (await response.json()) as
        | AnalyzeResponse
        | AnalyzeErrorResponse;

      if (!data.success) {
        throw new Error(data.error);
      }

      const saved: SavedAnalysis = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        imageDataUrl,
        result: data.result,
      };

      saveAnalysis(saved);
      setResult(data.result);
      setSavedId(saved.id);
      setState("result");
    } catch (error) {
      setErrorMessage(formatAnalysisError(error));
      setState("error");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader
        title="Safety Lens"
        subtitle="산업안전 현장 위험요소 AI 분석"
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {state !== "result" && (
          <>
            <div className="mb-6">
              <h2 className="mb-1 text-base font-bold text-slate-800">
                현장 사진 분석
              </h2>
              <p className="text-sm text-slate-500">
                사진을 촬영하거나 업로드하면 AI가 위험요소를 분석합니다.
              </p>
            </div>

            {!imageDataUrl ? (
              <ImageCapture
                onImageSelect={handleImageSelect}
                disabled={state === "analyzing"}
              />
            ) : (
              <div className="space-y-4">
                <ImagePreview dataUrl={imageDataUrl} onClear={handleClear} />

                {state === "analyzing" ? (
                  <LoadingSpinner />
                ) : (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50"
                  >
                    안전 분석 시작
                  </button>
                )}

                {state === "error" && errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {errorMessage}
                    </p>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="mt-2 text-sm font-semibold text-red-600 underline"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {state === "result" && result && (
          <div className="space-y-4">
            <ImagePreview dataUrl={imageDataUrl} onClear={handleClear} />
            <AnalysisResultView result={result} showSaveNotice={!!savedId} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-2xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                새 분석
              </button>
              {savedId && (
                <a
                  href={`/history/${savedId}`}
                  className="flex-1 rounded-2xl bg-slate-800 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-900"
                >
                  상세보기
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-500">
            본 분석 결과는 AI 기반 참고 자료이며, 법적 판단이나 최종 안전
            확인을 대체하지 않습니다. 중요 사항은 현장 전문가의 점검을
            권장합니다.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
