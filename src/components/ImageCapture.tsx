"use client";

import { compressImageForAnalysis } from "@/lib/image";

interface ImageCaptureProps {
  onImageSelect: (
    file: File,
    dataUrl: string,
    mimeType: string,
  ) => void | Promise<void>;
  disabled?: boolean;
}

export default function ImageCapture({
  onImageSelect,
  disabled,
}: ImageCaptureProps) {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageForAnalysis(file);
      await onImageSelect(file, compressed.dataUrl, compressed.mimeType);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        void onImageSelect(file, reader.result as string, file.type);
      };
      reader.onerror = () => { /* silent */ };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  const cardBase = "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 transition-all overflow-hidden";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        className={`${cardBase} border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-orange-700">사진 촬영</span>
        <span className="text-xs text-orange-500">카메라로 촬영</span>
      </div>

      <div
        className={`${cardBase} border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-700">이미지 업로드</span>
        <span className="text-xs text-slate-500">갤러리에서 선택</span>
      </div>
    </div>
  );
}
