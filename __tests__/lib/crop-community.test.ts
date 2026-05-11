import { describe, expect, it } from "vitest";
import {
  cleanVarietyName,
  findExistingCropMatch,
  inferVarietyName,
  mergeVarieties,
  serializeVarietiesForDb,
} from "@/lib/crop-community";
import { attachVarietyImage } from "@/lib/crop-image";

describe("crop community helpers", () => {
  it("routes tomato variety queries to the base crop", () => {
    const crop = findExistingCropMatch("томат сорта Черный бизон", "Томат Черный бизон", "Томат");

    expect(crop?.slug).toBe("tomat");
    expect(inferVarietyName("томат сорта Черный бизон", crop, "Томат Черный бизон")).toBe("Черный бизон");
  });

  it("cleans service words from explicit variety names", () => {
    expect(cleanVarietyName("сорт Черный бизон")).toBe("Черный бизон");
    expect(cleanVarietyName("сорта «Черный бизон»")).toBe("Черный бизон");
  });

  it("serializes varieties without undefined fields for Prisma JSON", () => {
    const merged = mergeVarieties(
      [{ name: "Черри", desc: "Мелкие сладкие плоды." }],
      [{ name: "Черный бизон", desc: "Крупноплодный тёмный сорт.", imageUrl: undefined }],
    );

    expect(serializeVarietiesForDb(merged)).toEqual([
      { name: "Черри", desc: "Мелкие сладкие плоды." },
      { name: "Черный бизон", desc: "Крупноплодный тёмный сорт." },
    ]);
  });

  it("keeps a resolved image on the newly added variety", () => {
    const varieties = mergeVarieties(
      [{ name: "Черри", desc: "Мелкие сладкие плоды." }],
      [{ name: "Черный бизон", desc: "Крупноплодный тёмный сорт." }],
    );
    const withImage = attachVarietyImage(
      varieties,
      "Черный бизон",
      "https://upload.wikimedia.org/example/chernyi-bizon.jpg",
    );

    expect(serializeVarietiesForDb(withImage)).toContainEqual({
      name: "Черный бизон",
      desc: "Крупноплодный тёмный сорт.",
      imageUrl: "https://upload.wikimedia.org/example/chernyi-bizon.jpg",
    });
  });
});
