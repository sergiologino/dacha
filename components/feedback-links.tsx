"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

type FeedbackLinksProps = { variant?: "bar" | "inline" };

export function FeedbackLinks({ variant = "bar" }: FeedbackLinksProps) {
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

  const telegramUrl = links.telegram;
  const maxUrl = links.max;
  const show = telegramUrl || maxUrl;

  if (!show) return null;

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
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Telegram
          </a>
        )}
        {telegramUrl && maxUrl && (
          <span className="text-slate-400 dark:text-slate-500" aria-hidden>
            ·
          </span>
        )}
        {maxUrl && (
          <a
            href={maxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            MAX
          </a>
        )}
      </span>
    </div>
  );
}
