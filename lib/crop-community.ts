import { crops as staticCrops } from "@/lib/data/crops";
import type { Crop, CropVariety } from "@/lib/types";

/** Главное фото культуры или первое фото сорта (если общее не задано). */
export function getCropDisplayImageUrl(crop: Pick<Crop, "imageUrl" | "varieties">): string | undefined {
  const main = crop.imageUrl?.trim();
  if (main) return main;
  const withVarietyImg = crop.varieties?.find((v) => v.imageUrl?.trim());
  return withVarietyImg?.imageUrl?.trim();
}

export interface CommunityCropRow {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  plantMonths: string[];
  harvestMonths: string[];
  waterSchedule: string | null;
  regions: string[];
  careNotes: string | null;
  imageUrl: string | null;
  varieties: unknown;
}

const CROP_ALIASES: Record<string, string[]> = {
  tomat: ["томат", "томаты", "помидор", "помидоры"],
  perets: ["перец", "перцы", "болгарский перец", "сладкий перец"],
  ogurets: ["огурец", "огурцы", "огурцов"],
  baklazhan: ["баклажан", "баклажаны"],
  luk: ["лук", "луки", "репчатый лук"],
  "luk-porey": ["лук порей", "лук-порей", "порей"],
  petuniya: ["петуния", "петунии", "петунья", "петуньи"],
  kapusta: ["капуста"],
  klubnika: ["клубника", "земляника"],
};

export function normalizeCropText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\"'`«»()]/g, " ")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVarieties(raw: unknown): CropVariety[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const varieties = raw
    .map((item) => ({
      name:
        typeof item === "object" && item && "name" in item
          ? String((item as { name?: unknown }).name ?? "").trim()
          : "",
      desc:
        typeof item === "object" && item && "desc" in item
          ? String((item as { desc?: unknown }).desc ?? "").trim()
          : "",
      imageUrl:
        typeof item === "object" &&
        item &&
        "imageUrl" in item &&
        typeof (item as { imageUrl?: unknown }).imageUrl === "string"
          ? String((item as { imageUrl: string }).imageUrl).trim() || undefined
          : undefined,
    }))
    .filter((item) => item.name.length > 0);

  return varieties.length > 0 ? varieties : undefined;
}

export function mergeVarieties(
  base: CropVariety[] | undefined,
  extra: CropVariety[] | undefined,
): CropVariety[] | undefined {
  const seen = new Map<string, CropVariety>();

  for (const item of [...(base ?? []), ...(extra ?? [])]) {
    const key = normalizeCropText(item.name);
    if (!key) continue;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
      continue;
    }

    const nextDesc =
      (!existing.desc || existing.desc === "—") && item.desc && item.desc !== "—"
        ? item.desc
        : existing.desc;
    const nextImg = existing.imageUrl || item.imageUrl;
    if (nextDesc !== existing.desc || nextImg !== existing.imageUrl) {
      seen.set(key, { name: existing.name, desc: nextDesc, imageUrl: nextImg });
    }
  }

  const merged = [...seen.values()];
  return merged.length > 0 ? merged : undefined;
}

export function mapCommunityCropRow(row: CommunityCropRow): Crop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description ?? undefined,
    region: row.regions ?? [],
    plantMonth: row.plantMonths?.[0] ?? "",
    harvestMonth: row.harvestMonths?.[0] ?? "",
    water: row.waterSchedule ?? "",
    note: row.careNotes ?? "",
    imageUrl: row.imageUrl ?? undefined,
    varieties: buildVarieties(row.varieties),
  };
}

export function mergeCropWithCommunityData(baseCrop: Crop, row: CommunityCropRow): Crop {
  const overlayCrop = mapCommunityCropRow(row);

  return {
    ...baseCrop,
    description: overlayCrop.description || baseCrop.description,
    region: overlayCrop.region.length > 0 ? overlayCrop.region : baseCrop.region,
    plantMonth: overlayCrop.plantMonth || baseCrop.plantMonth,
    harvestMonth: overlayCrop.harvestMonth || baseCrop.harvestMonth,
    water: overlayCrop.water || baseCrop.water,
    note: overlayCrop.note || baseCrop.note,
    imageUrl: overlayCrop.imageUrl || baseCrop.imageUrl,
    varieties: mergeVarieties(baseCrop.varieties, overlayCrop.varieties),
  };
}

export function findMatchingStaticCropBySlugOrName(nameOrSlug: string): Crop | null {
  const normalized = normalizeCropText(nameOrSlug);

  return (
    staticCrops.find((crop) => crop.slug === nameOrSlug || normalizeCropText(crop.name) === normalized) ??
    null
  );
}

export function findExistingCropMatch(query: string, extractedName?: string, baseCropName?: string): Crop | null {
  const candidates = [
    normalizeCropText(baseCropName ?? ""),
    normalizeCropText(extractedName ?? ""),
    normalizeCropText(query),
  ].filter(Boolean);

  for (const crop of staticCrops) {
    const aliases = [normalizeCropText(crop.name), ...(CROP_ALIASES[crop.slug] ?? []).map(normalizeCropText)];

    for (const candidate of candidates) {
      for (const alias of aliases.sort((a, b) => b.length - a.length)) {
        if (!alias) continue;
        if (candidate === alias) return crop;
        if (candidate.startsWith(`${alias} `) || candidate.endsWith(` ${alias}`) || candidate.includes(` ${alias} `)) {
          return crop;
        }
      }
    }
  }

  return null;
}

export function inferVarietyName(
  query: string,
  crop: Crop | null,
  extractedName?: string,
  explicitVarietyName?: string,
): string | null {
  if (explicitVarietyName) {
    const cleaned = normalizeCropText(explicitVarietyName);
    return cleaned ? explicitVarietyName.trim() : null;
  }

  if (!crop) {
    return null;
  }

  const aliases = [crop.name, ...(CROP_ALIASES[crop.slug] ?? [])]
    .map(normalizeCropText)
    .sort((a, b) => b.length - a.length);

  for (const rawSource of [query, extractedName ?? ""]) {
    const source = normalizeCropText(rawSource);
    if (!source) continue;

    for (const alias of aliases) {
      if (!alias) continue;
      if (source === alias) continue;

      if (source.startsWith(`${alias} `)) {
        const variety = rawSource.trim().slice(rawSource.toLowerCase().indexOf(alias) + alias.length).trim();
        return variety.replace(/^[,:\-–—\s]+/, "").trim() || null;
      }
    }
  }

  return null;
}
