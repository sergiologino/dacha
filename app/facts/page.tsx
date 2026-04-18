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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-600">
        <p className="mb-4">Факты скоро появятся после миграций и сида контента.</p>
        <code className="text-sm block">
          npx prisma migrate deploy && npx tsx prisma/seed-guide-content.ts
        </code>
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
