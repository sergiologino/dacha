import { describe, expect, it } from "vitest";
import {
  findExistingCropMatch,
  inferVarietyName,
  mergeVarieties,
  normalizeCropText,
} from "@/lib/crop-community";

describe("crop community helpers", () => {
  it("normalizes crop text consistently", () => {
    expect(normalizeCropText("Томат, «Всем на зависть»")).toBe("томат всем на зависть");
  });

  it("finds existing crop by common synonym", () => {
    const match = findExistingCropMatch("помидор всем на зависть", "Томат", "Томат");
    expect(match?.slug).toBe("tomat");
  });

  it("infers variety name from query", () => {
    const crop = findExistingCropMatch("томат всем на зависть", "Томат", "Томат");
    expect(inferVarietyName("томат всем на зависть", crop, "Томат", undefined)).toBe("всем на зависть");
  });

  it("merges varieties without duplicates", () => {
    const merged = mergeVarieties(
      [{ name: "Черри", desc: "base" }],
      [{ name: "черри", desc: "updated" }, { name: "Всем на зависть", desc: "new" }],
    );

    expect(merged).toHaveLength(2);
    expect(merged?.some((item) => item.name === "Всем на зависть")).toBe(true);
  });

  it("merges variety imageUrl from newer entry", () => {
    const merged = mergeVarieties([{ name: "Черри", desc: "мелкие" }], [
      { name: "Черри", desc: "мелкие", imageUrl: "https://upload.wikimedia.org/test.jpg" },
    ]);
    expect(merged?.[0].imageUrl).toBe("https://upload.wikimedia.org/test.jpg");
  });
});
