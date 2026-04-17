"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Sprout,
  LayoutGrid,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Search,
  HelpCircle,
  Pencil,
  Check,
} from "lucide-react";
import { FeatureOnboarding, getFeatureOnboardingSeen } from "@/components/feature-onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MotionDiv } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { useOnboardingCheck } from "@/lib/hooks/use-onboarding-check";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { useQueryClient } from "@tanstack/react-query";
import { usePlants, useCreatePlant, useUpdatePlant, useDeletePlant, type Plant } from "@/lib/hooks/use-plants";
import {
  useBeds,
  useCreateBed,
  useUpdateBed,
  useDeleteBed,
  useUploadPlantPhoto,
  useDeletePlantPhoto,
  type Bed,
} from "@/lib/hooks/use-beds";
import { PlantTimelineLabels, PlantTimelineBar, type PhotoCheck } from "@/components/plant-timeline";
import { GardenHelpContent } from "@/components/garden-help-content";
import { useCrops } from "@/lib/hooks/use-crops";
import { crops as staticCrops } from "@/lib/data/crops";
import { searchCropsAndVarieties, type CropSearchHit } from "@/lib/crops-search";
import type { CropWithSource } from "@/lib/crops-merge";
import { SubscribeModal } from "@/components/subscribe-modal";
import { PlannedWorkModal, type PlannedWorkEvent } from "@/components/planned-work-modal";
import { NotificationPromptModal, getNotificationPromptSeen } from "@/components/notification-prompt-modal";
import {
  GardenPlantGalleryDialog,
  type GardenGalleryState,
} from "@/components/garden-plant-gallery-dialog";
import { GardenPlantPhotoImg } from "@/components/garden-plant-photo";
import { bedTypeEmoji, bedTypeLabels } from "@/lib/garden-labels";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { GardenMobilePlantGrid } from "@/components/garden-mobile-plant-grid";
import { bedPlantsSummary } from "@/lib/garden-display-helpers";
import { AddPlantToBedForm } from "@/components/add-plant-to-bed-form";
import {
  LEGACY_FREE_BED_LIMIT,
  LEGACY_FREE_PLANT_LIMIT,
} from "@/lib/user-access";

