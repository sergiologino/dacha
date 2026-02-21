"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Trash2,
  Loader2,
  Sprout,
  LayoutGrid,
  Camera,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { useOnboardingCheck } from "@/lib/hooks/use-onboarding-check";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { usePlants, useCreatePlant, useDeletePlant } from "@/lib/hooks/use-plants";
import { useBeds, useCreateBed, useDeleteBed, type Bed } from "@/lib/hooks/use-beds";

type Tab = "plants" | "beds";

const bedTypeLabels: Record<string, string> = {
  open: "Открытый грунт",
  greenhouse: "Теплица",
  raised: "Высокая грядка",
};

export default function GardenPage() {
  const { data: session, status } = useSession();
  useOnboardingCheck();
  const { data: location } = useUserLocation();
  const [tab, setTab] = useState<Tab>("plants");

  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantBed, setNewPlantBed] = useState("");

  const [newBedName, setNewBedName] = useState("");
  const [newBedNumber, setNewBedNumber] = useState("");
  const [newBedType, setNewBedType] = useState("open");

  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const createPlant = useCreatePlant();
  const deletePlant = useDeletePlant();

  const { data: beds = [], isLoading: bedsLoading } = useBeds();
  const createBed = useCreateBed();
  const deleteBed = useDeleteBed();

  const addPlant = () => {
    if (!newPlantName) return;
    createPlant.mutate(
      { name: newPlantName, bed: newPlantBed },
      {
        onSuccess: () => {
          setNewPlantName("");
          setNewPlantBed("");
        },
      }
    );
  };

  const addBed = () => {
    if (!newBedName) return;
    createBed.mutate(
      { name: newBedName, number: newBedNumber, type: newBedType },
      {
        onSuccess: () => {
          setNewBedName("");
          setNewBedNumber("");
          setNewBedType("open");
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
        <h1 className="text-2xl font-semibold mb-4">
          Привет, {session?.user?.name?.split(" ")[0]}!
        </h1>
      </MotionDiv>

      {/* Weather */}
      <div className="mb-6">
        <WeatherWidget
          lat={location?.latitude ?? null}
          lon={location?.longitude ?? null}
          compact
        />
      </div>

      {/* Tabs */}
      <MotionDiv variant="fadeUp" delay={0.05}>
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "plants" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("plants")}
            className={tab === "plants" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <Sprout className="w-4 h-4 mr-1" /> Растения ({plants.length})
          </Button>
          <Button
            variant={tab === "beds" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("beds")}
            className={tab === "beds" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <LayoutGrid className="w-4 h-4 mr-1" /> Грядки ({beds.length})
          </Button>
        </div>
      </MotionDiv>

      {tab === "plants" && (
        <>
          {/* Add plant form */}
          <MotionDiv variant="fadeUp" delay={0.1}>
            <Card className="p-6 mb-8">
              <h2 className="font-semibold mb-4">Добавить растение</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Название (Томат Черри)"
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Грядка № или Теплица"
                  value={newPlantBed}
                  onChange={(e) => setNewPlantBed(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                />
                <Button
                  onClick={addPlant}
                  disabled={createPlant.isPending}
                  className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {createPlant.isPending ? (
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 w-5 h-5" />
                  )}
                  Добавить
                </Button>
              </div>
            </Card>
          </MotionDiv>

          {/* Plants list */}
          <StaggerContainer className="space-y-4">
            {plants.length === 0 ? (
              <StaggerItem>
                <Card className="p-12 text-center">
                  <Sprout className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
                  <p className="text-slate-500">
                    Пока пусто. Добавь первое растение!
                  </p>
                </Card>
              </StaggerItem>
            ) : (
              plants.map((plant) => (
                <StaggerItem key={plant.id}>
                  <Card className="p-6 flex justify-between items-center group hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold">{plant.name}</div>
                      <div className="text-sm text-slate-500">
                        {plant.notes && `Грядка ${plant.notes} · `}
                        {new Date(plant.plantedDate).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePlant.mutate(plant.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </Card>
                </StaggerItem>
              ))
            )}
          </StaggerContainer>
        </>
      )}

      {tab === "beds" && (
        <>
          {/* Add bed form */}
          <MotionDiv variant="fadeUp" delay={0.1}>
            <Card className="p-6 mb-8">
              <h2 className="font-semibold mb-4">Новая грядка</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Название (Томатная теплица)"
                  value={newBedName}
                  onChange={(e) => setNewBedName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Номер (необязательно)"
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                />
                <select
                  value={newBedType}
                  onChange={(e) => setNewBedType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900"
                >
                  <option value="open">Открытый грунт</option>
                  <option value="greenhouse">Теплица</option>
                  <option value="raised">Высокая грядка</option>
                </select>
                <Button
                  onClick={addBed}
                  disabled={createBed.isPending}
                  className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {createBed.isPending ? (
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 w-5 h-5" />
                  )}
                  Создать грядку
                </Button>
              </div>
            </Card>
          </MotionDiv>

          {/* Beds grid */}
          <StaggerContainer className="space-y-4">
            {beds.length === 0 ? (
              <StaggerItem>
                <Card className="p-12 text-center">
                  <LayoutGrid className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
                  <p className="text-slate-500">
                    Пока нет грядок. Создайте первую!
                  </p>
                </Card>
              </StaggerItem>
            ) : (
              beds.map((bed: Bed) => (
                <StaggerItem key={bed.id}>
                  <BedCard bed={bed} onDelete={() => deleteBed.mutate(bed.id)} />
                </StaggerItem>
              ))
            )}
          </StaggerContainer>
        </>
      )}
    </>
  );
}

function BedCard({ bed, onDelete }: { bed: Bed; onDelete: () => void }) {
  return (
    <Card className="p-6 group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{bed.name}</h3>
            {bed.number && (
              <Badge variant="secondary" className="text-xs">
                #{bed.number}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <MapPin className="w-3 h-3" />
            {bedTypeLabels[bed.type] || bed.type}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-red-500"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Photo thumbnails */}
      {bed.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {bed.photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={photo.url}
                alt={photo.caption || "Фото грядки"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Plants in this bed */}
      {bed.plants.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {bed.plants.map((plant) => (
            <Badge key={plant.id} variant="outline" className="text-xs gap-1">
              <Sprout className="w-3 h-3 text-emerald-500" />
              {plant.name}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Camera className="w-3 h-3" /> Добавьте растения и фото
        </p>
      )}
    </Card>
  );
}
