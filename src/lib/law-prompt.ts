import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatArticleText, type ParsedArticle } from "./law-api";

export function buildLawSystemPrompt(articles: ParsedArticle[]): string {
  const articleTexts = articles.map(formatArticleText).join("\n\n");

  return `당신은 산업안전보건 전문가입니다.
아래 [법령 조문]만을 근거로 답변하세요.
법령 조문에 없는 내용은 절대 추측하거나 지어내지 마세요.
조문에 없는 내용은 "해당 조문에서 확인되지 않습니다"라고 답하세요.
답변 마지막에 인용한 법령 조항을 명시하세요.

[법령 조문]
${articleTexts}`;
}

export async function askLawQuestion(
  question: string,
  articles: ParsedArticle[],
  apiKey: string,
): Promise<string> {
  if (!apiKey) throw new Error("Gemini API Key가 필요합니다.");
  if (articles.length === 0) throw new Error("조회된 법령 조문이 없습니다.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.1 },
    systemInstruction: buildLawSystemPrompt(articles),
  });

  const result = await model.generateContent(question);
  const text = result.response.text();
  if (!text) throw new Error("AI 응답을 받지 못했습니다.");
  return text;
}
