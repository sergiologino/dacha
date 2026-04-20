/** Ошибка fetch / обрыв связи при том, что navigator.onLine ещё true. */

export function isLikelyNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  const m = e instanceof Error ? e.message : String(e);
  return /fetch|network|failed to load|load failed|abort|econnreset|etimedout|internet/i.test(m);
}
