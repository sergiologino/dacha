"use client";

import { useSession } from "next-auth/react";
import { Loader2, ListTodo, Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useOutboxQueueStats } from "@/lib/hooks/use-outbox-pending-count";

/**
 * Индикатор онлайн/офлайн и числа задач в outbox (авторизованные пользователи).
 */
export function SyncStatusBar() {
  const { status } = useSession();
  const { reachability, isBrowserOnline, recheck } = useNetworkStatus({ probeOnMount: true });
  const { pending, failed } = useOutboxQueueStats();

  if (status !== "authenticated") return null;

  const offline = !isBrowserOnline || reachability === "offline";
  const checking = reachability === "checking";

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] pointer-events-none flex justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))] print:hidden"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => void recheck()}
        title="Проверить соединение с сервером"
        className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border transition-colors ${
          offline
            ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/90 dark:text-amber-100 dark:border-amber-800"
            : "bg-white/95 text-slate-600 border-slate-200 dark:bg-slate-900/95 dark:text-slate-300 dark:border-slate-700"
        }`}
      >
        {checking ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
        ) : offline ? (
          <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
        ) : (
          <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-600" aria-hidden />
        )}
        <span>{checking ? "Проверка сети…" : offline ? "Офлайн" : "Онлайн"}</span>
        {pending > 0 ? (
          <span className="flex items-center gap-1 pl-2 ml-0.5 border-l border-current/25">
            <ListTodo className="w-3.5 h-3.5 opacity-80 shrink-0" aria-hidden />
            <span>В очереди: {pending}</span>
          </span>
        ) : null}
        {failed > 0 ? (
          <span className="flex items-center gap-1 pl-2 ml-0.5 border-l border-red-300/50 text-red-700 dark:text-red-300">
            <span>Ошибки: {failed}</span>
          </span>
        ) : null}
      </button>
    </div>
  );
}
