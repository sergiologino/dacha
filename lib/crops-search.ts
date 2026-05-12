import type { Crop, CropVariety } from "@/lib/types";

const MIN_SEARCH_CHARS = 3;

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\"'`«»()]/g, " ")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textMatchesQuery(text: string, query: string): boolean {
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedText || !normalizedQuery) return false;
  if (normalizedText.includes(normalizedQuery)) return true;

  const parts = normalizedQuery.split(" ").filter(Boolean);
  return parts.length > 1 && parts.every((part) => normalizedText.includes(part));
}

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
  const q = normalizeSearchText(query);
  if (q.length < minChars) return [];

  const hits: CropSearchHit[] = [];
  const seen = new Set<string>(); // "cropId" или "cropId:varietyName" для дедупа

  for (const crop of crops) {
    const nameMatch = textMatchesQuery(crop.name, q);
    const varieties = crop.varieties ?? [];

    if (nameMatch) {
      const key = String(crop.id);
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({ crop, displayName: crop.name });
      }
    }

    for (const v of varieties) {
      const varietyMatch =
        textMatchesQuery(v.name, q) ||
        textMatchesQuery(`${crop.name} ${v.name}`, q) ||
        textMatchesQuery(`${crop.name}, ${v.name}`, q);
      if (!varietyMatch) continue;
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
