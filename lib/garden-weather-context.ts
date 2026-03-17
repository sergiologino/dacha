export type GardenWeatherContext = {
  openBeds: number;
  greenhouseBeds: number;
  raisedBeds: number;
  seedlingHomeBeds: number;
};

export function buildGardenWeatherContext(
  bedTypes: string[] | undefined
): GardenWeatherContext {
  const context: GardenWeatherContext = {
    openBeds: 0,
    greenhouseBeds: 0,
    raisedBeds: 0,
    seedlingHomeBeds: 0,
  };

  for (const type of bedTypes ?? []) {
    if (type === "greenhouse") {
      context.greenhouseBeds++;
    } else if (type === "raised") {
      context.raisedBeds++;
    } else if (type === "seedling_home") {
      context.seedlingHomeBeds++;
    } else {
      context.openBeds++;
    }
  }

  return context;
}

export function hasOutdoorCultivation(context: GardenWeatherContext): boolean {
  return (
    context.openBeds > 0 ||
    context.raisedBeds > 0 ||
    context.greenhouseBeds > 0
  );
}

export function isSeedlingHomeOnly(context: GardenWeatherContext): boolean {
  return context.seedlingHomeBeds > 0 && !hasOutdoorCultivation(context);
}
