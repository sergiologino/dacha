import { describe, expect, it } from "vitest";
import { searchCropsAndVarieties } from "@/lib/crops-search";
import type { Crop } from "@/lib/types";

const crops: Crop[] = [
  {
    id: 1,
    name: "Томат",
    slug: "tomat",
    category: "Овощи",
    region: ["Все регионы"],
    plantMonth: "Май",
    harvestMonth: "Август",
    water: "Каждые 3-4 дня",
    note: "Любит тепло",
    varieties: [
      { name: "Бычье сердце", desc: "Крупноплодный сорт." },
      { name: "Черный бизон", desc: "Тёмный крупноплодный сорт." },
    ],
  },
];

describe("searchCropsAndVarieties", () => {
  it("finds a variety by variety name only", () => {
    expect(searchCropsAndVarieties(crops, "Бычье сердце")[0]?.displayName).toBe(
      "Томат, Бычье сердце",
    );
  });

  it("finds a variety by crop and variety name together", () => {
    expect(searchCropsAndVarieties(crops, "Томат Бычье сердце")[0]?.displayName).toBe(
      "Томат, Бычье сердце",
    );
  });

  it("finds a variety with punctuation and ё/e normalization", () => {
    expect(searchCropsAndVarieties(crops, "томат, бычье сердце")[0]?.displayName).toBe(
      "Томат, Бычье сердце",
    );
  });
});
