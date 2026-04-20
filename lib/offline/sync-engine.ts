/**
 * Обработка очереди при восстановлении сети.
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  deleteLocalBlob,
  deleteOutboxRecord,
  getLocalBlob,
  pickNextPendingOutbox,
  updateOutboxRecord,
} from "@/lib/offline/outbox";
import { mirrorOutboxCompleted } from "@/lib/offline/outbox-server-mirror";
import { blobToDataUrl } from "@/lib/offline/blob-utils";
import { DrainAuthError, isDrainAuthError } from "@/lib/offline/drain-errors";
import { probeServerReachable } from "@/lib/offline/network-status";
import type { OutboxRecord } from "@/lib/offline/outbox-types";
import {
  notifyAnalysesSynced,
  notifyChatHistorySynced,
  notifyGallerySynced,
  notifyGuideAiSearchReady,
  notifyGuideDetailReady,
  notifyShareLinkReady,
} from "@/lib/offline/sync-events";

export type SyncEngineResult = {
  processed: number;
  errors: number;
  skippedOffline: boolean;
  /** Сессия недействительна — запись возвращена в pending, drain остановлен */
  authRequired?: boolean;
};

let queryClientRef: QueryClient | null = null;

export function registerOfflineQueryClient(client: QueryClient | null): void {
  queryClientRef = client;
}

function invalidateGardenQueries(): void {
  void queryClientRef?.invalidateQueries({ queryKey: ["beds"] });
  void queryClientRef?.invalidateQueries({ queryKey: ["plants"] });
  void queryClientRef?.invalidateQueries({ queryKey: ["gallery-feed"] });
}

/** offline-* и локальные id → серверные id в рамках одной сессии drain. */
export type IdMaps = {
  bed: Map<string, string>;
  plant: Map<string, string>;
  event: Map<string, string>;
};

function createIdMaps(): IdMaps {
  return {
    bed: new Map(),
    plant: new Map(),
    event: new Map(),
  };
}

async function readApiError(res: Response): Promise<string> {
  const t = await res.text();
  try {
    const j = JSON.parse(t) as { error?: string };
    return j.error || t || res.statusText;
  } catch {
    return t || res.statusText;
  }
}

async function assertOkForDrain(res: Response): Promise<void> {
  if (res.status === 401 || res.status === 403) {
    throw new DrainAuthError();
  }
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

function drainBackoffMs(retriesAfterFailure: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.min(retriesAfterFailure, 5));
}

