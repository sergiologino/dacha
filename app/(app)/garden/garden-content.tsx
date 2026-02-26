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
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  Search,
  HelpCircle,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { useOnboardingCheck } from "@/lib/hooks/use-onboarding-check";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { useQueryClient } from "@tanstack/react-query";
import { usePlants, useCreatePlant, useUpdatePlant, useDeletePlant, type Plant } from "@/lib/hooks/use-plants";
import { useBeds, useCreateBed, useUpdateBed, useDeleteBed, useUploadPlantPhoto, type Bed } from "@/lib/hooks/use-beds";
import { PlantTimelineLabels, PlantTimelineBar, type PhotoCheck } from "@/components/plant-timeline";
import { GardenHelpContent } from "@/components/garden-help-content";
import { useCrops } from "@/lib/hooks/use-crops";
import { crops as staticCrops } from "@/lib/data/crops";
import { searchCropsAndVarieties, type CropSearchHit } from "@/lib/crops-search";
import type { CropWithSource } from "@/lib/crops-merge";

const bedTypeLabels: Record<string, string> = {
  open: "Открытый грунт",
  greenhouse: "Теплица",
  raised: "Высокая грядка",
  seedling_home: "Рассада дома",
};

const bedTypeEmoji: Record<string, string> = {
  open: "🌿",
  greenhouse: "🏠",
  raised: "📦",
  seedling_home: "🪴",
};

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
      (window.location.search.includes("payment=success") || searchParams.get("payment") === "success");
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

  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();

  const qc = useQueryClient();
  const { data: beds = [], isLoading: bedsLoading } = useBeds();
  const { data: cropsList } = useCrops();
  const createBed = useCreateBed();
  const updateBed = useUpdateBed();
  const deleteBed = useDeleteBed();
  const uploadPhoto = useUploadPlantPhoto();

  const crops: CropWithSource[] =
    cropsList ??
    staticCrops.map((c) => ({ ...c, addedByCommunity: false }));

  const unassignedPlants = plants.filter((p) => !p.bedId);

  const addBed = () => {
    if (!newBedName) return;
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

  if (status === "loading" || plantsLoading || bedsLoading) {
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
          compact
        />
      </div>

      {/* Add bed button + Help */}
      <MotionDiv variant="fadeUp" delay={0.05}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-600" />
            Мой участок
          </h2>
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
            <Button
              size="sm"
              onClick={() => setShowBedForm(!showBedForm)}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-1" /> Новая грядка
            </Button>
          </div>
        </div>
      </MotionDiv>

      {/* Модалка помощи — контент на фронте, без задержек */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          showCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 dark:text-slate-100">
              Как пользоваться страницей «Мой участок»
            </DialogTitle>
            <DialogDescription className="sr-only">
              Подробное описание: грядки, культуры, шкала роста, фото
            </DialogDescription>
          </DialogHeader>
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

      {/* Beds list */}
      <StaggerContainer className="space-y-4">
        {beds.length === 0 && unassignedPlants.length === 0 ? (
          <StaggerItem>
            <Card className="p-12 text-center">
              <LayoutGrid className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
              <p className="text-slate-500 mb-2">Участок пока пустой</p>
              <p className="text-sm text-slate-400">
                Создайте грядку и добавьте в неё растения
              </p>
            </Card>
          </StaggerItem>
        ) : (
          <>
            {beds.map((bed: Bed) => (
              <StaggerItem key={bed.id}>
                <BedCard
                  bed={bed}
                  crops={crops}
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
                    uploadPhoto.mutate(
                      { file, plantId, bedId, takenAt },
                      {
                        onSuccess: () => {
                          qc.refetchQueries({ queryKey: ["beds"] });
                        },
                      }
                    )
                  }
                  onRegenerateTimeline={async (plantId) => {
                    const res = await fetch(`/api/plants/${plantId}/timeline/generate`, { method: "POST" });
                    if (!res.ok) throw new Error("Generate failed");
                    qc.invalidateQueries({ queryKey: ["beds"] });
                  }}
                  addingPlant={createPlant.isPending}
                  updatingPlant={updatePlant.isPending}
                  uploadingPhoto={uploadPhoto.isPending}
                />
              </StaggerItem>
            ))}

            {/* Unassigned plants */}
            {unassignedPlants.length > 0 && (
              <StaggerItem>
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
              </StaggerItem>
            )}
          </>
        )}
      </StaggerContainer>
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
  onUpdateBed,
  updatingBed,
  onDelete,
  onAddPlant,
  onUpdatePlant,
  onDeletePlant,
  onUploadPhoto,
  onRegenerateTimeline,
  addingPlant,
  updatingPlant,
  uploadingPhoto,
}: {
  bed: Bed;
  crops: { id: number; name: string; slug: string; category: string; varieties?: { name: string }[] }[];
  onUpdateBed: (id: string, data: { name?: string; number?: string; type?: string }) => void;
  updatingBed: boolean;
  onDelete: () => void;
  onAddPlant: (name: string, plantedDate?: string, cropSlug?: string) => void;
  onUpdatePlant: (id: string, plantedDate: string) => void;
  onDeletePlant: (id: string) => void;
  onUploadPhoto: (file: File, plantId: string, bedId: string, takenAt?: string) => void;
  onRegenerateTimeline?: (plantId: string) => void | Promise<void>;
  addingPlant: boolean;
  updatingPlant: boolean;
  uploadingPhoto: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPlantId, setPhotoPlantId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{
    plantName: string;
    photos: { id: string; url: string; takenAt: string; analysisResult?: string | null; analysisStatus?: string | null }[];
    index: number;
  } | null>(null);
  const [regeneratingPlantId, setRegeneratingPlantId] = useState<string | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

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
    if (file && photoPlantId) {
      const takenAt = toDateInputValue(new Date().toISOString());
      onUploadPhoto(file, photoPlantId, bed.id, `${takenAt}T12:00:00.000Z`);
      setPhotoPlantId(null);
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

  const closeGallery = () => setGallery(null);

  const galleryPrev = () => {
    if (!gallery) return;
    setGallery((g) =>
      g ? { ...g, index: g.index > 0 ? g.index - 1 : g.photos.length - 1 } : null
    );
  };

  const galleryNext = () => {
    if (!gallery) return;
    setGallery((g) =>
      g ? { ...g, index: g.index < g.photos.length - 1 ? g.index + 1 : 0 } : null
    );
  };

  return (
    <>
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Header тАФ clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
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
              <span className="flex items-center gap-1">
                <Sprout className="w-3 h-3" />
                {bed.plants.length} растени{bed.plants.length === 1 ? "е" : bed.plants.length < 5 ? "я" : "й"}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Plants list */}
          {bed.plants.length > 0 ? (
            <div className="space-y-2 mb-4">
              <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            capture="environment"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-emerald-600 flex-shrink-0"
                      onClick={() => {
                        setPhotoPlantId(plant.id);
                        photoInputRef.current?.click();
                      }}
                      disabled={uploadingPhoto}
                      title="Сделать фото растения"
                    >
                      {uploadingPhoto && photoPlantId === plant.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </Button>
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
                              return (
                                <button
                                  key={ph.id}
                                  type="button"
                                  onClick={() => openGallery(plant, idx)}
                                  className="absolute top-0 w-9 h-9 rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow -translate-x-1/2 focus:ring-2 focus:ring-emerald-500 focus:outline-none z-10"
                                  style={{ left: scaleLeftPct(offset) }}
                                  title={new Date(ph.takenAt).toLocaleDateString("ru-RU")}
                                >
                                  <img src={ph.url} alt="" className="w-full h-full object-cover" />
                                </button>
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
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })()}
                  {(plant.timelineEvents?.length ?? 0) === 0 && onRegenerateTimeline ? (
                    <div className="mt-2 pl-8">
                      <button
                        type="button"
                        disabled={regeneratingPlantId === plant.id}
                        onClick={async () => {
                          if (regeneratingPlantId === plant.id) return;
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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPlantInput(true)}
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
          )}
          </div>
        </div>
      )}
    </Card>

    {/* Галерея фото растения — полноэкранная на мобильном */}
    <Dialog open={!!gallery} onOpenChange={(open) => !open && closeGallery()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 w-full h-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-black/95 p-0 gap-0 flex flex-col sm:inset-[5%] sm:h-[90%] sm:max-w-4xl sm:mx-auto sm:rounded-2xl sm:border sm:border-slate-700"
      >
        {gallery && (
          <>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-black/50 sm:rounded-t-2xl">
              <DialogTitle className="text-white font-semibold text-base">
                {gallery.plantName}
                {gallery.photos[gallery.index]?.takenAt && (
                  <span className="text-white/80 font-normal ml-1">
                    — {new Date(gallery.photos[gallery.index].takenAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                {" — фото "}{gallery.index + 1} из {gallery.photos.length}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={closeGallery}
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
              <img
                src={gallery.photos[gallery.index].url}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
              {gallery.photos[gallery.index]?.analysisResult && (
                <div className="w-full flex-shrink-0 px-4 py-2 bg-black/60 text-white text-sm sm:rounded-b-2xl">
                  <p className="font-medium">
                    {gallery.photos[gallery.index].analysisStatus === "problem" ? "Отклонения: " : "Вердикт: "}
                  </p>
                  <p className="mt-0.5">{gallery.photos[gallery.index].analysisResult}</p>
                </div>
              )}
              {gallery.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={galleryPrev}
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={galleryNext}
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
            {gallery.photos.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3 flex-shrink-0 bg-black/50 sm:rounded-b-2xl">
                {gallery.photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGallery((g) => (g ? { ...g, index: i } : null))}
                    className={[
                      "w-2 h-2 rounded-full transition-colors",
                      i === gallery.index
                        ? "bg-emerald-400"
                        : "bg-white/40 hover:bg-white/60",
                    ].join(" ")}
                    aria-label={`Фото ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
