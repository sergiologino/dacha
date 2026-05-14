import { describe, expect, it } from "vitest";
import {
  combineLocalDateTime,
  PLANNED_WORK_TIME_OPTIONS,
} from "@/components/planned-work-modal";

describe("planned work time input", () => {
  it("offers half-hour time options for manual works", () => {
    expect(PLANNED_WORK_TIME_OPTIONS).toHaveLength(48);
    expect(PLANNED_WORK_TIME_OPTIONS.slice(0, 4)).toEqual([
      "00:00",
      "00:30",
      "01:00",
      "01:30",
    ]);
    expect(PLANNED_WORK_TIME_OPTIONS.at(-1)).toBe("23:30");
  });

  it("stores selected local date and time in scheduledDate", () => {
    const iso = combineLocalDateTime("2026-05-14", "10:30");
    const date = new Date(iso);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(14);
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(30);
  });
});
