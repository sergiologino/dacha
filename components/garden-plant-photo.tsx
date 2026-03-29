"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Превью фото растения: всегда через API (не прямой /uploads).
 */
export function GardenPlantPhotoImg({
  photoId,
  className,
  loading = "eager",
}: {
  photoId: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const [attempt, setAttempt] = useState(0);
  const qs = attempt > 0 ? `?r=${attempt}` : "";
  const src = `/api/photos/${photoId}/image${qs}`;
  const broken = attempt >= 3;

  if (broken) {
    return (
      <div
        className={cn(
          className,
          "flex min-h-[4rem] items-center justify-center bg-slate-200 px-2 text-center text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        )}
        role="img"
        aria-label="Фото не загрузилось"
      >
        Не удалось загрузить фото. Проверьте вход или обновите страницу.
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
