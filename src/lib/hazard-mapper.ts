import { getLawArticleByName, type ParsedArticle } from "./law-api";
import type { HazardExtraction } from "./gemini";

export interface LawArticleHint {
  법령: string;
  조: string;
}

// ─── 법제처 API로 실제 조문 가져오기 ─────────────────────────
// Stage 1에서 Gemini가 제안한 (법령, 조번호) 힌트를 기반으로
// 법제처 API에서 실제 조문 내용을 조회함.
// 조문이 존재하지 않으면 조용히 건너뜀 (API가 최종 판단)

export async function fetchArticlesForHazards(
  hazardExtraction: HazardExtraction,
): Promise<ParsedArticle[]> {
  const hints = hazardExtraction.조회할법령 ?? [];

  console.log("[Stage2] Gemini 제안 조문 힌트:", hints);

  if (hints.length === 0) {
    console.warn("[Stage2] 조문 힌트 없음 — 빈 배열 반환");
    return [];
  }

  const articles: ParsedArticle[] = [];
  const seen = new Set<string>();

  await Promise.allSettled(
    hints.map(async (hint) => {
      const key = `${hint.법령}|${hint.조}`;
      if (seen.has(key)) return;
      seen.add(key);

      try {
        const article = await getLawArticleByName(hint.법령, hint.조);
        articles.push(article);
        console.log(`[Stage2] ✅ 조문 조회 성공: ${hint.법령} 제${hint.조}조`);
      } catch (err) {
        // 법제처 API에서 조문을 찾지 못하면 결과에서 제외
        console.warn(`[Stage2] ⚠️ 조문 없음 (제외): ${hint.법령} 제${hint.조}조 —`, (err as Error).message);
      }
    }),
  );

  console.log(`[Stage2] 최종 확인된 조문 수: ${articles.length}건`);
  return articles;
}

export type { ParsedArticle };
