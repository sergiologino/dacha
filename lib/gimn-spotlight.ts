/**
 * Одноразовая подсказка про гимн: с 21.04.2026 (локальный календарь).
 * При первом подходящем заходе клиент сразу пишет dismissed в localStorage,
 * чтобы при следующей загрузке баннер не появлялся; подсветка и баннер — только в этой сессии.
 */

const STORAGE_KEY = "dacha-gimn-spotlight-v1-dismissed";

/** Локальная полночь 21 апреля 2026 — показ только с этого календарного дня. */
export function isGimnSpotlightEligibleByDate(): boolean {
  const now = new Date();
  const start = new Date(2026, 3, 21, 0, 0, 0, 0);
  return now >= start;
}

export function hasDismissedGimnSpotlight(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissGimnSpotlightPersist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function shouldShowGimnSpotlight(): boolean {
  return isGimnSpotlightEligibleByDate() && !hasDismissedGimnSpotlight();
}
