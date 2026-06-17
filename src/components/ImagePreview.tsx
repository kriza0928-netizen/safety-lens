"use client";

import { useEffect, useState } from "react";

interface ImagePreviewProps {
  dataUrl: string;
  onClear: () => void;
}

export default function ImagePreview({ dataUrl, onClear }: ImagePreviewProps) {
  const [clearEnabled, setClearEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setClearEnabled(true), 600);
    return () => clearTimeout(timer);
  }, [dataUrl]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt="분석 대상 현장 사진"
        className="max-h-64 w-full object-contain"
      />
      <button
        type="button"
        onClick={clearEnabled ? onClear : undefined}
        disabled={!clearEnabled}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        aria-label="이미지 제거"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
