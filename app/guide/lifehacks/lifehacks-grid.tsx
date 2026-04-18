"use client";

import { useMemo, useState } from "react";
import { GuideHackImage } from "@/components/guide-hack-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GuideHackDTO } from "@/lib/data/guide-hacks";

const catColors: Record<string, string> = {
  "growing-secrets":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "plot-improvement":
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  "soil-compost-mulch":
    "bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-100",
  "watering-irrigation":
    "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  "pests-diseases-care":
    "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  "folk-simple":
    "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

function HackCard({ hack }: { hack: GuideHackDTO }) {
  return (
    <Card className="overflow-hidden flex flex-col border-slate-200 dark:border-slate-700">
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        <GuideHackImage
          src={hack.imageUrl}
          alt={hack.imageAlt}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Badge className={`w-fit text-xs ${catColors[hack.categorySlug] ?? ""}`}>
          {hack.categoryTitle}
        </Badge>
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{hack.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{hack.text}</p>
      </div>
    </Card>
  );
}

const PAGE = 8;

export function LifehacksGrid({ hacks }: { hacks: GuideHackDTO[] }) {
  const sorted = useMemo(
    () => [...hacks].sort((a, b) => a.slug.localeCompare(b.slug)),
    [hacks]
  );
  const [visible, setVisible] = useState(PAGE);
  const shown = sorted.slice(0, visible);
  const canMore = visible < sorted.length;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((hack) => (
          <HackCard key={hack.slug} hack={hack} />
        ))}
      </div>
      {canMore ? (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setVisible((v) => Math.min(v + PAGE, sorted.length))}
          >
            Показать ещё 8
          </Button>
        </div>
      ) : null}
    </>
  );
}
