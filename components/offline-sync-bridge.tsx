"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  registerOfflineQueryClient,
  drainOutbox,
} from "@/lib/offline/sync-engine";
import { wipeLocalOfflineStores } from "@/lib/offline/local-db";
import { listOutboxTasksForMirrorSync } from "@/lib/offline/outbox";
import { mirrorOutboxSyncAllPending } from "@/lib/offline/outbox-server-mirror";
import {
  subscribeNetworkReachability,
  refreshReachabilityWithProbe,
} from "@/lib/offline/network-status";
import { SHARE_LINK_READY_EVENT } from "@/lib/offline/sync-events";

function shareDrainToastTitle(shareKind: string): string {
  if (shareKind === "analysis") return "Разбор можно отправить друзьям";
  if (shareKind === "chat") return "Диалог можно показать близким";
  return "Ссылка для «Поделиться» готова";
}

async function syncMirrorIfOnline() {
  const rows = await listOutboxTasksForMirrorSync();
  if (rows.length > 0) void mirrorOutboxSyncAllPending(rows);
}

async function drainWithFeedback() {
  await syncMirrorIfOnline();
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
 *
 * Для **Capacitor / React Native** после `resume` вызывайте `drainOutbox()` из
 * `lib/offline/sync-engine` (или дублируйте логику ping + drain), чтобы очередь
 * обрабатывалась и при свёрнутом WebView.
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

  useEffect(() => {
    if (status !== "authenticated") return;
    const tick = () => {
      void refreshReachabilityWithProbe().then((r) => {
        if (r === "online") void drainWithFeedback();
      });
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const onResume = () => {
      if (document.visibilityState !== "visible") return;
      void refreshReachabilityWithProbe().then((r) => {
        if (r === "online") void drainWithFeedback();
      });
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [status]);

  useEffect(() => {
    const onShareReady = (ev: Event) => {
      const e = ev as CustomEvent<{ url?: string; shareKind?: string }>;
      const url = typeof e.detail?.url === "string" ? e.detail.url : "";
      if (!url) return;
      const shareKind = typeof e.detail?.shareKind === "string" ? e.detail.shareKind : "";
      toast.success(shareDrainToastTitle(shareKind), {
        description:
          "Пока не было сети, мы бережно держали это в очереди. Теперь всё на сервере — осталось скопировать ссылку и отправить тем, с кем хочется поделиться теплом дачного сезона.",
        duration: 14_000,
        action: {
          label: "Скопировать",
          onClick: () => {
            void navigator.clipboard.writeText(url).then(() => {
              toast.success("Ссылка в буфере — вставьте, куда душа ляжет");
            });
          },
        },
      });
    };
    window.addEventListener(SHARE_LINK_READY_EVENT, onShareReady);
    return () => window.removeEventListener(SHARE_LINK_READY_EVENT, onShareReady);
  }, []);

  return null;
}
