import { crops as staticCrops } from "@/lib/data/crops";
import type { Crop } from "@/lib/types";

export interface CropWithSource extends Crop {
  addedByCommunity?: boolean;
}

/** Маппинг Prisma Crop в клиентский Crop + флаг «Добавлено дачниками». */
function dbCropToClient(row: {
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
}): CropWithSource {
  const varieties = Array.isArray(row.varieties)
    ? (row.varieties as { name: string; desc: string }[])
    : undefined;
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
    varieties,
    addedByCommunity: true,
  };
}

/** Объединённый список: статика + культуры из БД (добавленные дачниками). */
export async function getMergedCrops(
  prismaCropFindMany: () => Promise<
    {
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
    }[]
  >
): Promise<CropWithSource[]> {
  const dbCrops = await prismaCropFindMany();
  const fromDb = dbCrops.map(dbCropToClient);
  const staticWithFlag = staticCrops.map((c) => ({ ...c, addedByCommunity: false as const }));
  return [...staticWithFlag, ...fromDb];
}
