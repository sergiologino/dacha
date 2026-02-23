import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фото-анализ растений",
  description: "Сфотографируйте растение — AI определит болезни и предложит лечение. Быстрая диагностика по фото.",
};

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
