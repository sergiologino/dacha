"use client";

import Link from "next/link";
import { GuideHackImage } from "@/components/guide-hack-image";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  orderHacksForGuideSection,
  type GuideHackDTO,
} from "@/lib/data/guide-hacks";

type Props = {
  hacks: GuideHackDTO[];
};

export function GuideWeeklyHacksSection({ hacks }: Props) {
  const ordered = orderHacksForGuideSection(hacks);
  const heroHack = ordered[0];

  return (
    <section className="mb-8" aria-labelledby="guide-hacks-heading">
      <Link
        href="/guide/lifehacks"
        className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/90 text-emerald-950 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100 md:flex-row"
      >
        <div className="relative min-h-40 bg-emerald-100 dark:bg-emerald-950 md:w-64 md:min-h-0">
          {heroHack ? (
            <GuideHackImage
              src={heroHack.imageUrl}
              alt={heroHack.imageAlt}
              sizes="(max-width: 768px) 100vw, 256px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-100 dark:bg-emerald-950">
              <Lightbulb className="h-12 w-12 text-emerald-600 dark:text-emerald-300" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-4 px-4 py-4 md:px-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
              <h2 id="guide-hacks-heading" className="font-semibold">
                Лайфхаки и народные приёмы
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-emerald-900/85 dark:text-emerald-200/85">
              Короткие дачные советы, народные способы ухода, идеи для почвы, полива и защиты
              растений вынесены на отдельную страницу, чтобы ниже сразу был справочник культур.
            </p>
            {heroHack ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-white/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                  {heroHack.categoryTitle}
                </Badge>
                <span className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                  {hacks.length} карточек
                </span>
              </div>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 underline-offset-4 group-hover:underline dark:text-emerald-300">
            Открыть лайфхаки
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </section>
  );
}
