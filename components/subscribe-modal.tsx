"use client";

import { useState } from "react";
import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeModal({ open, onOpenChange }: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

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
      } else {
        alert("Ошибка создания платежа");
      }
    } catch {
      alert("Ошибка YooKassa. Попробуйте позже.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-amber-500" /> Любимая Дача Премиум
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <Card
            className={`p-6 cursor-pointer transition-all ${
              selectedPlan === "monthly"
                ? "ring-2 ring-emerald-600 scale-[1.02]"
                : ""
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xl font-semibold">Месячный</p>
                <p className="text-3xl font-bold">
                  199 ₽{" "}
                  <span className="text-base font-normal text-slate-500">
                    / мес
                  </span>
                </p>
              </div>
              {selectedPlan === "monthly" && (
                <Check className="w-6 h-6 text-emerald-600 mt-1" />
              )}
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all relative ${
              selectedPlan === "yearly"
                ? "ring-2 ring-emerald-600 scale-[1.02]"
                : ""
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
                  1990 ₽{" "}
                  <span className="text-base font-normal text-slate-500">
                    / год
                  </span>
                </p>
                <p className="text-emerald-600 text-sm">
                  Экономия 398 ₽ (цена 10 месяцев)
                </p>
              </div>
              {selectedPlan === "yearly" && (
                <Check className="w-6 h-6 text-emerald-600 mt-1" />
              )}
            </div>
          </Card>

          <Button
            onClick={createPayment}
            className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg font-medium"
          >
            Купить{" "}
            {selectedPlan === "yearly"
              ? "на год за 1990 ₽"
              : "на месяц за 199 ₽"}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Отмена подписки в любой момент
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
