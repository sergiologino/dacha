"use client";

import { useState, useEffect, useCallback } from "react";

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

export type PushState = "unsupported" | "loading" | "subscribed" | "denied" | "error" | "not-supported";

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
        setState("error");
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
        setState("error");
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Ошибка подписки");
      }
      setState("subscribed");
      setMessage("Уведомления включены. Напоминания по работам активны, а погодные предупреждения можно настроить в профиле ниже.");
    } catch (err) {
      setState("error");
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
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("denied");
      setMessage("Уведомления отключены");
    } catch {
      setState("error");
      setMessage("Не удалось отключить");
    }
  }, [checkSupport]);

  const checkExisting = useCallback(async () => {
    if (!checkSupport()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setState("subscribed");
      else if (Notification.permission === "denied") setState("denied");
      else setState("error");
    } catch {
      setState("error");
    }
  }, [checkSupport]);

  useEffect(() => {
    if (state !== "loading" || !checkSupport()) return;
    let mounted = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          if (mounted) setState("not-supported");
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        if (mounted) {
          if (sub) setState("subscribed");
          else if (Notification.permission === "denied") setState("denied");
          else setState("error");
        }
      } catch {
        if (mounted) setState("error");
      }
    })();
    return () => { mounted = false; };
  }, [state, checkSupport]);

  return {
    state,
    message,
    subscribe,
    unsubscribe,
    checkExisting,
    isSupported: checkSupport(),
  };
}
