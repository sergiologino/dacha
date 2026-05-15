import {
  addMonthsPreservingDate,
  getPremiumDurationMonths,
  getYearlyPlanExtraMonths,
  YEARLY_PLAN_STANDARD_MONTHS,
} from "@/lib/yearly-promo";

export type SubscriptionPlan = "monthly" | "seasonal" | "yearly";

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  {
    amount: number;
    title: string;
    period: string;
    paymentLabel: string;
    description: string;
    receiptDescription: string;
  }
> = {
  monthly: {
    amount: 199,
    title: "Месячный",
    period: "/ мес",
    paymentLabel: "199 ₽ в месяц",
    description: "Любимая Дача Премиум на месяц",
    receiptDescription: "Премиум на месяц",
  },
  seasonal: {
    amount: 990,
    title: "Сезонный",
    period: "май-октябрь",
    paymentLabel: "990 ₽ за сезон",
    description: "Любимая Дача Премиум: сезон май-октябрь",
    receiptDescription: "Премиум сезон май-октябрь",
  },
  yearly: {
    amount: 1990,
    title: "Годовой",
    period: "/ год",
    paymentLabel: "1990 ₽ в год",
    description: "Любимая Дача Премиум на 12 месяцев",
    receiptDescription: "Премиум 12 месяцев (год)",
  },
};

export function normalizeSubscriptionPlan(plan: unknown): SubscriptionPlan {
  if (plan === "monthly" || plan === "seasonal" || plan === "yearly") {
    return plan;
  }

  return "monthly";
}

export function getDefaultSubscriptionPlan(now = new Date()): SubscriptionPlan {
  const month = now.getMonth();
  return month >= 4 && month <= 9 ? "seasonal" : "yearly";
}

export function getSubscriptionPlanAmount(plan: SubscriptionPlan): number {
  return SUBSCRIPTION_PLANS[plan].amount;
}

export function getSubscriptionPlanDescription(
  plan: SubscriptionPlan,
  yearlyPromoExtraMonths = 0
): string {
  if (plan === "yearly" && yearlyPromoExtraMonths > 0) {
    return "Любимая Дача Премиум: 12 мес + 2 мес по акции новичка";
  }

  return SUBSCRIPTION_PLANS[plan].description;
}

export function getSubscriptionPlanReceiptDescription(
  plan: SubscriptionPlan,
  yearlyPromoExtraMonths = 0
): string {
  if (plan === "yearly" && yearlyPromoExtraMonths > 0) {
    return "Премиум 12 мес + 2 мес (акция новичка)";
  }

  return SUBSCRIPTION_PLANS[plan].receiptDescription;
}

export function getSeasonalPremiumUntil(
  purchasedAt: Date,
  currentPremiumUntil?: Date | null
): Date {
  const base =
    currentPremiumUntil && currentPremiumUntil.getTime() > purchasedAt.getTime()
      ? currentPremiumUntil
      : purchasedAt;
  const baseYear = base.getFullYear();
  const baseMonth = base.getMonth();
  const seasonYear = baseMonth > 9 ? baseYear + 1 : baseYear;
  const seasonEnd = new Date(seasonYear, 9, 31, 23, 59, 59, 999);

  if (seasonEnd.getTime() <= base.getTime()) {
    return new Date(seasonYear + 1, 9, 31, 23, 59, 59, 999);
  }

  return seasonEnd;
}

export function getPremiumUntilForSubscriptionPlan(params: {
  plan: SubscriptionPlan;
  createdAt: Date;
  purchasedAt: Date;
  premiumFrom: Date;
  yearlyPromoExtraMonths?: number;
}): Date {
  if (params.plan === "seasonal") {
    return getSeasonalPremiumUntil(params.purchasedAt, params.premiumFrom);
  }

  if (params.plan === "yearly" && typeof params.yearlyPromoExtraMonths === "number") {
    return addMonthsPreservingDate(
      params.premiumFrom,
      YEARLY_PLAN_STANDARD_MONTHS + params.yearlyPromoExtraMonths
    );
  }

  const durationMonths = getPremiumDurationMonths({
    plan: params.plan,
    createdAt: params.createdAt,
    purchasedAt: params.purchasedAt,
  });

  return addMonthsPreservingDate(params.premiumFrom, durationMonths);
}

export function getYearlyPromoExtraMonthsForPlan(
  plan: SubscriptionPlan,
  createdAt: Date,
  purchasedAt: Date
): number {
  return plan === "yearly" ? getYearlyPlanExtraMonths(createdAt, purchasedAt) : 0;
}
