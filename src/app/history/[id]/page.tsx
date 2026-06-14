"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AnalysisResultView from "@/components/AnalysisResult";
import { deleteAnalysis, formatDate, getAnalysisById } from "@/lib/storage";
import type { SavedAnalysis } from "@/lib/types";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const found = getAnalysisById(id);
    setAnalysis(found);
    setLoaded(true);
  }, [id]);

  const handleDelete = () => {
    deleteAnalysis(id);
    router.push("/history");
  };

  if (!loaded) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50">
        <AppHeader title="분석 상세" backHref="/history" />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <p className="mb-4 text-base font-semibold text-slate-600">
            분석 결과를 찾을 수 없습니다
          </p>
          <a
            href="/history"
            className="rounded-2xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white"
          >
            이력으로 돌아가기
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader
        title="분석 상세"
        subtitle={formatDate(analysis.createdAt)}
        backHref="/history"
        action={
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50"
            aria-label="삭제"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        }
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8 pt-4">
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={analysis.imageDataUrl}
            alt="분석 현장"
            className="max-h-72 w-full object-contain"
          />
        </div>

        <AnalysisResultView
          result={analysis.result}
          mode={analysis.mode ?? "ai"}
        />
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              분석 결과 삭제
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              이 분석 결과를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
