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

    const result = await analyzeSafetyImage(body.image, body.mimeType);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
