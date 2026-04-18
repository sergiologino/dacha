"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
};

/**
 * Локальные пути `/images/...` отдаются из `public` как есть.
 * `https://upload.wikimedia.org/...` — через `/api/guide-image` (в РФ прямой запрос из браузера часто падает).
 * Прочие абсолютные URL — как есть.
 */
function resolvedSrc(src: string): string {
  const t = src.trim();
  if (!t) return t;
  if (t.startsWith("/")) return t;
  if (t.startsWith("data:") || t.startsWith("blob:")) return t;
  try {
    const u = new URL(t);
    if (u.protocol === "https:" && u.hostname === "upload.wikimedia.org") {
      return `/api/guide-image?url=${encodeURIComponent(t)}`;
    }
  } catch {
    return t;
  }
  return t;
}

export function GuideHackImage({ src, alt, sizes: _sizes, className = "object-cover" }: Props) {
  const [failed, setFailed] = useState(false);

  const imgSrc = resolvedSrc(src);

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-200/90 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-4 text-center text-xs">
        <ImageOff className="w-10 h-10 opacity-70" aria-hidden />
        <span className="sr-only">Изображение не загрузилось</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- прокси-URL с длинным query; тот же origin
    <img
      src={imgSrc}
      alt={alt}
      className={`absolute inset-0 w-full h-full ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
