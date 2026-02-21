"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingCheck } from "@/lib/hooks/use-onboarding-check";
import { usePlants, useCreatePlant, useDeletePlant } from "@/lib/hooks/use-plants";

export default function GardenPage() {
  const { data: session, status } = useSession();
  useOnboardingCheck();
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantBed, setNewPlantBed] = useState("");

  const { data: plants = [], isLoading } = usePlants();
  const createPlant = useCreatePlant();
  const deletePlant = useDeletePlant();

  const addPlant = () => {
    if (!newPlantName || !newPlantBed) return;
    createPlant.mutate(
      { name: newPlantName, bed: newPlantBed },
      { onSuccess: () => { setNewPlantName(""); setNewPlantBed(""); } }
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">
        Привет, {session?.user?.name?.split(" ")[0]}! 🌱
      </h1>

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

      <div className="space-y-4">
        {plants.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-500">
              Пока пусто. Добавь первое растение 👆
            </p>
          </Card>
        ) : (
          plants.map((plant) => (
            <Card
              key={plant.id}
              className="p-6 flex justify-between items-center group hover:scale-[1.01]"
            >
              <div>
                <div className="font-semibold">{plant.name}</div>
                <div className="text-sm text-slate-500">
                  {plant.notes && `Грядка ${plant.notes} • `}
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
          ))
        )}
      </div>
    </>
  );
}
