"use client";

import { useState } from "react";
import { Crown, Check, Sparkles, Camera, Calendar, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const features = [
  { icon: Camera, text: "Безлимитный AI-анализ фото" },
  { icon: Calendar, text: "Персональный календарь по погоде" },
  { icon: BookOpen, text: "Расширенный справочник" },
  { icon: Sparkles, text: "Прогноз урожая" },
];

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [checking, setChecking] = useState(false);

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
        toast.info("Оплата пока не найдена. Вернитесь сюда после оплаты по кнопке «Вернуться на сайт».");
      }
    } catch {
      toast.error("Не удалось проверить оплату");
    } finally {
      setChecking(false);
    }
  };

  const createPayment = async () => {
    const amount = selectedPlan === "yearly" ? 1990 : 199;
    const description =
      selectedPlan === "yearly"
        ? "Любимая Дача Премиум на год"
        : "Любимая Дача Премиум на месяц";

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, plan: selectedPlan }),
      });
      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch {
      alert("Ошибка создания платежа");
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Любимая Дача Премиум</h1>
        <p className="text-slate-500">Разблокируй все возможности</p>
      </div>

      <div className="space-y-3 mb-8">
        {features.map((f) => (
          <div key={f.text} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <f.icon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-medium">{f.text}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        <Card
          className={`p-6 cursor-pointer transition-all ${
            selectedPlan === "monthly" ? "ring-2 ring-emerald-600 scale-[1.02]" : ""
          }`}
          onClick={() => setSelectedPlan("monthly")}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-semibold">Месячный</p>
              <p className="text-3xl font-bold">
                199 ₽ <span className="text-base font-normal text-slate-500">/ мес</span>
              </p>
            </div>
            {selectedPlan === "monthly" && <Check className="w-6 h-6 text-emerald-600 mt-1" />}
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all relative ${
            selectedPlan === "yearly" ? "ring-2 ring-emerald-600 scale-[1.02]" : ""
          }`}
          onClick={() => setSelectedPlan("yearly")}
        >
          <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-xs px-4 py-1 rounded-full font-medium">
            2 месяца бесплатно
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-semibold">Годовой</p>
              <p className="text-3xl font-bold">
                1990 ₽ <span className="text-base font-normal text-slate-500">/ год</span>
              </p>
              <p className="text-emerald-600 text-sm">Экономия 398 ₽</p>
            </div>
            {selectedPlan === "yearly" && <Check className="w-6 h-6 text-emerald-600 mt-1" />}
          </div>
        </Card>
      </div>

      <Button
        onClick={createPayment}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg font-medium"
      >
        Купить {selectedPlan === "yearly" ? "на год за 1990 ₽" : "на месяц за 199 ₽"}
      </Button>

      <p className="text-center text-xs text-slate-500 mt-4">
        Отмена подписки в любой момент
      </p>

      <Button
        variant="outline"
        onClick={checkPayment}
        disabled={checking}
        className="w-full mt-4 rounded-2xl border-slate-200 text-slate-600"
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
    </>
  );
}
