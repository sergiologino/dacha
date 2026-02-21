import { describe, it, expect } from "vitest";
import { findClimateZone, getDefaultReport } from "@/lib/data/climate-zones";

describe("findClimateZone", () => {
  it("finds Moscow zone for coordinates near Moscow", () => {
    const zone = findClimateZone(55.75, 37.62);
    expect(zone).not.toBeNull();
    expect(zone!.name).toContain("Московская");
  });

  it("finds Krasnodar zone for southern coordinates", () => {
    const zone = findClimateZone(45.03, 38.97);
    expect(zone).not.toBeNull();
    expect(zone!.name).toContain("Краснодар");
  });

  it("finds SPb zone for northern coordinates", () => {
    const zone = findClimateZone(59.93, 30.33);
    expect(zone).not.toBeNull();
    expect(zone!.name).toContain("Северо-Запад");
  });

  it("finds Siberia zone for Novosibirsk", () => {
    const zone = findClimateZone(55.03, 82.92);
    expect(zone).not.toBeNull();
    expect(zone!.name).toContain("Сибирь");
  });

  it("returns null for coordinates outside Russia", () => {
    const zone = findClimateZone(48.86, 2.35); // Paris
    expect(zone).toBeNull();
  });
});

describe("getDefaultReport", () => {
  it("returns a report for any coordinates", () => {
    const report = getDefaultReport(60, 100);
    expect(report.name).toBe("Ваш регион");
    expect(report.report).toContain("60.00");
    expect(report.bestCrops.length).toBeGreaterThan(0);
  });
});
