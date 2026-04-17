import { describe, it, expect } from "vitest";
import {
  filterWinterDormancyEvents,
  isWinterDormancyCrop,
} from "@/lib/timeline-winter-context";

describe("isWinterDormancyCrop", () => {
  it("detects autumn-planted winter wheat", () => {
    expect(
      isWinterDormancyCrop(new Date("2025-10-01"), "Пшеница озимая", "pshenitsa-ozimaya")
    ).toBe(true);
  });

  it("returns false for spring tomato", () => {
    expect(isWinterDormancyCrop(new Date("2025-05-01"), "Томат", "tomat")).toBe(false);
  });
});

describe("filterWinterDormancyEvents", () => {
  it("drops December events for winter crop", () => {
    const planted = new Date("2025-10-15");
    const events = [
      {
        scheduledDate: new Date("2025-12-10"),
        dateTo: null as Date | null,
      },
      {
        scheduledDate: new Date("2026-03-15"),
        dateTo: null as Date | null,
      },
    ];
    const out = filterWinterDormancyEvents(events, planted, "Озимая рожь", "rozh-ozimaya");
    expect(out).toHaveLength(1);
    expect(out[0].scheduledDate.getUTCMonth()).toBe(2);
  });
});
