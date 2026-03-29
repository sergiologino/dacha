"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";

const NOTIFICATION_PROMPT_SEEN_KEY = "dacha_notification_prompt_seen";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}

export type NotificationPromptModalProps = {
  open: boolean;
  onClose: () => void;
  /** Напоминания по работам — только Премиум; иначе показываем оплату */
  isPremium?: boolean;
  onNeedPremium?: () => void;
};

export function NotificationPromptModal({
  open,
  onClose,
  isPremium = true,
  onNeedPremium,
}: NotificationPromptModalProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [mounted, setMounted] = useState(false);
  const push = usePushSubscription();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted || typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, [open, mounted]);

  const handleAllow = async () => {
    if (!isPremium) {
      onNeedPremium?.();
      onClose();
      return;
    }
    await push.subscribe();
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  };

  useEffect(() => {
    if (open && push.state === "subscribed") {
      setNotificationPromptSeen(true);
      onClose();
    }
  }, [open, push.state, onClose]);

  const handleDismiss = () => {
    if (mounted && typeof localStorage !== "undefined") {
      localStorage.setItem(NOTIFICATION_PROMPT_SEEN_KEY, "1");
    }
    onClose();
  };

  const mobile = mounted && isMobile();
  const denied = permission === "denied";
  const canRequest = permission === "default" && push.isSupported && isPremium;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/40 dark:to-slate-900"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Не пропустите напоминания
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Включайте уведомления, чтобы получать напоминания о плановых работах на грядках (полив, подкормка и т.д.) на сегодня и завтра.
            </DialogDescription>

            {!isPremium && permission === "default" && push.isSupported && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Напоминания о работах на грядках доступны с подпиской Премиум. Нажмите кнопку ниже, чтобы перейти к оформлению.
              </p>
            )}

            {canRequest && (
              <>
                <Button
                  onClick={handleAllow}
                  disabled={push.state === "loading"}
                  className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 mb-3"
                >
                  {push.state === "loading" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Разрешить уведомления"
                  )}
                </Button>
                {push.message && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{push.message}</p>
                )}
              </>
            )}

            {!isPremium && permission === "default" && push.isSupported && (
              <Button
                type="button"
                onClick={() => {
                  onNeedPremium?.();
                  onClose();
                }}
                className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 mb-3"
              >
                Оформить Премиум
              </Button>
            )}

            {denied && (
              <div className="w-full text-left space-y-3 mb-4">
                {mobile ? (
                  <>
                    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Smartphone className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Настройки телефона</p>
                        <p className="text-slate-600 dark:text-slate-400">
                          Настройки → Приложения → браузер (Chrome, Safari и т.д.) или «Любимая Дача» → Уведомления → включите разрешение.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Monitor className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Настройки браузера</p>
                        <p className="text-slate-600 dark:text-slate-400">
                          Нажмите на значок замка или «i» слева от адреса сайта в строке браузера → Уведомления или «Настройки сайта» → выберите «Разрешить».
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {!push.isSupported && permission !== null && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Ваш браузер не поддерживает уведомления или сайт открыт в режиме без поддержки.
              </p>
            )}

            <Button
              variant="outline"
              onClick={handleDismiss}
              className="w-full rounded-2xl"
            >
              {denied || !canRequest ? "Понятно" : "Напомнить позже"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getNotificationPromptSeen(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(NOTIFICATION_PROMPT_SEEN_KEY) === "1";
}

export function setNotificationPromptSeen(seen: boolean): void {
  if (typeof localStorage === "undefined") return;
  if (seen) localStorage.setItem(NOTIFICATION_PROMPT_SEEN_KEY, "1");
  else localStorage.removeItem(NOTIFICATION_PROMPT_SEEN_KEY);
}
