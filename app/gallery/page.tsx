import type { Metadata } from "next";
import { Images } from "lucide-react";
import { GalleryFeed } from "./gallery-feed";

export const metadata: Metadata = {
  title: "Галерея дачников",
  description:
    "Фото растений, урожая и грядок от пользователей Любимая Дача. Смотрите результаты, делитесь своими публикациями и обсуждайте уход.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Галерея дачников",
    description:
      "Фото растений, урожая и грядок от пользователей Любимая Дача. Смотрите результаты, делитесь своими публикациями и обсуждайте уход.",
    url: "https://dacha-ai.ru/gallery",
    siteName: "Любимая Дача",
    type: "website",
  },
};

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Images className="w-6 h-6 text-emerald-600" />
          Галерея дачников
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Здесь можно посмотреть реальные фото с участков, результаты выращивания и поделиться своими удачными кадрами.
        </p>
      </div>

      <GalleryFeed />
    </div>
  );
}
