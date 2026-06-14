import { formatAnalysisError } from "@/lib/errors";
import { analyzeSafetyImage } from "@/lib/gemini";
import type { AnalyzeRequestBody } from "@/lib/types";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;

    if (!body.image || !body.mimeType) {
      return NextResponse.json(
        { success: false, error: "이미지 데이터가 필요합니다." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(body.mimeType)) {
      return NextResponse.json(
        { success: false, error: "지원하지 않는 이미지 형식입니다." },
        { status: 400 },
      );
    }

    const apiKey = body.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 API Key를 등록해 주세요.",
        },
        { status: 400 },
      );
    }

    const result = await analyzeSafetyImage(body.image, body.mimeType, apiKey);

    return NextResponse.json({ success: true, result, mode: "ai" as const });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = formatAnalysisError(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
