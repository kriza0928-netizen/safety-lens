import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  formatAnalysisError,
  getErrorMessage,
  isQuotaError,
  sleep,
} from "./errors";
import type { SafetyAnalysisResult } from "./types";

const ANALYSIS_PROMPT = `당신은 산업안전 전문가입니다. 현장 사진을 분석하여 위험요소를 식별하고 실무적인 개선안을 제시합니다.

## 작성 규칙
- 법 위반이라고 단정하지 말고 "점검 필요", "개선 권고" 수준으로 표현하세요.
- 사진만으로 판단이 어려운 경우 해당 항목에 "추가 확인 필요"를 명시하세요.
- 산업안전관리자가 현장에서 바로 볼 수 있게 간결하고 실행 가능하게 작성하세요.
- 위험등급(riskLevel)은 low, medium, high, critical 중 하나만 사용하세요.
- hazards는 발견된 위험요소마다 title(짧은 제목)과 description(설명)을 포함하세요.
- safetyCheckpoints는 관련 안전관리 체크포인트 목록입니다.

## 응답 형식
반드시 아래 JSON 스키마에 맞는 유효한 JSON만 출력하세요. 마크다운이나 추가 설명 없이 JSON만 반환하세요.

{
  "siteSummary": "현장 상황 요약 (1~3문장)",
  "hazards": [
    { "title": "위험요소명", "description": "문제점 설명" }
  ],
  "accidentTypes": ["예상 사고유형"],
  "riskLevel": "low|medium|high|critical",
  "immediateActions": ["즉시 조치사항"],
  "preventionMeasures": ["재발방지 대책"],
  "additionalChecks": ["추가 확인사항"],
  "safetyCheckpoints": ["관련 안전관리 체크포인트"]
}`;

// 무료 플랜에서는 2.5-flash만 할당량이 있을 수 있음 → 1회 클릭 = 1 API 호출
const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
].filter((model): model is string => Boolean(model));

function parseAnalysisResult(text: string): SafetyAnalysisResult {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as SafetyAnalysisResult;

  if (!parsed.siteSummary || !parsed.riskLevel) {
    throw new Error("분석 결과 형식이 올바르지 않습니다.");
  }

  return {
    siteSummary: parsed.siteSummary ?? "",
    hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
    accidentTypes: Array.isArray(parsed.accidentTypes) ? parsed.accidentTypes : [],
    riskLevel: parsed.riskLevel,
    immediateActions: Array.isArray(parsed.immediateActions)
      ? parsed.immediateActions
      : [],
    preventionMeasures: Array.isArray(parsed.preventionMeasures)
      ? parsed.preventionMeasures
      : [],
    additionalChecks: Array.isArray(parsed.additionalChecks)
      ? parsed.additionalChecks
      : [],
    safetyCheckpoints: Array.isArray(parsed.safetyCheckpoints)
      ? parsed.safetyCheckpoints
      : [],
  };
}

async function analyzeWithModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  imageBase64: string,
  mimeType: string,
): Promise<SafetyAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    ANALYSIS_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  const text = result.response.text();
  if (!text) {
    throw new Error("Gemini API에서 응답을 받지 못했습니다.");
  }

  return parseAnalysisResult(text);
}

export async function analyzeSafetyImage(
  imageBase64: string,
  mimeType: string,
): Promise<SafetyAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(DEFAULT_MODELS)];
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    const modelName = models[index];

    try {
      return await analyzeWithModel(genAI, modelName, imageBase64, mimeType);
    } catch (error) {
      lastError = error;
      const message = getErrorMessage(error);
      const canRetry =
        !isQuotaError(message) && index < models.length - 1;

      if (canRetry) {
        await sleep(1500);
        continue;
      }

      throw new Error(formatAnalysisError(error));
    }
  }

  throw new Error(formatAnalysisError(lastError));
}
