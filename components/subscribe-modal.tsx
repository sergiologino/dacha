"use client";

import { useState } from "react";
import { Crown, Check, Star, Users, ShieldCheck, Quote, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  YearlyPlanBadge,
  YearlyPlanDetails,
  YearlyPromoBanner,
  useYearlyPromoOffer,
} from "@/components/yearly-promo";
import { guardOnlineForFeature } from "@/lib/offline/offline-feature-toast";
import { isLikelyNetworkError } from "@/lib/offline/network-error";
import {
  getDefaultSubscriptionPlan,
  getSubscriptionPlanDescription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";

const TESTIMONIALS = [
  {
    name: "Марина, Подмосковье",
    text: "Наконец-то перестала гадать, когда сажать. Календарь подсказывает по погоде — урожай томатов впервые как на картинке.",
    rating: 5,
  },
  {
    name: "Алексей, Ленинградская обл.",
    text: "Сфотографировал лист — приложение показало болезнь и чем лечить. За сезон спас всю рассаду.",
    rating: 5,
  },
  {
    name: "Ольга, Краснодар",
    text: "Справочник и напоминания всегда под рукой. Даже без интернета на участке всё открывается.",
    rating: 5,
  },
];

const USER_COUNT = "более 30 000";

const PREMIUM_BENEFITS = [
  "AI-агроном подскажет, что делать с культурой именно сейчас",
  "календарь ухода и push-напоминания не дадут пропустить полив, подкормку и обработку",
  "фото-диагностика помогает спасти растения до того, как проблема стала видимой всем",
  "сезонный план помогает вырастить урожай, которым приятно похвастаться соседям",
];

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeModal({ open, onOpenChange }: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(() =>
    getDefaultSubscriptionPlan()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offer } = useYearlyPromoOffer({ enabled: open });

  const createPayment = async () => {
    if (isSubmitting) return;

    const amount = SUBSCRIPTION_PLANS[selectedPlan].amount;
    const description = getSubscriptionPlanDescription(
      selectedPlan,
      offer.isEligible ? 2 : 0
    );

    setError(null);
    if (!guardOnlineForFeature("Оплата подписки")) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, plan: selectedPlan }),
      });

      let data: { error?: string; paymentUrl?: string } | null = null;
      try {
        data = await response.json();
      } catch {
        // тело не JSON — обработаем общим сообщением ниже
      }

      if (!response.ok) {
        const message =
          data?.error ||
          "Не удалось создать платёж. Попробуйте позже или напишите нам в поддержку.";
        setError(message);
        return;
      }

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError("Платёж создан некорректно: не пришёл URL оплаты.");
      }
    } catch (e) {
      if (isLikelyNetworkError(e)) {
        setError("Нет стабильного интернета. Подключитесь к сети и откройте оплату снова.");
      } else {
        setError("Ошибка связи с YooKassa. Проверьте интернет или попробуйте позже.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/30 rounded-t-lg px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" /> Премиум для сильного урожая
            </DialogTitle>
          </DialogHeader>

          <p className="text-center text-sm text-slate-700 dark:text-slate-300 mt-3 px-2 leading-snug">
            Сезон короткий: Премиум помогает вовремя посадить, подкормить, заметить болезнь и не забыть важные работы.
            После <strong>14 дней полного доступа</strong> для AI-помощника, календаря ухода и уведомлений нужна подписка.
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-slate-600 dark:text-slate-400">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium">
              {USER_COUNT} дачников уже с нами
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {PREMIUM_BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-2 rounded-xl bg-white/80 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border border-emerald-100 dark:border-emerald-900/60"
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3 max-h-32 overflow-y-auto pr-1">
            {TESTIMONIALS.slice(0, 2).map((t) => (
              <div
                key={t.name}
                className="flex gap-2 text-left bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700"
              >
                <Quote className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    «{t.text}»
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="text-[11px] text-slate-500 ml-1">
                      {t.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <YearlyPromoBanner offer={offer} compact />

          <Card
            className={`p-5 cursor-pointer transition-all border-2 ${
              selectedPlan === "monthly"
                ? "ring-2 ring-emerald-500 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
                : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold">Месячный</p>
                <p className="text-2xl font-bold mt-0.5">
                  199 ₽{" "}
                  <span className="text-sm font-normal text-slate-500">
                    / мес
                  </span>
                </p>
              </div>
              {selectedPlan === "monthly" && (
                <Check className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              )}
            </div>
          </Card>

          <Card
            className={`p-5 cursor-pointer transition-all relative border-2 ${
              selectedPlan === "seasonal"
                ? "ring-2 ring-amber-500 border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30"
                : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            }`}
            onClick={() => setSelectedPlan("seasonal")}
          >
            <span className="absolute -top-2.5 right-5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Для сезона
            </span>
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SunMedium className="h-5 w-5 text-amber-500" />
                  <p className="text-lg font-semibold">Сезонный</p>
                </div>
                <p className="text-2xl font-bold mt-0.5">
                  990 ₽{" "}
                  <span className="text-sm font-normal text-slate-500">
                    май-октябрь
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Для тех, кто активно ведёт дачу только в тёплые месяцы.
                </p>
              </div>
              {selectedPlan === "seasonal" && (
                <Check className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              )}
            </div>
          </Card>

          <Card
            className={`p-5 cursor-pointer transition-all relative border-2 ${
              selectedPlan === "yearly"
                ? "ring-2 ring-emerald-500 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
                : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            }`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <YearlyPlanBadge offer={offer} className="absolute -top-2.5 right-5" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold">Годовой</p>
                <p className="text-2xl font-bold mt-0.5">
                  1990 ₽{" "}
                  <span className="text-sm font-normal text-slate-500">
                    / год
                  </span>
                </p>
                <YearlyPlanDetails offer={offer} className="mt-2" />
              </div>
              {selectedPlan === "yearly" && (
                <Check className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              )}
            </div>
          </Card>

          <Button
            onClick={createPayment}
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-70"
          >
            {isSubmitting
              ? "Создаём платёж..."
              : `Оформить Премиум — ${SUBSCRIPTION_PLANS[selectedPlan].paymentLabel}`}
          </Button>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Оплата через ЮKassa. Отмена в любой момент.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