export default function GardenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  useOnboardingCheck();
  const { data: location } = useUserLocation();

  // Проверка оплаты при возврате с ЮKassa: по URL (window), searchParams может быть пуст при гидрации
  useEffect(() => {
    const hasSuccess =
      typeof window !== "undefined" &&
      (window.location.search.includes("payment=success") || searchParams?.get?.("payment") === "success");
    if (!hasSuccess) return;
    let mounted = true;
    toast.info("Проверяем оплату...");
    const run = (attempt: number) => {
      fetch("/api/payments/sync")
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          if (data.activated) {
            toast.success("Премиум активирован!");
            window.history.replaceState(null, "", "/garden");
            router.refresh();
            return;
          }
          if (attempt < 3) {
            setTimeout(() => run(attempt + 1), 2000);
          } else {
            window.history.replaceState(null, "", "/garden");
          }
        })
        .catch(() => {
          if (mounted && attempt < 3) setTimeout(() => run(attempt + 1), 2000);
        });
    };
    run(1);
    return () => { mounted = false; };
  }, [searchParams]);

  const [newBedName, setNewBedName] = useState("");
  const [newBedNumber, setNewBedNumber] = useState("");
  const [newBedType, setNewBedType] = useState("open");
  const [showBedForm, setShowBedForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState<boolean | null>(null);
  const [isLegacyFreeTier, setIsLegacyFreeTier] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAddPlantDialog, setShowAddPlantDialog] = useState(false);
  const [plannedWorkModal, setPlannedWorkModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    event: PlannedWorkEvent | null;
    plant: { id: string; name: string };
    bed: { id: string; name: string };
  } | null>(null);
  const [showFeatureOnboarding, setShowFeatureOnboarding] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const hasSeededRef = useRef(false);
  const hasSuggestedOnboardingRef = useRef(false);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const isMobile = useIsMobile();
  const [desktopGardenView, setDesktopGardenView] = useState<"graph" | "list">("graph");

  useEffect(() => {
    try {
      const v = localStorage.getItem("garden-desktop-view");
      if (v === "list" || v === "graph") setDesktopGardenView(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("garden-desktop-view", desktopGardenView);
    } catch {
      /* ignore */
    }
  }, [desktopGardenView]);

  const plantsQuery = usePlants({ enabled: status === "authenticated" });
  const plants = plantsQuery.data ?? [];
  const plantsLoading = plantsQuery.isLoading;
  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();

  const qc = useQueryClient();
  const bedsQuery = useBeds({ enabled: status === "authenticated" });
  const beds = bedsQuery.data ?? [];
  const bedsLoading = bedsQuery.isLoading;
  const bedsError = bedsQuery.isError;
  const { data: cropsList } = useCrops();
  const createBed = useCreateBed();
  const updateBed = useUpdateBed();
  const deleteBed = useDeleteBed();
  const uploadPhoto = useUploadPlantPhoto();

  const crops: CropWithSource[] =
    cropsList ??
    staticCrops.map((c) => ({ ...c, addedByCommunity: false }));

  const unassignedPlants = plants.filter((p) => !p.bedId);

  const totalBeds = beds.length;
  const bedInteractionMode = isMobile || desktopGardenView === "list" ? "navigate" : "graph";

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((data: { hasFullAccess?: boolean; isPremium?: boolean; isLegacyFreeTier?: boolean }) => {
        setHasFullAccess(Boolean(data.hasFullAccess ?? data.isPremium));
        setIsLegacyFreeTier(Boolean(data.isLegacyFreeTier));
      })
      .catch(() => {
        setHasFullAccess(false);
        setIsLegacyFreeTier(false);
      });
  }, []);

  const blockNewBed =
    hasFullAccess === false &&
    !(isLegacyFreeTier === true && totalBeds < LEGACY_FREE_BED_LIMIT);
  const blockNewPlant =
    hasFullAccess === false &&
    !(isLegacyFreeTier === true && plants.length < LEGACY_FREE_PLANT_LIMIT);
  /** Только премиум/триал: не legacy-бесплатный тариф. */
  const blockPremiumOnlyFeature =
    hasFullAccess === false && isLegacyFreeTier !== true;

  const showOnboardingParam = searchParams?.get?.("showOnboarding") === "1";

  useEffect(() => {
    if (showOnboardingParam) setShowFeatureOnboarding(true);
  }, [showOnboardingParam]);

  useEffect(() => {
    const t = setTimeout(() => setLoadingFallback(true), 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || bedsLoading || bedsError) return;
    if (beds.length === 0 && !hasSeededRef.current) {
      hasSeededRef.current = true;
      fetch("/api/user/seed-demo-garden", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.seeded) {
            void qc.invalidateQueries({ queryKey: ["beds"] });
          }
        })
        .catch(() => {
          hasSeededRef.current = false;
        });
      return;
    }
    if (showOnboardingParam) {
      setShowFeatureOnboarding(true);
      return;
    }
    if (!getFeatureOnboardingSeen() && !hasSuggestedOnboardingRef.current) {
      hasSuggestedOnboardingRef.current = true;
      setShowFeatureOnboarding(true);
    }
  }, [bedsLoading, bedsError, beds.length, showOnboardingParam, qc, status]);

  const addBed = () => {
    if (!newBedName) return;
    if (blockNewBed) {
      setShowPaywall(true);
      return;
    }
    createBed.mutate(
      { name: newBedName, number: newBedNumber, type: newBedType },
      {
        onSuccess: () => {
          setNewBedName("");
          setNewBedNumber("");
          setNewBedType("open");
          setShowBedForm(false);
        },
      }
    );
  };

  const showSpinner =
    (status === "loading" || plantsLoading || bedsLoading) &&
    !showOnboardingParam &&
    !loadingFallback;

  if (showSpinner) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <MotionDiv variant="fadeUp">
        <h1 className="text-2xl font-semibold mb-1">
          Привет, {session?.user?.name?.split(" ")[0]}!
        </h1>
        {location?.locationName && (
          <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {location.locationName}
          </p>
        )}
      </MotionDiv>

      <div className="mb-6">
        <WeatherWidget
          lat={location?.latitude ?? null}
          lon={location?.longitude ?? null}
          locationName={location?.locationName || ""}
          bedTypes={beds.map((bed) => bed.type)}
          plants={beds.flatMap((bed) =>
            (bed.plants ?? []).map((plant) => ({
              name: plant.name,
              cropSlug: plant.cropSlug,
              bedType: bed.type,
            }))
          )}
          compact
        />
      </div>

      {/* Заголовок и кнопки — без MotionDiv (whileInView может не сработать), чтобы кнопка «Помощь» всегда была видна */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-emerald-600" />
          Мой участок
        </h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHelp(true)}
              className="rounded-2xl border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:border-amber-400 dark:hover:border-amber-500"
              aria-label="Как пользоваться страницей"
            >
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Помощь
            </Button>
            {isMobile && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (blockNewPlant) {
                    setShowPaywall(true);
                    return;
                  }
                  setShowAddPlantDialog(true);
                }}
                className="rounded-2xl border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-4 h-4 mr-1" /> Культура
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (blockNewBed) {
                  setShowPaywall(true);
                  return;
                }
                setShowBedForm(!showBedForm);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-1" /> Новая грядка
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-wrap items-center gap-3 mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Вид участка:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={desktopGardenView === "graph" ? "default" : "outline"}
            className="h-11 px-4 rounded-xl text-base"
            onClick={() => setDesktopGardenView("graph")}
          >
            График на грядке
          </Button>
          <Button
            type="button"
            variant={desktopGardenView === "list" ? "default" : "outline"}
            className="h-11 px-4 rounded-xl text-base"
            onClick={() => setDesktopGardenView("list")}
          >
            Список работ (как на телефоне)
          </Button>
        </div>
      </div>

      {/* Модалка помощи — контент на фронте, без задержек */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          showCloseButton={true}
        >
          <div>
            <DialogTitle className="text-xl text-slate-900 dark:text-slate-100">
              Как пользоваться страницей «Мой участок»
            </DialogTitle>
            <span className="sr-only">
              Подробное описание: грядки, культуры, шкала роста, фото
            </span>
          </div>
          <div className="overflow-y-auto pr-2 -mr-2 min-h-0">
            <GardenHelpContent />
          </div>
        </DialogContent>
      </Dialog>

      {/* New bed form */}
      {showBedForm && (
        <MotionDiv variant="fadeUp">
          <Card className="p-5 mb-6 border-emerald-200 dark:border-emerald-800">
            <h3 className="font-semibold mb-3">Новая грядка</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Введите 3+ буквы (название или сорт)"
                value={newBedName}
                onChange={(e) => setNewBedName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Номер"
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="w-1/3 px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                />
                <select
                  value={newBedType}
                  onChange={(e) => setNewBedType(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                >
                  <option value="open">🌿 Открытый грунт</option>
                  <option value="greenhouse">🏠 Теплица</option>
                  <option value="raised">📦 Высокая грядка</option>
                  <option value="seedling_home">🪴 Рассада дома</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addBed}
                  disabled={createBed.isPending || !newBedName}
                  className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {createBed.isPending ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 w-4 h-4" />
                  )}
                  Создать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBedForm(false)}
                  className="h-11 rounded-2xl"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        </MotionDiv>
      )}

      {/* Мобильный вид — кубики культур; грядки отдельным списком ссылок */}
      {isMobile && (beds.length > 0 || unassignedPlants.length > 0) && (
        <>
          <GardenMobilePlantGrid beds={beds} unassignedPlants={unassignedPlants} />
          {beds.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-900/40">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Грядки</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {beds.map((b) => (
                  <Link
                    key={b.id}
                    href={`/garden/bed/${b.id}`}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Beds list — десктоп и планшет: раскрывающиеся карточки грядок */}
      <div className="space-y-4 max-w-full min-w-0">
        {beds.length === 0 && unassignedPlants.length === 0 ? (
          <Card className="p-12 text-center">
            <LayoutGrid className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
            <p className="text-slate-500 mb-2">Участок пока пустой</p>
            <p className="text-sm text-slate-400">
              Создайте грядку и добавьте в неё растения
            </p>
          </Card>
        ) : (
          <>
            {!isMobile &&
              beds.map((bed: Bed) => (
              <div key={bed.id}>
                <BedCard
                  bed={bed}
                  crops={crops}
                  hasFullAccess={hasFullAccess}
                  isLegacyFreeTier={isLegacyFreeTier}
                  totalPlantCount={plants.length}
                  onShowPaywall={() => setShowPaywall(true)}
                  onUpdateBed={(id, data) => updateBed.mutate({ id, ...data })}
                  updatingBed={updateBed.isPending}
                  onDelete={() => deleteBed.mutate(bed.id)}
                  onAddPlant={(name, plantedDate, cropSlug) =>
                    createPlant.mutate({ name, bedId: bed.id, plantedDate, cropSlug })
                  }
                  onUpdatePlant={(id, plantedDate) =>
                    updatePlant.mutate({ id, plantedDate })
                  }
                  onDeletePlant={(id) => deletePlant.mutate(id)}
                  onUploadPhoto={(file, plantId, bedId, takenAt) =>
                    uploadPhoto.mutate({ file, plantId, bedId, takenAt })
                  }
                  onRegenerateTimeline={async (plantId) => {
                    const res = await fetch(`/api/plants/${plantId}/timeline/generate`, { method: "POST" });
                    if (!res.ok) throw new Error("Generate failed");
                    qc.invalidateQueries({ queryKey: ["beds"] });
                  }}
                  onEditPlannedWork={(event, plant, bed) =>
                    setPlannedWorkModal({
                      open: true,
                      mode: "edit",
                      event: {
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        scheduledDate: event.scheduledDate,
                        dateTo: event.dateTo,
                        isAction: event.isAction,
                        type: event.type ?? "other",
                      },
                      plant: { id: plant.id, name: plant.name },
                      bed: { id: bed.id, name: bed.name },
                    })
                  }
                  onAddPlannedWork={(plant, bed) => {
                    if (blockPremiumOnlyFeature) {
                      setShowPaywall(true);
                      return;
                    }
                    setPlannedWorkModal({
                      open: true,
                      mode: "add",
                      event: null,
                      plant: { id: plant.id, name: plant.name },
                      bed: { id: bed.id, name: bed.name },
                    });
                  }}
                  addingPlant={createPlant.isPending}
                  updatingPlant={updatePlant.isPending}
                  uploadingPhotoPlantId={
                    uploadPhoto.isPending ? uploadPhoto.variables?.plantId ?? null : null
                  }
                  interactionMode={bedInteractionMode}
                />
              </div>
            ))}

            {/* Unassigned plants */}
            {!isMobile && unassignedPlants.length > 0 && (
                <Card className="p-5 border-dashed border-2 border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-500 mb-3 flex items-center gap-2">
                    <Sprout className="w-4 h-4" /> Растения без грядки
                  </h3>
                  <div className="space-y-2">
                    {unassignedPlants.map((plant) => (
                      <div
                        key={plant.id}
                        className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <span className="text-sm font-medium">{plant.name}</span>
                          <span className="text-xs text-slate-400 ml-2">
                            {new Date(plant.plantedDate).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          onClick={() => deletePlant.mutate(plant.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
            )}
          </>
        )}
      </div>
      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
      <FeatureOnboarding
        open={showFeatureOnboarding}
        onClose={() => {
          setShowFeatureOnboarding(false);
          setTimeout(() => {
            if (
              typeof Notification !== "undefined" &&
              Notification.permission !== "granted" &&
              !getNotificationPromptSeen() &&
              hasFullAccess === true
            ) {
              setShowNotificationPrompt(true);
            }
          }, 400);
        }}
      />
      <Dialog open={showAddPlantDialog} onOpenChange={setShowAddPlantDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
          <DialogTitle className="text-lg">Добавить культуру</DialogTitle>
          <p className="text-sm text-slate-500 mb-2">
            Сначала выберите культуру и сорт, затем грядку и дату посадки.
          </p>
          <AddPlantToBedForm
            bedsForSelection={beds.map((b) => ({ id: b.id, name: b.name }))}
            crops={crops}
            hasFullAccess={hasFullAccess}
            blockAddPlant={blockNewPlant}
            onShowPaywall={() => {
              setShowAddPlantDialog(false);
              setShowPaywall(true);
            }}
            onPlantAdded={() => {
              setShowAddPlantDialog(false);
              void qc.invalidateQueries({ queryKey: ["beds"] });
              void qc.invalidateQueries({ queryKey: ["plants"] });
            }}
          />
        </DialogContent>
      </Dialog>
      <NotificationPromptModal
        open={showNotificationPrompt}
        onClose={() => setShowNotificationPrompt(false)}
        isPremium={hasFullAccess === true}
        onNeedPremium={() => setShowPaywall(true)}
      />
      {plannedWorkModal && (
        <PlannedWorkModal
          open={plannedWorkModal.open}
          onOpenChange={(open) => setPlannedWorkModal((prev) => (prev ? { ...prev, open } : null))}
          mode={plannedWorkModal.mode}
          plantId={plannedWorkModal.plant.id}
          bedId={plannedWorkModal.bed.id}
          bedName={plannedWorkModal.bed.name}
          plantName={plannedWorkModal.plant.name}
          event={plannedWorkModal.event}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["beds"] });
            setPlannedWorkModal(null);
          }}
          onShowPaywall={() => setShowPaywall(true)}
        />
      )}
    </>
  );
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

const categoriesFromCrops = (cropsList: { category: string }[]) =>
  [...new Set(cropsList.map((c) => c.category))].sort();

function BedCard({
  bed,
  crops: cropsList,
  hasFullAccess,
  isLegacyFreeTier,
  totalPlantCount,
  onShowPaywall,
  onUpdateBed,
  updatingBed,
  onDelete,
  onAddPlant,
  onUpdatePlant,
  onDeletePlant,
  onUploadPhoto,
  onRegenerateTimeline,
  onEditPlannedWork,
  onAddPlannedWork,
  addingPlant,
  updatingPlant,
  uploadingPhotoPlantId,
  interactionMode,
}: {
  bed: Bed;
  crops: { id: number; name: string; slug: string; category: string; varieties?: { name: string }[] }[];
  hasFullAccess: boolean | null;
  isLegacyFreeTier: boolean | null;
  totalPlantCount: number;
  onShowPaywall?: () => void;
  onUpdateBed: (id: string, data: { name?: string; number?: string; type?: string }) => void;
  updatingBed: boolean;
  onDelete: () => void;
  onAddPlant: (name: string, plantedDate?: string, cropSlug?: string) => void;
  onUpdatePlant: (id: string, plantedDate: string) => void;
  onDeletePlant: (id: string) => void;
  onUploadPhoto: (file: File, plantId: string, bedId: string, takenAt?: string) => void;
  onRegenerateTimeline?: (plantId: string) => void | Promise<void>;
  onEditPlannedWork?: (
    event: { id: string; title: string; description: string | null; scheduledDate: string; dateTo: string | null; isAction: boolean; type?: string },
    plant: { id: string; name: string },
    bed: { id: string; name: string }
  ) => void;
  onAddPlannedWork?: (plant: { id: string; name: string }, bed: { id: string; name: string }) => void;
  addingPlant: boolean;
  updatingPlant: boolean;
  uploadingPhotoPlantId: string | null;
  interactionMode: "graph" | "navigate";
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = interactionMode === "graph" && internalExpanded;
  const [editingBedName, setEditingBedName] = useState(false);
  const [editingBedNameValue, setEditingBedNameValue] = useState(bed.name);
  useEffect(() => {
    if (!editingBedName) setEditingBedNameValue(bed.name);
  }, [bed.name, editingBedName]);
  const [showPlantInput, setShowPlantInput] = useState(false);
  const [addMode, setAddMode] = useState<"search" | "category">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHit, setSelectedHit] = useState<CropSearchHit | null>(null);
  const [category, setCategory] = useState("");
  const [selectedCropId, setSelectedCropId] = useState<number | "">("");
  const [selectedVarietyName, setSelectedVarietyName] = useState("");
  const [newPlantDate, setNewPlantDate] = useState(() => toDateInputValue(new Date().toISOString()));
  const [editingDatePlantId, setEditingDatePlantId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState("");
  const photoCameraInputRef = useRef<HTMLInputElement>(null);
  const photoGalleryInputRef = useRef<HTMLInputElement>(null);
  const photoTargetRef = useRef<{ plantId: string; bedId: string } | null>(null);
  const [gallery, setGallery] = useState<GardenGalleryState>(null);
  const [regeneratingPlantId, setRegeneratingPlantId] = useState<string | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const deletePlantPhoto = useDeletePlantPhoto();

  const blockNewPlantLocal =
    hasFullAccess === false &&
    !(isLegacyFreeTier === true && totalPlantCount < LEGACY_FREE_PLANT_LIMIT);
  const blockPremiumOnlyUIFeature =
    hasFullAccess === false && isLegacyFreeTier !== true;

  const searchHits = searchQuery.trim().length >= 3 ? searchCropsAndVarieties(cropsList as Parameters<typeof searchCropsAndVarieties>[0], searchQuery.trim()) : [];
  const categories = categoriesFromCrops(cropsList);
  const categoryCrops = category ? cropsList.filter((c) => c.category === category) : [];
  const selectedCrop = selectedCropId ? cropsList.find((c) => c.id === selectedCropId) : null;
  const varieties = selectedCrop?.varieties ?? [];
  const displayFromCategory =
    selectedCrop && selectedVarietyName
      ? `${selectedCrop.name}, ${selectedVarietyName}`
      : selectedCrop
        ? selectedCrop.name
        : "";

  const canAdd =
    (addMode === "search" && selectedHit) ||
    (addMode === "category" && selectedCrop && displayFromCategory);

  const handleAddPlant = () => {
    const hit =
      addMode === "search"
        ? selectedHit
        : selectedCrop && displayFromCategory
          ? ({ crop: selectedCrop, displayName: displayFromCategory, variety: selectedVarietyName ? { name: selectedVarietyName, desc: "" } : undefined } as CropSearchHit)
          : null;
    if (!hit?.displayName?.trim()) return;
    const plantedDate = newPlantDate ? `${newPlantDate}T12:00:00.000Z` : undefined;
    onAddPlant(hit.displayName.trim(), plantedDate, hit.crop.slug);
    setSearchQuery("");
    setSelectedHit(null);
    setCategory("");
    setSelectedCropId("");
    setSelectedVarietyName("");
    setNewPlantDate(toDateInputValue(new Date().toISOString()));
    setShowPlantInput(false);
  };

  const startEditDate = (plant: Bed["plants"][0]) => {
    setEditingDatePlantId(plant.id);
    setEditingDateValue(toDateInputValue(plant.plantedDate));
  };

  const saveEditDate = () => {
    if (editingDatePlantId && editingDateValue) {
      onUpdatePlant(editingDatePlantId, `${editingDateValue}T12:00:00.000Z`);
    }
    setEditingDatePlantId(null);
    setEditingDateValue("");
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pending = photoTargetRef.current;
    if (file && pending) {
      const takenAt = toDateInputValue(new Date().toISOString());
      onUploadPhoto(file, pending.plantId, pending.bedId, `${takenAt}T12:00:00.000Z`);
      photoTargetRef.current = null;
    }
    e.target.value = "";
  };

  const openGallery = (plant: Bed["plants"][0], index: number) => {
    if (!plant.photos?.length) return;
    setGallery({
      plantName: plant.name,
      photos: plant.photos,
      index: Math.min(index, plant.photos.length - 1),
    });
  };

  const handleDeletePlantPhoto = (photoId: string) => {
    deletePlantPhoto.mutate(photoId, {
      onSuccess: () => {
        setGallery((g) => {
          if (!g) return null;
          const photos = g.photos.filter((p) => p.id !== photoId);
          if (photos.length === 0) return null;
          return { ...g, photos, index: Math.min(g.index, photos.length - 1) };
        });
      },
    });
  };

  const deletingPhotoId = deletePlantPhoto.isPending ? deletePlantPhoto.variables ?? null : null;

  return (
    <>
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {interactionMode === "navigate" && editingBedName ? (
        <div className="w-full p-5 flex items-center justify-between text-left gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl shrink-0">{bedTypeEmoji[bed.type] || "🌱"}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  value={editingBedNameValue}
                  onChange={(e) => setEditingBedNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = editingBedNameValue.trim();
                      if (v) onUpdateBed(bed.id, { name: v });
                      setEditingBedName(false);
                    }
                    if (e.key === "Escape") {
                      setEditingBedNameValue(bed.name);
                      setEditingBedName(false);
                    }
                  }}
                  onBlur={() => {
                    const v = editingBedNameValue.trim();
                    if (v && v !== bed.name) onUpdateBed(bed.id, { name: v });
                    setEditingBedNameValue(bed.name);
                    setEditingBedName(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 font-semibold text-base min-w-[120px] max-w-full"
                  aria-label="Название грядки"
                />
                {updatingBed ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                ) : (
                  <Check
                    className="w-4 h-4 text-emerald-600 cursor-pointer shrink-0"
                    onClick={() => {
                      const v = editingBedNameValue.trim();
                      if (v) onUpdateBed(bed.id, { name: v });
                      setEditingBedName(false);
                    }}
                    aria-label="Сохранить"
                  />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {bedTypeLabels[bed.type] || bed.type}
                </span>
                <span className="flex items-start gap-1.5 min-w-0">
                  <Sprout className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug line-clamp-3 break-words text-slate-600 dark:text-slate-400">
                    {bedPlantsSummary(bed.plants)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : interactionMode === "navigate" ? (
        <Link
          href={`/garden/bed/${bed.id}`}
          className="w-full p-5 flex items-center justify-between text-left gap-3 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/25 transition-colors min-h-[4.5rem]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl shrink-0">{bedTypeEmoji[bed.type] || "🌱"}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{bed.name}</h3>
                {bed.number && (
                  <Badge variant="secondary" className="text-xs">
                    #{bed.number}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {bedTypeLabels[bed.type] || bed.type}
                </span>
                <span className="flex items-start gap-1.5 min-w-0">
                  <Sprout className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug line-clamp-3 break-words text-slate-600 dark:text-slate-400">
                    {bedPlantsSummary(bed.plants)}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setEditingBedNameValue(bed.name);
                setEditingBedName(true);
              }}
              className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
              aria-label="Изменить название грядки"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              aria-label="Удалить грядку"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <ChevronRight className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden />
          </div>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setInternalExpanded(!internalExpanded)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{bedTypeEmoji[bed.type] || "🌱"}</span>
            <div
              className="min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {editingBedName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingBedNameValue}
                      onChange={(e) => setEditingBedNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = editingBedNameValue.trim();
                          if (v) onUpdateBed(bed.id, { name: v });
                          setEditingBedName(false);
                        }
                        if (e.key === "Escape") {
                          setEditingBedNameValue(bed.name);
                          setEditingBedName(false);
                        }
                      }}
                      onBlur={() => {
                        const v = editingBedNameValue.trim();
                        if (v && v !== bed.name) onUpdateBed(bed.id, { name: v });
                        setEditingBedNameValue(bed.name);
                        setEditingBedName(false);
                      }}
                      autoFocus
                      className="px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 font-semibold text-base min-w-[120px] max-w-full"
                      aria-label="Название грядки"
                    />
                    {updatingBed ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Check
                        className="w-4 h-4 text-emerald-600 cursor-pointer"
                        onClick={() => {
                          const v = editingBedNameValue.trim();
                          if (v) onUpdateBed(bed.id, { name: v });
                          setEditingBedName(false);
                        }}
                        aria-label="Сохранить"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold">{bed.name}</h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingBedNameValue(bed.name);
                        setEditingBedName(true);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      aria-label="Изменить название грядки"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {bed.number && (
                  <Badge variant="secondary" className="text-xs">
                    #{bed.number}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {bedTypeLabels[bed.type] || bed.type}
                </span>
                <span className="flex items-start gap-1.5 min-w-0">
                  <Sprout className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug line-clamp-3 break-words text-slate-600 dark:text-slate-400">
                    {bedPlantsSummary(bed.plants)}
                  </span>
                </span>
              </div>
            </div>
          </div>
          {internalExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Plants list */}
          {bed.plants.length > 0 ? (
            <div className="space-y-2 mb-4">
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
            {bed.plants.map((plant) => (
                <div
                  key={plant.id}
                  className="py-2 px-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 gap-2"
                >
                  <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 flex-wrap min-w-0">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {plant.cropSlug ? (
                      <Link
                        href={`/guide/${plant.cropSlug}`}
                        className="text-sm font-medium truncate text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {plant.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium truncate">{plant.name}</span>
                    )}
                    {editingDatePlantId === plant.id ? (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="date"
                          value={editingDateValue}
                          onChange={(e) => setEditingDateValue(e.target.value)}
                          onBlur={saveEditDate}
                          onKeyDown={(e) => e.key === "Enter" && saveEditDate()}
                          autoFocus
                          className="text-xs px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-emerald-600"
                          onClick={saveEditDate}
                          disabled={updatingPlant}
                        >
                          {updatingPlant ? <Loader2 className="w-3 h-3 animate-spin" /> : "✓"}
                        </Button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditDate(plant)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                        title="Изменить дату посадки"
                      >
                        {new Date(plant.plantedDate).toLocaleDateString("ru-RU")}
                      </button>
                    )}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-emerald-600"
                        onClick={() => {
                          photoTargetRef.current = { plantId: plant.id, bedId: bed.id };
                          photoCameraInputRef.current?.click();
                        }}
                        disabled={!!uploadingPhotoPlantId}
                        title="Снять камерой"
                      >
                        {uploadingPhotoPlantId === plant.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-emerald-600"
                        onClick={() => {
                          photoTargetRef.current = { plantId: plant.id, bedId: bed.id };
                          photoGalleryInputRef.current?.click();
                        }}
                        disabled={!!uploadingPhotoPlantId}
                        title="Добавить из галереи"
                      >
                        {uploadingPhotoPlantId === plant.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-600 flex-shrink-0"
                    onClick={() => onDeletePlant(plant.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  </div>
                  {/* Полоса миниатюр над таймлайном по дате съёмки */}
                  {((plant.photos?.length ?? 0) > 0 || (plant.timelineEvents?.length ?? 0) > 0) && (() => {
                    const photoChecks: PhotoCheck[] = (plant.photos ?? [])
                      .filter((p) => p.analysisStatus && p.analysisResult)
                      .map((p) => ({
                        id: p.id,
                        date: p.takenAt,
                        status: p.analysisStatus as "ok" | "problem",
                        verdict: p.analysisResult!,
                      }));
                    const startMs = new Date(plant.plantedDate).setHours(0, 0, 0, 0);
                    const endFromEvents = (plant.timelineEvents ?? []).length > 0
                      ? Math.max(...(plant.timelineEvents ?? []).map((e) => (e.dateTo ? new Date(e.dateTo) : new Date(e.scheduledDate)).getTime()))
                      : 0;
                    const endFromPhotos = (plant.photos ?? []).length > 0
                      ? Math.max(...(plant.photos ?? []).map((p) => new Date(p.takenAt).getTime()))
                      : 0;
                    const endMs = Math.max(endFromEvents, endFromPhotos, startMs + 30 * 24 * 60 * 60 * 1000);
                    const totalMs = Math.max(endMs - startMs, 1);
                    const scaleLeftPct = (offset: number) => `${2 + 96 * Math.min(1, Math.max(0, offset))}%`;
                    return (
                      <div className="mt-2 pl-8 space-y-1">
                        {(plant.photos?.length ?? 0) > 0 && (
                          <div className="relative w-full h-11">
                            {(plant.photos ?? []).map((ph, idx) => {
                              const offset = (new Date(ph.takenAt).getTime() - startMs) / totalMs;
                              const n = (plant.photos ?? []).length;
                              /** takenAt desc: idx 0 — самое новое; выше z-index, чтобы перекрывало старые */
                              const stackZ = 10 + (n - idx);
                              return (
                                <div
                                  key={ph.id}
                                  className="absolute top-0 w-9 h-9 -translate-x-1/2"
                                  style={{ left: scaleLeftPct(offset), zIndex: stackZ }}
                                >
                                  <div className="relative w-9 h-9">
                                    <button
                                      type="button"
                                      onClick={() => openGallery(plant, idx)}
                                      className="absolute inset-0 rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                      title={new Date(ph.takenAt).toLocaleDateString("ru-RU")}
                                    >
                                      <GardenPlantPhotoImg
                                        photoId={ph.id}
                                        className="w-full h-full object-cover bg-slate-200/80 dark:bg-slate-700/80"
                                      />
                                    </button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute -right-1.5 -top-1.5 z-10 h-5 w-5 min-h-5 min-w-5 rounded-full border border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shadow-sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeletePlantPhoto(ph.id);
                                      }}
                                      disabled={deletingPhotoId === ph.id}
                                      title="Удалить фото"
                                      aria-label="Удалить фото"
                                    >
                                      {deletingPhotoId === ph.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {((plant.timelineEvents?.length ?? 0) > 0 || photoChecks.length > 0) ? (
                          <>
                            <PlantTimelineLabels
                              events={plant.timelineEvents ?? []}
                              plantedDate={plant.plantedDate}
                            />
                            <div className="mt-1">
                              <PlantTimelineBar
                                events={plant.timelineEvents ?? []}
                                plantedDate={plant.plantedDate}
                                photoChecks={photoChecks}
                                onEventClick={(ev) =>
                                  onEditPlannedWork?.(
                                    {
                                      id: ev.id,
                                      title: ev.title,
                                      description: ev.description,
                                      scheduledDate: ev.scheduledDate,
                                      dateTo: ev.dateTo,
                                      isAction: ev.isAction,
                                      type: ev.type,
                                    },
                                    { id: plant.id, name: plant.name },
                                    { id: bed.id, name: bed.name }
                                  )
                                }
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })()}
                  {((plant.timelineEvents?.length ?? 0) > 0 && onAddPlannedWork) ? (
                    <div className="mt-2 pl-8">
                      <button
                        type="button"
                        onClick={() => onAddPlannedWork({ id: plant.id, name: plant.name }, { id: bed.id, name: bed.name })}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        + Добавить плановую работу
                      </button>
                    </div>
                  ) : null}
                  {(plant.timelineEvents?.length ?? 0) === 0 && onRegenerateTimeline ? (
                    <div className="mt-2 pl-8 space-y-1">
                      <button
                        type="button"
                        disabled={regeneratingPlantId === plant.id}
                        onClick={async () => {
                          if (regeneratingPlantId === plant.id) return;
                          if (blockPremiumOnlyUIFeature) {
                            onShowPaywall?.();
                            return;
                          }
                          setRegeneratingPlantId(plant.id);
                          try {
                            await onRegenerateTimeline(plant.id);
                          } catch {
                            // restore clickability and color on error
                          } finally {
                            setRegeneratingPlantId(null);
                          }
                        }}
                        className={`text-xs hover:underline disabled:pointer-events-none disabled:cursor-default ${
                          regeneratingPlantId === plant.id
                            ? "text-slate-400 dark:text-slate-500 no-underline"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {regeneratingPlantId === plant.id ? "Расчёт…" : "Рассчитать таймлайн ухода"}
                      </button>
                      {onAddPlannedWork && (
                        <p className="text-xs">
                          <button
                            type="button"
                            onClick={() => onAddPlannedWork({ id: plant.id, name: plant.name }, { id: bed.id, name: bed.name })}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            + Добавить плановую работу
                          </button>
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-4">
              Здесь пока нет растений
            </p>
          )}

          {/* Add plant from guide — отступ от шкалы/таймлайна предыдущего растения */}
          <div className="mt-6">
          {showPlantInput ? (
            <div className="space-y-3">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAddMode("search")}
                  className={`px-2 py-1 rounded ${addMode === "search" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1" /> Поиск
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("category")}
                  className={`px-2 py-1 rounded ${addMode === "category" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                >
                  По категории
                </button>
              </div>
              {addMode === "search" ? (
                <div className="relative" ref={searchDropdownRef}>
                  <input
                    type="text"
                    placeholder="Введите 3+ буквы (название или сорт)"
                    value={selectedHit ? selectedHit.displayName : searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedHit) setSelectedHit(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedHit) handleAddPlant();
                      if (e.key === "Escape") setSelectedHit(null);
                    }}
                    autoFocus
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                  />
                  {searchQuery.trim().length >= 3 && !selectedHit && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-lg">
                      {searchHits.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</div>
                      ) : (
                        searchHits.slice(0, 15).map((hit) => (
                          <button
                            key={hit.variety ? `${hit.crop.id}:${hit.variety.name}` : String(hit.crop.id)}
                            type="button"
                            onClick={() => {
                              setSelectedHit(hit);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 first:rounded-t-xl last:rounded-b-xl"
                          >
                            {hit.displayName}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelectedCropId("");
                      setSelectedVarietyName("");
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                  >
                    <option value="">Категория</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {category && (
                    <select
                      value={selectedCropId}
                      onChange={(e) => {
                        setSelectedCropId(e.target.value ? Number(e.target.value) : "");
                        setSelectedVarietyName("");
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                    >
                      <option value="">Культура</option>
                      {categoryCrops.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  {selectedCrop && varieties.length > 0 && (
                    <select
                      value={selectedVarietyName}
                      onChange={(e) => setSelectedVarietyName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                    >
                      <option value="">Сорт (необязательно)</option>
                      {varieties.map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="date"
                  value={newPlantDate}
                  onChange={(e) => setNewPlantDate(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                  title="Дата посадки"
                />
                <Button
                  size="sm"
                  onClick={handleAddPlant}
                  disabled={addingPlant || !canAdd}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {addingPlant ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}{" "}
                  Добавить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowPlantInput(false);
                    setSearchQuery("");
                    setSelectedHit(null);
                    setCategory("");
                    setSelectedCropId("");
                    setSelectedVarietyName("");
                    setNewPlantDate(toDateInputValue(new Date().toISOString()));
                  }}
                  className="rounded-xl"
                  aria-label="Закрыть"
                >
                  ×
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (blockNewPlantLocal) {
                      onShowPaywall?.();
                      return;
                    }
                    setShowPlantInput(true);
                  }}
                  className="rounded-xl flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" /> Добавить растение
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
      {interactionMode === "navigate" && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/garden/bed/${bed.id}#add-plant`}
            className="block w-full px-5 py-4 text-center text-lg font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-colors"
          >
            + Добавить растение на грядку
          </Link>
        </div>
      )}
    </Card>

    <GardenPlantGalleryDialog gallery={gallery} setGallery={setGallery} />
    </>
  );
}

