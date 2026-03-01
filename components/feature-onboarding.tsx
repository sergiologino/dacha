"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Sprout, LayoutGrid, Calendar, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const FEATURE_ONBOARDING_KEY = "dacha_feature_onboarding_seen";

export type FeatureOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

const SLIDES: { icon: typeof Sprout; title: string; text: string }[] = [
  {
    icon: Sprout,
    title: "Добро пожаловать в Любимую Дачу!",
    text: "Здесь вы будете планировать посадки, уход и сбор урожая. Мы уже добавили для вас пример — грядку «Рассада дома» с одним растением и таймлайном ухода.",
  },
  {
    icon: LayoutGrid,
    title: "Мой участок",
    text: "Добавляйте грядки: открытый грунт, теплица, высокая грядка или рассада дома. На каждую грядку — растения из справочника или свои. Указывайте дату посадки и делайте фото.",
  },
  {
    icon: Calendar,
    title: "Таймлайн ухода",
    text: "По каждому растению строится план: всходы, полив, рыхление, подкормка, пересадка (для рассады), урожай. Можно добавлять свои плановые работы и редактировать даты.",
  },
  {
    icon: Calendar,
    title: "Календарь",
    text: "В разделе «Календарь» — общие задачи на месяц по регионам и ваши запланированные работы с грядок. Есть лунный календарь с приметами и рекомендациями.",
  },
  {
    icon: BookOpen,
    title: "Справочник и нейросеть",
    text: "100+ культур с описаниями и сортами. Не нашли культуру? Спросите AI-агронома или добавьте её в справочник. Чат и анализ фото растений помогут с вопросами по уходу.",
  },
  {
    icon: MessageCircle,
    title: "Чат и камера",
    text: "Задайте вопрос в разделе «Чат» — получите совет по садоводству. Сфотографируйте растение в «Камере» — нейросеть подскажет, что с ним и как ухаживать. Приятного урожая!",
  },
];

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

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/50 dark:to-slate-900"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
      >
        <div className="relative p-6 pb-4">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center min-h-[280px]">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/70 flex items-center justify-center mb-6 shadow-inner">
              <Icon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 px-2">
              {slide?.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base px-1">
              {slide?.text}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-1">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-2 h-2 rounded-full transition-colors ${
                    i === step ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
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
                  className="rounded-xl"
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
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  Готово
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  Далее <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
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
