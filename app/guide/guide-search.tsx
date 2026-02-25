"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles, Loader2, BookPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Crop } from "@/lib/types";
import type { CropWithSource } from "@/lib/crops-merge";

export function GuideSearch({ crops }: { crops: CropWithSource[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [addToGuideLoading, setAddToGuideLoading] = useState(false);
  const [addToGuideError, setAddToGuideError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  const filtered = searchTerm
    ? crops.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.varieties?.some((v) =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : [];

  const hasResults = searchTerm && filtered.length > 0;
  const noResults = searchTerm.length >= 2 && filtered.length === 0;

  const askAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAddToGuideError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Расскажи подробно о культуре "${searchTerm}" для выращивания на даче в России. Включи: описание, популярные сорта (3-5), сроки посадки (средняя полоса), полив, уход, болезни, урожай. Формат: структурированный текст с заголовками.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setAiResult(data.message);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Не удалось получить ответ");
    } finally {
      setAiLoading(false);
    }
  };

  const addToGuide = async () => {
    if (!searchTerm.trim()) return;
    setAddToGuideLoading(true);
    setAddToGuideError(null);
    try {
      const res = await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm.trim(), aiResult: aiResult ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось добавить в справочник");
      router.push(`/guide/${data.slug}`);
    } catch (err) {
      setAddToGuideError(err instanceof Error ? err.message : "Ошибка добавления");
    } finally {
      setAddToGuideLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="relative mb-4">
        <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Поиск растения или сорта..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setAiResult(null);
            setAiError(null);
          }}
          className="w-full pl-12 pr-4 py-4 rounded-3xl border bg-white dark:bg-slate-900"
        />
      </div>

      {hasResults && (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={`${c.slug}-${c.id}`} href={`/guide/${c.slug}`}>
              <Card className="hover:scale-[1.01] transition-all cursor-pointer mb-3 overflow-hidden flex">
                {c.imageUrl && (
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.varieties && (
                      <Badge variant="secondary" className="text-xs">
                        {c.varieties.length} сортов
                      </Badge>
                    )}
                    {c.addedByCommunity && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-xs">
                        Добавлено дачниками
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{c.note}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {noResults && !aiResult && (
        <Card className="p-6 text-center">
          <p className="text-slate-500 mb-4">
            «{searchTerm}» не найдено в справочнике
          </p>
          <Button
            onClick={askAI}
            disabled={aiLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ищу данные в нейросети...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Найти через нейроэксперта
              </>
            )}
          </Button>
          {aiLoading && (
            <p className="text-xs text-slate-400 mt-3 animate-pulse">
              Формируем информацию о «{searchTerm}», это может занять 10-20 секунд...
            </p>
          )}
          {aiError && (
            <p className="text-sm text-red-500 mt-3">{aiError}</p>
          )}
        </Card>
      )}

      {aiResult && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold">Ответ нейроэксперта</h3>
          </div>
          <div className="space-y-2">
            <div
              className={!aiExpanded && aiResult.length > 80 ? "relative" : ""}
              style={
                !aiExpanded && aiResult.length > 80
                  ? {
                      maxHeight: "7.5rem",
                      overflow: "hidden",
                      WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                      maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                    }
                  : undefined
              }
            >
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-emerald-700 dark:prose-headings:text-emerald-400">
                {aiResult.split("\n").map((line, i) => {
                if (line.startsWith("## "))
                  return (
                    <h2
                      key={i}
                      className="text-lg font-bold mt-4 mb-2 text-emerald-700 dark:text-emerald-400"
                    >
                      {line.replace("## ", "")}
                    </h2>
                  );
                if (line.startsWith("### "))
                  return (
                    <h3
                      key={i}
                      className="text-base font-bold mt-3 mb-1 text-emerald-700 dark:text-emerald-400"
                    >
                      {line.replace("### ", "")}
                    </h3>
                  );
                if (line.startsWith("- "))
                  return (
                    <li key={i} className="ml-4 list-disc text-sm">
                      {line.replace("- ", "")}
                    </li>
                  );
                if (line.trim() === "") return <br key={i} />;
                return (
                  <p key={i} className="text-sm leading-relaxed">
                    {line}
                  </p>
                );
                })}
              </div>
            </div>
            {!aiExpanded && aiResult.length > 80 && (
              <button
                type="button"
                onClick={() => setAiExpanded(true)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Развернуть ответ
              </button>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={addToGuide}
              disabled={addToGuideLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addToGuideLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Добавляю в справочник...
                </>
              ) : (
                <>
                  <BookPlus className="w-4 h-4 mr-2" />
                  Добавить в справочник
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Культура будет добавлена в общий справочник с пометкой «Добавлено дачниками» и фото по запросу к нейросети.
            </p>
            {addToGuideError && (
              <p className="text-sm text-red-500 mt-2">{addToGuideError}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
