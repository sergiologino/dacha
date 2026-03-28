"use client";

import { useState } from "react";
import {
  Crown,
  Check,
  Sparkles,
  Camera,
  Calendar,
  BookOpen,
  RefreshCw,
  Users,
  Star,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  YearlyPlanBadge,
  YearlyPlanDetails,
  YearlyPromoBanner,
  useYearlyPromoOffer,
} from "@/components/yearly-promo";
import type { YearlyPromoOffer } from "@/lib/yearly-promo";

const USER_COUNT = "более 30 000";

const TESTIMONIALS = [
  {
    name: "Марина, Подмосковье",
    text: "Календарь подсказывает по погоде — урожай томатов впервые как на картинке.",
    rating: 5,
  },
  {
    name: "Алексей, Лен. обл.",
    text: "Сфотографировал лист — приложение показало болезнь и чем лечить. Спас рассаду.",
    rating: 5,
  },
  {
    name: "Ольга, Краснодар",
    text: "Справочник и напоминания всегда под рукой. Работает даже без интернета на участке.",
    rating: 5,
  },
];

const features = [
  { icon: Camera, text: "Безлимитный AI-анализ фото растений" },
  { icon: Calendar, text: "Персональный календарь по погоде и региону" },
  { icon: BookOpen, text: "Расширенный справочник 100+ культур" },
  { icon: Sparkles, text: "Планирование урожая и уведомления" },
];

export function SubscribeContent({
  initialOffer,
}: {
  initialOffer: YearlyPromoOffer;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [checking, setChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offer } = useYearlyPromoOffer({ initialOffer });

  const checkPayment = async () => {
    setChecking(true);
    try {
      const r = await fetch("/api/payments/sync");
      const data = await r.json();
      if (data.activated) {
        toast.success("Премиум активирован!");
      } else if (data.isPremium) {
        toast.success("У вас уже есть Премиум");
      } else {
        toast.info(
          "Оплата пока не найдена. Вернитесь сюда после оплаты по кнопке «Вернуться на сайт»."
        );
      }
    } catch {
      toast.error("Не удалось проверить оплату");
    } finally {
      setChecking(false);
    }
  };

  const createPayment = async () => {
    if (isSubmitting) return;

    const amount = selectedPlan === "yearly" ? 1990 : 199;
    const description =
      selectedPlan === "yearly"
        ? offer.isEligible
          ? "Любимая Дача Премиум: 12 мес + 2 мес по акции новичка"
          : "Любимая Дача Премиум на 12 месяцев (годовая оплата)"
        : "Любимая Дача Премиум на месяц";

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, plan: selectedPlan }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            "Не удалось создать платёж. Попробуйте позже или напишите нам в поддержку."
        );
        return;
      }

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError("Платёж создан некорректно: не пришёл URL оплаты.");
      }
    } catch {
      setError("Ошибка связи с YooKassa. Проверьте интернет или попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-4 py-1.5 text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          {USER_COUNT} дачников уже с нами
        </div>
        <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Любимая Дача Премиум</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Разблокируйте все возможности — без рекламы и ограничений
        </p>
      </div>

      <YearlyPromoBanner offer={offer} className="mb-6" />

      <div className="space-y-4 mb-2">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} className="p-4 border-slate-200 dark:border-slate-700">
            <div className="flex gap-3">
              <Quote className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                  «{t.text}»
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">{t.name}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {features.map((f) => (
          <div key={f.text} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
              <f.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        <Card
          className={`p-6 cursor-pointer transition-all border-2 ${
            selectedPlan === "monthly"
              ? "ring-2 ring-emerald-500 border-emerald-200 dark:border-emerald-800"
              : "border-transparent"
          }`}
          onClick={() => setSelectedPlan("monthly")}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-semibold">Месячный</p>
              <p className="text-3xl font-bold mt-0.5">
                199 ₽ <span className="text-base font-normal text-slate-500">/ мес</span>
              </p>
            </div>
            {selectedPlan === "monthly" && (
              <Check className="w-6 h-6 text-emerald-600 mt-1" />
            )}
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all relative border-2 ${
            selectedPlan === "yearly"
              ? "ring-2 ring-emerald-500 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-transparent"
          }`}
          onClick={() => setSelectedPlan("yearly")}
        >
          <YearlyPlanBadge offer={offer} className="absolute -top-3 right-6" />
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-xl font-semibold">Годовой</p>
              <p className="text-3xl font-bold mt-0.5">
                1990 ₽ <span className="text-base font-normal text-slate-500">/ год</span>
              </p>
              <YearlyPlanDetails offer={offer} className="mt-2" />
            </div>
            {selectedPlan === "yearly" && (
              <Check className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
            )}
          </div>
        </Card>
      </div>

      <Button
        onClick={createPayment}
        disabled={isSubmitting}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-70"
      >
        {isSubmitting
          ? "Создаём платёж..."
          : `Оформить Премиум — ${
              selectedPlan === "yearly" ? "1990 ₽ в год" : "199 ₽ в месяц"
            }`}
      </Button>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center mt-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <span>Оплата через ЮKassa. Отмена в любой момент.</span>
      </div>

      <Button
        variant="outline"
        onClick={checkPayment}
        disabled={checking}
        className="w-full mt-4 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
      >
        {checking ? (
          "Проверяем..."
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Уже оплатили? Проверить оплату
          </>
        )}
      </Button>
    </div>
  );
}
