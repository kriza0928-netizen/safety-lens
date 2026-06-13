import type { RiskLevel } from "./types";

export const STORAGE_KEY = "safety-lens-analyses";
export const MAX_HISTORY_ITEMS = 50;

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "매우 높음",
};

export const RISK_LEVEL_COLORS: Record<
  RiskLevel,
  { bg: string; text: string; border: string; dot: string }
> = {
  low: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  critical: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};
