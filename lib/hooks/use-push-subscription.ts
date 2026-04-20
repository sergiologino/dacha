"use client";

/**
 * Web Push (VAPID + service worker). На мобильном вебе поддержка ограничена (iOS Safari 16.4+).
 * Для **Capacitor**: замените на `@capacitor/push-notifications` + свой backend endpoint;
 * хранение подписки в `PushSubscription` (Prisma) можно оставить с отдельным `provider`/`deviceToken`.
 * Для **React Native**: Firebase Cloud Messaging или аналог + тот же серверный cron, что шлёт погоду/напоминания.
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { isLikelyNetworkError } from "@/lib/offline/network-error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

const SW_READY_MS = 15000;

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("sw-ready-timeout")), SW_READY_MS);
      }),
    ]);
  } catch {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  }
}

export type PushState =
  | "unsupported"
  | "loading"
  | "subscribed"
  | "denied"
  /** Разрешение есть или ещё не спрашивали, подписки в браузере нет — можно включить */
  | "idle";

export function usePushSubscription() {
  const [state, setState] = useState<PushState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  const checkSupport = useCallback(() => {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }, []);

  useEffect(() => {
    if (!checkSupport()) {
      setState("unsupported");
      return;
    }
    setState("loading");
    setMessage(null);
  }, [checkSupport]);

  useEffect(() => {
    if (state !== "loading" || !checkSupport()) return;
    let mounted = true;
    (async () => {
      try {
        const reg = await getServiceWorkerRegistration();
        if (!mounted) return;
        if (!reg) {
          setState("idle");
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        if (!mounted) return;
        if (sub) setState("subscribed");
        else if (Notification.permission === "denied") setState("denied");
        else setState("idle");
      } catch {
        if (mounted) setState("idle");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [state, checkSupport]);

  const subscribe = useCallback(async () => {
    if (!checkSupport()) {
      setState("unsupported");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        setMessage("Разрешение на уведомления отклонено");
        return;
      }
      const keyRes = await fetch("/api/push/vapid-public");
      if (!keyRes.ok) {
        setState("idle");
        setMessage(
          "Push на этом сервере не включён: в окружении нет ключей VAPID. " +
            "Владельцу сайта: выполнить «npx web-push generate-vapid-keys», " +
            "добавить VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в .env на сервере и перезапустить приложение. " +
            "Инструкция: docs/DEPLOY.md (раздел про пуш-напоминания)."
        );
        return;
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        setState("idle");
        setMessage("Нет ключа подписки");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const premiumOrAuth = res.status === 403 || res.status === 401;
        const queueable = !premiumOrAuth && (res.status >= 500 || res.status === 0);
        if (queueable) {
          const outId = await enqueueOutbox({
            action: "PUSH_SUBSCRIBE",
            payload: { subscription: sub.toJSON() },
          });
          if (outId) {
            setState("subscribed");
            setMessage(
              "Подписка на уведомления в очереди — сервер обновится при появлении сети."
            );
            toast.message("Push: регистрация в очереди");
            return;
          }
        }
        await sub.unsubscribe().catch(() => {});
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : res.status === 403
              ? "Доступно с подпиской Премиум."
              : "Ошибка подписки"
        );
      }
      setState("subscribed");
      setMessage(
        "Уведомления включены. Напоминания по запланированным работам будут приходить на это устройство."
      );
    } catch (err) {
      const maybeSub = await navigator.serviceWorker.ready
        .then((r) => r.pushManager.getSubscription())
        .catch(() => null);
      if (maybeSub && isLikelyNetworkError(err)) {
        const outId = await enqueueOutbox({
          action: "PUSH_SUBSCRIBE",
          payload: { subscription: maybeSub.toJSON() },
        });
        if (outId) {
          setState("subscribed");
          setMessage(
            "Подписка на уведомления в очереди — сервер обновится при появлении сети."
          );
          toast.message("Push: регистрация в очереди");
          return;
        }
      }
      setState(Notification.permission === "denied" ? "denied" : "idle");
      setMessage(err instanceof Error ? err.message : "Ошибка подписки");
    }
  }, [checkSupport]);

  const unsubscribe = useCallback(async () => {
    if (!checkSupport()) return;
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        } catch (e) {
          if (isLikelyNetworkError(e)) {
            void enqueueOutbox({
              action: "PUSH_UNSUBSCRIBE",
              payload: { endpoint: sub.endpoint },
            });
            toast.message("Отписка от push в очереди — завершится при появлении сети");
          }
        }
        await sub.unsubscribe();
      }
      setState(Notification.permission === "denied" ? "denied" : "idle");
      setMessage("Уведомления отключены");
    } catch {
      setState("idle");
      setMessage("Не удалось отключить");
    }
  }, [checkSupport]);

  const checkExisting = useCallback(async () => {
    if (!checkSupport()) return;
    try {
      const reg = await getServiceWorkerRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) setState("subscribed");
      else if (Notification.permission === "denied") setState("denied");
      else setState("idle");
    } catch {
      setState("idle");
    }
  }, [checkSupport]);

  return {
    state,
    message,
    subscribe,
    unsubscribe,
    checkExisting,
    isSupported: checkSupport(),
  };
}
