"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { compressImageFileForUpload } from "@/lib/compress-image";
import {
  cancelPendingPhotoUploadByTempId,
  deleteLocalBlob,
  enqueueOutbox,
  putLocalBlob,
} from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { newOfflineClientId } from "@/lib/offline/offline-id";

export type OfflineEntityMeta = { pendingOutboxId: string };

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
  /** Офлайн: очередь загрузки + blob в Dexie */
  offlineMeta?: OfflineEntityMeta & { localBlobId?: string };
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
  offlineMeta?: OfflineEntityMeta;
}

export interface BedPlant {
  id: string;
  name: string;
  status: string;
  plantedDate: string;
  cropSlug?: string | null;
  photos?: BedPlantPhoto[];
  timelineEvents?: BedPlantTimelineEvent[];
  offlineMeta?: OfflineEntityMeta;
}

export interface Bed {
  id: string;
  name: string;
  number: string | null;
  type: string;
  createdAt: string;
  plants: BedPlant[];
  photos: BedPhoto[];
  offlineMeta?: OfflineEntityMeta;
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
    mutationFn: async (data: { name: string; number?: string; type?: string }) => {
      if (shouldQueueOfflineMutation()) {
        const tempClientId = newOfflineClientId();
        const outId = await enqueueOutbox({
          action: "CREATE_BED",
          payload: {
            tempClientId,
            name: data.name,
            number: data.number,
            type: data.type ?? "open",
          },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        const now = new Date().toISOString();
        const bed: Bed = {
          id: tempClientId,
          name: data.name,
          number: data.number ?? null,
          type: data.type ?? "open",
          createdAt: now,
          plants: [],
          photos: [],
          offlineMeta: { pendingOutboxId: outId },
        };
        return bed;
      }
      return createBed(data);
    },
    onSuccess: (newBed) => {
      const bed = normalizeBed(newBed);
      qc.setQueryData<Bed[]>(["beds"], (old) => (old ? [bed, ...old] : [bed]));
      if (bed.offlineMeta) {
        toast.message("Сохранено локально, синхронизируем при появлении сети");
      }
    },
    onSettled: () => {
      if (shouldQueueOfflineMutation()) return;
      void qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useUpdateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; name?: string; number?: string; type?: string }) => {
      if (shouldQueueOfflineMutation()) {
        const old = qc.getQueryData<Bed[]>(["beds"])?.find((b) => b.id === data.id);
        if (!old) throw new Error("Грядка не найдена в кэше");
        const merged: Bed = {
          ...old,
          name: data.name !== undefined ? data.name : old.name,
          number: data.number !== undefined ? data.number : old.number,
          type: data.type !== undefined ? data.type : old.type,
        };
        const outId = await enqueueOutbox({
          action: "UPDATE_BED",
          payload: {
            id: data.id,
            name: merged.name,
            number: merged.number,
            type: merged.type,
          },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        return normalizeBed(merged);
      }
      return updateBed(data);
    },
    onSuccess: (updatedBed) => {
      const bed = normalizeBed(updatedBed);
      qc.setQueryData<Bed[]>(["beds"], (old) =>
        old ? old.map((b) => (b.id === bed.id ? bed : b)) : [bed]
      );
      if (shouldQueueOfflineMutation()) {
        toast.message("Изменения сохранены локально, отправим при сети");
        return;
      }
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useDeleteBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (shouldQueueOfflineMutation()) {
        const outId = await enqueueOutbox({
          action: "DELETE_BED",
          payload: { id },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        return id;
      }
      await deleteBed(id);
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<Bed[]>(["beds"], (old) => old?.filter((b) => b.id !== id));
      if (shouldQueueOfflineMutation()) {
        toast.message("Удаление сохранено локально, отправим при сети");
        return;
      }
      void qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

async function deletePlantPhoto(photoId: string): Promise<void> {
  const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(body.error || "Не удалось удалить фото");
  }
}

export function useDeletePlantPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      if (shouldQueueOfflineMutation()) {
        if (photoId.startsWith("offline-")) {
          await cancelPendingPhotoUploadByTempId(photoId);
          return photoId;
        }
        const outId = await enqueueOutbox({
          action: "DELETE_PHOTO",
          payload: { id: photoId },
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        return photoId;
      }
      await deletePlantPhoto(photoId);
      return photoId;
    },
    onSuccess: (_, photoId) => {
      const old = qc.getQueryData<Bed[]>(["beds"]);
      let blobToRevoke: string | null = null;
      if (old) {
        outer: for (const bed of old) {
          for (const plant of bed.plants ?? []) {
            const ph = (plant.photos ?? []).find((p) => p.id === photoId);
            if (ph?.url?.startsWith("blob:")) {
              blobToRevoke = ph.url;
              break outer;
            }
          }
        }
      }
      if (blobToRevoke) {
        try {
          URL.revokeObjectURL(blobToRevoke);
        } catch {
          /* ignore */
        }
      }
      qc.setQueryData<Bed[]>(["beds"], (prev) => {
        if (!prev) return prev;
        return prev.map((bed) => ({
          ...bed,
          plants: (bed.plants ?? []).map((plant) => ({
            ...plant,
            photos: (plant.photos ?? []).filter((p) => p.id !== photoId),
          })),
        }));
      });
      if (!shouldQueueOfflineMutation()) {
        void qc.invalidateQueries({ queryKey: ["beds"] });
        void qc.invalidateQueries({ queryKey: ["gallery-feed"] });
      }
      if (photoId.startsWith("offline-")) {
        toast.success("Локальное фото убрано");
      } else if (shouldQueueOfflineMutation()) {
        toast.message("Удаление фото в очереди, отправим при сети");
      } else {
        toast.success("Фото удалено");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить фото");
    },
  });
}

export function useUploadPlantPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variables: UploadPlantPhotoParams) => {
      if (shouldQueueOfflineMutation()) {
        const fileToSend = await compressImageFileForUpload(variables.file);
        if (!fileToSend?.size) {
          throw new Error("Пустой файл изображения — попробуйте другое фото");
        }
        const localBlobId = await putLocalBlob(fileToSend, fileToSend.type || "image/jpeg");
        if (!localBlobId) throw new Error("Локальное хранилище недоступно");
        const tempPhotoId = newOfflineClientId();
        const beds = qc.getQueryData<Bed[]>(["beds"]);
        const bed = beds?.find((b) => b.id === variables.bedId);
        const plant = bed?.plants?.find((p) => p.id === variables.plantId);
        const dependsOn = plant?.offlineMeta?.pendingOutboxId;
        const outId = await enqueueOutbox({
          action: "UPLOAD_PHOTO",
          payload: {
            localBlobId,
            plantId: variables.plantId,
            bedId: variables.bedId,
            takenAt: variables.takenAt,
            tempPhotoId,
          },
          dependsOn,
        });
        if (!outId) {
          await deleteLocalBlob(localBlobId);
          throw new Error("Локальное хранилище недоступно");
        }
        const displayUrl = URL.createObjectURL(fileToSend);
        const takenAtRaw = variables.takenAt?.trim();
        const takenAt =
          takenAtRaw && takenAtRaw.length > 0
            ? takenAtRaw.includes("T")
              ? takenAtRaw
              : `${takenAtRaw}T12:00:00.000Z`
            : new Date().toISOString();
        return {
          id: tempPhotoId,
          url: displayUrl,
          takenAt,
          caption: null,
          offlineMeta: { pendingOutboxId: outId, localBlobId },
        } as BedPlantPhoto;
      }
      return uploadPlantPhoto(variables);
    },
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
      if (!shouldQueueOfflineMutation()) {
        await qc.invalidateQueries({ queryKey: ["beds"] });
      }
      if (newPhoto.offlineMeta) {
        toast.message("Фото сохранено локально, загрузим при появлении сети");
      } else {
        toast.success("Фото добавлено");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить фото");
    },
  });
}
