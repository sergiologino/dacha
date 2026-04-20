"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ListTodo, Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useOutboxQueueStats } from "@/lib/hooks/use-outbox-pending-count";

/**
 * Индикатор онлайн/офлайн и очереди outbox (только для авторизованных).
 * Рендерится в шапке под названием приложения — не перекрывает нижнее меню.
 */
export function SyncStatusBar() {
  const router = useRouter();
  const { status } = useSession();
  const { reachability, isBrowserOnline, recheck } = useNetworkStatus({ probeOnMount: true });
  const { pending, failed } = useOutboxQueueStats();
  const [recheckBusy, setRecheckBusy] = useState(false);

  if (status !== "authenticated") return null;

  const browserOffline = !isBrowserOnline;
  const serverUnreachable = reachability === "offline";

  const showOffline = browserOffline || serverUnreachable;

  const statusLabel = browserOffline
    ? "Офлайн"
    : serverUnreachable
      ? "Нет связи с сервером"
      : "Онлайн";

  return (
    <div
      className="w-full flex justify-center mt-2 mb-1 pointer-events-none print:hidden"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-1 max-w-[min(100%,28rem)] px-1 py-1 rounded-full text-xs font-medium shadow-sm border transition-colors ${
          showOffline
            ? "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/90 dark:text-red-100 dark:border-red-900"
            : "bg-emerald-50/95 text-emerald-900 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-100 dark:border-emerald-800"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setRecheckBusy(true);
            void Promise.resolve(recheck()).finally(() => setRecheckBusy(false));
          }}
          title="Проверить соединение с сервером"
          className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          {recheckBusy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
          ) : showOffline ? (
            <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <Wifi className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
          )}
          <span className="shrink-0">{recheckBusy ? "Проверка…" : statusLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/settings/sync-queue")}
          title="Открыть очередь синхронизации"
          className="flex items-center gap-1 pl-2 pr-2 py-1 ml-0.5 border-l border-current/20 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ListTodo className="w-3.5 h-3.5 opacity-80" aria-hidden />
          <span>Очередь: {pending}</span>
          {failed > 0 ? (
            <span className="text-red-700 dark:text-red-300 font-semibold">· ошибок: {failed}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
