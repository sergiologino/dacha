import { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { crops as staticCrops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";
import { getMergedCrops, type CropWithSource } from "@/lib/crops-merge";
import { GuideSearch } from "./guide-search";
import { GuideAccordion } from "./guide-accordion";

/** Список культур подгружается из БД при каждом запросе (в т.ч. добавленные дачниками). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Справочник растений — Любимая Дача",
  description:
    "Справочник садовых и огородных культур России: томаты, огурцы, картофель, ягоды и другие. Как сажать, ухаживать, поливать — советы от нейроэксперта.",
  keywords:
    "справочник растений, огород, дача, как сажать помидоры, полив огурцов, выращивание картофеля",
};

export default async function GuidePage() {
  let crops: CropWithSource[] = staticCrops.map((c) => ({ ...c, addedByCommunity: false }));
  try {
    crops = await getMergedCrops(() =>
      prisma.crop.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          plantMonths: true,
          harvestMonths: true,
          waterSchedule: true,
          regions: true,
          careNotes: true,
          imageUrl: true,
          varieties: true,
        },
      })
    );
  } catch (err) {
    // P2022 или другая ошибка БД (например, колонка varieties ещё не создана миграцией) — показываем только статический справочник
    console.error("[Guide] getMergedCrops failed, using static crops only:", err);
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          Справочник растений для дачи
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {crops.length} культур с рекомендациями по выращиванию в российских
          регионах
        </p>

        <GuideSearch crops={crops} />

        <GuideAccordion crops={crops} />

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/facts"
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            Интересные факты для дачников
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Короткие факты о растениях, сезонных работах и природе
          </p>
        </div>
      </div>
    </div>
  );
}
