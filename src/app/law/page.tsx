"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import SectionCard from "@/components/SectionCard";
import { KNOWN_LAW_NAMES } from "@/lib/law-api";
import type { ParsedArticle } from "@/lib/law-api";

type Step = "input" | "loading" | "result" | "asking" | "answered";

const PRESET_LAWS = Object.values(KNOWN_LAW_NAMES);

export default function LawPage() {
  const [lawName, setLawName] = useState(KNOWN_LAW_NAMES.SAFETY_STANDARDS_RULE);
  const [articleNo, setArticleNo] = useState("");
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [article, setArticle] = useState<ParsedArticle | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const fetchArticle = async () => {
    if (!lawName.trim() || !articleNo.trim()) return;
    setStep("loading");
    setError("");
    setArticle(null);
    setAnswer("");

    try {
      const res = await fetch("/api/law", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "articleByName", lawName, articleNo }),
      });
      const data = await res.json() as { success: boolean; article?: ParsedArticle; error?: string };
      if (!data.success) throw new Error(data.error);
      setArticle(data.article!);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
      setStep("input");
    }
  };

  const askQuestion = async () => {
    if (!article || !question.trim()) return;
    setStep("asking");
    setError("");

    try {
      const res = await fetch("/api/law", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          lawName: article.lawName,
          articleNo: article.articleNo,
          question,
        }),
      });
      const data = await res.json() as { success: boolean; answer?: string; error?: string };
      if (!data.success) throw new Error(data.error);
      setAnswer(data.answer!);
      setStep("answered");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 질의 중 오류가 발생했습니다.");
      setStep("result");
    }
  };

  const reset = () => {
    setStep("input");
    setArticle(null);
    setAnswer("");
    setError("");
    setQuestion("");
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader title="법령 조회" subtitle="법제처 실시간 조문 검색" />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 pb-28 pt-4">

        {/* 입력 폼 */}
        <SectionCard title="조문 검색">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">법령명</label>
              <select
                value={lawName}
                onChange={(e) => setLawName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {PRESET_LAWS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <input
                type="text"
                value={lawName}
                onChange={(e) => setLawName(e.target.value)}
                placeholder="또는 직접 입력"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">조 번호</label>
              <input
                type="number"
                value={articleNo}
                onChange={(e) => setArticleNo(e.target.value)}
                placeholder="예: 306"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={fetchArticle}
              disabled={step === "loading" || !lawName.trim() || !articleNo.trim()}
              className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 disabled:opacity-50"
            >
              {step === "loading" ? "조회 중…" : "조문 조회"}
            </button>
          </div>
        </SectionCard>

        {/* 조문 결과 */}
        {article && (
          <SectionCard title={`${article.lawName} 제${article.articleNo}조`}>
            <div className="space-y-2">
              {article.articleTitle && (
                <p className="text-sm font-semibold text-slate-800">({article.articleTitle})</p>
              )}
              {article.articleContent && (
                <p className="text-sm leading-relaxed text-slate-700">{article.articleContent}</p>
              )}
              {article.paragraphs.map((para, i) => (
                <div key={i} className="pl-3">
                  <p className="text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold">①{para.no !== "1" ? para.no : ""}</span> {para.content}
                  </p>
                  {para.subItems.map((sub, j) => (
                    <p key={j} className="pl-4 text-sm text-slate-600">· {sub}</p>
                  ))}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* AI 질의 */}
        {(step === "result" || step === "asking" || step === "answered") && article && (
          <SectionCard title="AI에게 질문">
            <div className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`위 조문에 대해 궁금한 점을 물어보세요.\n예: 안전난간 설치 높이 기준이 어떻게 되나요?`}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={askQuestion}
                disabled={step === "asking" || !question.trim()}
                className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-bold text-white transition-all hover:bg-slate-900 disabled:opacity-50"
              >
                {step === "asking" ? "AI 분석 중…" : "질문하기"}
              </button>
            </div>
          </SectionCard>
        )}

        {/* AI 답변 */}
        {answer && (
          <SectionCard title="AI 답변">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{answer}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-2xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              새 검색
            </button>
          </SectionCard>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
