import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  formatAnalysisError,
  getErrorMessage,
  isQuotaError,
  sleep,
} from "./errors";
import { formatArticleText, type ParsedArticle } from "./law-api";
import type { SafetyAnalysisResult } from "./types";

// ─── Stage 1 프롬프트: 위험요소 추출만 ────────────────────────

const HAZARD_EXTRACTION_PROMPT = `당신은 산업안전보건 법령 전문가입니다.
이 사진에서 보이는 위험 요소를 분석하고, 관련 법령 조문을 법제처 API로 조회할 수 있도록 아래 JSON 형식으로만 답하세요.

규칙:
- 조회할법령은 실제로 존재할 가능성이 높은 조문만 포함하세요.
- 법령명은 정확한 공식 명칭을 사용하세요 (예: "산업안전보건기준에 관한 규칙", "산업안전보건법").
- 조번호는 숫자만 입력하세요 (예: "32", "42").
- 확실하지 않은 조번호는 포함하지 마세요.

{
  "위험요소": ["사다리 고정 안됨", "안전모 미착용"],
  "작업유형": "고소작업 / 전기작업 / 화학물질취급 / 중장비 / 기타",
  "위험부위": ["머리", "손", "발"],
  "추정위험등급": "상 / 중 / 하",
  "조회할법령": [
    {"법령": "산업안전보건기준에 관한 규칙", "조": "32"},
    {"법령": "산업안전보건법", "조": "38"}
  ]
}
JSON만 반환하고 다른 말은 하지 마세요.`;

// ─── Stage 3 프롬프트: 조문 기반 최종 분석 ────────────────────

function buildAnalysisPrompt(
  hazardJson: string,
  articles: ParsedArticle[],
): string {
  const articleTexts = articles.map(formatArticleText).join("\n\n");

  return `당신은 산업안전보건 법령 전문가입니다.
아래 [법령 조문]과 [위험요소 분석]만을 근거로 답변하세요.
조문에 없는 내용은 절대 추측하지 마세요.

[법령 조문]
${articleTexts}

[위험요소 분석]
${hazardJson}

위 사진에서 발견된 위험요소가 어떤 법령을 위반하는지 분석하고,
반드시 아래 JSON 형식으로만 반환하세요. 마크다운이나 추가 설명 없이 JSON만 반환하세요.

{
  "siteSummary": "현장 상황 요약 (1~3문장, 법령 근거 기반)",
  "hazards": [
    { "title": "위험요소명", "description": "문제점 설명 (조문 기반)" }
  ],
  "accidentTypes": ["예상 사고유형"],
  "riskLevel": "low|medium|high|critical",
  "immediateActions": ["즉시 조치사항"],
  "preventionMeasures": ["재발방지 대책"],
  "additionalChecks": ["추가 확인사항"],
  "safetyCheckpoints": ["관련 안전관리 체크포인트"]
}`;
}

// ─── 타입 ────────────────────────────────────────────────────

export interface LawArticleHint {
  법령: string;
  조: string;
}

export interface HazardExtraction {
  위험요소: string[];
  작업유형: string;
  위험부위: string[];
  추정위험등급: "상" | "중" | "하";
  조회할법령: LawArticleHint[];
}

// ─── 유틸 ────────────────────────────────────────────────────

const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
].filter((model): model is string => Boolean(model));

function getModel(genAI: GoogleGenerativeAI, modelName: string, jsonMode = true) {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: jsonMode ? 0.1 : 0.3,
      responseMimeType: jsonMode ? "application/json" : undefined,
    },
  });
}

function cleanJson(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ─── Stage 1: 위험요소 추출 ───────────────────────────────────

export async function extractHazards(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<HazardExtraction> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(DEFAULT_MODELS)];
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      const model = getModel(genAI, models[i]);
      const result = await model.generateContent([
        HAZARD_EXTRACTION_PROMPT,
        { inlineData: { data: imageBase64, mimeType } },
      ]);
      const text = result.response.text();
      if (!text) throw new Error("Gemini 응답 없음");

      const raw = JSON.parse(cleanJson(text)) as Partial<HazardExtraction>;
      const parsed: HazardExtraction = {
        위험요소: Array.isArray(raw.위험요소) ? raw.위험요소 : [],
        작업유형: raw.작업유형 ?? "기타",
        위험부위: Array.isArray(raw.위험부위) ? raw.위험부위 : [],
        추정위험등급: raw.추정위험등급 ?? "중",
        조회할법령: Array.isArray(raw.조회할법령) ? raw.조회할법령 : [],
      };
      console.log("[Stage1] 위험요소 추출:", parsed);
      return parsed;
    } catch (error) {
      lastError = error;
      const msg = getErrorMessage(error);
      if (!isQuotaError(msg) && i < models.length - 1) {
        await sleep(1500);
        continue;
      }
      throw new Error(formatAnalysisError(error));
    }
  }

  throw new Error(formatAnalysisError(lastError));
}

