import { prisma } from "@/lib/prisma";
import type { GuideHackDTO } from "@/lib/data/guide-hacks";
import type { FunFactDTO } from "@/lib/data/fun-facts";

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

export async function countPublishedGuideHacks(): Promise<number> {
  return prisma.guideHack.count({ where: { published: true } });
}
