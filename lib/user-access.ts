/** Дни полного доступа после регистрации (триал), только для аккаунтов новой модели. */
export const TRIAL_DAYS = 14;

/** Аккаунты с датой регистрации до этой даты включительно сохраняют старый бесплатный тариф (с лимитами), пока не купят Премиум. */
export const LEGACY_FREE_TIER_LAST_INCLUSIVE = new Date(Date.UTC(2026, 3, 17, 23, 59, 59, 999));

/** Первый момент «новой» модели: 18.04.2026 00:00 UTC. */
export const NEW_PRICING_REGISTRATION_FROM = new Date(Date.UTC(2026, 3, 18, 0, 0, 0, 0));

export type UserAccessFields = {
  isPremium: boolean;
  createdAt: Date;
};

/** Старый бесплатный тариф: только не-премиум, регистрация не позже 17.04.2026 включительно. */
export function isLegacyFreeTierUser(user: UserAccessFields, _now = new Date()): boolean {
  if (user.isPremium) return false;
  return user.createdAt.getTime() <= LEGACY_FREE_TIER_LAST_INCLUSIVE.getTime();
}

export function trialEndDate(createdAt: Date): Date {
  const d = new Date(createdAt);
  d.setUTCDate(d.getUTCDate() + TRIAL_DAYS);
  return d;
}

/**
 * Полный функционал: Премиум, либо триал 14 дней (только для аккаунтов с 18.04.2026, не legacy-free).
 */
export function hasFullAccess(user: UserAccessFields, now = new Date()): boolean {
  if (user.isPremium) return true;
  if (isLegacyFreeTierUser(user, now)) return false;
  return now < trialEndDate(user.createdAt);
}

export function isTrialActive(user: UserAccessFields, now = new Date()): boolean {
  return !user.isPremium && hasFullAccess(user, now);
}

/** Лимиты старого бесплатного тарифа (для legacy-пользователей). */
export const LEGACY_FREE_BED_LIMIT = 2;
export const LEGACY_FREE_PLANT_LIMIT = 3;
export const LEGACY_FREE_TIMELINE_LIMIT = 1;
export const LEGACY_FREE_PLANNED_WORKS_LIMIT = 5;
export const LEGACY_FREE_CHAT_LIMIT = 5;
export const LEGACY_FREE_ANALYSIS_LIMIT = 3;
