import { Metadata } from "next";
import { FactsContent } from "./facts-content";
import { absoluteUrl } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getPublishedFunFacts } from "@/lib/queries/guide-content";

export const metadata: Metadata = {
  title: "Интересные факты о растениях — Любимая Дача",
  description:
    "Интересные факты о растениях, огороде и даче: короткие заметки о культурах, урожае, истории и природе без лишней энциклопедичности.",
  keywords:
    "интересные факты о растениях, факты о даче, факты об огороде, садоводство",
  alternates: {
    canonical: absoluteUrl("/facts"),
  },
};

export default async function FactsPage() {
  let facts = await getPublishedFunFacts().catch(() => []);
  let categories = await prisma.factCategory
    .findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } })
    .catch(() => []);

  if (facts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-600 dark:text-slate-400">
        <p className="mb-2">
          Пока нет опубликованных фактов. Обычно контент подгружается при старте приложения
          вместе с миграциями; попробуйте обновить страницу через минуту.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <code className="text-xs block mt-4 text-left whitespace-pre-wrap break-all bg-slate-100 dark:bg-slate-900 p-3 rounded-lg">
            npm run db:seed:guide
          </code>
        ) : null}
      </div>
    );
  }

  const categoryFromFacts =
    categories.length > 0
      ? categories
      : Array.from(
          new Map(facts.map((f) => [f.categorySlug, { slug: f.categorySlug, title: f.categoryTitle }])).values()
        );

  return <FactsContent facts={facts} categories={categoryFromFacts} />;
}
