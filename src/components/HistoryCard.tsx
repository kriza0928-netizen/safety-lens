"use client";

import Link from "next/link";
import RiskBadge from "./RiskBadge";
import { formatDate } from "@/lib/storage";
import type { SavedAnalysis } from "@/lib/types";

interface HistoryCardProps {
  analysis: SavedAnalysis;
}

export default function HistoryCard({ analysis }: HistoryCardProps) {
  const hazardCount = analysis.result.hazards.length;
  const summaryPreview =
    analysis.result.siteSummary.length > 80
      ? `${analysis.result.siteSummary.slice(0, 80)}...`
      : analysis.result.siteSummary;

  return (
    <Link
      href={`/history/${analysis.id}`}
      className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={analysis.imageDataUrl}
          alt="분석 현장"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-slate-400">
            {formatDate(analysis.createdAt)}
          </p>
          <RiskBadge level={analysis.result.riskLevel} size="sm" />
        </div>
        <p className="line-clamp-2 text-sm text-slate-700">{summaryPreview}</p>
        <p className="text-xs text-slate-400">
          위험요소 {hazardCount}건 · {analysis.result.accidentTypes.length}개
          사고유형
        </p>
      </div>
    </Link>
  );
}
