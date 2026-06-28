import { formatAnalysisError } from "@/lib/errors";
import { extractHazards, analyzeWithLawContext } from "@/lib/gemini";
import { fetchArticlesForHazards } from "@/lib/hazard-mapper";
import { formatArticleText } from "@/lib/law-api";
import type { AnalyzeRequestBody, LegalReference } from "@/lib/types";
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

    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp",
      "image/gif", "image/heic", "image/heif",
    ];
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
          error: "GEMINI_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 API Key를 등록해 주세요.",
        },
        { status: 400 },
      );
    }

    // ── Stage 1: Gemini - 위험요소 추출 ──────────────────────
    console.log("[Analyze] Stage 1 시작: 위험요소 추출");
    const hazardExtraction = await extractHazards(body.image, body.mimeType, apiKey);
    console.log("[Analyze] Stage 1 완료:", hazardExtraction);

    // ── Stage 2: 법제처 API - 관련 조문 조회 ─────────────────
    console.log("[Analyze] Stage 2 시작: 법령 조문 조회");
    let articles: Awaited<ReturnType<typeof fetchArticlesForHazards>> = [];
    let legalReferences: LegalReference[] = [];

    try {
      articles = await fetchArticlesForHazards(hazardExtraction);
      console.log(`[Analyze] Stage 2 완료: 조문 ${articles.length}건`);

      legalReferences = articles.map((a) => ({
        law: a.lawName,
        article: `제${a.articleNo}조${a.articleTitle ? ` (${a.articleTitle})` : ""}`,
        description: formatArticleText(a).split("\n").slice(1, 3).join(" ").trim(),
      }));
    } catch (lawErr) {
      // 법제처 API 실패해도 분석은 계속 진행
      console.warn("[Analyze] Stage 2 법령 조회 실패 (계속 진행):", lawErr);
    }

    // ── Stage 3: Gemini - 조문 기반 위반 여부 판단 ────────────
    console.log("[Analyze] Stage 3 시작: 조문 기반 최종 분석");
    const analysisBase = await analyzeWithLawContext(hazardExtraction, articles, apiKey);
    console.log("[Analyze] Stage 3 완료");

    const result = { ...analysisBase, legalReferences };

    return NextResponse.json({ success: true, result, mode: "ai" as const });
  } catch (error) {
    console.error("[Analyze] 오류:", error);
    const message = formatAnalysisError(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
