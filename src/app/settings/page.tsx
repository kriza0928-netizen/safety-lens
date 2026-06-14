"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import {
  getSettings,
  saveSettings,
  type AnalysisMode,
  type AppSettings,
} from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    mode: "ai",
    apiKey: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleModeChange = (mode: AnalysisMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader title="설정" subtitle="분석 모드 및 API Key 관리" />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 pb-28 pt-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-800">분석 모드</h2>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <input
                type="radio"
                name="mode"
                checked={settings.mode === "ai"}
                onChange={() => handleModeChange("ai")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Gemini AI 분석 (기본)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-orange-700">
                  사진을 Gemini Vision API로 분석합니다. 서버에 설정된
                  GEMINI_API_KEY를 사용합니다.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="radio"
                name="mode"
                checked={settings.mode === "demo"}
                onChange={() => handleModeChange("demo")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">데모 모드</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  API 호출 없이 일반 안전 점검 가이드만 표시합니다.
                </p>
              </div>
            </label>
          </div>
        </section>

        {settings.mode === "ai" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-slate-800">
              개인 API Key (선택)
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              비워두면 서버의 GEMINI_API_KEY를 사용합니다. 입력하면 본인 Key로
              분석합니다.
            </p>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="비워두면 서버 Key 사용"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                {showKey ? "숨김" : "표시"}
              </button>
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-orange-600 underline"
            >
              Google AI Studio에서 API Key 발급 →
            </a>
          </section>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.98]"
        >
          {saved ? "저장됨 ✓" : "설정 저장"}
        </button>

        <section className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-500">
            로컬: 프로젝트 루트 <code className="text-slate-600">.env.local</code>
            에 GEMINI_API_KEY 설정. Vercel: Environment Variables에 동일하게
            등록.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
