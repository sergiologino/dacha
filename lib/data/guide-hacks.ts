/**
 * Лайфхаки: контент в БД. Здесь — только типы и недельная подборка по пулу.
 */
import { getISOWeek, getISOWeekYear } from "date-fns";

export const WEEKLY_GUIDE_HACK_COUNT = 8;

/** DTO для UI и сидов (без внутреннего id БД). */
export type GuideHackDTO = {
  slug: string;
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  categorySlug: string;
  categoryTitle: string;
};

function stableMixKey(slug: string, year: number, week: number): number {
  const s = `${slug}:${year}-W${week}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Подборка на текущую ISO-неделю из переданного пула. */
export function getWeeklyGuideHacksFromPool(
  hacks: GuideHackDTO[],
  now: Date = new Date()
): GuideHackDTO[] {
  if (hacks.length === 0) return [];
  const year = getISOWeekYear(now);
  const week = getISOWeek(now);
  const n = Math.min(WEEKLY_GUIDE_HACK_COUNT, hacks.length);
  const sorted = [...hacks].sort(
    (a, b) => stableMixKey(a.slug, year, week) - stableMixKey(b.slug, year, week)
  );
  return sorted.slice(0, n);
}

/**
 * Порядок показа на странице справочника: сначала карточки недели, затем остальные по slug.
 */
export function orderHacksForGuideSection(
  all: GuideHackDTO[],
  now: Date = new Date()
): GuideHackDTO[] {
  const weekly = getWeeklyGuideHacksFromPool(all, now);
  const inWeek = new Set(weekly.map((h) => h.slug));
  const rest = all.filter((h) => !inWeek.has(h.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
  return [...weekly, ...rest];
}
