"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const t = parseInt(dismissed, 10);
      if (Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIosHint(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-emerald-600 dark:bg-emerald-800 text-white rounded-2xl shadow-lg border border-emerald-500/30 dark:border-emerald-700 p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Установить приложение</p>
          {iosHint ? (
            <p className="text-emerald-100 text-xs mt-1">
              Нажмите «Поделиться» в Safari и выберите «На экран „Домой“» — появится иконка на рабочем столе.
            </p>
          ) : (
            <p className="text-emerald-100 text-xs mt-1">
              Быстрый доступ с главного экрана, уведомления и работа офлайн.
            </p>
          )}
          {!iosHint && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="mt-3 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Установить
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 text-white"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
