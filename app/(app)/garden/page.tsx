"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Trash2,
  Loader2,
  Sprout,
  LayoutGrid,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { useOnboardingCheck } from "@/lib/hooks/use-onboarding-check";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { usePlants, useCreatePlant, useDeletePlant, type Plant } from "@/lib/hooks/use-plants";
import { useBeds, useCreateBed, useDeleteBed, type Bed } from "@/lib/hooks/use-beds";

const bedTypeLabels: Record<string, string> = {
  open: "Открытый грунт",
  greenhouse: "Теплица",
  raised: "Высокая грядка",
};

const bedTypeEmoji: Record<string, string> = {
  open: "🌿",
  greenhouse: "🏠",
  raised: "📦",
};

export default function GardenPage() {
  const { data: session, status } = useSession();
  useOnboardingCheck();
  const { data: location } = useUserLocation();

  const [newBedName, setNewBedName] = useState("");
  const [newBedNumber, setNewBedNumber] = useState("");
  const [newBedType, setNewBedType] = useState("open");
  const [showBedForm, setShowBedForm] = useState(false);

  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const createPlant = useCreatePlant();
  const deletePlant = useDeletePlant();

  const { data: beds = [], isLoading: bedsLoading } = useBeds();
  const createBed = useCreateBed();
  const deleteBed = useDeleteBed();

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

      {/* Add bed button */}
      <MotionDiv variant="fadeUp" delay={0.05}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-600" />
            Мой участок
          </h2>
          <Button
            size="sm"
            onClick={() => setShowBedForm(!showBedForm)}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-1" /> Новая грядка
          </Button>
        </div>
      </MotionDiv>

      {/* New bed form */}
      {showBedForm && (
        <MotionDiv variant="fadeUp">
          <Card className="p-5 mb-6 border-emerald-200 dark:border-emerald-800">
            <h3 className="font-semibold mb-3">Новая грядка</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Название (Томатная теплица)"
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
                  onDelete={() => deleteBed.mutate(bed.id)}
                  onAddPlant={(name) =>
                    createPlant.mutate({ name, bedId: bed.id })
                  }
                  onDeletePlant={(id) => deletePlant.mutate(id)}
                  addingPlant={createPlant.isPending}
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

function BedCard({
  bed,
  onDelete,
  onAddPlant,
  onDeletePlant,
  addingPlant,
}: {
  bed: Bed;
  onDelete: () => void;
  onAddPlant: (name: string) => void;
  onDeletePlant: (id: string) => void;
  addingPlant: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [showPlantInput, setShowPlantInput] = useState(false);

  const handleAddPlant = () => {
    if (!newPlantName.trim()) return;
    onAddPlant(newPlantName.trim());
    setNewPlantName("");
    setShowPlantInput(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Header — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{bedTypeEmoji[bed.type] || "🌱"}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{bed.name}</h3>
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
              {bed.plants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10"
                >
                  <div className="flex items-center gap-2">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-medium">{plant.name}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(plant.plantedDate).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-600"
                    onClick={() => onDeletePlant(plant.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-4">
              Здесь пока нет растений
            </p>
          )}

          {/* Add plant */}
          {showPlantInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Название растения"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlant()}
                autoFocus
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
              />
              <Button
                size="sm"
                onClick={handleAddPlant}
                disabled={addingPlant || !newPlantName.trim()}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                {addingPlant ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowPlantInput(false); setNewPlantName(""); }}
                className="rounded-xl"
              >
                ✕
              </Button>
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
      )}
    </Card>
  );
}
