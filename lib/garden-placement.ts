export const gardenPlacementTypes = [
  "seedling_home",
  "greenhouse",
  "open",
  "raised",
] as const;

export type GardenPlacementType = (typeof gardenPlacementTypes)[number];

export const gardenPlacementLabels: Record<GardenPlacementType, string> = {
  seedling_home: "Дома на подоконнике",
  greenhouse: "В теплице",
  open: "В открытом грунте",
  raised: "На высокой грядке",
};

export const gardenPlacementShortLabels: Record<GardenPlacementType, string> = {
  seedling_home: "Дома",
  greenhouse: "Теплица",
  open: "Открытый грунт",
  raised: "Высокая грядка",
};

export function isGardenPlacementType(value: unknown): value is GardenPlacementType {
  return typeof value === "string" && gardenPlacementTypes.includes(value as GardenPlacementType);
}

export function virtualBedNameForPlacement(type: GardenPlacementType): string {
  return gardenPlacementShortLabels[type];
}
