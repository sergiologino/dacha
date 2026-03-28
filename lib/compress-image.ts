/**
 * Сжимает изображение для отправки в API (укладывается в лимит тела запроса ~1MB).
 * Особенно важно для мобильных: камера даёт большие файлы, base64 без сжатия приводит к ошибке.
 */
const MAX_LONG_EDGE = 1200;
const TARGET_MAX_BYTES = 900_000; // ~900KB, запас до 1MB
const MIN_QUALITY = 0.5;

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale =
        width > height
          ? Math.min(1, MAX_LONG_EDGE / width)
          : Math.min(1, MAX_LONG_EDGE / height);
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const mime = file.type?.startsWith("image/") ? file.type : "image/jpeg";
      const isJpeg = mime === "image/jpeg" || mime === "image/jpg";

      const tryQuality = (quality: number) => {
        const dataUrl = canvas.toDataURL(mime, quality);
        const base64Length = dataUrl.split(",")[1]?.length ?? 0;
        const bytes = Math.ceil((base64Length * 3) / 4);
        return { dataUrl, bytes };
      };

      let quality = 0.88;
      let { dataUrl, bytes } = tryQuality(quality);

      while (bytes > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
        quality -= 0.12;
        const next = tryQuality(Math.max(MIN_QUALITY, quality));
        dataUrl = next.dataUrl;
        bytes = next.bytes;
      }

      if (isJpeg && bytes > TARGET_MAX_BYTES) {
        quality = MIN_QUALITY;
        const last = tryQuality(quality);
        resolve(last.dataUrl);
      } else {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/** Файл для multipart (грядка, камера): сжимает крупные снимки с телефона. */
export async function compressImageFileForUpload(file: File): Promise<File> {
  if (file.size <= 400_000) return file;
  const dataUrl = await compressImageFile(file);
  const m = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
  if (!m) return file;
  const mime = m[1] || "image/jpeg";
  const b64 = m[2];
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const ext = mime.includes("png") ? ".png" : ".jpg";
  return new File([u8], `plant-photo${ext}`, { type: mime });
}
