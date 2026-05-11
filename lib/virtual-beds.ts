import { prisma } from "@/lib/prisma";
import {
  type GardenPlacementType,
  isGardenPlacementType,
  virtualBedNameForPlacement,
} from "@/lib/garden-placement";

export function parsePlacementType(value: unknown): GardenPlacementType | null {
  return isGardenPlacementType(value) ? value : null;
}

export async function ensureVirtualBed(userId: string, type: GardenPlacementType) {
  return prisma.bed.upsert({
    where: {
      userId_virtualKey: {
        userId,
        virtualKey: type,
      },
    },
    update: {
      name: virtualBedNameForPlacement(type),
      type,
      isVirtual: true,
    },
    create: {
      userId,
      name: virtualBedNameForPlacement(type),
      type,
      isVirtual: true,
      virtualKey: type,
    },
  });
}
