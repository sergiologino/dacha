export type PlantWeatherInfo = {
  name: string;
  cropSlug?: string | null;
  bedType?: string | null;
};

export type CropWeatherProfile = {
  coldSensitive: string[];
  heatSensitive: string[];
  humiditySensitive: string[];
  droughtSensitive: string[];
  windSensitive: string[];
  homeSeedlingSensitive: string[];
};

const CROP_NAMES: Record<string, string> = {
  tomat: "томаты",
  ogurets: "огурцы",
  perets: "перцы",
  baklazhan: "баклажаны",
  kapusta: "капуста",
  brokkoli: "брокколи",
  kolrabi: "кольраби",
  klubnika: "клубника",
  zemlyanika: "земляника",
  kartofel: "картофель",
  salat: "салат",
  rukkola: "руккола",
  shpinat: "шпинат",
  petuniya: "петуния",
  bazilik: "базилик",
  arbuz: "арбузы",
  dynya: "дыни",
  kabachok: "кабачки",
};

const NAME_MATCHERS: Array<{ key: string; patterns: string[] }> = [
  { key: "tomat", patterns: ["томат", "помидор"] },
  { key: "ogurets", patterns: ["огур"] },
  { key: "perets", patterns: ["перец"] },
  { key: "baklazhan", patterns: ["баклаж"] },
  { key: "kapusta", patterns: ["капуст"] },
  { key: "brokkoli", patterns: ["броккол"] },
  { key: "kolrabi", patterns: ["кольраб"] },
  { key: "klubnika", patterns: ["клубник"] },
  { key: "zemlyanika", patterns: ["землян"] },
  { key: "kartofel", patterns: ["картоф"] },
  { key: "salat", patterns: ["салат"] },
  { key: "rukkola", patterns: ["руккол"] },
  { key: "shpinat", patterns: ["шпинат"] },
  { key: "petuniya", patterns: ["петуни"] },
  { key: "bazilik", patterns: ["базилик"] },
  { key: "arbuz", patterns: ["арбуз"] },
  { key: "dynya", patterns: ["дын"] },
  { key: "kabachok", patterns: ["кабач"] },
];

const COLD_SENSITIVE = new Set([
  "tomat",
  "ogurets",
  "perets",
  "baklazhan",
  "bazilik",
  "arbuz",
  "dynya",
  "kabachok",
  "petuniya",
]);

const HEAT_SENSITIVE = new Set([
  "ogurets",
  "perets",
  "baklazhan",
  "salat",
  "rukkola",
  "shpinat",
  "klubnika",
  "zemlyanika",
  "kapusta",
  "brokkoli",
  "kolrabi",
]);

const HUMIDITY_SENSITIVE = new Set([
  "tomat",
  "ogurets",
  "kartofel",
  "klubnika",
  "zemlyanika",
  "petuniya",
]);

const DROUGHT_SENSITIVE = new Set([
  "ogurets",
  "kapusta",
  "brokkoli",
  "kolrabi",
  "salat",
  "rukkola",
  "shpinat",
  "klubnika",
  "zemlyanika",
  "kabachok",
]);

const WIND_SENSITIVE = new Set([
  "tomat",
  "ogurets",
  "perets",
  "baklazhan",
  "petuniya",
]);

const HOME_SEEDLING_SENSITIVE = new Set([
  "tomat",
  "ogurets",
  "perets",
  "baklazhan",
  "petuniya",
  "bazilik",
  "kapusta",
]);

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

export function resolveCropKey(plant: PlantWeatherInfo): string | null {
  if (plant.cropSlug && CROP_NAMES[plant.cropSlug]) {
    return plant.cropSlug;
  }

  const normalized = normalizeText(plant.name);
  for (const matcher of NAME_MATCHERS) {
    if (matcher.patterns.some((pattern) => normalized.includes(pattern))) {
      return matcher.key;
    }
  }

  return null;
}

export function getCropDisplayName(plant: PlantWeatherInfo): string | null {
  const key = resolveCropKey(plant);
  return key ? CROP_NAMES[key] ?? null : null;
}

function setToSortedNames(keys: Set<string>): string[] {
  return Array.from(keys)
    .map((key) => CROP_NAMES[key] ?? key)
    .sort((a, b) => a.localeCompare(b, "ru"));
}

export function buildCropWeatherProfile(
  plants: PlantWeatherInfo[] | undefined
): CropWeatherProfile {
  const coldSensitive = new Set<string>();
  const heatSensitive = new Set<string>();
  const humiditySensitive = new Set<string>();
  const droughtSensitive = new Set<string>();
  const windSensitive = new Set<string>();
  const homeSeedlingSensitive = new Set<string>();

  for (const plant of plants ?? []) {
    const key = resolveCropKey(plant);
    if (!key) continue;

    if (COLD_SENSITIVE.has(key)) coldSensitive.add(key);
    if (HEAT_SENSITIVE.has(key)) heatSensitive.add(key);
    if (HUMIDITY_SENSITIVE.has(key)) humiditySensitive.add(key);
    if (DROUGHT_SENSITIVE.has(key)) droughtSensitive.add(key);
    if (WIND_SENSITIVE.has(key)) windSensitive.add(key);
    if (HOME_SEEDLING_SENSITIVE.has(key)) homeSeedlingSensitive.add(key);
  }

  return {
    coldSensitive: setToSortedNames(coldSensitive),
    heatSensitive: setToSortedNames(heatSensitive),
    humiditySensitive: setToSortedNames(humiditySensitive),
    droughtSensitive: setToSortedNames(droughtSensitive),
    windSensitive: setToSortedNames(windSensitive),
    homeSeedlingSensitive: setToSortedNames(homeSeedlingSensitive),
  };
}

function joinCropNames(names: string[]): string {
  if (names.length <= 2) return names.join(" и ");
  return `${names.slice(0, 2).join(" и ")} и другие`;
}

export function buildCropRiskSentence(
  profile: CropWeatherProfile | undefined,
  risk:
    | "cold"
    | "heat"
    | "humidity"
    | "drought"
    | "wind"
    | "home_seedling"
): string {
  if (!profile) return "";

  const names =
    risk === "cold"
      ? profile.coldSensitive
      : risk === "heat"
        ? profile.heatSensitive
        : risk === "humidity"
          ? profile.humiditySensitive
          : risk === "drought"
            ? profile.droughtSensitive
            : risk === "wind"
              ? profile.windSensitive
              : profile.homeSeedlingSensitive;

  if (names.length === 0) return "";

  const crops = joinCropNames(names);

  if (risk === "cold") {
    return `Холод особенно опасен для культур вроде ${crops}.`;
  }
  if (risk === "heat") {
    return `Перегрев быстрее бьёт по культурам вроде ${crops}.`;
  }
  if (risk === "humidity") {
    return `Сырость повышает риск болезней у культур вроде ${crops}.`;
  }
  if (risk === "drought") {
    return `Без влаги быстрее пострадают ${crops}.`;
  }
  if (risk === "wind") {
    return `Порывы особенно травмируют ${crops}.`;
  }
  return `Для домашней рассады особенно чувствительны ${crops}.`;
}
