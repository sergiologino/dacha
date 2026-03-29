import { describe, it, expect, vi, beforeEach } from "vitest";
import { userOwnsPhotoRow } from "@/lib/photo-access";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plant: {
      findUnique: vi.fn(),
    },
    bed: {
      findFirst: vi.fn(),
    },
  },
}));

describe("userOwnsPhotoRow", () => {
  beforeEach(() => {
    vi.mocked(prisma.plant.findUnique).mockReset();
    vi.mocked(prisma.bed.findFirst).mockReset();
  });

  it("returns true when photo.userId matches", async () => {
    const ok = await userOwnsPhotoRow("u-cuid", {
      userId: "u-cuid",
      plantId: "p1",
      bedId: "b1",
    });
    expect(ok).toBe(true);
    expect(prisma.plant.findUnique).not.toHaveBeenCalled();
  });

  it("returns true when plant.userId matches", async () => {
    vi.mocked(prisma.plant.findUnique).mockResolvedValue({
      userId: "u-cuid",
      bedId: "b1",
    } as never);
    const ok = await userOwnsPhotoRow("u-cuid", {
      userId: "oauth-sub",
      plantId: "p1",
      bedId: null,
    });
    expect(ok).toBe(true);
    expect(prisma.bed.findFirst).not.toHaveBeenCalled();
  });

  it("returns true when photo.userId/plant.userId wrong but plant.bed belongs to user", async () => {
    vi.mocked(prisma.plant.findUnique).mockResolvedValue({
      userId: "oauth-sub",
      bedId: "b-owned",
    } as never);
    vi.mocked(prisma.bed.findFirst).mockResolvedValue({ id: "b-owned" } as never);
    const ok = await userOwnsPhotoRow("u-cuid", {
      userId: "oauth-sub-2",
      plantId: "p1",
      bedId: null,
    });
    expect(ok).toBe(true);
    expect(prisma.bed.findFirst).toHaveBeenCalledWith({
      where: { id: "b-owned", userId: "u-cuid" },
      select: { id: true },
    });
  });

  it("returns true when photo.bedId belongs to user (no plant match)", async () => {
    vi.mocked(prisma.plant.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.bed.findFirst).mockResolvedValue({ id: "b1" } as never);
    const ok = await userOwnsPhotoRow("u-cuid", {
      userId: "x",
      plantId: "missing",
      bedId: "b1",
    });
    expect(ok).toBe(true);
  });

  it("returns false for stranger", async () => {
    vi.mocked(prisma.plant.findUnique).mockResolvedValue({
      userId: "other",
      bedId: "b99",
    } as never);
    vi.mocked(prisma.bed.findFirst).mockResolvedValue(null);
    const ok = await userOwnsPhotoRow("u-cuid", {
      userId: "x",
      plantId: "p1",
      bedId: null,
    });
    expect(ok).toBe(false);
  });
});
