export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

export function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes("exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  );
}

export function formatAnalysisError(error: unknown): string {
  const message = getErrorMessage(error);

  if (isQuotaError(message)) {
    return "Gemini API 사용 한도를 초과했습니다. 1~2분 후 다시 시도하거나, Google AI Studio에서 할당량·결제 설정을 확인해 주세요.";
  }

  if (
    message.includes("403") ||
    message.toLowerCase().includes("api key not valid")
  ) {
    return "API Key가 올바르지 않습니다. Vercel 환경 변수의 GEMINI_API_KEY 값을 확인해 주세요.";
  }

  if (message.includes("404") && message.includes("models/")) {
    return "선택한 Gemini 모델을 사용할 수 없습니다. GEMINI_MODEL 환경 변수를 확인해 주세요.";
  }

  if (message.includes("GEMINI_API_KEY")) {
    return message;
  }

  return "이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { sleep };
