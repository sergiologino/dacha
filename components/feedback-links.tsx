"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { TelegramBrandIcon, MaxMessengerIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type FeedbackLinksProps = { variant?: "bar" | "inline" | "icons" };

export function useFeedbackUrls(): { telegram: string; max: string } {
  const [links, setLinks] = useState<{ telegram: string; max: string }>({ telegram: "", max: "" });

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: { feedbackTelegramUrl?: string; feedbackMaxUrl?: string }) => {
        setLinks({
          telegram: data.feedbackTelegramUrl || "",
          max: data.feedbackMaxUrl || "",
        });
      })
      .catch(() => {});
  }, []);

  return { telegram: links.telegram, max: links.max };
}

const iconBtn =
  "inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/80";

/** Крупные иконки мессенджеров — для шапки приложения рядом с «Поделиться». */
export function MessengerFeedbackButtons({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { telegram, max } = useFeedbackUrls();
  const show = telegram || max;
  if (!show) return null;

  const dim = size === "md" ? "h-10 w-10" : "h-9 w-9";
  const ico = size === "md" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label="Обратная связь в мессенджерах">
      {telegram ? (
        <a
          href={telegram}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(iconBtn, dim)}
          title="Написать в Telegram"
        >
          <TelegramBrandIcon className={cn(ico, "rounded-full")} />
          <span className="sr-only">Telegram</span>
        </a>
      ) : null}
      {max ? (
        <a
          href={max}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(iconBtn, dim)}
          title="Написать в MAX"
        >
          <MaxMessengerIcon className={ico} />
          <span className="sr-only">MAX</span>
        </a>
      ) : null}
    </div>
  );
}

export function FeedbackLinks({ variant = "bar" }: FeedbackLinksProps) {
  const { telegram, max } = useFeedbackUrls();
  const show = telegram || max;

  if (!show) return null;

  if (variant === "icons") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Связь:</span>
        <MessengerFeedbackButtons size="sm" />
      </div>
    );
  }

  const isInline = variant === "inline";
  const wrapperClass = isInline
    ? "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
    : "max-w-5xl mx-auto px-4 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 py-2";

  return (
    <div className={wrapperClass}>
      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
      <span className="sr-only">Обратная связь:</span>
      {!isInline && <span className="hidden sm:inline">Обратная связь:</span>}
      <span className="flex items-center gap-2 sm:gap-3">
        {telegram && (
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            <TelegramBrandIcon className="h-4 w-4 rounded-full flex-shrink-0" />
            <span className="hidden sm:inline">Telegram</span>
          </a>
        )}
        {telegram && max && (
          <span className="text-slate-400 dark:text-slate-500" aria-hidden>
            ·
          </span>
        )}
        {max && (
          <a
            href={max}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            <MaxMessengerIcon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">MAX</span>
          </a>
        )}
      </span>
    </div>
  );
}
