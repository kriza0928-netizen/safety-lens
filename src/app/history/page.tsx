"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import HistoryCard from "@/components/HistoryCard";
import { getAllAnalyses } from "@/lib/storage";
import type { SavedAnalysis } from "@/lib/types";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAnalyses(getAllAnalyses());
    setLoaded(true);
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader title="분석 이력" subtitle={`총 ${analyses.length}건`} />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {!loaded ? (
          <div className="py-12 text-center text-sm text-slate-400">
            불러오는 중...
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mb-1 text-base font-semibold text-slate-600">
              분석 이력이 없습니다
            </p>
            <p className="text-sm text-slate-400">
              현장 사진을 분석하면 결과가 여기에 저장됩니다.
            </p>
            <a
              href="/"
              className="mt-6 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              분석 시작하기
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <HistoryCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
