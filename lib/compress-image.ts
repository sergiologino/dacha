/**
 * Сжимает изображение для отправки в API (укладывается в лимит тела запроса ~1MB).
 * Особенно важно для мобильных: камера даёт большие файлы, base64 без сжатия приводит к ошибке.
 */
const DEFAULT_MAX_LONG_EDGE = 1200;
const GARDEN_UPLOAD_MAX_LONG_EDGE = 1600;
const TARGET_MAX_BYTES = 900_000; // ~900KB, запас до 1MB
const MIN_QUALITY = 0.5;

export type CompressImageOptions = {
  /** Формат выхода (для грядки всегда image/jpeg — максимальная совместимость с <img>). */
  outputMime?: string;
  maxLongEdge?: number;
};

export function compressImageFile(
  file: File,
  options?: CompressImageOptions
): Promise<string> {
  const outputMime =
    options?.outputMime ??
    (file.type?.startsWith("image/") ? file.type : "image/jpeg");
  const maxEdge = options?.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale =
        width > height
          ? Math.min(1, maxEdge / width)
          : Math.min(1, maxEdge / height);
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

      const isJpeg =
        outputMime === "image/jpeg" || outputMime === "image/jpg";

      const tryQuality = (quality: number) => {
        const dataUrl = canvas.toDataURL(outputMime, quality);
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

/**
 * Файл для multipart (грядка): всегда уменьшаем и конвертируем в JPEG в браузере,
 * чтобы не слать многослойные/HEIC и тяжёлые кадры. Если декодирование не удалось — исходный файл (нормализация на сервере через sharp).
 */
export async function compressImageFileForUpload(file: File): Promise<File> {
  try {
    const dataUrl = await compressImageFile(file, {
      outputMime: "image/jpeg",
      maxLongEdge: GARDEN_UPLOAD_MAX_LONG_EDGE,
    });
    const m = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
    if (!m) return file;
    const b64 = m[2];
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const out = new File([u8], "plant-photo.jpg", { type: "image/jpeg" });
    if (out.size < 64) return file;
    return out;
  } catch {
    return file;
  }
}
