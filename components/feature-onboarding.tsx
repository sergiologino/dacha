"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Sprout, LayoutGrid, Calendar, BookOpen, MessageCircle, Users, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const FEATURE_ONBOARDING_KEY = "dacha_feature_onboarding_seen";

const SLIDES: {
  icon: typeof Sprout;
  title: string;
  text: string;
  image: string;
  imageTitle: string;
  imageText: string;
}[] = [
  {
    icon: Sprout,
    title: "Добро пожаловать в Любимую Дачу!",
    text: "Планируйте посадки, уход и урожай в одном месте. Мы уже добавили для вас пример — культуру в теплице с планом ухода. Если понадобится помощь или хотите подсказать идею, напишите нам в MAX — кнопка есть в шапке приложения.",
    image: "/images/landing/hero-garden.jpg",
    imageTitle: "Теплица и участок под контролем",
    imageText: "пример уже ждёт внутри",
  },
  {
    icon: LayoutGrid,
    title: "Мой участок",
    text: "Сажайте культуры и указывайте место: дома, теплица, открытый грунт или высокая грядка. Если культуры нет в справочнике, Агроэксперт поможет найти данные и добавить её.",
    image: "/images/guide/crops/tomat.jpg",
    imageTitle: "Что посадили и где растёт",
    imageText: "томаты, огурцы, зелень и свои культуры",
  },
  {
    icon: Calendar,
    title: "План ухода",
    text: "По каждому растению видно, что делать дальше: полить, подкормить, пересадить, ждать всходов или урожая. Свои работы можно добавлять и переносить.",
    image: "/images/guide/crops/ogurets.jpg",
    imageTitle: "Ближайшие дела по растению",
    imageText: "без непонятных таблиц и терминов",
  },
  {
    icon: Calendar,
    title: "Календарь",
    text: "Общие задачи на месяц по регионам и ваши запланированные работы с грядок. Лунный календарь с приметами и рекомендациями.",
    image: "/images/landing/fresh-vegetables.jpg",
    imageTitle: "Работы по сезону",
    imageText: "что делать сегодня, завтра и в выходные",
  },
  {
    icon: Users,
    title: "Дача для всей семьи",
    text: "Пригласите близких через QR-код в настройках. Все видят один участок, добавляют работы и уход, а удалять посаженные культуры может только владелец аккаунта.",
    image: "/images/guide/crops/malina.jpg",
    imageTitle: "Один участок для семьи",
    imageText: "план и уход видны всем, кто помогает на даче",
  },
  {
    icon: SunMedium,
    title: "Сезонный тариф май–октябрь",
    text: "Если приложение нужно только в тёплые месяцы, выбирайте сезонный Премиум: календарь, Агроэксперт, фото-анализ, напоминания и семейный доступ на весь дачный сезон.",
    image: "/images/landing/fresh-vegetables.jpg",
    imageTitle: "Премиум на дачный сезон",
    imageText: "май, лето и сбор урожая без лишней годовой оплаты",
  },
  {
    icon: BookOpen,
    title: "Справочник и Агроэксперт",
    text: "100+ культур с описаниями и сортами. Не нашли? Спросите Агроэксперта или добавьте культуру в справочник.",
    image: "/images/guide/crops/klubnika.jpg",
    imageTitle: "Справочник пополняется",
    imageText: "культуры, сорта, уход и защита",
  },
  {
    icon: MessageCircle,
    title: "Чат и камера",
    text: "Задайте вопрос в «Чате» — совет по садоводству. Сфотографируйте растение в «Камере» — Агроэксперт подскажет, что с ним. Приятного урожая!",
    image: "/images/guide/crops/perets.jpg",
    imageTitle: "Фото и подсказки Агроэксперта",
    imageText: "если лист желтеет или рост остановился",
  },
];

const GRADIENT_BY_STEP = [
  "from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/40",
  "from-emerald-100 to-lime-100 dark:from-emerald-950/60 dark:to-lime-950/40",
  "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30",
  "from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40",
  "from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30",
  "from-amber-50 to-lime-50 dark:from-amber-950/35 dark:to-lime-950/30",
  "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40",
  "from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40",
];

export type FeatureOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

export function FeatureOnboarding({ open, onClose }: FeatureOnboardingProps) {
  const [step, setStep] = useState(0);

  const markSeen = () => {
    if (typeof localStorage !== "undefined") {
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
        <DialogTitle className="sr-only">{slide?.title}</DialogTitle>
        <DialogDescription className="sr-only">{slide?.text}</DialogDescription>
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
              <div
                className="relative w-full aspect-[16/10] max-h-[260px] rounded-2xl overflow-hidden shadow-lg border border-white/60 dark:border-slate-600/50 mb-5 bg-slate-100 dark:bg-slate-800"
                role="img"
                aria-label={slide?.imageTitle}
              >
                {slide?.image ? (
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92vw, 560px"
                    className="object-cover"
                    priority={step === 0}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                  <p className="text-white text-base sm:text-lg font-semibold leading-tight">
                    {slide?.imageTitle}
                  </p>
                  <p className="text-emerald-50 text-xs sm:text-sm mt-1">
                    {slide?.imageText}
                  </p>
                </div>
              </div>

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
