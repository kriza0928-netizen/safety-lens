const LAW_API_BASE = "https://www.law.go.kr/DRF";

export const KNOWN_LAW_NAMES = {
  INDUSTRIAL_SAFETY_ACT: "산업안전보건법",
  SAFETY_STANDARDS_RULE: "산업안전보건기준에 관한 규칙",
  SERIOUS_ACCIDENT_ACT: "중대재해 처벌 등에 관한 법률",
  ENFORCEMENT_DECREE: "산업안전보건법 시행령",
  ENFORCEMENT_RULE: "산업안전보건법 시행규칙",
} as const;

// ─── 인메모리 캐시 (서버 재시작 전까지 유지) ──────────────────
const mstCache = new Map<string, string>();
// 전체 조문 단위 배열 캐시 (MST → 조문단위[])
const lawArticleCache = new Map<string, RawArticleUnit[]>();

// ─── 타입 ────────────────────────────────────────────────────

export interface LawSearchItem {
  mst: string;
  lawName: string;
  promulgationDate: string;
  enforcementDate: string;
}

export interface ArticleParagraph {
  no: string;
  content: string;
  subItems: string[];
}

export interface ParsedArticle {
  lawName: string;
  mst: string;
  articleNo: string;
  articleTitle: string;
  articleContent: string;
  paragraphs: ArticleParagraph[];
}

// 법제처 API 내부 타입
interface RawArticleUnit {
  조문번호: string;
  조문제목?: string;
  조문내용?: string;
  항?: RawParagraph | RawParagraph[];
  조문여부?: string;
}

interface RawParagraph {
  항번호?: string;
  항내용?: string;
  호?: RawSubItem | RawSubItem[];
}

interface RawSubItem {
  호번호?: string;
  호내용?: string;
}

// ─── 유틸 ────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.LAW_API_KEY?.trim();
  if (!key) throw new Error("LAW_API_KEY가 설정되지 않았습니다. .env.local에 LAW_API_KEY를 등록해 주세요.");
  return key;
}

async function fetchJson(url: string, maxRetries = 3): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
  throw lastError;
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

// ─── 법령 검색 ────────────────────────────────────────────────

export async function searchLaw(query: string): Promise<LawSearchItem[]> {
  const apiKey = getApiKey();
  const url = `${LAW_API_BASE}/lawSearch.do?OC=${apiKey}&target=law&query=${encodeURIComponent(query)}&type=JSON`;

  const data = (await fetchJson(url)) as Record<string, unknown>;
  const root = data["LawSearch"] as Record<string, unknown> | undefined;
  if (!root || root["resultCode"] !== "00") return [];

  const rawList = root["law"];
  const list = toArray(rawList as Record<string, unknown>);

  return list.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      mst: String(row["법령일련번호"] ?? ""),
      lawName: String(row["법령명한글"] ?? ""),
      promulgationDate: String(row["공포일자"] ?? ""),
      enforcementDate: String(row["시행일자"] ?? ""),
    };
  });
}

export async function resolveMst(lawName: string): Promise<string> {
  if (mstCache.has(lawName)) return mstCache.get(lawName)!;

  const results = await searchLaw(lawName);
  const match = results.find((r) => r.lawName.includes(lawName) || lawName.includes(r.lawName));
  if (!match) throw new Error(`"${lawName}" 법령을 찾을 수 없습니다.`);

  mstCache.set(lawName, match.mst);
  return match.mst;
}

// ─── 전체 법령 조문 로드 (캐시 포함) ─────────────────────────

async function loadArticleUnits(mst: string): Promise<RawArticleUnit[]> {
  if (lawArticleCache.has(mst)) return lawArticleCache.get(mst)!;

  const apiKey = getApiKey();
  const url = `${LAW_API_BASE}/lawService.do?OC=${apiKey}&target=law&MST=${mst}&type=JSON`;
  const data = (await fetchJson(url)) as Record<string, unknown>;

  const root = data["법령"] as Record<string, unknown> | undefined;
  if (!root) throw new Error("법령 응답 형식이 올바르지 않습니다.");

  const jomun = root["조문"] as Record<string, unknown> | undefined;
  const units = toArray((jomun?.["조문단위"] ?? []) as RawArticleUnit);

  lawArticleCache.set(mst, units);
  return units;
}

// ─── 조문 조회 ────────────────────────────────────────────────

export async function getLawArticle(
  mst: string,
  articleNo: string | number,
): Promise<ParsedArticle> {
  const units = await loadArticleUnits(mst);
  const target = String(articleNo);
  const unit = units.find((u) => String(u.조문번호) === target);

  if (!unit) throw new Error(`제${articleNo}조를 찾을 수 없습니다.`);

  // lawName은 검색 결과 캐시에서 역방향으로 찾기
  const lawName = [...mstCache.entries()].find(([, v]) => v === mst)?.[0] ?? "";

  return parseArticleUnit(unit, mst, lawName);
}

export async function getLawArticleByName(
  lawName: string,
  articleNo: string | number,
): Promise<ParsedArticle> {
  const mst = await resolveMst(lawName);
  const units = await loadArticleUnits(mst);
  const target = String(articleNo);
  const unit = units.find((u) => String(u.조문번호) === target);

  if (!unit) throw new Error(`${lawName} 제${articleNo}조를 찾을 수 없습니다.`);

  return parseArticleUnit(unit, mst, lawName);
}

// ─── 파서 ────────────────────────────────────────────────────

function parseArticleUnit(
  unit: RawArticleUnit,
  mst: string,
  lawName: string,
): ParsedArticle {
  const paragraphList = toArray(unit.항);

  const paragraphs: ArticleParagraph[] = paragraphList.map((p) => {
    const hoList = toArray(p.호);
    return {
      no: String(p.항번호 ?? ""),
      content: String(p.항내용 ?? ""),
      subItems: hoList.map((h) => String(h.호내용 ?? "")),
    };
  });

  // 조문내용에서 제목 제거 (예: "제306조(교류아크용접기 등)" → 내용만)
  const rawContent = String(unit.조문내용 ?? "");
  const articleContent = rawContent.replace(/^제\d+조[^\s]*\s*/, "").trim();

  return {
    lawName,
    mst,
    articleNo: String(unit.조문번호),
    articleTitle: String(unit.조문제목 ?? ""),
    articleContent,
    paragraphs,
  };
}

// ─── 텍스트 포매터 ────────────────────────────────────────────

export function formatArticleText(article: ParsedArticle): string {
  const lines: string[] = [];
  const title = article.articleTitle ? `(${article.articleTitle})` : "";
  lines.push(`[${article.lawName} 제${article.articleNo}조${title}]`);

  if (article.articleContent) {
    lines.push(article.articleContent);
  }

  for (const para of article.paragraphs) {
    const paraContent = para.content.replace(/^[①-⑳]\s*/, "").trim();
    lines.push(`  ${para.no} ${paraContent}`);
    for (const sub of para.subItems) {
      const subContent = sub.replace(/^\d+\.\s*/, "").trim();
      if (subContent) lines.push(`    · ${subContent}`);
    }
  }

  return lines.join("\n");
}
