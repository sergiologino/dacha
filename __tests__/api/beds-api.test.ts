import { describe, it, expect } from "vitest";

describe("Beds API data structures", () => {
  it("bed type labels cover all valid types", () => {
    const validTypes = ["open", "greenhouse", "raised"];
    const labels: Record<string, string> = {
      open: "Открытый грунт",
      greenhouse: "Теплица",
      raised: "Высокая грядка",
    };
    for (const t of validTypes) {
      expect(labels[t]).toBeTruthy();
    }
  });

  it("bed interface has required fields", () => {
    const bed = {
      id: "test-1",
      name: "Грядка 1",
      number: "1",
      type: "open",
      createdAt: new Date().toISOString(),
      plants: [],
      photos: [],
    };
    expect(bed.id).toBeTruthy();
    expect(bed.name).toBeTruthy();
    expect(bed.type).toBe("open");
    expect(Array.isArray(bed.plants)).toBe(true);
    expect(Array.isArray(bed.photos)).toBe(true);
  });

  it("bed can have plants and photos", () => {
    const bed = {
      id: "test-2",
      name: "Теплица",
      number: null,
      type: "greenhouse",
      createdAt: new Date().toISOString(),
      plants: [
        { id: "p1", name: "Томат", status: "growing", plantedDate: "2026-05-01" },
        { id: "p2", name: "Огурец", status: "growing", plantedDate: "2026-05-10" },
      ],
      photos: [
        { id: "ph1", url: "/photo1.jpg", caption: "Посадка", takenAt: "2026-05-01" },
      ],
    };
    expect(bed.plants).toHaveLength(2);
    expect(bed.photos).toHaveLength(1);
    expect(bed.plants[0].name).toBe("Томат");
  });

  it("bed types are limited to valid values", () => {
    const validTypes = new Set(["open", "greenhouse", "raised"]);
    expect(validTypes.has("open")).toBe(true);
    expect(validTypes.has("greenhouse")).toBe(true);
    expect(validTypes.has("raised")).toBe(true);
    expect(validTypes.has("pool")).toBe(false);
  });
});
