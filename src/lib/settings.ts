export type AnalysisMode = "demo" | "ai";

export interface AppSettings {
  mode: AnalysisMode;
  apiKey: string;
}

const SETTINGS_KEY = "safety-lens-settings";

const DEFAULT_SETTINGS: AppSettings = {
  mode: "demo",
  apiKey: "",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      mode: parsed.mode === "ai" ? "ai" : "demo",
      apiKey: parsed.apiKey ?? "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getModeLabel(mode: AnalysisMode): string {
  return mode === "demo" ? "데모 (무료)" : "AI 분석";
}
