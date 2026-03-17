import { describe, expect, it } from "vitest";
import {
  buildCropRiskSentence,
  buildCropWeatherProfile,
} from "@/lib/crop-weather-context";

describe("crop weather context", () => {
  it("builds profile from crop slugs and names", () => {
    const profile = buildCropWeatherProfile([
      { name: "Томат, Черри", cropSlug: "tomat" },
      { name: "Огурец Зозуля" },
      { name: "Клубника" },
    ]);

    expect(profile.coldSensitive).toContain("томаты");
    expect(profile.coldSensitive).toContain("огурцы");
    expect(profile.humiditySensitive).toContain("клубника");
  });

  it("formats crop-specific risk sentence", () => {
    const sentence = buildCropRiskSentence(
      {
        coldSensitive: ["томаты", "огурцы"],
        heatSensitive: [],
        humiditySensitive: [],
        droughtSensitive: [],
        windSensitive: [],
        homeSeedlingSensitive: [],
      },
      "cold"
    );

    expect(sentence).toContain("томаты");
    expect(sentence).toContain("огурцы");
  });
});
