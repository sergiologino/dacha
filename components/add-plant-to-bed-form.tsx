"use client";

import { useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreatePlant } from "@/lib/hooks/use-plants";
import { searchCropsAndVarieties, type CropSearchHit } from "@/lib/crops-search";
import type { CropWithSource } from "@/lib/crops-merge";

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

const categoriesFromCrops = (cropsList: { category: string }[]) =>
  [...new Set(cropsList.map((c) => c.category))].sort();

type AddPlantToBedFormProps = {
  bedId: string;
  crops: CropWithSource[];
  isPremium: boolean | null;
  totalPlants: number;
  freePlantLimit: number;
  onShowPaywall?: () => void;
};

export function AddPlantToBedForm({
  bedId,
  crops: cropsList,
  isPremium,
  totalPlants,
  freePlantLimit,
  onShowPaywall,
}: AddPlantToBedFormProps) {
  const createPlant = useCreatePlant();
  const [addMode, setAddMode] = useState<"search" | "category">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHit, setSelectedHit] = useState<CropSearchHit | null>(null);
  const [category, setCategory] = useState("");
  const [selectedCropId, setSelectedCropId] = useState<number | "">("");
  const [selectedVarietyName, setSelectedVarietyName] = useState("");
  const [newPlantDate, setNewPlantDate] = useState(() =>
    toDateInputValue(new Date().toISOString())
  );

  const searchHits =
    searchQuery.trim().length >= 3
      ? searchCropsAndVarieties(cropsList as Parameters<typeof searchCropsAndVarieties>[0], searchQuery.trim())
      : [];
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
    if (isPremium === false && totalPlants >= freePlantLimit) {
      onShowPaywall?.();
      return;
    }
    const hit =
      addMode === "search"
        ? selectedHit
        : selectedCrop && displayFromCategory
          ? ({
              crop: selectedCrop,
              displayName: displayFromCategory,
              variety: selectedVarietyName ? { name: selectedVarietyName, desc: "" } : undefined,
            } as CropSearchHit)
          : null;
    if (!hit?.displayName?.trim()) return;
    const plantedDate = newPlantDate ? `${newPlantDate}T12:00:00.000Z` : undefined;
    createPlant.mutate(
      {
        name: hit.displayName.trim(),
        bedId,
        plantedDate,
        cropSlug: hit.crop.slug,
      },
      {
        onSuccess: () => {
          toast.success("Растение добавлено");
          setSearchQuery("");
          setSelectedHit(null);
          setCategory("");
          setSelectedCropId("");
          setSelectedVarietyName("");
          setNewPlantDate(toDateInputValue(new Date().toISOString()));
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Не удалось добавить");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 text-base">
        <button
          type="button"
          onClick={() => setAddMode("search")}
          className={`px-4 py-2.5 rounded-xl font-medium ${
            addMode === "search"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <Search className="w-5 h-5 inline mr-2 align-text-bottom" aria-hidden />
          Поиск
        </button>
        <button
          type="button"
          onClick={() => setAddMode("category")}
          className={`px-4 py-2.5 rounded-xl font-medium ${
            addMode === "category"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          По категории
        </button>
      </div>

      {addMode === "search" ? (
        <div className="relative">
          <label className="sr-only" htmlFor="add-plant-search">
            Название культуры или сорта
          </label>
          <input
            id="add-plant-search"
            type="text"
            placeholder="Введите 3 и более букв (название или сорт)"
            value={selectedHit ? selectedHit.displayName : searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedHit) setSelectedHit(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && selectedHit) handleAddPlant();
              if (e.key === "Escape") setSelectedHit(null);
            }}
            className="w-full px-4 py-3 text-lg rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 min-h-[3rem]"
          />
          {searchQuery.trim().length >= 3 && !selectedHit && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-lg">
              {searchHits.length === 0 ? (
                <div className="px-4 py-3 text-base text-slate-500">Ничего не найдено</div>
              ) : (
                searchHits.slice(0, 15).map((hit) => (
                  <button
                    key={hit.variety ? `${hit.crop.id}:${hit.variety.name}` : String(hit.crop.id)}
                    type="button"
                    onClick={() => {
                      setSelectedHit(hit);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-4 py-3 text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    {hit.displayName}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="sr-only" htmlFor="add-plant-category">
            Категория
          </label>
          <select
            id="add-plant-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSelectedCropId("");
              setSelectedVarietyName("");
            }}
            className="w-full px-4 py-3 text-lg rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 min-h-[3rem]"
          >
            <option value="">Категория</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {category && (
            <>
              <label className="sr-only" htmlFor="add-plant-crop">
                Культура
              </label>
              <select
                id="add-plant-crop"
                value={selectedCropId}
                onChange={(e) => {
                  setSelectedCropId(e.target.value ? Number(e.target.value) : "");
                  setSelectedVarietyName("");
                }}
                className="w-full px-4 py-3 text-lg rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 min-h-[3rem]"
              >
                <option value="">Культура</option>
                {categoryCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {selectedCrop && varieties.length > 0 && (
            <>
              <label className="sr-only" htmlFor="add-plant-variety">
                Сорт
              </label>
              <select
                id="add-plant-variety"
                value={selectedVarietyName}
                onChange={(e) => setSelectedVarietyName(e.target.value)}
                className="w-full px-4 py-3 text-lg rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 min-h-[3rem]"
              >
                <option value="">Сорт (необязательно)</option>
                {varieties.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
        <label className="sr-only" htmlFor="add-plant-date">
          Дата посадки
        </label>
        <input
          id="add-plant-date"
          type="date"
          value={newPlantDate}
          onChange={(e) => setNewPlantDate(e.target.value)}
          className="px-4 py-3 text-lg rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 min-h-[3rem]"
          title="Дата посадки"
        />
        <Button
          type="button"
          onClick={handleAddPlant}
          disabled={createPlant.isPending || !canAdd}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg min-h-[3rem] px-6"
        >
          {createPlant.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 mr-2" />
          )}
          Добавить на грядку
        </Button>
      </div>
      {isPremium === false && (
        <p className="text-base text-slate-500">
          Всего растений на участке: {totalPlants} из {freePlantLimit} бесплатно
        </p>
      )}
    </div>
  );
}
