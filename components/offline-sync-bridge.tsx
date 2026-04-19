"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerOfflineQueryClient, drainOutbox } from "@/lib/offline/sync-engine";
import { wipeLocalOfflineStores } from "@/lib/offline/local-db";
import {
  subscribeNetworkReachability,
  refreshReachabilityWithProbe,
} from "@/lib/offline/network-status";

async function drainWithFeedback() {
  const r = await drainOutbox();
  if (r.skippedOffline) return;
  if (r.authRequired) {
    toast.error("Сессия истекла. Войдите снова, чтобы отправить очередь.");
    return;
  }
  if (r.errors > 0) {
    toast.error("Часть изменений не отправилась. Проверьте сеть.");
  }
}

/**
 * Регистрирует QueryClient для инвалидации после drain, чистит Dexie при выходе,
 * при появлении сети — пробует отправить outbox.
 */
export function OfflineSyncBridge() {
  const qc = useQueryClient();
  const { status } = useSession();
  const wasAuthed = useRef(false);

  useEffect(() => {
    registerOfflineQueryClient(qc);
    return () => registerOfflineQueryClient(null);
  }, [qc]);

  useEffect(() => {
    const authed = status === "authenticated";
    if (wasAuthed.current && !authed) {
      void wipeLocalOfflineStores();
      qc.clear();
    }
    wasAuthed.current = authed;
  }, [status, qc]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void refreshReachabilityWithProbe().then((r) => {
      if (r === "online") void drainWithFeedback();
    });
  }, [status]);

  useEffect(() => {
    const unsub = subscribeNetworkReachability((reach) => {
      if (reach !== "online") return;
      void refreshReachabilityWithProbe().then((r) => {
        if (r === "online" && status === "authenticated") void drainWithFeedback();
      });
    });
    return unsub;
  }, [status]);

  return null;
}
