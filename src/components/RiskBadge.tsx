import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS } from "@/lib/constants";
import type { RiskLevel } from "@/lib/types";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const colors = RISK_LEVEL_COLORS[level];
  const label = RISK_LEVEL_LABELS[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
