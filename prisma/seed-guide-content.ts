/**
 * Идемпотентное наполнение лайфхаков и фактов (upsert по slug).
 * Запуск: npx tsx prisma/seed-guide-content.ts
 * Не трогает промпты и прочие таблицы.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { GUIDE_HACK_CATEGORY_DEFS } from "./seed-data/hack-categories";
import { FACT_CATEGORY_DEFS } from "./seed-data/fact-categories";
import { LEGACY_GUIDE_HACKS } from "./seed-data/hacks-legacy";
import { EXTRA_GUIDE_HACKS } from "./seed-data/hacks-extra";
import { LEGACY_FUN_FACTS } from "./seed-data/facts-legacy";
import { EXTRA_FUN_FACTS } from "./seed-data/facts-extra";

const prisma = new PrismaClient();

async function main() {
  for (const c of GUIDE_HACK_CATEGORY_DEFS) {
    await prisma.guideHackCategory.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        sortOrder: c.sortOrder,
      },
      update: { title: c.title, sortOrder: c.sortOrder },
    });
  }

  const hackCatIds = new Map(
    (await prisma.guideHackCategory.findMany()).map((x) => [x.slug, x.id] as const)
  );

  const allHacks = [...LEGACY_GUIDE_HACKS, ...EXTRA_GUIDE_HACKS];
  for (const h of allHacks) {
    const categoryId = hackCatIds.get(h.categorySlug);
    if (!categoryId) throw new Error(`Unknown hack category: ${h.categorySlug}`);
    await prisma.guideHack.upsert({
      where: { slug: h.slug },
      create: {
        slug: h.slug,
        title: h.title,
        text: h.text,
        imageUrl: h.imageUrl,
        imageAlt: h.imageAlt,
        published: true,
        sortOrder: h.sortOrder,
        categoryId,
      },
      update: {
        title: h.title,
        text: h.text,
        imageUrl: h.imageUrl,
        imageAlt: h.imageAlt,
        published: true,
        sortOrder: h.sortOrder,
        categoryId,
      },
    });
  }

  for (const c of FACT_CATEGORY_DEFS) {
    await prisma.factCategory.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        sortOrder: c.sortOrder,
      },
      update: { title: c.title, sortOrder: c.sortOrder },
    });
  }

  const factCatIds = new Map(
    (await prisma.factCategory.findMany()).map((x) => [x.slug, x.id] as const)
  );

  const allFacts = [...LEGACY_FUN_FACTS, ...EXTRA_FUN_FACTS];
  for (const f of allFacts) {
    const categoryId = factCatIds.get(f.categorySlug);
    if (!categoryId) throw new Error(`Unknown fact category: ${f.categorySlug}`);
    await prisma.funFact.upsert({
      where: { slug: f.slug },
      create: {
        slug: f.slug,
        emoji: f.emoji,
        title: f.title,
        text: f.text,
        published: true,
        sortOrder: f.sortOrder,
        categoryId,
      },
      update: {
        emoji: f.emoji,
        title: f.title,
        text: f.text,
        published: true,
        sortOrder: f.sortOrder,
        categoryId,
      },
    });
  }

  console.log(
    "Guide content seeded:",
    allHacks.length,
    "hacks,",
    allFacts.length,
    "facts"
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
