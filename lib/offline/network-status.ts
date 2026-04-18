/**
 * Устойчивое определение доступности сети (см. docs/ai/OFFLINE_SYNC.md).
 */

export type NetworkReachability = "online" | "offline" | "checking";

const listeners = new Set<(s: NetworkReachability) => void>();
let lastReachability: NetworkReachability =
  typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

function setReachability(next: NetworkReachability) {
  if (next === lastReachability) return;
  lastReachability = next;
  for (const fn of listeners) fn(next);
}

export function getNetworkReachability(): NetworkReachability {
  return lastReachability;
}

/** Быстрая проверка без fetch: только события браузера. */
export function subscribeNetworkReachability(
  fn: (s: NetworkReachability) => void
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function attachWindowListeners() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => setReachability("online"));
  window.addEventListener("offline", () => setReachability("offline"));
}

attachWindowListeners();

const HEALTH_PATH = "/api/health";
const HEALTH_TIMEOUT_MS = 5000;

/**
 * Проверка «реального» доступа к origin (не только navigator.onLine).
 * Вызывать перед drain outbox.
 */
export async function probeServerReachable(): Promise<boolean> {
  if (typeof fetch === "undefined") return false;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), HEALTH_TIMEOUT_MS);
    const res = await fetch(HEALTH_PATH, {
      method: "GET",
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Обновить глобальное состояние: сначала offline-событие, затем ping.
 */
export async function refreshReachabilityWithProbe(): Promise<NetworkReachability> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setReachability("offline");
    return "offline";
  }
  setReachability("checking");
  const ok = await probeServerReachable();
  const next: NetworkReachability = ok ? "online" : "offline";
  setReachability(next);
  return next;
}
