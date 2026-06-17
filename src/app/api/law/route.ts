import { NextResponse } from "next/server";
import {
  searchLaw,
  getLawArticle,
  getLawArticleByName,
} from "@/lib/law-api";
import { askLawQuestion } from "@/lib/law-prompt";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as string;

    // 법령 검색
    if (action === "search") {
      const query = body.query as string;
      if (!query) {
        return NextResponse.json({ success: false, error: "검색어를 입력해 주세요." }, { status: 400 });
      }
      const results = await searchLaw(query);
      return NextResponse.json({ success: true, results });
    }

    // 조문 조회 (MST + 조번호)
    if (action === "article") {
      const mst = body.mst as string;
      const articleNo = body.articleNo as string;
      if (!mst || !articleNo) {
        return NextResponse.json({ success: false, error: "MST와 조번호가 필요합니다." }, { status: 400 });
      }
      const article = await getLawArticle(mst, articleNo);
      return NextResponse.json({ success: true, article });
    }

    // 조문 조회 (법령명 + 조번호)
    if (action === "articleByName") {
      const lawName = body.lawName as string;
      const articleNo = body.articleNo as string;
      if (!lawName || !articleNo) {
        return NextResponse.json({ success: false, error: "법령명과 조번호가 필요합니다." }, { status: 400 });
      }
      const article = await getLawArticleByName(lawName, articleNo);
      return NextResponse.json({ success: true, article });
    }

    // 조문 기반 AI 질의
    if (action === "ask") {
      const lawName = body.lawName as string;
      const articleNo = body.articleNo as string;
      const question = body.question as string;
      const apiKey = (body.apiKey as string | undefined)?.trim()
        || process.env.GEMINI_API_KEY?.trim()
        || "";

      if (!lawName || !articleNo || !question) {
        return NextResponse.json({ success: false, error: "법령명, 조번호, 질문이 필요합니다." }, { status: 400 });
      }
      if (!apiKey) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 400 });
      }

      const article = await getLawArticleByName(lawName, articleNo);
      const answer = await askLawQuestion(question, [article], apiKey);
      return NextResponse.json({ success: true, article, answer });
    }

    return NextResponse.json({ success: false, error: "알 수 없는 action입니다." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
