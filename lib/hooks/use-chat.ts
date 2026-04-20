"use client";

import { useState, useCallback, useEffect } from "react";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { isLikelyNetworkError } from "@/lib/offline/network-error";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { CHAT_HISTORY_SYNC_EVENT } from "@/lib/offline/sync-events";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SendOptions {
  networkName?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [freeLeft, setFreeLeft] = useState<number | null>(null);

  const loadHistory = useCallback((): Promise<void> => {
    return fetch("/api/chat/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string; timestamp: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.timestamp),
            }))
          );
        } else {
          setMessages([]);
        }
        if (typeof data.freeLeft === "number") {
          setFreeLeft(data.freeLeft);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory().finally(() => setHistoryLoaded(true));
  }, [loadHistory]);

  useEffect(() => {
    const onSync = () => loadHistory();
    window.addEventListener(CHAT_HISTORY_SYNC_EVENT, onSync);
    return () => window.removeEventListener(CHAT_HISTORY_SYNC_EVENT, onSync);
  }, [loadHistory]);

  const sendMessage = useCallback(
    async (content: string, options?: SendOptions) => {
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        if (shouldQueueOfflineMutation()) {
          const outId = await enqueueOutbox({
            action: "AI_CHAT_MESSAGE",
            payload: {
              messages: apiMessages,
              networkName: options?.networkName,
            },
          });
          if (!outId) throw new Error("Локальное хранилище недоступно");
          toast.message("Сообщение в очереди — ответ появится после подключения к сети");
          return;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            networkName: options?.networkName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ошибка при получении ответа");
        }

        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (!shouldQueueOfflineMutation() && isLikelyNetworkError(err)) {
          try {
            const outId = await enqueueOutbox({
              action: "AI_CHAT_MESSAGE",
              payload: {
                messages: apiMessages,
                networkName: options?.networkName,
              },
            });
            if (outId) {
              toast.message("Нет стабильной связи — сообщение поставлено в очередь");
              return;
            }
          } catch {
            /* fall through */
          }
        }
        const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    fetch("/api/chat/history", { method: "DELETE" }).catch(() => {});
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat, historyLoaded, freeLeft, setFreeLeft };
}
