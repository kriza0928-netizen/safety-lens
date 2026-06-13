interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "분석 중...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      <p className="text-xs text-slate-400">
        Gemini AI가 현장 사진을 분석하고 있습니다
      </p>
    </div>
  );
}
