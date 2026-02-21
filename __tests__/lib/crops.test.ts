import { describe, it, expect } from "vitest";
import { crops, regions } from "@/lib/data/crops";

describe("crops data", () => {
  it("has at least 20 crops", () => {
    expect(crops.length).toBeGreaterThanOrEqual(20);
  });

  it("every crop has required fields", () => {
    for (const crop of crops) {
      expect(crop.id).toBeDefined();
      expect(crop.name).toBeTruthy();
      expect(crop.slug).toBeTruthy();
      expect(crop.category).toBeTruthy();
      expect(crop.region.length).toBeGreaterThan(0);
      expect(crop.plantMonth).toBeTruthy();
      expect(crop.harvestMonth).toBeTruthy();
      expect(crop.water).toBeTruthy();
    }
  });

  it("has unique slugs", () => {
    const slugs = crops.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique ids", () => {
    const ids = crops.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("regions list has at least 4 entries", () => {
    expect(regions.length).toBeGreaterThanOrEqual(4);
  });

  it("each region has value and label", () => {
    for (const r of regions) {
      expect(r.value).toBeTruthy();
      expect(r.label).toBeTruthy();
    }
  });
});
