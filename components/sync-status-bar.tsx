"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ListTodo, Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useOutboxQueueStats } from "@/lib/hooks/use-outbox-pending-count";

/**
 * Индикатор онлайн/офлайн и очереди outbox (только для авторизованных).
 * Сеть: зелёный «Онлайн» / красный «Офлайн»; во время фоновой проверки при живом браузере — остаётся зелёным (без вечного спиннера).
 */
export function SyncStatusBar() {
  const { status } = useSession();
  const { reachability, isBrowserOnline, recheck } = useNetworkStatus({ probeOnMount: true });
  const { pending, failed } = useOutboxQueueStats();
  const [recheckBusy, setRecheckBusy] = useState(false);

  if (status !== "authenticated") return null;

  const browserOffline = !isBrowserOnline;
  const serverUnreachable = reachability === "offline";

  /** Красный: браузер без сети или ping /api/health не прошёл. */
  const showOffline = browserOffline || serverUnreachable;

  const statusLabel = browserOffline
    ? "Офлайн"
    : serverUnreachable
      ? "Нет связи с сервером"
      : "Онлайн";

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] pointer-events-none flex justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))] print:hidden"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => {
          setRecheckBusy(true);
          void Promise.resolve(recheck()).finally(() => setRecheckBusy(false));
        }}
        title="Проверить соединение с сервером"
        className={`pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 max-w-[min(100%,28rem)] px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border transition-colors ${
          showOffline
            ? "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/90 dark:text-red-100 dark:border-red-900"
            : "bg-emerald-50/95 text-emerald-900 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-100 dark:border-emerald-800"
        }`}
      >
        {recheckBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
        ) : showOffline ? (
          <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
        ) : (
          <Wifi className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
        )}
        <span className="shrink-0">{recheckBusy ? "Проверка…" : statusLabel}</span>
        <span className="flex items-center gap-1 pl-2 ml-0.5 border-l border-current/20 shrink-0">
          <ListTodo className="w-3.5 h-3.5 opacity-80" aria-hidden />
          <span>Очередь: {pending}</span>
          {failed > 0 ? (
            <span className="text-red-700 dark:text-red-300 font-semibold">· ошибок: {failed}</span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
