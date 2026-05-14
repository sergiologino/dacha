import { describe, expect, it } from "vitest";
import {
  getDefaultSubscriptionPlan,
  getPremiumUntilForSubscriptionPlan,
  getSeasonalPremiumUntil,
  getSubscriptionPlanAmount,
  normalizeSubscriptionPlan,
} from "@/lib/subscription-plans";

describe("subscription plans", () => {
  it("normalizes known plans and rejects unknown values", () => {
    expect(normalizeSubscriptionPlan("monthly")).toBe("monthly");
    expect(normalizeSubscriptionPlan("seasonal")).toBe("seasonal");
    expect(normalizeSubscriptionPlan("yearly")).toBe("yearly");
    expect(normalizeSubscriptionPlan("free")).toBe("monthly");
  });

  it("uses the configured seasonal price", () => {
    expect(getSubscriptionPlanAmount("seasonal")).toBe(990);
  });

  it("defaults to seasonal plan during May-October", () => {
    expect(getDefaultSubscriptionPlan(new Date(2026, 4, 14))).toBe("seasonal");
    expect(getDefaultSubscriptionPlan(new Date(2026, 9, 31))).toBe("seasonal");
    expect(getDefaultSubscriptionPlan(new Date(2026, 10, 1))).toBe("yearly");
  });

  it("grants seasonal premium until the end of October inclusive", () => {
    const premiumUntil = getSeasonalPremiumUntil(new Date(2026, 4, 14, 10, 0, 0));

    expect(premiumUntil.getFullYear()).toBe(2026);
    expect(premiumUntil.getMonth()).toBe(9);
    expect(premiumUntil.getDate()).toBe(31);
    expect(premiumUntil.getHours()).toBe(23);
    expect(premiumUntil.getMinutes()).toBe(59);
  });

  it("extends seasonal premium to the next season when current access is already past October", () => {
    const premiumUntil = getPremiumUntilForSubscriptionPlan({
      plan: "seasonal",
      createdAt: new Date(2026, 0, 1),
      purchasedAt: new Date(2026, 4, 14),
      premiumFrom: new Date(2026, 11, 15),
    });

    expect(premiumUntil.getFullYear()).toBe(2027);
    expect(premiumUntil.getMonth()).toBe(9);
    expect(premiumUntil.getDate()).toBe(31);
  });
});
