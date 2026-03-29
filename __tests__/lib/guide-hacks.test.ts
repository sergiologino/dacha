import { describe, it, expect } from "vitest";
import {
  GUIDE_HACKS,
  getWeeklyGuideHacks,
  WEEKLY_GUIDE_HACK_COUNT,
} from "@/lib/data/guide-hacks";

describe("guide-hacks", () => {
  it("has at least 15 items in pool", () => {
    expect(GUIDE_HACKS.length).toBeGreaterThanOrEqual(15);
  });

  it("every hack has image and body text", () => {
    for (const h of GUIDE_HACKS) {
      expect(h.id).toBeTruthy();
      expect(h.title.length).toBeGreaterThan(5);
      expect(h.text.length).toBeGreaterThan(40);
      expect(h.imageUrl).toMatch(/^https:\/\//);
      expect(h.imageAlt.length).toBeGreaterThan(5);
    }
  });

  it("ids are unique", () => {
    const ids = GUIDE_HACKS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("weekly selection has fixed size and is stable within the same day", () => {
    const d = new Date("2026-03-15T12:00:00Z");
    const a = getWeeklyGuideHacks(d);
    const b = getWeeklyGuideHacks(d);
    expect(a.length).toBe(Math.min(WEEKLY_GUIDE_HACK_COUNT, GUIDE_HACKS.length));
    expect(a.map((x) => x.id).join(",")).toBe(b.map((x) => x.id).join(","));
  });

  it("weekly selection differs for distant weeks (rotation)", () => {
    const w1 = getWeeklyGuideHacks(new Date("2026-01-05T12:00:00Z"));
    const w2 = getWeeklyGuideHacks(new Date("2026-06-15T12:00:00Z"));
    expect(w1.map((x) => x.id).join(",")).not.toBe(w2.map((x) => x.id).join(","));
  });
});
