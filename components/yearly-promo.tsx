"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Gift, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type YearlyPromoOffer,
  getInactiveYearlyPromoOffer,
  resolveLiveYearlyPromoOffer,
} from "@/lib/yearly-promo";

type UseYearlyPromoOfferOptions = {
  initialOffer?: YearlyPromoOffer | null;
  enabled?: boolean;
};

function formatCountdown(expiresAt: string | null): string | null {
  if (!expiresAt) return null;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return null;

  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} ч ${String(minutes).padStart(2, "0")} мин`;
}

export function useYearlyPromoOffer({
  initialOffer,
  enabled = true,
}: UseYearlyPromoOfferOptions = {}) {
  const [offer, setOffer] = useState<YearlyPromoOffer>(
    initialOffer ?? getInactiveYearlyPromoOffer()
  );
  const [isLoading, setIsLoading] = useState(enabled && !initialOffer);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!enabled) {
      setOffer(initialOffer ?? getInactiveYearlyPromoOffer());
      setIsLoading(false);
      return;
    }

    if (initialOffer) {
      setOffer(initialOffer);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch("/api/user/yearly-promo")
      .then((response) => response.json())
      .then((data: YearlyPromoOffer) => {
        if (!cancelled) {
          setOffer(data ?? getInactiveYearlyPromoOffer());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffer(getInactiveYearlyPromoOffer());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, initialOffer]);

  useEffect(() => {
    if (!offer.isEligible || !offer.expiresAt) return;

    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [offer.isEligible, offer.expiresAt]);

  const liveOffer = useMemo(() => {
    void nowTick;
    return resolveLiveYearlyPromoOffer(offer);
  }, [offer, nowTick]);

  return {
    offer: liveOffer,
    isLoading,
    countdownText: formatCountdown(liveOffer.expiresAt),
  };
}

export function YearlyPlanBadge({
  offer,
  className,
}: {
  offer: YearlyPromoOffer;
  className?: string;
}) {
  const label = offer.isEligible
    ? "Ранняя скидка: +2 месяца"
    : "Годовой — выгоднее помесячной";

  return (
    <div
      className={cn(
        "bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm",
        offer.isEligible && "bg-gradient-to-r from-amber-500 to-orange-500",
        className
      )}
    >
      {label}
    </div>
  );
}

export function YearlyPlanDetails({
  offer,
  className,
}: {
  offer: YearlyPromoOffer;
  className?: string;
}) {
  const countdownText = formatCountdown(offer.expiresAt);

  if (offer.isEligible) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
          Год премиума по цене «десяти месяцев» — плюс два месяца в подарок
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Разовый платёж <span className="font-medium text-slate-700 dark:text-slate-300">1990 ₽</span> — это примерно{" "}
          <span className="font-medium">десять</span> оплат по 199 ₽, при этом доступ на{" "}
          <span className="font-medium">12 месяцев</span>. В первые дни после регистрации добавляем ещё{" "}
          <span className="font-medium">2 месяца</span>: обычно это <span className="font-medium">поздняя осень и зима</span>{" "}
          — на грядках тише, зато планы и справочник с вами к сезону. К оплате всё равно один раз 1990 ₽; по сравнению с{" "}
          14 раз по 199 ₽ экономия около <span className="font-medium">800 ₽</span> — впору на{" "}
          <span className="font-medium">мангал</span> или <span className="font-medium">коньяк к открытию сезона</span>.
        </p>
        {countdownText && (
          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            До конца акции: {countdownText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5 mt-1", className)}>
      <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
        Год за 1990 ₽ вместо 12×199 ₽
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        По сути платите <span className="font-medium">как за ~10 месяцев</span>, пользуетесь{" "}
        <span className="font-medium">целый год (12 мес)</span>. Экономия около{" "}
        <span className="font-medium">400 ₽</span> — хватит, например, на{" "}
        <span className="font-medium">новый мангал</span> или{" "}
        <span className="font-medium">бутылку к первому шашлыку</span>.
      </p>
    </div>
  );
}

export function YearlyPromoBanner({
  offer,
  className,
  compact = false,
  ctaHref,
}: {
  offer: YearlyPromoOffer;
  className?: string;
  compact?: boolean;
  ctaHref?: string;
}) {
  const countdownText = formatCountdown(offer.expiresAt);

  if (!offer.isEligible) return null;

  return (
    <Card
      className={cn(
        "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 dark:border-amber-800 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/30",
        compact ? "px-4 py-3 gap-3" : "p-5 gap-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
            <Gift className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                <Sparkles className="w-3 h-3" />
                Скидка новичкам
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-200 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
              >
                +2 мес к году (осень и зима)
              </Badge>
            </div>
            <p className={cn("font-medium text-slate-900 dark:text-slate-100", compact && "text-sm")}>
              Уже берёте год выгоднее помесячной оплаты — и в первые дни после регистрации даём ещё два месяца: спокойнее на
              участке, а приложение с вами к новому сезону.
            </p>
            {countdownText && (
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" />
                До конца предложения: {countdownText}
              </p>
            )}
          </div>
        </div>

        {ctaHref && (
          <Button
            asChild
            size={compact ? "sm" : "default"}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            <Link href={ctaHref}>Оформить год со скидкой</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

export function YearlyPromoBannerWithData({
  initialOffer,
  className,
  compact = false,
  ctaHref,
}: {
  initialOffer: YearlyPromoOffer;
  className?: string;
  compact?: boolean;
  ctaHref?: string;
}) {
  const { offer } = useYearlyPromoOffer({ initialOffer });

  return (
    <YearlyPromoBanner
      offer={offer}
      className={className}
      compact={compact}
      ctaHref={ctaHref}
    />
  );
}
