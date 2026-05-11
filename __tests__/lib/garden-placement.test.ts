import { describe, expect, it } from "vitest";
import {
  gardenPlacementLabels,
  gardenPlacementTypes,
  isGardenPlacementType,
  virtualBedNameForPlacement,
} from "@/lib/garden-placement";

describe("garden placement", () => {
  it("covers the virtual bed placement types shown in the UI", () => {
    expect(gardenPlacementTypes).toEqual([
      "seedling_home",
      "greenhouse",
      "open",
      "raised",
    ]);

    for (const type of gardenPlacementTypes) {
      expect(gardenPlacementLabels[type]).toBeTruthy();
      expect(virtualBedNameForPlacement(type)).toBeTruthy();
    }
  });

  it("rejects unknown placement types", () => {
    expect(isGardenPlacementType("greenhouse")).toBe(true);
    expect(isGardenPlacementType("balcony")).toBe(false);
    expect(isGardenPlacementType(null)).toBe(false);
  });
});
