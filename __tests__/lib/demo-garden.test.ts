import { describe, expect, it } from "vitest";
import { demoBedForDate } from "@/lib/demo-garden";

describe("demo garden", () => {
  it("uses seedling at home before May", () => {
    expect(demoBedForDate(new Date("2026-04-30T12:00:00.000Z"))).toEqual({
      name: "Рассада дома",
      type: "seedling_home",
    });
  });

  it("uses greenhouse from May", () => {
    expect(demoBedForDate(new Date("2026-05-01T12:00:00.000Z"))).toEqual({
      name: "Теплица",
      type: "greenhouse",
    });
  });
});
