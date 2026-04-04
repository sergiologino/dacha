"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
};

/**
 * Картинки идут через /api/guide-image — Wikimedia часто недоступен из браузера в РФ,
 * зато сервер приложения качает и отдаёт байты самому клиенту.
 */
export function GuideHackImage({ src, alt, sizes, className = "object-cover" }: Props) {
  const [failed, setFailed] = useState(false);

  const proxied = `/api/guide-image?url=${encodeURIComponent(src)}`;

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-200/90 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-4 text-center text-xs">
        <ImageOff className="w-10 h-10 opacity-70" aria-hidden />
        <span className="sr-only">Изображение не загрузилось</span>
      </div>
    );
  }

  return (
    <Image
      src={proxied}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
