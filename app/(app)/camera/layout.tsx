import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фото-анализ растений",
  description: "Сфотографируйте растение — Агроэксперт подскажет возможную болезнь и что делать дальше. Быстрая диагностика по фото.",
};

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
