"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  nextScheduledWorkLabel,
  splitCropAndVariety,
} from "@/lib/garden-display-helpers";
import { getCropDisplayImageUrl } from "@/lib/crop-community";
import { crops as staticCrops } from "@/lib/data/crops";
import { proxifyGuideMediaUrl } from "@/lib/guide-image-url";
import type { Bed } from "@/lib/hooks/use-beds";
import type { Plant } from "@/lib/hooks/use-plants";

type Props = {
  beds: Bed[];
  unassignedPlants: Plant[];
};

export function GardenMobilePlantGrid({ beds, unassignedPlants }: Props) {
  const fromBeds = beds.flatMap((bed) =>
    (bed.plants ?? []).map((plant) => ({ plant, bed: bed as { id: string; name: string } }))
  );
  const fromLoose = unassignedPlants.map((plant) => ({ plant, bed: null as null }));
  const items = [...fromBeds, ...fromLoose];

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 mb-6">
      {items.map(({ plant, bed }) => {
        const { crop, variety } = splitCropAndVariety(plant.name);
        const work = nextScheduledWorkLabel(plant);
        const dateStr = new Date(plant.plantedDate).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        });
        const bedLine = bed ? bed.name : "Без грядки";
        const cropData = plant.cropSlug
          ? staticCrops.find((c) => c.slug === plant.cropSlug)
          : null;
        const imageUrl = cropData ? getCropDisplayImageUrl(cropData) : undefined;

        const card = (
          <Card className="p-3 min-h-[116px] flex gap-3 rounded-2xl border-emerald-200/80 dark:border-emerald-800/80 bg-white/90 dark:bg-slate-900/90 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors shadow-sm overflow-hidden">
            <div className="w-24 min-h-24 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-950 flex-shrink-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxifyGuideMediaUrl(imageUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden>
                  🌱
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <p className="text-[11px] text-slate-500">{dateStr}</p>
              <p className="font-semibold text-base leading-snug text-slate-900 dark:text-slate-50 line-clamp-2">
                {crop}
              </p>
              {variety ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{variety}</p>
              ) : null}
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-auto line-clamp-2 leading-snug">
                {work}
              </p>
              <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 truncate">
                {bedLine}
              </p>
            </div>
          </Card>
        );

        if (bed) {
          return (
            <Link
              key={plant.id}
              href={`/garden/bed/${bed.id}/plant/${plant.id}`}
              className="block min-w-0"
            >
              {card}
            </Link>
          );
        }

        return (
          <div key={plant.id} className="min-w-0 opacity-95">
            {card}
          </div>
        );
      })}
    </div>
  );
}
