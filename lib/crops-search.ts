import type { Crop, CropVariety } from "@/lib/types";

const MIN_SEARCH_CHARS = 3;

export interface CropSearchHit {
  crop: Crop;
  variety?: CropVariety;
  /** Отображаемое название: "Томат, Черри" или "Томат" */
  displayName: string;
}

/**
 * Поиск по справочнику: название культуры и название сорта.
 * Поиск от 3 символов, без учёта регистра.
 */
export function searchCropsAndVarieties(
  crops: Crop[],
  query: string,
  minChars: number = MIN_SEARCH_CHARS
): CropSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < minChars) return [];

  const hits: CropSearchHit[] = [];
  const seen = new Set<string>(); // "cropId" или "cropId:varietyName" для дедупа

  for (const crop of crops) {
    const nameMatch = crop.name.toLowerCase().includes(q);
    const varieties = crop.varieties ?? [];

    if (nameMatch) {
      const key = String(crop.id);
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({ crop, displayName: crop.name });
      }
    }

    for (const v of varieties) {
      if (!v.name.toLowerCase().includes(q)) continue;
      const key = `${crop.id}:${v.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        crop,
        variety: v,
        displayName: `${crop.name}, ${v.name}`,
      });
    }
  }

  return hits;
}
