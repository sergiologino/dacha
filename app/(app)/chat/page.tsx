"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  Sparkles,
  Lock,
} from "lucide-react";
import { ShareIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionDiv } from "@/components/motion";
import { motion, AnimatePresence } from "framer-motion";
import { useChat, type ChatMessage } from "@/lib/hooks/use-chat";
import { SubscribeModal } from "@/components/subscribe-modal";

const quickQuestions = [
  "Что посадить в марте на рассаду?",
  "Желтеют листья томатов",
  "Когда сажать картошку?",
  "Как бороться с тлёй?",
  "Чем подкормить огурцы?",
  "Какая погода завтра?",
  "Когда укрывать розы?",
  "Как пикировать томаты?",
];

function MessageBubble({
  message,
  prevMessage,
  onShare,
  sharing,
  shared,
}: {
  message: ChatMessage;
  prevMessage?: ChatMessage;
  onShare?: (question: string, answer: string) => void;
  sharing?: boolean;
  shared?: boolean;
}) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);
  const isAssistant = !isUser;
  const needsCollapse = message.content.length > 80 || message.content.split(/\n/).length > 3;
  const shouldCollapse = isAssistant && !expanded && needsCollapse;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-emerald-600" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
        }`}
      >
        <div
          style={
            shouldCollapse
              ? {
                  maxHeight: "7.5rem",
                  overflow: "hidden",
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                }
              : undefined
          }
          className={shouldCollapse ? "relative" : ""}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          {shouldCollapse && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Развернуть
            </button>
          )}
        </div>
        {!isUser && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-400">Нейроэксперт</p>
            {onShare && prevMessage && (
              <button
                onClick={() => onShare(prevMessage.content, message.content)}
                disabled={sharing}
                className="text-[10px] text-emerald-500 hover:text-emerald-700 flex items-center gap-0.5"
              >
                {shared ? (
                  <><CheckIcon className="w-3 h-3" /> Скопировано</>
                ) : (
                  <><ShareIcon className="w-3 h-3" /> Поделиться</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default function ChatPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    historyLoaded,
    freeLeft,
    setFreeLeft,
  } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sharingPair, setSharingPair] = useState<string | null>(null);
  const [sharedPair, setSharedPair] = useState<string | null>(null);

  const isPremium = freeLeft === -1;
  const reachedLimit = !isPremium && freeLeft !== null && freeLeft <= 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (reachedLimit) {
      setShowPaywall(true);
      return;
    }

    setInput("");
    await sendMessage(text);

    if (!isPremium && freeLeft !== null) {
      setFreeLeft(freeLeft - 1);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSharePair = async (question: string, answer: string) => {
    const pairKey = `${question.substring(0, 20)}`;
    setSharingPair(pairKey);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          data: { question, answer },
        }),
      });
      const json = await res.json();
      if (json.url) {
        await navigator.clipboard.writeText(json.url);
        setSharedPair(pairKey);
        setTimeout(() => setSharedPair(null), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSharingPair(null);
    }
  };

  const handleQuickQuestion = async (q: string) => {
    if (reachedLimit) {
      setShowPaywall(true);
      return;
    }
    await sendMessage(q);
    if (!isPremium && freeLeft !== null) {
      setFreeLeft(freeLeft - 1);
    }
  };

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <MotionDiv variant="fadeUp">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" /> Чат с
              нейроэкспертом
            </h1>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4 mr-1" /> Очистить
              </Button>
            )}
          </div>
          {!isPremium && freeLeft !== null && (
            <p className="text-xs text-slate-500 mb-2">
              Бесплатно осталось: {freeLeft} из 5 запросов в месяц
            </p>
          )}
        </MotionDiv>

        {/* Input area */}
        <div className="pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спросите о даче, погоде, рассаде..."
              rows={2}
              className="flex-1 resize-none px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : reachedLimit ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <MotionDiv variant="fadeUp" delay={0.1}>
              <Card className="p-6 text-center">
                <Bot className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                <h2 className="font-semibold text-lg mb-2">
                  Спросите что угодно о даче
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Погода, болезни растений, сроки посадки, подкормки, борьба с
                  вредителями
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </Card>
            </MotionDiv>
          )}

          <AnimatePresence>
            {messages.map((msg, idx) => {
              const prevMsg =
                msg.role === "assistant" && idx > 0
                  ? messages[idx - 1]
                  : undefined;
              const pairKey = prevMsg
                ? `${prevMsg.content.substring(0, 20)}`
                : null;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  prevMessage={prevMsg}
                  onShare={
                    msg.role === "assistant" ? handleSharePair : undefined
                  }
                  sharing={pairKey ? sharingPair === pairKey : false}
                  shared={pairKey ? sharedPair === pairKey : false}
                />
              );
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 items-center"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="text-center text-sm text-red-500 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
