"use client";

import { useState } from "react";

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
  const [retry, setRetry] = useState(0);
  const qs = retry > 0 ? `?r=${retry}` : "";
  const src = `/api/photos/${photoId}/image${qs}`;
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setRetry((n) => (n < 2 ? n + 1 : n))}
    />
  );
}