async function applyOne(record: OutboxRecord, maps: IdMaps): Promise<void> {
  const p = record.payload as Record<string, unknown>;

  switch (record.action) {
    case "CREATE_BED": {
      const tempClientId = String(p.tempClientId ?? "");
      const body = {
        name: p.name,
        number: p.number,
        type: p.type,
      };
      const res = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const bed = (await res.json()) as { id: string };
      if (tempClientId) maps.bed.set(tempClientId, bed.id);
      return;
    }
    case "UPDATE_BED": {
      const id = maps.bed.get(String(p.id)) ?? String(p.id);
      const res = await fetch("/api/beds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: p.name, number: p.number, type: p.type }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "DELETE_BED": {
      const id = maps.bed.get(String(p.id)) ?? String(p.id);
      const res = await fetch("/api/beds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "CREATE_PLANT": {
      const tempClientId = String(p.tempClientId ?? "");
      const rawBedId = p.bedId != null ? String(p.bedId) : undefined;
      const bedId = rawBedId ? maps.bed.get(rawBedId) ?? rawBedId : undefined;
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          bedId: bedId || undefined,
          plantedDate: p.plantedDate,
          cropSlug: p.cropSlug,
        }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const plant = (await res.json()) as { id: string };
      if (tempClientId) maps.plant.set(tempClientId, plant.id);
      return;
    }
    case "UPDATE_PLANT": {
      const id = maps.plant.get(String(p.id)) ?? String(p.id);
      const res = await fetch("/api/plants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          plantedDate: p.plantedDate,
          name: p.name,
          notes: p.notes,
          status: p.status,
        }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "DELETE_PLANT": {
      const id = maps.plant.get(String(p.id)) ?? String(p.id);
      const res = await fetch("/api/plants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "CREATE_TIMELINE_EVENT": {
      const tempEventId = String(p.tempEventId ?? "");
      const rawPlantId = String(p.plantId);
      const plantId = maps.plant.get(rawPlantId) ?? rawPlantId;
      const body = p.body as Record<string, unknown>;
      const res = await fetch(`/api/plants/${plantId}/timeline/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const ev = (await res.json()) as { id: string };
      if (tempEventId) maps.event.set(tempEventId, ev.id);
      return;
    }
    case "PATCH_TIMELINE_EVENT": {
      const plantId = maps.plant.get(String(p.plantId)) ?? String(p.plantId);
      const eventId = maps.event.get(String(p.eventId)) ?? String(p.eventId);
      const body = p.body as Record<string, unknown>;
      const res = await fetch(`/api/plants/${plantId}/timeline/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "DELETE_TIMELINE_EVENT": {
      const plantId = maps.plant.get(String(p.plantId)) ?? String(p.plantId);
      const eventId = maps.event.get(String(p.eventId)) ?? String(p.eventId);
      const res = await fetch(`/api/plants/${plantId}/timeline/events/${eventId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "UPLOAD_PHOTO": {
      const localBlobId = String(p.localBlobId ?? "");
      const blob = await getLocalBlob(localBlobId);
      if (!blob) throw new Error("Локальный файл фото не найден (возможно, уже отправлен)");
      const plantId = maps.plant.get(String(p.plantId)) ?? String(p.plantId);
      const bedId = maps.bed.get(String(p.bedId)) ?? String(p.bedId);
      const file = new File([blob], "upload.jpg", { type: blob.type || "image/jpeg" });
      const formData = new FormData();
      formData.set("file", file);
      formData.set("plantId", plantId);
      formData.set("bedId", bedId);
      if (p.takenAt != null && String(p.takenAt)) {
        formData.set("takenAt", String(p.takenAt));
      }
      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      await deleteLocalBlob(localBlobId);
      return;
    }
    case "DELETE_PHOTO": {
      const id = String(p.id);
      const res = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "AI_ANALYZE_PHOTO": {
      const localBlobId = String(p.localBlobId ?? "");
      const blob = await getLocalBlob(localBlobId);
      if (!blob) throw new Error("Локальное изображение для анализа не найдено");
      const image = await blobToDataUrl(blob);
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      await deleteLocalBlob(localBlobId);
      notifyAnalysesSynced();
      return;
    }
    case "AI_CHAT_MESSAGE": {
      const messages = p.messages as { role: string; content: string }[];
      const networkName = p.networkName as string | undefined;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, networkName }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const data = (await res.json()) as { message?: string };
      const assistantText = typeof data.message === "string" ? data.message : "";
      const guideCtx = p.guideAiSearch as { searchTerm?: string } | undefined;
      const term = typeof guideCtx?.searchTerm === "string" ? guideCtx.searchTerm.trim() : "";
      if (term && assistantText) notifyGuideAiSearchReady(term, assistantText);
      notifyChatHistorySynced();
      return;
    }
    case "AI_TIMELINE_GENERATE": {
      const rawPid = String(p.plantId);
      const plantId = maps.plant.get(rawPid) ?? rawPid;
      const res = await fetch(`/api/plants/${plantId}/timeline/generate`, {
        method: "POST",
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "GUIDE_DETAIL_FETCH": {
      const slug = String(p.slug ?? "");
      const res = await fetch(`/api/guide/detail?slug=${encodeURIComponent(slug)}`, {
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const data = (await res.json()) as { content?: string };
      const content = typeof data.content === "string" ? data.content : "";
      notifyGuideDetailReady(slug, content);
      return;
    }
    case "SHARE_CONTENT": {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: p.type, data: p.data }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      const shareData = (await res.json()) as { url?: string };
      const shareUrl = typeof shareData.url === "string" ? shareData.url : "";
      if (shareUrl) {
        notifyShareLinkReady(shareUrl, String(p.type ?? ""));
      }
      return;
    }
    case "GALLERY_LIKE": {
      const photoId = String(p.photoId ?? "");
      const setLiked = Boolean(p.setLiked);
      const res = await fetch(`/api/gallery/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setLiked }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "GALLERY_COMMENT": {
      const photoId = String(p.photoId ?? "");
      const commentText = String(
        (p as { content?: string; comment?: string }).content ??
          (p as { comment?: string }).comment ??
          ""
      );
      const res = await fetch(`/api/gallery/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "PAGE_VISIT": {
      const path = String(p.path ?? "");
      const res = await fetch("/api/analytics/page-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "PUSH_SUBSCRIBE": {
      const sub = p.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    case "PUSH_UNSUBSCRIBE": {
      const endpoint = String(p.endpoint ?? "");
      const res = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
        credentials: "same-origin",
      });
      await assertOkForDrain(res);
      return;
    }
    default:
      throw new Error(`sync-engine: неизвестное действие «${record.action}»`);
  }
}

export async function drainOutbox(): Promise<SyncEngineResult> {
  const reachable = await probeServerReachable();
  if (!reachable) {
    return { processed: 0, errors: 0, skippedOffline: true };
  }

  const maps = createIdMaps();
  let processed = 0;
  let errors = 0;
  let authRequired = false;
  const galleryTouchedIds = new Set<string>();

  for (;;) {
    if (!(await probeServerReachable())) break;
    const rec = await pickNextPendingOutbox();
    if (!rec) break;

    await updateOutboxRecord(rec.id, { status: "syncing" });
    try {
      await applyOne(rec, maps);
      void mirrorOutboxCompleted(rec.id);
      await deleteOutboxRecord(rec.id, { skipMirrorCancel: true });
      processed += 1;
      if (rec.action === "GALLERY_LIKE" || rec.action === "GALLERY_COMMENT") {
        const op = rec.payload as Record<string, unknown>;
        const pid = String(op.photoId ?? "");
        if (pid) galleryTouchedIds.add(pid);
      }
    } catch (e) {
      if (isDrainAuthError(e)) {
        await updateOutboxRecord(rec.id, {
          status: "pending",
          lastError: "Сессия истекла — войдите снова",
        });
        authRequired = true;
        errors += 1;
        break;
      }
      const msg = e instanceof Error ? e.message : String(e);
      const retries = rec.retries + 1;
      await updateOutboxRecord(rec.id, {
        status: retries >= 8 ? "failed" : "pending",
        retries,
        lastError: msg,
      });
      errors += 1;
      if (retries < 8) {
        await new Promise((r) => setTimeout(r, drainBackoffMs(retries)));
      }
    }
  }

  if (processed > 0) invalidateGardenQueries();
  if (galleryTouchedIds.size > 0) {
    notifyGallerySynced([...galleryTouchedIds]);
  }

  return { processed, errors, skippedOffline: false, authRequired };
}
