/**
 * Админские проверки по email сессии.
 * Список через ADMIN_EMAILS (через запятую); по умолчанию — основной аккаунт владельца.
 */
export function isAdminSessionEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "savkin.sergey.s@gmail.com";
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
