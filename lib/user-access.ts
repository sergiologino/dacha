/** Дни полного доступа после регистрации (триал), до оплаты. */
export const TRIAL_DAYS = 14;

export type UserAccessFields = {
  isPremium: boolean;
  createdAt: Date;
};

/**
 * Полный доступ к функциям приложения: оплаченный Премиум или активный триал с даты регистрации.
 */
export function hasFullAccess(user: UserAccessFields, now = new Date()): boolean {
  if (user.isPremium) return true;
  const end = trialEndDate(user.createdAt);
  return now < end;
}

export function trialEndDate(createdAt: Date): Date {
  const d = new Date(createdAt);
  d.setUTCDate(d.getUTCDate() + TRIAL_DAYS);
  return d;
}

export function isTrialActive(user: UserAccessFields, now = new Date()): boolean {
  return !user.isPremium && hasFullAccess(user, now);
}
