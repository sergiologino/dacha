import { describe, it, expect } from "vitest";
import {
  getWeeklyGuideHacksFromPool,
  orderHacksForGuideSection,
  WEEKLY_GUIDE_HACK_COUNT,
  type GuideHackDTO,
} from "@/lib/data/guide-hacks";
import { LEGACY_GUIDE_HACKS } from "../../prisma/seed-data/hacks-legacy";
import { EXTRA_GUIDE_HACKS } from "../../prisma/seed-data/hacks-extra";
import { GUIDE_HACK_CATEGORY_DEFS } from "../../prisma/seed-data/hack-categories";

const categoryTitle = new Map(
  GUIDE_HACK_CATEGORY_DEFS.map((c) => [c.slug, c.title] as const)
);

const HACK_POOL: GuideHackDTO[] = [...LEGACY_GUIDE_HACKS, ...EXTRA_GUIDE_HACKS].map(
  (h) => ({
    slug: h.slug,
    title: h.title,
    text: h.text,
    imageUrl: h.imageUrl,
    imageAlt: h.imageAlt,
    categorySlug: h.categorySlug,
    categoryTitle: categoryTitle.get(h.categorySlug) ?? h.categorySlug,
  })
);

describe("guide-hacks seed pool", () => {
  it("has at least 15 items", () => {
    expect(HACK_POOL.length).toBeGreaterThanOrEqual(15);
  });

  it("every hack has image and body text", () => {
    for (const h of HACK_POOL) {
      expect(h.slug).toBeTruthy();
      expect(h.title.length).toBeGreaterThan(5);
      expect(h.text.length).toBeGreaterThan(40);
      expect(h.imageUrl).toMatch(/^https:\/\//);
      expect(h.imageAlt.length).toBeGreaterThanOrEqual(3);
      expect(categoryTitle.has(h.categorySlug)).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = HACK_POOL.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("guide-hacks weekly selection", () => {
  it("has fixed size and is stable for the same date", () => {
    const d = new Date("2026-03-15T12:00:00Z");
    const a = getWeeklyGuideHacksFromPool(HACK_POOL, d);
    const b = getWeeklyGuideHacksFromPool(HACK_POOL, d);
    expect(a.length).toBe(Math.min(WEEKLY_GUIDE_HACK_COUNT, HACK_POOL.length));
    expect(a.map((x) => x.slug).join(",")).toBe(b.map((x) => x.slug).join(","));
  });

  it("differs for distant weeks", () => {
    const w1 = getWeeklyGuideHacksFromPool(HACK_POOL, new Date("2026-01-05T12:00:00Z"));
    const w2 = getWeeklyGuideHacksFromPool(HACK_POOL, new Date("2026-06-15T12:00:00Z"));
    expect(w1.map((x) => x.slug).join(",")).not.toBe(w2.map((x) => x.slug).join(","));
  });

  it("orderHacksForGuideSection puts weekly picks first", () => {
    const d = new Date("2026-03-15T12:00:00Z");
    const weekly = getWeeklyGuideHacksFromPool(HACK_POOL, d);
    const ordered = orderHacksForGuideSection(HACK_POOL, d);
    expect(ordered.slice(0, weekly.length).map((h) => h.slug)).toEqual(
      weekly.map((h) => h.slug)
    );
  });
});
