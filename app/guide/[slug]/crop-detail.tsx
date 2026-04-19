"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CropImage } from "@/components/crop-image";
import {
  ArrowLeft,
  Droplets,
  Calendar,
  Sun,
  StickyNote,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Leaf,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { SubscribeModal } from "@/components/subscribe-modal";
import type { Crop } from "@/lib/types";
import { getCropDisplayImageUrl } from "@/lib/crop-community";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { GUIDE_DETAIL_READY_EVENT } from "@/lib/offline/sync-events";
import { toast } from "sonner";

interface Props {
  crop: Crop & { addedByCommunity?: boolean };
}

export function CropDetailContent({ crop }: Props) {
  const heroImageUrl = getCropDisplayImageUrl(crop);
  const [detailContent, setDetailContent] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [expandedVariety, setExpandedVariety] = useState<string | null>(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [detailQueued, setDetailQueued] = useState(false);

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((data: { hasFullAccess?: boolean; isPremium?: boolean }) =>
        setHasFullAccess(Boolean(data.hasFullAccess ?? data.isPremium))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onReady = (ev: Event) => {
      const ce = ev as CustomEvent<{ slug?: string; content?: string }>;
      if (ce.detail?.slug !== crop.slug) return;
      const c = ce.detail.content;
      if (typeof c !== "string") return;
      setDetailContent(c);
      setDetailQueued(false);
      setDetailError(null);
    };
    window.addEventListener(GUIDE_DETAIL_READY_EVENT, onReady as EventListener);
    return () =>
      window.removeEventListener(GUIDE_DETAIL_READY_EVENT, onReady as EventListener);
  }, [crop.slug]);

  const loadDetail = async () => {
    if (detailContent) return;
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      if (shouldQueueOfflineMutation()) {
        const outId = await enqueueOutbox({
          action: "GUIDE_DETAIL_FETCH",
          payload: { slug: crop.slug },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        setDetailQueued(true);
        toast.message("Руководство в очереди — откроется после подключения к сети");
        return;
      }
      const res = await fetch(`/api/guide/detail?slug=${encodeURIComponent(crop.slug)}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setDetailContent(data.content);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Не удалось загрузить"
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/guide">
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад к справочнику
          </Link>
        </Button>

        {/* Hero image */}
        {heroImageUrl && (
          <MotionDiv variant="fadeIn">
            <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
              <CropImage
                src={heroImageUrl}
                alt={crop.name}
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h1 className="text-3xl font-bold text-white">{crop.name}</h1>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                    {crop.category}
                  </Badge>
                  {crop.addedByCommunity && (
                    <Badge className="bg-amber-500/90 text-white border-0">
                      Добавлено дачниками
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </MotionDiv>
        )}

        {!heroImageUrl && (
          <MotionDiv variant="fadeUp">
            <h1 className="text-3xl font-bold mb-2">{crop.name}</h1>
            <div className="flex gap-2 mb-6 flex-wrap">
              <Badge variant="secondary">{crop.category}</Badge>
              {crop.addedByCommunity && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  Добавлено дачниками
                </Badge>
              )}
            </div>
          </MotionDiv>
        )}

        {/* Regions */}
        <MotionDiv variant="fadeUp" delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-6">
            {crop.region.map((r) => (
              <Badge key={r} variant="outline">
                {r}
              </Badge>
            ))}
          </div>
        </MotionDiv>

        {/* Description */}
        {crop.description && (
          <MotionDiv variant="fadeUp" delay={0.15}>
            <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
              {crop.description}
            </p>
          </MotionDiv>
        )}

        <MotionDiv variant="fadeUp" delay={0.18}>
          <div className="grid gap-4 mb-8 md:grid-cols-3">
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Когда сажать {crop.name.toLowerCase()}</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ориентировочный срок посадки или высадки: <strong>{crop.plantMonth}</strong>. Для теплолюбивых культур сверяйте срок с регионом и риском возвратных заморозков.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Когда ждать урожай</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Основной период сбора урожая: <strong>{crop.harvestMonth}</strong>. Точные сроки зависят от сорта, погоды и способа выращивания.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Уход и полив</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Базовый режим полива: <strong>{crop.water}</strong>. В заметках учтите особенность культуры: {crop.note}.
              </p>
            </Card>
          </div>
        </MotionDiv>

        {/* Info cards */}
        <MotionDiv variant="fadeUp" delay={0.2}>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Посадка</p>
                <p className="text-lg font-bold">{crop.plantMonth}</p>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                <Sun className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Урожай</p>
                <p className="text-lg font-bold">{crop.harvestMonth}</p>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Полив</p>
                <p className="text-lg font-bold">{crop.water}</p>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
                <StickyNote className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Примечание</p>
                <p className="text-lg font-semibold">{crop.note}</p>
              </div>
            </Card>
          </div>
        </MotionDiv>

        {/* Varieties */}
        {crop.varieties && crop.varieties.length > 0 && (
          <MotionDiv variant="fadeUp" delay={0.25}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-500" /> Популярные сорта
            </h2>
            <StaggerContainer className="grid gap-3 mb-8" staggerDelay={0.05}>
              {crop.varieties.map((v) => (
                <StaggerItem key={v.name}>
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      setExpandedVariety(
                        expandedVariety === v.name ? null : v.name
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      {v.imageUrl && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                          <CropImage
                            src={v.imageUrl}
                            alt={v.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 flex-1 text-left">
                        {v.name}
                      </h3>
                      {expandedVariety === v.name ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {expandedVariety === v.name && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {v.desc}
                      </p>
                    )}
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </MotionDiv>
        )}

        {/* AI Detail button */}
        <MotionDiv variant="fadeUp" delay={0.3}>
          <Card className="p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1">
                  Подробное руководство
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Полная инструкция: подготовка, посадка, уход, болезни,
                  хранение, лайфхаки. Генерируется AI-агрономом.
                </p>
                {!detailContent && !hasFullAccess && (
                  <Button
                    onClick={() => setShowPaywall(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Доступно в Премиум
                  </Button>
                )}
                {!detailContent && hasFullAccess && (
                  <Button
                    onClick={loadDetail}
                    disabled={isLoadingDetail || detailQueued}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoadingDetail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Генерирую руководство...
                      </>
                    ) : detailQueued ? (
                      <>В очереди — дождитесь сети</>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Получить подробности
                      </>
                    )}
                  </Button>
                )}
                {detailError && (
                  <p className="text-sm text-red-500 mt-2">{detailError}</p>
                )}
              </div>
            </div>

            {detailContent && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-emerald-700 dark:prose-headings:text-emerald-400 prose-li:marker:text-emerald-500"
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(detailContent),
                  }}
                />
              </div>
            )}
          </Card>
        </MotionDiv>
      </div>

      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-3">$1</h2>')
    .replace(/^\*\*(.+?)\*\*/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
