import { MAX_HISTORY_ITEMS, STORAGE_KEY } from "./constants";
import type { SavedAnalysis } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAllAnalyses(): SavedAnalysis[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAnalysisById(id: string): SavedAnalysis | null {
  return getAllAnalyses().find((item) => item.id === id) ?? null;
}

export function saveAnalysis(analysis: SavedAnalysis): void {
  if (!isBrowser()) return;

  const existing = getAllAnalyses();
  const updated = [analysis, ...existing.filter((item) => item.id !== analysis.id)].slice(
    0,
    MAX_HISTORY_ITEMS,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteAnalysis(id: string): void {
  if (!isBrowser()) return;

  const updated = getAllAnalyses().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
