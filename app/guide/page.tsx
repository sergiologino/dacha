import { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { crops as staticCrops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";
import { getMergedCrops, type CropWithSource } from "@/lib/crops-merge";
import { absoluteUrl } from "@/lib/seo";
import { GuideSearch } from "./guide-search";
import { GuideAccordion } from "./guide-accordion";

/** Список культур подгружается из БД при каждом запросе (в т.ч. добавленные дачниками). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Справочник растений и сроки посадки — Любимая Дача",
  description:
    "Справочник культур для дачи: томаты, перец, огурцы, баклажаны, лук, цветы и ягоды. Когда сажать, как выращивать, когда высаживать в грунт и как ухаживать.",
  keywords:
    "когда сажать помидоры, когда сажать перец, когда сажать огурцы, когда сажать баклажаны, справочник растений для дачи",
  alternates: {
    canonical: absoluteUrl("/guide"),
  },
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Справочник растений и сроки посадки",
          description:
            "Справочник культур для дачи с ответами на запросы когда сажать, как выращивать и когда высаживать в открытый грунт.",
          url: absoluteUrl("/guide"),
        }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          Справочник растений для дачи
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {crops.length} культур с рекомендациями по выращиванию в российских
          регионах
        </p>

        <div className="mb-8 grid gap-3 md:grid-cols-2">
          <Link
            href="/kogda-sazhat-rassadu"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
          >
            <span className="block font-semibold">Когда сажать рассаду</span>
            <span className="mt-1 block text-emerald-800/80 dark:text-emerald-200/80">
              Помидоры, перец, баклажаны, огурцы, лук и цветы по месяцам и регионам.
            </span>
          </Link>
          <Link
            href="/kalendar-posadok-2026"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <span className="block font-semibold">Календарь посадок 2026</span>
            <span className="mt-1 block text-amber-900/80 dark:text-amber-200/80">
              Что сажать в феврале, марте, апреле и когда высаживать в теплицу и грунт.
            </span>
          </Link>
        </div>

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
