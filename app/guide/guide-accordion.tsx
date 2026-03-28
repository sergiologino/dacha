"use client";

import { useState } from "react";
import Link from "next/link";
import { CropImage } from "@/components/crop-image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Crop } from "@/lib/types";
import { getCropDisplayImageUrl } from "@/lib/crop-community";

const categoryIcons: Record<string, { emoji: string; color: string }> = {
  "Овощи": { emoji: "🥬", color: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
  "Ягоды": { emoji: "🍓", color: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  "Зелень": { emoji: "🌿", color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  "Пряные травы": { emoji: "🌱", color: "bg-lime-50 dark:bg-lime-950 border-lime-200 dark:border-lime-800" },
  "Бобовые": { emoji: "🫘", color: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  "Плодовые деревья": { emoji: "🍎", color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800" },
  "Цветы": { emoji: "🌸", color: "bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800" },
};

function getCategoryImage(crops: Crop[]): string | undefined {
  for (const c of crops) {
    const u = getCropDisplayImageUrl(c);
    if (u) return u;
  }
  return undefined;
}

export function GuideAccordion({ crops }: { crops: Crop[] }) {
  const categories = [...new Set(crops.map((c) => c.category))];
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const catCrops = crops.filter((c) => c.category === cat);
        const isOpen = openCategory === cat;
        const cfg = categoryIcons[cat] || { emoji: "🌾", color: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" };
        const previewImg = getCategoryImage(catCrops);

        return (
          <div key={cat}>
            <button
              onClick={() => setOpenCategory(isOpen ? null : cat)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${cfg.color} ${
                isOpen ? "shadow-md" : "hover:shadow-sm"
              }`}
            >
              {previewImg ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <CropImage
                    src={previewImg}
                    alt={cat}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <span className="text-3xl flex-shrink-0">{cfg.emoji}</span>
              )}
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold">{cat}</h2>
                <p className="text-xs text-slate-500">{catCrops.length} культур</p>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {isOpen && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3 pl-2">
                {catCrops.map((c) => {
                  const thumb = getCropDisplayImageUrl(c);
                  return (
                  <Link key={c.id} href={`/guide/${c.slug}`}>
                    <Card className="hover:scale-[1.02] transition-all cursor-pointer h-full overflow-hidden">
                      {thumb && (
                        <div className="relative w-full h-28">
                          <CropImage
                            src={thumb}
                            alt={c.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 672px) 50vw, 300px"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{c.name}</h3>
                          {c.varieties && c.varieties.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {c.varieties.length} сортов
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{c.note}</p>
                      </div>
                    </Card>
                  </Link>
                );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
