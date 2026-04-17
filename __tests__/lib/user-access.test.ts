import { describe, it, expect } from "vitest";
import {
  hasFullAccess,
  isLegacyFreeTierUser,
  trialEndDate,
  TRIAL_DAYS,
} from "@/lib/user-access";

describe("hasFullAccess", () => {
  it("grants access when isPremium is true", () => {
    expect(
      hasFullAccess(
        { isPremium: true, createdAt: new Date("2020-01-01") },
        new Date("2026-06-01")
      )
    ).toBe(true);
  });

  it("does not grant trial to legacy free-tier accounts (registered on or before 2026-04-17)", () => {
    const created = new Date("2026-04-01T12:00:00.000Z");
    expect(hasFullAccess({ isPremium: false, createdAt: created }, new Date("2026-04-10T12:00:00.000Z"))).toBe(
      false
    );
    expect(isLegacyFreeTierUser({ isPremium: false, createdAt: created })).toBe(true);
  });

  it("grants access within trial for new-model accounts (registered from 2026-04-18)", () => {
    const created = new Date("2026-04-20T12:00:00.000Z");
    expect(hasFullAccess({ isPremium: false, createdAt: created }, new Date("2026-04-25T12:00:00.000Z"))).toBe(
      true
    );
    expect(isLegacyFreeTierUser({ isPremium: false, createdAt: created })).toBe(false);
  });

  it("denies access after trial without premium (new model)", () => {
    const created = new Date("2026-04-20T12:00:00.000Z");
    const after = new Date(created);
    after.setUTCDate(after.getUTCDate() + TRIAL_DAYS + 1);
    expect(hasFullAccess({ isPremium: false, createdAt: created }, after)).toBe(false);
  });
});

describe("trialEndDate", () => {
  it("adds TRIAL_DAYS to createdAt", () => {
    const created = new Date("2026-04-01T12:00:00.000Z");
    const end = trialEndDate(created);
    expect(end.getUTCDate()).toBe(created.getUTCDate() + TRIAL_DAYS);
  });
});
