import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { getPublishedGuideHacks } from "@/lib/queries/guide-content";
import { LifehacksGrid } from "./lifehacks-grid";

export const metadata: Metadata = {
  title: "Дачные лайфхаки и народные приёмы для огорода — Любимая Дача",
  description:
    "Практичные дачные лайфхаки, народные приёмы для огорода, советы по почве, поливу, мульче, вредителям и уходу за растениями с наглядными карточками.",
  keywords: [
    "дачные лайфхаки",
    "народные приемы для огорода",
    "советы для дачников",
    "уход за растениями народные способы",
    "лайфхаки для сада и огорода",
    "мульча компост полив вредители",
  ],
  alternates: { canonical: absoluteUrl("/guide/lifehacks") },
  openGraph: {
    title: "Дачные лайфхаки и народные приёмы для огорода",
    description:
      "Короткие практичные карточки: почва, полив, защита растений, благоустройство участка и проверенные народные способы.",
    url: absoluteUrl("/guide/lifehacks"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Дачные лайфхаки и народные приёмы",
    description: "Практичные советы для сада и огорода от «Любимой Дачи».",
  },
};

export default async function GuideLifehacksPage() {
  const hacks = await getPublishedGuideHacks().catch(() => []);
  const url = absoluteUrl("/guide/lifehacks");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Дачные лайфхаки и народные приёмы",
          description:
            "Коллекция практичных советов для дачников: почва, полив, вредители, уход за растениями и благоустройство участка.",
          url,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: hacks.length,
            itemListElement: hacks.slice(0, 50).map((hack, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: hack.title,
              description: hack.text.slice(0, 180),
            })),
          },
        }}
      />
      <Link
        href="/guide"
        className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        К справочнику культур
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Lightbulb className="w-9 h-9 text-emerald-600" aria-hidden />
        <h1 className="text-3xl font-bold">Лайфхаки для дачи и огорода</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-3xl">
        Полный архив по категориям: выращивание, благоустройство, почва, полив, защита растений и
        простые приёмы. На главной справочника каждую неделю показывается новая подборка из этой
        коллекции.
      </p>

      {hacks.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          Коллекция пока пуста. Контент подставляется при старте приложения после миграций; обновите
          страницу через минуту.
        </p>
      ) : (
        <LifehacksGrid hacks={hacks} />
      )}
    </div>
  );
}
