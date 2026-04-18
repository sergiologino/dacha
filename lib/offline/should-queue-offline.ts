import { getNetworkReachability } from "@/lib/offline/network-status";

/**
 * Мутации при отсутствии сети уходят в outbox.
 * navigator.onLine + последнее известное состояние reachability.
 */
export function shouldQueueOfflineMutation(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.onLine) return true;
  return getNetworkReachability() === "offline";
}
