export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface HazardItem {
  title: string;
  description: string;
}

export interface SafetyAnalysisResult {
  siteSummary: string;
  hazards: HazardItem[];
  accidentTypes: string[];
  riskLevel: RiskLevel;
  immediateActions: string[];
  preventionMeasures: string[];
  additionalChecks: string[];
  safetyCheckpoints: string[];
}

export interface SavedAnalysis {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  result: SafetyAnalysisResult;
}

export interface AnalyzeRequestBody {
  image: string;
  mimeType: string;
}

export interface AnalyzeResponse {
  success: true;
  result: SafetyAnalysisResult;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}
