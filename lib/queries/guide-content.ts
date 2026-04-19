import { prisma } from "@/lib/prisma";
import type { GuideHackDTO } from "@/lib/data/guide-hacks";
import type { FunFactDTO } from "@/lib/data/fun-facts";
import { getStaticFunFactsFallback } from "@/lib/data/fun-facts-fallback";

export async function getPublishedGuideHacks(): Promise<GuideHackDTO[]> {
  const rows = await prisma.guideHack.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
  return rows.map((h) => ({
    slug: h.slug,
    title: h.title,
    text: h.text,
    imageUrl: h.imageUrl,
    imageAlt: h.imageAlt,
    categorySlug: h.category.slug,
    categoryTitle: h.category.title,
  }));
}

export async function getPublishedFunFacts(): Promise<FunFactDTO[]> {
  const rows = await prisma.funFact.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
  return rows.map((f) => ({
    id: f.id,
    slug: f.slug,
    emoji: f.emoji,
    title: f.title,
    text: f.text,
    categorySlug: f.category.slug,
    categoryTitle: f.category.title,
  }));
}

/** Факты из БД; если таблица пуста или БД недоступна — встроенный набор как у seed. */
export async function getPublishedFunFactsWithFallback(): Promise<FunFactDTO[]> {
  try {
    const fromDb = await getPublishedFunFacts();
    if (fromDb.length > 0) return fromDb;
  } catch {
    // P1001 / пустая БД / миграции
  }
  return getStaticFunFactsFallback();
}

export async function countPublishedGuideHacks(): Promise<number> {
  return prisma.guideHack.count({ where: { published: true } });
}
