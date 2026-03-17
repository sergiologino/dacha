import { crops as staticCrops } from "@/lib/data/crops";
import {
  type CommunityCropRow,
  mapCommunityCropRow,
  mergeCropWithCommunityData,
} from "@/lib/crop-community";
import type { Crop } from "@/lib/types";

export interface CropWithSource extends Crop {
  addedByCommunity?: boolean;
}

/** Маппинг Prisma Crop в клиентский Crop + флаг «Добавлено дачниками». */
function dbCropToClient(row: CommunityCropRow): CropWithSource {
  return {
    ...mapCommunityCropRow(row),
    addedByCommunity: true,
  };
}

/** Объединённый список: статика + культуры из БД (добавленные дачниками). */
export async function getMergedCrops(
  prismaCropFindMany: () => Promise<CommunityCropRow[]>
): Promise<CropWithSource[]> {
  const dbCrops = await prismaCropFindMany();
  const staticEntries: Array<[string, CropWithSource]> = staticCrops.map((crop) => [
    crop.slug,
    { ...crop, addedByCommunity: false },
  ]);
  const staticMap = new Map<string, CropWithSource>(staticEntries);

  const mergedStatic = new Map(staticMap);
  const communityOnly: CropWithSource[] = [];

  for (const row of dbCrops) {
    const staticCrop = mergedStatic.get(row.slug);

    if (staticCrop) {
      mergedStatic.set(row.slug, {
        ...mergeCropWithCommunityData(staticCrop, row),
        addedByCommunity: true,
      });
      continue;
    }

    communityOnly.push(dbCropToClient(row));
  }

  return [...mergedStatic.values(), ...communityOnly];
}
