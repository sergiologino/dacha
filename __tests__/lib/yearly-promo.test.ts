import { describe, expect, it } from "vitest";
import {
  YEARLY_PLAN_BASE_FREE_MONTHS,
  YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS,
  addMonthsPreservingDate,
  buildYearlyPromoOffer,
  getPremiumDurationMonths,
  getYearlyPromoDeadline,
  isYearlyPromoEligibleAt,
  resolveLiveYearlyPromoOffer,
} from "@/lib/yearly-promo";

describe("yearly promo", () => {
  it("sets promo deadline to the end of the second next Moscow day", () => {
    const createdAt = new Date("2026-03-15T12:30:00.000Z");
    const deadline = getYearlyPromoDeadline(createdAt);

    expect(deadline.toISOString()).toBe("2026-03-17T20:59:59.999Z");
  });

  it("grants extra months for yearly payment inside the promo window", () => {
    const months = getPremiumDurationMonths({
      plan: "yearly",
      createdAt: new Date("2026-03-15T07:00:00.000Z"),
      purchasedAt: new Date("2026-03-17T20:00:00.000Z"),
    });

    expect(months).toBe(12 + YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS);
  });

  it("does not grant extra months after the promo deadline", () => {
    expect(
      isYearlyPromoEligibleAt(
        new Date("2026-03-15T07:00:00.000Z"),
        new Date("2026-03-17T21:00:00.000Z")
      )
    ).toBe(false);
  });

  it("falls back to the base yearly offer after expiration", () => {
    const expiredOffer = resolveLiveYearlyPromoOffer({
      ...buildYearlyPromoOffer({
        createdAt: new Date("2026-03-15T07:00:00.000Z"),
        isPremium: false,
      }),
      isEligible: true,
      expiresAt: "2026-03-15T00:00:00.000Z",
      extraFreeMonths: YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS,
      totalFreeMonths:
        YEARLY_PLAN_BASE_FREE_MONTHS + YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS,
    });

    expect(expiredOffer.isEligible).toBe(false);
    expect(expiredOffer.extraFreeMonths).toBe(0);
    expect(expiredOffer.totalFreeMonths).toBe(YEARLY_PLAN_BASE_FREE_MONTHS);
  });

  it("preserves the last day of month when extending premium", () => {
    const premiumUntil = addMonthsPreservingDate(
      new Date("2026-01-31T10:00:00.000Z"),
      1
    );

    expect(premiumUntil.toISOString()).toBe("2026-02-28T10:00:00.000Z");
  });
});
