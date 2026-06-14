"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import {
  AI_USAGE_LIMIT,
  getRemainingDailyUses,
} from "@/lib/usage-guard";
import {
  getSettings,
  saveSettings,
  type AnalysisMode,
  type AppSettings,
} from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    mode: "demo",
    apiKey: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [remainingUses, setRemainingUses] = useState(AI_USAGE_LIMIT);

  useEffect(() => {
    setSettings(getSettings());
    setRemainingUses(getRemainingDailyUses());
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
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <input
                type="radio"
                name="mode"
                checked={settings.mode === "demo"}
                onChange={() => handleModeChange("demo")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  데모 모드 (무료 · 기본)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                  API 호출 없음. 일반적인 안전 점검 가이드를 즉시 제공합니다.
                  비용 0원, 횟수 제한 없음.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="radio"
                name="mode"
                checked={settings.mode === "ai"}
                onChange={() => handleModeChange("ai")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  AI 분석 (본인 API Key)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Google Gemini 무료 API Key로 사진 기반 AI 분석. 앱 운영자
                  비용 0원, 본인 Google 무료 한도 사용.
                </p>
              </div>
            </label>
          </div>
        </section>

        {settings.mode === "ai" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-slate-800">
              Gemini API Key
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              본인 Google 계정에서 발급한 Key만 사용합니다. 기기에만 저장되며
              서버에 영구 보관되지 않습니다.
            </p>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="AIza..."
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
              Google AI Studio에서 무료 API Key 발급 →
            </a>

            <p className="mt-3 text-xs text-slate-400">
              AI 분석 보호: 하루 최대 {AI_USAGE_LIMIT}회, 요청 간격 15초 (오늘
              남은 횟수: {remainingUses}회)
            </p>
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
            <strong className="text-slate-600">0원 구조:</strong> 데모 모드는
            API를 전혀 사용하지 않습니다. AI 모드는 본인 Google 무료 한도만
            사용하므로 앱 운영 비용이 발생하지 않습니다. Vercel 서버의
            GEMINI_API_KEY는 더 이상 필수가 아닙니다.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
