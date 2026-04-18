"use client";

import { useEffect, useState } from "react";
import { countFailedOutbox, countPendingOutbox } from "@/lib/offline/outbox";
import { OUTBOX_CHANGED_EVENT } from "@/lib/offline/sync-events";

export type OutboxQueueStats = { pending: number; failed: number };

/** Счётчики очереди: pending и failed (после исчерпания ретраев). */
export function useOutboxQueueStats(): OutboxQueueStats {
  const [state, setState] = useState<OutboxQueueStats>({ pending: 0, failed: 0 });

  useEffect(() => {
    const refresh = () => {
      void Promise.all([countPendingOutbox(), countFailedOutbox()]).then(([pending, failed]) =>
        setState({ pending, failed })
      );
    };
    refresh();
    window.addEventListener(OUTBOX_CHANGED_EVENT, refresh);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(OUTBOX_CHANGED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return state;
}
