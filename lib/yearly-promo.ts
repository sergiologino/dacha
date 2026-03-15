export const YEARLY_PLAN_BASE_FREE_MONTHS = 2;
export const YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS = 2;
export const YEARLY_PLAN_STANDARD_MONTHS = 12;
export const YEARLY_PROMO_TIMEZONE = "Europe/Moscow";

const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

export type YearlyPromoOffer = {
  isPremium: boolean;
  isEligible: boolean;
  expiresAt: string | null;
  baseFreeMonths: number;
  extraFreeMonths: number;
  totalFreeMonths: number;
};

function getCalendarDayPartsInTimezone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const value = date.toLocaleDateString("en-CA", { timeZone });
  const [year, month, day] = value.split("-").map(Number);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  return { year, month, day };
}

export function getYearlyPromoDeadline(
  createdAt: Date,
  timeZone = YEARLY_PROMO_TIMEZONE
): Date {
  const { year, month, day } = getCalendarDayPartsInTimezone(createdAt, timeZone);

  if (timeZone === YEARLY_PROMO_TIMEZONE) {
    return new Date(
      Date.UTC(year, month - 1, day + 2, 23, 59, 59, 999) - MOSCOW_OFFSET_MS
    );
  }

  return new Date(Date.UTC(year, month - 1, day + 2, 23, 59, 59, 999));
}

export function isYearlyPromoEligibleAt(
  createdAt: Date,
  purchasedAt: Date
): boolean {
  return purchasedAt.getTime() <= getYearlyPromoDeadline(createdAt).getTime();
}

export function getInactiveYearlyPromoOffer(): YearlyPromoOffer {
  return {
    isPremium: false,
    isEligible: false,
    expiresAt: null,
    baseFreeMonths: YEARLY_PLAN_BASE_FREE_MONTHS,
    extraFreeMonths: 0,
    totalFreeMonths: YEARLY_PLAN_BASE_FREE_MONTHS,
  };
}

export function buildYearlyPromoOffer(user: {
  createdAt: Date;
  isPremium: boolean;
}): YearlyPromoOffer {
  const deadline = getYearlyPromoDeadline(user.createdAt);
  const isEligible = !user.isPremium && isYearlyPromoEligibleAt(user.createdAt, new Date());

  return {
    isPremium: user.isPremium,
    isEligible,
    expiresAt: deadline.toISOString(),
    baseFreeMonths: YEARLY_PLAN_BASE_FREE_MONTHS,
    extraFreeMonths: isEligible ? YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS : 0,
    totalFreeMonths: isEligible
      ? YEARLY_PLAN_BASE_FREE_MONTHS + YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS
      : YEARLY_PLAN_BASE_FREE_MONTHS,
  };
}

export function getYearlyPlanExtraMonths(
  createdAt: Date,
  purchasedAt: Date
): number {
  return isYearlyPromoEligibleAt(createdAt, purchasedAt)
    ? YEARLY_PLAN_EARLY_BIRD_EXTRA_MONTHS
    : 0;
}

export function getPremiumDurationMonths(params: {
  plan: "monthly" | "yearly";
  createdAt: Date;
  purchasedAt: Date;
}): number {
  if (params.plan === "monthly") {
    return 1;
  }

  return (
    YEARLY_PLAN_STANDARD_MONTHS +
    getYearlyPlanExtraMonths(params.createdAt, params.purchasedAt)
  );
}

export function addMonthsPreservingDate(from: Date, months: number): Date {
  const result = new Date(from);
  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + months);

  if (result.getDate() < originalDay) {
    result.setDate(0);
  }

  return result;
}

export function resolveLiveYearlyPromoOffer(
  offer: YearlyPromoOffer
): YearlyPromoOffer {
  if (!offer.isEligible || !offer.expiresAt) {
    return offer;
  }

  const expiresAtMs = new Date(offer.expiresAt).getTime();
  if (Number.isNaN(expiresAtMs) || Date.now() <= expiresAtMs) {
    return offer;
  }

  return {
    ...offer,
    isEligible: false,
    expiresAt: null,
    extraFreeMonths: 0,
    totalFreeMonths: offer.baseFreeMonths,
  };
}
