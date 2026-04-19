"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GardenBreadcrumbs } from "@/components/garden-breadcrumbs";
import { PlantWorksList } from "@/components/plant-works-list";
import { Button } from "@/components/ui/button";
import { SubscribeModal } from "@/components/subscribe-modal";
import { PlannedWorkModal, type PlannedWorkEvent } from "@/components/planned-work-modal";
import { useBeds, useUploadPlantPhoto, type Bed } from "@/lib/hooks/use-beds";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { useCrops } from "@/lib/hooks/use-crops";
import { getCropDisplayImageUrl } from "@/lib/crop-community";
import { proxifyGuideMediaUrl } from "@/lib/guide-image-url";
import { crops as staticCrops } from "@/lib/data/crops";
import type { CropWithSource } from "@/lib/crops-merge";

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function PlantPageClient({ bedId, plantId }: { bedId: string; plantId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const bedsQuery = useBeds({ enabled: status === "authenticated" });
  const beds = bedsQuery.data ?? [];
  const bed = beds.find((b: Bed) => b.id === bedId) ?? null;
  const plant = bed?.plants?.find((p) => p.id === plantId) ?? null;

  const { data: cropsList } = useCrops();
  const crops: CropWithSource[] =
    cropsList ?? staticCrops.map((c) => ({ ...c, addedByCommunity: false }));

  const [hasFullAccess, setHasFullAccess] = useState<boolean | null>(null);
  const [isLegacyFreeTier, setIsLegacyFreeTier] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [plannedWorkModal, setPlannedWorkModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    event: PlannedWorkEvent | null;
  }>({ open: false, mode: "add", event: null });

  const uploadPhoto = useUploadPlantPhoto();
  const photoCameraInputRef = useRef<HTMLInputElement>(null);
  const photoGalleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((d: { hasFullAccess?: boolean; isPremium?: boolean; isLegacyFreeTier?: boolean }) => {
        setHasFullAccess(Boolean(d.hasFullAccess ?? d.isPremium));
        setIsLegacyFreeTier(Boolean(d.isLegacyFreeTier));
      })
      .catch(() => {
        setHasFullAccess(false);
        setIsLegacyFreeTier(false);
      });
  }, []);

  const blockPremiumOnlyFeature =
    hasFullAccess === false && isLegacyFreeTier !== true;

  const crop = plant?.cropSlug ? crops.find((c) => c.slug === plant.cropSlug) : null;
  const heroUrl = crop ? getCropDisplayImageUrl(crop) : undefined;

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && plant && bed) {
      const takenAt = toDateInputValue(new Date().toISOString());
      uploadPhoto.mutate({
        file,
        plantId: plant.id,
        bedId: bed.id,
        takenAt: `${takenAt}T12:00:00.000Z`,
      });
    }
    e.target.value = "";
  };

  if (status === "loading" || bedsQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  if (!bed || !plant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-lg text-slate-600 dark:text-slate-400">Растение не найдено.</p>
        <Link href="/garden" className="text-lg text-emerald-600 font-medium mt-4 inline-block">
          ← На участок
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10">
      <GardenBreadcrumbs
        items={[
          { label: "Участок", href: "/garden" },
          { label: bed.name, href: `/garden/bed/${bed.id}` },
          { label: plant.name },
        ]}
      />

      {heroUrl ? (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 max-h-56 sm:max-h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proxifyGuideMediaUrl(heroUrl)} alt="" className="w-full h-48 sm:h-64 object-cover" />
        </div>
      ) : (
        <div className="mb-6 rounded-2xl h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-6xl" aria-hidden>
          🌱
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
          {plant.name}
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mt-2">
          Дата посадки:{" "}
          {new Date(plant.plantedDate).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        {plant.cropSlug ? (
          <Link
            href={`/guide/${plant.cropSlug}`}
            className="inline-block mt-3 text-lg font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Открыть культуру в справочнике →
          </Link>
        ) : null}
      </header>

      <section className="mb-8" aria-label="Добавить фото растения">
        <input
          type="file"
          ref={photoCameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoInputChange}
        />
        <input
          type="file"
          ref={photoGalleryInputRef}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoInputChange}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base rounded-xl"
            disabled={uploadPhoto.isPending}
            onClick={() => photoCameraInputRef.current?.click()}
          >
            {uploadPhoto.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5 mr-2" />
            )}
            Снять фото
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base rounded-xl"
            disabled={uploadPhoto.isPending}
            onClick={() => photoGalleryInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Из галереи
          </Button>
        </div>
      </section>

      {(plant.timelineEvents?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-12 text-base rounded-xl bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              if (blockPremiumOnlyFeature) {
                setShowPaywall(true);
                return;
              }
              setPlannedWorkModal({ open: true, mode: "add", event: null });
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить работу
          </Button>
        </div>
      )}

      {(plant.timelineEvents?.length ?? 0) === 0 && (
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-base rounded-xl"
            disabled={blockPremiumOnlyFeature}
            onClick={async () => {
              if (blockPremiumOnlyFeature) {
                setShowPaywall(true);
                return;
              }
              if (shouldQueueOfflineMutation()) {
                const dependsOn = plant.offlineMeta?.pendingOutboxId;
                const outId = await enqueueOutbox({
                  action: "AI_TIMELINE_GENERATE",
                  payload: { plantId: plant.id },
                  dependsOn,
                });
                if (outId) {
                  toast.message("Генерация таймлайна в очереди — выполним при появлении сети");
                }
                return;
              }
              const res = await fetch(`/api/plants/${plant.id}/timeline/generate`, { method: "POST" });
              if (!res.ok) return;
              void qc.invalidateQueries({ queryKey: ["beds"] });
            }}
          >
            Сгенерировать план работ
          </Button>
        </div>
      )}

      <section aria-labelledby="works-heading">
        <h2 id="works-heading" className="sr-only">
          Работы и фотографии
        </h2>
        <PlantWorksList
          plantId={plant.id}
          plantName={plant.name}
          events={plant.timelineEvents ?? []}
          photos={plant.photos ?? []}
        />
      </section>

      <PlannedWorkModal
        open={plannedWorkModal.open}
        onOpenChange={(open) => setPlannedWorkModal((s) => ({ ...s, open }))}
        mode={plannedWorkModal.mode}
        plantId={plant.id}
        bedId={bed.id}
        bedName={bed.name}
        plantName={plant.name}
        event={plannedWorkModal.event}
        onSuccess={() => {
          if (!shouldQueueOfflineMutation()) {
            void qc.invalidateQueries({ queryKey: ["beds"] });
          }
        }}
        onShowPaywall={() => setShowPaywall(true)}
      />

      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
}
