import type { FunFactDTO } from "@/lib/data/fun-facts";
import { FACT_CATEGORY_DEFS } from "../../prisma/seed-data/fact-categories";
import { LEGACY_FUN_FACTS } from "../../prisma/seed-data/facts-legacy";
import { EXTRA_FUN_FACTS } from "../../prisma/seed-data/facts-extra";

const categoryTitleBySlug = new Map<string, string>(
  FACT_CATEGORY_DEFS.map((c) => [c.slug, c.title])
);

/** Встроенный набор фактов (как в seed), если в БД ещё нет записей. */
export function getStaticFunFactsFallback(): FunFactDTO[] {
  const all = [...LEGACY_FUN_FACTS, ...EXTRA_FUN_FACTS];
  return all.map((f) => ({
    id: `static:${f.slug}`,
    slug: f.slug,
    emoji: f.emoji,
    title: f.title,
    text: f.text,
    categorySlug: f.categorySlug,
    categoryTitle: categoryTitleBySlug.get(f.categorySlug) ?? f.categorySlug,
  }));
}
