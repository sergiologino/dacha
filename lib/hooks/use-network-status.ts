"use client";

import { useEffect, useState } from "react";
import {
  getNetworkReachability,
  refreshReachabilityWithProbe,
  subscribeNetworkReachability,
  type NetworkReachability,
} from "@/lib/offline/network-status";

/**
 * Состояние сети для UI и решения «слать в API или в outbox».
 */
export function useNetworkStatus(options?: { probeOnMount?: boolean }) {
  const [reachability, setReachability] = useState<NetworkReachability>(() =>
    typeof window === "undefined" ? "offline" : getNetworkReachability()
  );

  useEffect(() => {
    const unsub = subscribeNetworkReachability(setReachability);
    if (options?.probeOnMount) {
      void refreshReachabilityWithProbe();
    }
    return unsub;
  }, [options?.probeOnMount]);

  const recheck = () => refreshReachabilityWithProbe();

  return {
    reachability,
    /** Удобный флаг: онлайн по браузеру (без гарантии ping). */
    isBrowserOnline:
      typeof navigator !== "undefined" ? navigator.onLine : false,
    recheck,
  };
}
