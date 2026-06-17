import { getLawArticleByName, formatArticleText, type ParsedArticle } from "./law-api";

// ─── 위험요소 표현 → 법령 검색어 매핑 ───────────────────────

const HAZARD_KEYWORD_MAP: Record<string, string> = {
  // 보호구
  "안전모": "보호구 착용",
  "안전화": "보호구 착용",
  "안전대": "보호구 착용",
  "보호구": "보호구 착용",
  "안전장갑": "보호구 착용",
  "보호복": "보호구 착용",
  "귀마개": "보호구 착용",
  "방진마스크": "보호구 착용",
  "미착용": "보호구 착용",

  // 추락
  "추락": "추락 방지",
  "사다리": "추락 방지",
  "고소작업": "추락 방지",
  "작업발판": "추락 방지",
  "발판": "추락 방지",
  "개구부": "추락 방지",
  "난간": "안전난간",
  "안전난간": "안전난간",
  "지붕": "추락 방지",
  "비계": "추락 방지",

  // 전기
  "전기": "전기 안전",
  "전선": "전기 안전",
  "콘센트": "전기 안전",
  "배전반": "전기 안전",
  "감전": "전기 안전",
  "누전": "전기 안전",

  // 화재
  "화재": "화재 예방",
  "화기": "화재 예방",
  "용접": "화재 예방",
  "인화성": "화재 예방",
  "소화기": "화재 예방",

  // 화학물질
  "화학물질": "화학물질 취급",
  "유해물질": "화학물질 취급",
  "독성": "화학물질 취급",
  "MSDS": "화학물질 취급",
  "물질안전": "화학물질 취급",

  // 밀폐공간
  "밀폐공간": "밀폐공간 작업",
  "산소결핍": "밀폐공간 작업",
  "맨홀": "밀폐공간 작업",
  "탱크 내부": "밀폐공간 작업",

  // 중량물 / 중장비
  "중량물": "중량물 취급",
  "크레인": "중량물 취급",
  "호이스트": "중량물 취급",
  "인양": "중량물 취급",
  "지게차": "차량계 하역운반기계",
  "굴착기": "차량계 건설기계",
  "불도저": "차량계 건설기계",

  // 정리정돈
  "정리정돈": "작업장 정리",
  "통로": "작업장 정리",
  "적재": "중량물 취급",
};

// ─── 검색어 → (법령명, 조번호) 매핑 ────────────────────────
// 조번호는 법제처 API에서 실제 내용을 가져올 때 사용
// 단, MST는 동적 검색으로 해결하므로 법령명만 지정

interface LawArticleRef {
  law: string;
  article: string; // 숫자 문자열, e.g. "32"
}

const SEARCH_TO_LAW_ARTICLES: Record<string, LawArticleRef[]> = {
  "보호구 착용": [
    { law: "산업안전보건법", article: "38" },
    { law: "산업안전보건기준에 관한 규칙", article: "32" },
  ],
  "추락 방지": [
    { law: "산업안전보건법", article: "38" },
    { law: "산업안전보건기준에 관한 규칙", article: "42" },
    { law: "산업안전보건기준에 관한 규칙", article: "44" },
  ],
  "안전난간": [
    { law: "산업안전보건기준에 관한 규칙", article: "13" },
  ],
  "전기 안전": [
    { law: "산업안전보건기준에 관한 규칙", article: "301" },
    { law: "산업안전보건기준에 관한 규칙", article: "306" },
  ],
  "화재 예방": [
    { law: "산업안전보건기준에 관한 규칙", article: "241" },
  ],
  "화학물질 취급": [
    { law: "산업안전보건법", article: "114" },
    { law: "산업안전보건법", article: "39" },
  ],
  "밀폐공간 작업": [
    { law: "산업안전보건기준에 관한 규칙", article: "619" },
    { law: "산업안전보건기준에 관한 규칙", article: "620" },
  ],
  "중량물 취급": [
    { law: "산업안전보건기준에 관한 규칙", article: "169" },
  ],
  "차량계 하역운반기계": [
    { law: "산업안전보건기준에 관한 규칙", article: "171" },
    { law: "산업안전보건기준에 관한 규칙", article: "179" },
  ],
  "차량계 건설기계": [
    { law: "산업안전보건기준에 관한 규칙", article: "196" },
    { law: "산업안전보건기준에 관한 규칙", article: "199" },
  ],
  "작업장 정리": [
    { law: "산업안전보건기준에 관한 규칙", article: "3" },
  ],
};

// ─── 위험요소 배열 → 검색어 세트 변환 ────────────────────────

export function mapHazardsToSearchTerms(hazardList: string[]): string[] {
  const terms = new Set<string>();
  for (const hazard of hazardList) {
    for (const [keyword, searchTerm] of Object.entries(HAZARD_KEYWORD_MAP)) {
      if (hazard.includes(keyword)) {
        terms.add(searchTerm);
      }
    }
  }
  return [...terms];
}

// ─── 검색어 → 조문 레퍼런스 목록 ────────────────────────────

export function getArticleRefs(searchTerms: string[]): LawArticleRef[] {
  const seen = new Set<string>();
  const refs: LawArticleRef[] = [];

  for (const term of searchTerms) {
    const articles = SEARCH_TO_LAW_ARTICLES[term] ?? [];
    for (const ref of articles) {
      const key = `${ref.law}|${ref.article}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push(ref);
      }
    }
  }
  return refs;
}

// ─── 법제처 API로 실제 조문 가져오기 ─────────────────────────

export async function fetchArticlesForHazards(
  hazardList: string[],
  workType: string,
): Promise<ParsedArticle[]> {
  const allHazards = [...hazardList, workType];
  const searchTerms = mapHazardsToSearchTerms(allHazards);

  console.log("[Stage2] 검색어:", searchTerms);

  const refs = getArticleRefs(searchTerms);
  console.log("[Stage2] 조문 레퍼런스:", refs);

  const articles: ParsedArticle[] = [];

  await Promise.allSettled(
    refs.map(async (ref) => {
      try {
        const article = await getLawArticleByName(ref.law, ref.article);
        articles.push(article);
        console.log(`[Stage2] 조문 조회 성공: ${ref.law} 제${ref.article}조`);
      } catch (err) {
        console.warn(`[Stage2] 조문 조회 실패: ${ref.law} 제${ref.article}조 —`, err);
      }
    }),
  );

  return articles;
}

export { formatArticleText };
export type { ParsedArticle };