// ─── Stage 3: 조문 컨텍스트 기반 최종 분석 ───────────────────

function parseAnalysisResult(text: string): Omit<SafetyAnalysisResult, "legalReferences"> {
  const parsed = JSON.parse(cleanJson(text)) as SafetyAnalysisResult;

  if (!parsed.siteSummary || !parsed.riskLevel) {
    throw new Error("분석 결과 형식이 올바르지 않습니다.");
  }

  return {
    siteSummary: parsed.siteSummary ?? "",
    hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
    accidentTypes: Array.isArray(parsed.accidentTypes) ? parsed.accidentTypes : [],
    riskLevel: parsed.riskLevel,
    immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
    preventionMeasures: Array.isArray(parsed.preventionMeasures) ? parsed.preventionMeasures : [],
    additionalChecks: Array.isArray(parsed.additionalChecks) ? parsed.additionalChecks : [],
    safetyCheckpoints: Array.isArray(parsed.safetyCheckpoints) ? parsed.safetyCheckpoints : [],
  };
}

export async function analyzeWithLawContext(
  hazardExtraction: HazardExtraction,
  articles: ParsedArticle[],
  apiKey: string,
): Promise<Omit<SafetyAnalysisResult, "legalReferences">> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(DEFAULT_MODELS)];
  const hazardJson = JSON.stringify(hazardExtraction, null, 2);
  const prompt = buildAnalysisPrompt(hazardJson, articles);
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      const model = getModel(genAI, models[i]);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error("Gemini 응답 없음");

      console.log("[Stage3] 최종 분석 완료");
      return parseAnalysisResult(text);
    } catch (error) {
      lastError = error;
      const msg = getErrorMessage(error);
      if (!isQuotaError(msg) && i < models.length - 1) {
        await sleep(1500);
        continue;
      }
      throw new Error(formatAnalysisError(error));
    }
  }

  throw new Error(formatAnalysisError(lastError));
}

// ─── 기존 단일 흐름 (폴백용) ─────────────────────────────────

const LEGACY_PROMPT = `당신은 산업안전 현장 전문가입니다. 현장 사진을 분석하여 위험요소를 식별하고 실무적인 개선안을 제시합니다.

## 작성 규칙
- 법 위반이라고 단정하지 말고 "점검 필요", "개선 권고" 수준으로 표현하세요.
- 사진만으로 판단이 어려운 경우 해당 항목에 "추가 확인 필요"를 명시하세요.
- 위험등급(riskLevel)은 low, medium, high, critical 중 하나만 사용하세요.

## 응답 형식 (JSON만 반환)
{
  "siteSummary": "현장 상황 요약",
  "hazards": [{ "title": "위험요소명", "description": "설명" }],
  "accidentTypes": ["예상 사고유형"],
  "riskLevel": "low|medium|high|critical",
  "immediateActions": ["즉시 조치사항"],
  "preventionMeasures": ["재발방지 대책"],
  "additionalChecks": ["추가 확인사항"],
  "safetyCheckpoints": ["안전관리 체크포인트"]
}`;

export async function analyzeSafetyImage(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<SafetyAnalysisResult> {
  if (!apiKey) throw new Error("Gemini API Key가 필요합니다.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(DEFAULT_MODELS)];
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      const model = getModel(genAI, models[i]);
      const result = await model.generateContent([
        LEGACY_PROMPT,
        { inlineData: { data: imageBase64, mimeType } },
      ]);
      const text = result.response.text();
      if (!text) throw new Error("Gemini API에서 응답을 받지 못했습니다.");

      const base = parseAnalysisResult(text);
      return { ...base, legalReferences: [] };
    } catch (error) {
      lastError = error;
      const msg = getErrorMessage(error);
      if (!isQuotaError(msg) && i < models.length - 1) {
        await sleep(1500);
        continue;
      }
      throw new Error(formatAnalysisError(error));
    }
  }

  throw new Error(formatAnalysisError(lastError));
}
