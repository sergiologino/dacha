"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Bed, BedPlant, OfflineEntityMeta } from "./use-beds";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { newOfflineClientId } from "@/lib/offline/offline-id";

export interface Plant {
  id: string;
  name: string;
  bedId: string | null;
  notes: string | null;
  plantedDate: string;
  status: string;
  cropSlug?: string | null;
  offlineMeta?: OfflineEntityMeta;
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
    offlineMeta: plant.offlineMeta,
  };
}

export function useCreatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      name: string;
      bedId?: string;
      plantedDate?: string;
      cropSlug?: string;
    }) => {
      if (shouldQueueOfflineMutation()) {
        const tempClientId = newOfflineClientId();
        const beds = qc.getQueryData<Bed[]>(["beds"]);
        const bed = variables.bedId ? beds?.find((b) => b.id === variables.bedId) : undefined;
        const dependsOn = bed?.offlineMeta?.pendingOutboxId;
        const outId = await enqueueOutbox({
          action: "CREATE_PLANT",
          payload: {
            tempClientId,
            name: variables.name,
            bedId: variables.bedId,
            plantedDate: variables.plantedDate,
            cropSlug: variables.cropSlug,
          },
          dependsOn,
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        const plantedRaw = variables.plantedDate ?? new Date().toISOString();
        const plantedDate =
          typeof plantedRaw === "string" && plantedRaw.includes("T")
            ? plantedRaw
            : `${plantedRaw}T12:00:00.000Z`;
        const plant: Plant = {
          id: tempClientId,
          name: variables.name,
          bedId: variables.bedId ?? null,
          notes: null,
          status: "growing",
          plantedDate,
          cropSlug: variables.cropSlug ?? null,
          offlineMeta: { pendingOutboxId: outId },
        };
        return plant;
      }
      return createPlant(variables);
    },
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
      if (plantNorm.offlineMeta) {
        toast.message("Растение сохранено локально, отправим при сети");
      }
    },
    onSettled: () => {
      if (shouldQueueOfflineMutation()) return;
      void qc.invalidateQueries({ queryKey: ["plants"] });
      void qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useUpdatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      plantedDate?: string;
      name?: string;
      notes?: string;
      status?: string;
    }) => {
      if (shouldQueueOfflineMutation()) {
        const cur = qc.getQueryData<Plant[]>(["plants"])?.find((p) => p.id === data.id);
        if (!cur) throw new Error("Растение не найдено в кэше");
        const outId = await enqueueOutbox({
          action: "UPDATE_PLANT",
          payload: { ...data },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        return {
          ...cur,
          ...data,
          plantedDate:
            data.plantedDate !== undefined
              ? typeof data.plantedDate === "string"
                ? data.plantedDate
                : new Date(data.plantedDate).toISOString()
              : cur.plantedDate,
        } as Plant;
      }
      return updatePlant(data);
    },
    onSuccess: (plant) => {
      const norm: Plant = {
        ...plant,
        plantedDate:
          typeof plant.plantedDate === "string"
            ? plant.plantedDate
            : new Date(plant.plantedDate).toISOString(),
      };
      qc.setQueryData<Plant[]>(["plants"], (old) =>
        old?.map((p) => (p.id === norm.id ? norm : p))
      );
      qc.setQueryData<Bed[]>(["beds"], (old) =>
        old?.map((b) => ({
          ...b,
          plants: (b.plants ?? []).map((p) => {
            if (p.id !== norm.id) return p;
            const bp = plantToBedPlant(norm);
            return { ...p, ...bp, timelineEvents: p.timelineEvents, photos: p.photos };
          }),
        }))
      );
      if (shouldQueueOfflineMutation()) {
        toast.message("Изменения растения сохранены локально");
        return;
      }
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useDeletePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (shouldQueueOfflineMutation()) {
        const outId = await enqueueOutbox({
          action: "DELETE_PLANT",
          payload: { id },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        return id;
      }
      await deletePlant(id);
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<Plant[]>(["plants"], (old) => old?.filter((p) => p.id !== id));
      qc.setQueryData<Bed[]>(["beds"], (old) =>
        old?.map((b) => ({
          ...b,
          plants: (b.plants ?? []).filter((p) => p.id !== id),
        }))
      );
      if (shouldQueueOfflineMutation()) {
        toast.message("Удаление растения сохранено локально");
        return;
      }
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}
