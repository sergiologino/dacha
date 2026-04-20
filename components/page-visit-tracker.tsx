"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { isLikelyNetworkError } from "@/lib/offline/network-error";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";

export function PageVisitTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const { status } = useSession();

  useEffect(() => {
    if (!pathname || pathname === prevPath.current) return;
    if (status !== "authenticated") {
      prevPath.current = pathname;
      return;
    }
    prevPath.current = pathname;

    if (shouldQueueOfflineMutation()) {
      void enqueueOutbox({
        action: "PAGE_VISIT",
        payload: { path: pathname },
      });
      return;
    }

    fetch("/api/analytics/page-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch((e) => {
      if (isLikelyNetworkError(e)) {
        void enqueueOutbox({
          action: "PAGE_VISIT",
          payload: { path: pathname },
        });
      }
    });
  }, [pathname, status]);

  return null;
}
