const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

export async function compressImageForAnalysis(file: File): Promise<{
  dataUrl: string;
  mimeType: string;
}> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.width, image.height),
  );
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return { dataUrl, mimeType: file.type || "image/jpeg" };
  }

  context.drawImage(image, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { dataUrl: compressedDataUrl, mimeType: "image/jpeg" };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    image.src = src;
  });
}
