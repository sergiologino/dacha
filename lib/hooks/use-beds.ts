"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { compressImageFileForUpload } from "@/lib/compress-image";

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
  caption?: string | null;
  isPublic?: boolean;
  publishedAt?: string | null;
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
  isUserCreated?: boolean;
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
  const res = await fetch("/api/beds", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch beds");
  return res.json();
}

async function createBed(data: { name: string; number?: string; type?: string }): Promise<Bed> {
  const res = await fetch("/api/beds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to create bed");
  return body as Bed;
}

async function updateBed(data: { id: string; name?: string; number?: string; type?: string }): Promise<Bed> {
  const res = await fetch("/api/beds", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to update bed");
  return body as Bed;
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
}: UploadPlantPhotoParams): Promise<BedPlantPhoto> {
  const fileToSend = await compressImageFileForUpload(file);
  if (!fileToSend?.size) {
    throw new Error("Пустой файл изображения — попробуйте другое фото");
  }
  const formData = new FormData();
  formData.set("file", fileToSend);
  formData.set("plantId", plantId);
  formData.set("bedId", bedId);
  if (takenAt) formData.set("takenAt", takenAt);
  const res = await fetch("/api/photos", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to upload photo");
  }
  const url = typeof data.url === "string" ? data.url : "";
  if (!url) {
    throw new Error("Сервер не вернул адрес фото");
  }
  return {
    id: String(data.id),
    url,
    takenAt:
      typeof data.takenAt === "string"
        ? data.takenAt
        : data.takenAt != null
          ? new Date(data.takenAt as string | number | Date).toISOString()
          : new Date().toISOString(),
    caption: typeof data.caption === "string" ? data.caption : null,
    isPublic: typeof data.isPublic === "boolean" ? data.isPublic : undefined,
    publishedAt:
      data.publishedAt != null
        ? new Date(data.publishedAt as string | number | Date).toISOString()
        : null,
    analysisResult: typeof data.analysisResult === "string" ? data.analysisResult : undefined,
    analysisStatus: typeof data.analysisStatus === "string" ? data.analysisStatus : undefined,
    analyzedAt:
      data.analyzedAt != null
        ? new Date(data.analyzedAt as string | number | Date).toISOString()
        : undefined,
  } as BedPlantPhoto;
}

export function useBeds(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["beds"],
    queryFn: fetchBeds,
    enabled,
    // Не наследовать глобальные 60s: фото/растения должны сразу подтягиваться с сервера после мутаций
    staleTime: 0,
  });
}

function normalizeBed(bed: Bed): Bed {
  return {
    ...bed,
    createdAt: typeof bed.createdAt === "string" ? bed.createdAt : new Date(bed.createdAt).toISOString(),
    plants: (bed.plants ?? []).map((p) => ({
      ...p,
      plantedDate: typeof p.plantedDate === "string" ? p.plantedDate : new Date(p.plantedDate).toISOString(),
    })),
  };
}

export function useCreateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBed,
    onSuccess: (newBed) => {
      const bed = normalizeBed(newBed);
      qc.setQueryData<Bed[]>(["beds"], (old) => (old ? [bed, ...old] : [bed]));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useUpdateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBed,
    onSuccess: (updatedBed) => {
      const bed = normalizeBed(updatedBed);
      qc.setQueryData<Bed[]>(["beds"], (old) =>
        old ? old.map((b) => (b.id === bed.id ? bed : b)) : [bed]
      );
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
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
      const newPhoto: BedPlantPhoto = data;
      // Как до регрессии (feb 2026): сразу показываем фото из ответа мутации; иначе при гонке refetch
      // с запросом, начатым до коммита фото в БД, полоса превью остаётся пустой.
      qc.setQueryData<Bed[]>(["beds"], (old) => {
        if (!old) return old;
        return old.map((bed) => {
          if (bed.id !== bedId) return bed;
          return {
            ...bed,
            plants: (bed.plants ?? []).map((plant) => {
              if (plant.id !== plantId) return plant;
              const existing = plant.photos ?? [];
              const withoutDup = existing.filter((p) => p.id !== newPhoto.id);
              return { ...plant, photos: [newPhoto, ...withoutDup] };
            }),
          };
        });
      });
      await qc.invalidateQueries({ queryKey: ["beds"] });
      toast.success("Фото добавлено");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить фото");
    },
  });
}
