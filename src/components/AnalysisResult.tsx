import RiskBadge from "./RiskBadge";
import SectionCard from "./SectionCard";
import type { SafetyAnalysisResult } from "@/lib/types";

interface AnalysisResultProps {
  result: SafetyAnalysisResult;
  showSaveNotice?: boolean;
  mode?: "demo" | "ai";
}

function ListItems({
  items,
  bulletColor = "bg-orange-500",
}: {
  items: string[];
  bulletColor?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">해당 항목 없음</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm text-slate-700">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bulletColor}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisResultView({
  result,
  showSaveNotice,
  mode = "ai",
}: AnalysisResultProps) {
  const isHighRisk = result.riskLevel === "high" || result.riskLevel === "critical";

  return (
    <div className="space-y-4">
      {mode === "demo" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>데모 모드</strong> — 사진 AI 분석이 아닌 일반 안전 점검
          가이드입니다. 실제 AI 분석은 설정 → AI 분석 모드에서 API Key를
          등록하세요.
        </div>
      )}

      {showSaveNotice && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          분석 결과가 이력에 저장되었습니다.
        </div>
      )}

      <SectionCard
        title="위험등급"
        variant={isHighRisk ? "danger" : "default"}
        icon={
          <svg
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
      >
        <RiskBadge level={result.riskLevel} size="lg" />
      </SectionCard>

      <SectionCard title="현장 상황 요약">
        <p className="text-sm leading-relaxed text-slate-700">
          {result.siteSummary}
        </p>
      </SectionCard>

      <SectionCard
        title="발견된 위험요소"
        variant={result.hazards.length > 0 ? "warning" : "default"}
      >
        {result.hazards.length === 0 ? (
          <p className="text-sm text-slate-500">명확한 위험요소가 발견되지 않았습니다.</p>
        ) : (
          <div className="space-y-3">
            {result.hazards.map((hazard, index) => (
              <div
                key={index}
                className="rounded-xl border border-amber-100 bg-white p-3"
              >
                <h4 className="mb-1 text-sm font-semibold text-amber-900">
                  {hazard.title}
                </h4>
                <p className="text-sm text-slate-600">{hazard.description}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="예상 사고유형">
        <ListItems items={result.accidentTypes} bulletColor="bg-red-400" />
      </SectionCard>

      <SectionCard title="즉시 조치사항" variant="danger">
        <ListItems items={result.immediateActions} bulletColor="bg-red-500" />
      </SectionCard>

      <SectionCard title="재발방지 대책">
        <ListItems items={result.preventionMeasures} />
      </SectionCard>

      <SectionCard title="추가 확인사항">
        <ListItems items={result.additionalChecks} bulletColor="bg-blue-500" />
      </SectionCard>

      <SectionCard title="안전관리 체크포인트">
        <ListItems items={result.safetyCheckpoints} bulletColor="bg-slate-500" />
      </SectionCard>
    </div>
  );
}
