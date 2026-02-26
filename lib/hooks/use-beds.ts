"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface BedPhoto {
  id: string;
  url: string;
  caption: string | null;
  takenAt: string;
}

export interface BedPlantPhoto {
  id: string;
  url: string;
  takenAt: string;
  analysisResult?: string | null;
  analysisStatus?: string | null;
  analyzedAt?: string | null;
}

export interface BedPlantTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  dateTo: string | null;
  isAction: boolean;
  sortOrder: number;
  doneAt: string | null;
}

export interface BedPlant {
  id: string;
  name: string;
  status: string;
  plantedDate: string;
  cropSlug?: string | null;
  photos?: BedPlantPhoto[];
  timelineEvents?: BedPlantTimelineEvent[];
}

export interface Bed {
  id: string;
  name: string;
  number: string | null;
  type: string;
  createdAt: string;
  plants: BedPlant[];
  photos: BedPhoto[];
}

async function fetchBeds(): Promise<Bed[]> {
  const res = await fetch("/api/beds");
  if (!res.ok) throw new Error("Failed to fetch beds");
  return res.json();
}

async function createBed(data: { name: string; number?: string; type?: string }): Promise<Bed> {
  const res = await fetch("/api/beds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create bed");
  return res.json();
}

async function deleteBed(id: string): Promise<void> {
  const res = await fetch("/api/beds", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete bed");
}

export interface UploadPlantPhotoParams {
  file: File;
  plantId: string;
  bedId: string;
  takenAt?: string;
}

async function uploadPlantPhoto({
  file,
  plantId,
  bedId,
  takenAt,
}: UploadPlantPhotoParams): Promise<BedPhoto> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("plantId", plantId);
  formData.set("bedId", bedId);
  if (takenAt) formData.set("takenAt", takenAt);
  const res = await fetch("/api/photos", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upload photo");
  }
  return res.json();
}

export function useBeds() {
  return useQuery({ queryKey: ["beds"], queryFn: fetchBeds });
}

export function useCreateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beds"] }),
  });
}

export function useDeleteBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beds"] }),
  });
}

export function useUploadPlantPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadPlantPhoto,
    onSuccess: async (data, variables) => {
      const { plantId, bedId } = variables;
      const takenAtStr =
        typeof data.takenAt === "string"
          ? data.takenAt
          : data.takenAt != null
            ? new Date(data.takenAt).toISOString()
            : new Date().toISOString();
      const newPhoto: BedPlantPhoto = {
        id: String(data.id),
        url: String(data.url),
        takenAt: takenAtStr,
        analysisResult: data.analysisResult ?? undefined,
        analysisStatus: data.analysisStatus ?? undefined,
        analyzedAt: data.analyzedAt != null ? new Date(data.analyzedAt).toISOString() : undefined,
      };
      qc.setQueryData<Bed[]>(["beds"], (old) => {
        if (!old) return old;
        return old.map((bed) => {
          if (bed.id !== bedId) return bed;
          return {
            ...bed,
            plants: bed.plants.map((plant) => {
              if (plant.id !== plantId) return plant;
              const photos = [newPhoto, ...(plant.photos ?? [])];
              return { ...plant, photos };
            }),
          };
        });
      });
      toast.success("Фото добавлено");
      await qc.refetchQueries({ queryKey: ["beds"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить фото");
    },
  });
}
