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
 * Лайфхаки тянут картинки с Wikimedia; оптимизатор Next по умолчанию качает их с сервера
 * и часто получает 403/таймаут — остаётся серый блок. unoptimized + загрузка в браузере обходят это.
 */
export function GuideHackImage({ src, alt, sizes, className = "object-cover" }: Props) {
  const [failed, setFailed] = useState(false);

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
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
