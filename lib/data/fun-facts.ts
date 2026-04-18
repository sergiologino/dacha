/**
 * Интересные факты: контент в БД. Здесь — только типы и UI-хелперы.
 */

export type FunFactDTO = {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  text: string;
  categorySlug: string;
  categoryTitle: string;
};

/** Псевдокатегория «все» для фильтра на клиенте. */
export const FACT_FILTER_ALL = "все" as const;

export type FactFilterValue = typeof FACT_FILTER_ALL | string;

export const factCategoryBadgeClass = (slug: string): string => {
  const map: Record<string, string> = {
    plants: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    harvest: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    history: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    science: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    records: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    soil: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200",
    world: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  };
  return map[slug] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};
