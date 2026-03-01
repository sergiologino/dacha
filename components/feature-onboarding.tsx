"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Sprout, LayoutGrid, Calendar, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const FEATURE_ONBOARDING_KEY = "dacha_feature_onboarding_seen";

const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&q=80",
  "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80",
  "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80",
] as const;

const SLIDES: {
  icon: typeof Sprout;
  title: string;
  text: string;
  image: string;
  mock?: "garden" | "timeline" | "calendar" | "guide" | "chat";
}[] = [
  {
    icon: Sprout,
    title: "Добро пожаловать в Любимую Дачу!",
    text: "Планируйте посадки, уход и урожай в одном месте. Мы уже добавили для вас пример — грядку «Рассада дома» с растением и планом ухода.",
    image: SLIDE_IMAGES[0],
    mock: "garden",
  },
  {
    icon: LayoutGrid,
    title: "Мой участок",
    text: "Добавляйте грядки: открытый грунт, теплица, высокая грядка или рассада дома. На каждую — растения из справочника, дата посадки и фото.",
    image: SLIDE_IMAGES[1],
    mock: "garden",
  },
  {
    icon: Calendar,
    title: "Таймлайн ухода",
    text: "По каждому растению — план: всходы, полив, рыхление, подкормка, пересадка, урожай. Добавляйте свои работы и редактируйте даты.",
    image: SLIDE_IMAGES[2],
    mock: "timeline",
  },
  {
    icon: Calendar,
    title: "Календарь",
    text: "Общие задачи на месяц по регионам и ваши запланированные работы с грядок. Лунный календарь с приметами и рекомендациями.",
    image: SLIDE_IMAGES[3],
    mock: "calendar",
  },
  {
    icon: BookOpen,
    title: "Справочник и нейросеть",
    text: "100+ культур с описаниями и сортами. Не нашли? Спросите AI-агронома или добавьте культуру в справочник.",
    image: SLIDE_IMAGES[4],
    mock: "guide",
  },
  {
    icon: MessageCircle,
    title: "Чат и камера",
    text: "Задайте вопрос в «Чате» — совет по садоводству. Сфотографируйте растение в «Камере» — нейросеть подскажет, что с ним. Приятного урожая!",
    image: SLIDE_IMAGES[5],
    mock: "chat",
  },
];

function ScreenMock({ type }: { type: NonNullable<(typeof SLIDES)[number]["mock"]> }) {
  if (type === "garden") {
    return (
      <div className="mx-auto w-full max-w-[200px] rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <LayoutGrid className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Мой участок</span>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-2.5 border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100">🪴 Рассада дома</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Томат, Черри · 01.03</p>
        </div>
      </div>
    );
  }
  if (type === "timeline") {
    return (
      <div className="mx-auto w-full max-w-[200px] rounded-2xl border-2 border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600 mb-2" />
        <div className="flex gap-1 justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">Всходы → Полив → Пересадка</p>
      </div>
    );
  }
  if (type === "calendar") {
    return (
      <div className="mx-auto w-full max-w-[200px] rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Март</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center text-slate-500">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={i === 2 ? "text-emerald-600 font-bold" : ""}>{i + 1}</span>
          ))}
        </div>
      </div>
    );
  }
  if (type === "guide") {
    return (
      <div className="mx-auto w-full max-w-[200px] rounded-2xl border-2 border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Справочник</span>
        </div>
        <div className="flex gap-2">
          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-600 shrink-0" />
          <div>
            <p className="text-xs font-medium">Томат</p>
            <p className="text-[10px] text-slate-500">6 сортов</p>
          </div>
        </div>
      </div>
    );
  }
  if (type === "chat") {
    return (
      <div className="mx-auto w-full max-w-[200px] rounded-2xl border-2 border-teal-200 dark:border-teal-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageCircle className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">AI-агроном</span>
        </div>
        <div className="rounded-lg bg-teal-50 dark:bg-teal-900/30 p-2 text-[11px] text-slate-700 dark:text-slate-300">
          Когда высаживать томаты в теплицу?
        </div>
      </div>
    );
  }
  return null;
}

const GRADIENT_BY_STEP = [
  "from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/40",
  "from-emerald-100 to-lime-100 dark:from-emerald-950/60 dark:to-lime-950/40",
  "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30",
  "from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40",
  "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40",
  "from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40",
];

export type FeatureOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

export function FeatureOnboarding({ open, onClose }: FeatureOnboardingProps) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markSeen = () => {
    if (mounted && typeof localStorage !== "undefined") {
      localStorage.setItem(FEATURE_ONBOARDING_KEY, "1");
    }
  };

  const handleClose = () => {
    markSeen();
    onClose();
  };

  const handleFinish = () => {
    markSeen();
    onClose();
  };

  const slide = SLIDES[step];
  const Icon = slide?.icon ?? Sprout;
  const isFirst = step === 0;
  const isLast = step === SLIDES.length - 1;
  const gradient = GRADIENT_BY_STEP[step] ?? GRADIENT_BY_STEP[0];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 overflow-y-auto max-h-[95dvh] sm:max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
      >
        <div className={`bg-gradient-to-b ${gradient} min-h-0`}>
          <div className="relative p-4 sm:p-6 pb-4">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors touch-manipulation"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative w-full aspect-[16/10] max-h-[180px] sm:max-h-[220px] rounded-2xl overflow-hidden shadow-lg border border-white/50 dark:border-slate-600/50 mb-4">
                <Image
                  src={slide?.image ?? SLIDE_IMAGES[0]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 560px"
                  priority
                />
              </div>

              {slide?.mock && (
                <div className="mb-4 w-full flex justify-center">
                  <ScreenMock type={slide.mock} />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-white/90 dark:bg-slate-800/90 flex items-center justify-center mb-3 shadow-sm border border-white/80">
                <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 px-2">
                {slide?.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base px-1 max-w-md">
                {slide?.text}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700">
              <div className="flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2 h-2 rounded-full transition-all ${
                      i === step ? "bg-emerald-600 w-4" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {!isFirst ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-xl touch-manipulation"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                  </Button>
                ) : (
                  <span />
                )}
                {isLast ? (
                  <Button
                    type="button"
                    onClick={handleFinish}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 touch-manipulation"
                  >
                    Готово
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 touch-manipulation"
                  >
                    Далее <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getFeatureOnboardingSeen(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(FEATURE_ONBOARDING_KEY) === "1";
}

export function clearFeatureOnboardingSeen(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(FEATURE_ONBOARDING_KEY);
  }
}
