"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bed, BedPlant } from "./use-beds";

export interface Plant {
  id: string;
  name: string;
  bedId: string | null;
  notes: string | null;
  plantedDate: string;
  status: string;
  cropSlug?: string | null;
}

async function fetchPlants(): Promise<Plant[]> {
  const res = await fetch("/api/plants", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch plants");
  return res.json();
}

async function createPlant(data: {
  name: string;
  bedId?: string;
  plantedDate?: string;
  cropSlug?: string;
}): Promise<Plant> {
  const res = await fetch("/api/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to create plant");
  return body as Plant;
}

async function updatePlant(data: {
  id: string;
  plantedDate?: string;
  name?: string;
  notes?: string;
  status?: string;
}): Promise<Plant> {
  const res = await fetch("/api/plants", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plant");
  return res.json();
}

async function deletePlant(id: string): Promise<void> {
  const res = await fetch("/api/plants", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete plant");
}

export function usePlants(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["plants"],
    queryFn: fetchPlants,
    enabled,
  });
}

function plantToBedPlant(plant: Plant): BedPlant {
  return {
    id: plant.id,
    name: plant.name,
    status: plant.status ?? "growing",
    plantedDate:
      typeof plant.plantedDate === "string" ? plant.plantedDate : new Date(plant.plantedDate).toISOString(),
    cropSlug: plant.cropSlug ?? null,
    photos: [],
    timelineEvents: [],
  };
}

export function useCreatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlant,
    onSuccess: (newPlant, variables) => {
      const plantNorm: Plant = {
        ...newPlant,
        plantedDate:
          typeof newPlant.plantedDate === "string"
            ? newPlant.plantedDate
            : new Date(newPlant.plantedDate).toISOString(),
      };
      qc.setQueryData<Plant[]>(["plants"], (old) => (old ? [plantNorm, ...old] : [plantNorm]));
      if (variables.bedId) {
        qc.setQueryData<Bed[]>(["beds"], (old) => {
          if (!old) return old;
          const bedPlant = plantToBedPlant(plantNorm);
          return old.map((bed) =>
            bed.id === variables.bedId
              ? { ...bed, plants: [bedPlant, ...(bed.plants ?? [])] }
              : bed
          );
        });
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["plants"] });
      void qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useUpdatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePlant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useDeletePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}
