"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sprout, Loader2, MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GardenBreadcrumbs } from "@/components/garden-breadcrumbs";
import { AddPlantToBedForm } from "@/components/add-plant-to-bed-form";
import { SubscribeModal } from "@/components/subscribe-modal";
import { useBeds, type Bed } from "@/lib/hooks/use-beds";
import { useCrops } from "@/lib/hooks/use-crops";
import { crops as staticCrops } from "@/lib/data/crops";
import type { CropWithSource } from "@/lib/crops-merge";
import { bedTypeEmoji, bedTypeLabels } from "@/lib/garden-labels";

const FREE_PLANT_LIMIT = 3;

export function BedPageClient({ bedId }: { bedId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const bedsQuery = useBeds({ enabled: status === "authenticated" });
  const beds = bedsQuery.data ?? [];
  const bed = beds.find((b: Bed) => b.id === bedId) ?? null;
  const { data: cropsList } = useCrops();
  const crops: CropWithSource[] =
    cropsList ?? staticCrops.map((c) => ({ ...c, addedByCommunity: false }));
  const totalPlants = beds.reduce((n, b) => n + (b.plants?.length ?? 0), 0);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((d) => setIsPremium(!!d.isPremium))
      .catch(() => setIsPremium(false));
  }, []);

  useEffect(() => {
    if (!bed || typeof window === "undefined") return;
    if (window.location.hash !== "#add-plant") return;
    const t = window.setTimeout(() => {
      document.getElementById("add-plant")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [bed?.id, bed?.plants?.length]);

  if (status === "loading" || bedsQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  if (!bed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-lg text-slate-600 dark:text-slate-400">Грядка не найдена или удалена.</p>
        <Link href="/garden" className="text-lg text-emerald-600 font-medium mt-4 inline-block">
          ← На главную участка
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
      <GardenBreadcrumbs
        items={[
          { label: "Участок", href: "/garden" },
          { label: bed.name },
        ]}
      />

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl md:text-5xl" aria-hidden>
            {bedTypeEmoji[bed.type] || "🌱"}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
            {bed.name}
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 flex flex-wrap gap-4">
          <span className="flex items-center gap-2">
            <MapPin className="w-5 h-5 shrink-0" aria-hidden />
            {bedTypeLabels[bed.type] || bed.type}
          </span>
          <span className="flex items-center gap-2">
            <Sprout className="w-5 h-5 shrink-0" aria-hidden />
            Растений: {bed.plants.length}
          </span>
        </p>
      </header>

      <section aria-labelledby="plants-list-heading">
        <h2
          id="plants-list-heading"
          className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4"
        >
          Растения на этой грядке
        </h2>
        <ul className="space-y-4">
          {bed.plants.length === 0 ? (
            <Card className="p-8 text-center text-lg text-slate-500 rounded-2xl">
              На этой грядке пока нет растений. Добавьте первое растение в форме ниже на этой странице.
            </Card>
          ) : (
            bed.plants.map((plant) => (
              <li key={plant.id}>
                <Link
                  href={`/garden/bed/${bed.id}/plant/${plant.id}`}
                  className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 min-h-[4.5rem] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {plant.name}
                      </p>
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">
                        Посадка:{" "}
                        {new Date(plant.plantedDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-slate-400 text-2xl" aria-hidden>
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section
        id="add-plant"
        aria-labelledby="add-plant-heading"
        className="mt-10 scroll-mt-6"
      >
        <h2
          id="add-plant-heading"
          className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 shrink-0" aria-hidden />
          Добавить растение на эту грядку
        </h2>
        <Card className="p-5 sm:p-6 rounded-2xl border-emerald-200/80 dark:border-emerald-800/80">
          <AddPlantToBedForm
            bedId={bed.id}
            crops={crops}
            isPremium={isPremium}
            totalPlants={totalPlants}
            freePlantLimit={FREE_PLANT_LIMIT}
            onShowPaywall={() => setShowPaywall(true)}
          />
        </Card>
      </section>
    </div>
  );
}
