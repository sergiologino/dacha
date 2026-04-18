/**
 * Обработка очереди при восстановлении сети.
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  deleteLocalBlob,
  deleteOutboxRecord,
  pickNextPendingOutbox,
  updateOutboxRecord,
} from "@/lib/offline/outbox";
import { probeServerReachable } from "@/lib/offline/network-status";
import type { OutboxRecord } from "@/lib/offline/outbox-types";

export type SyncEngineResult = {
  processed: number;
  errors: number;
  skippedOffline: boolean;
};

let queryClientRef: QueryClient | null = null;

export function registerOfflineQueryClient(client: QueryClient | null): void {
  queryClientRef = client;
}

function invalidateGardenQueries(): void {
  void queryClientRef?.invalidateQueries({ queryKey: ["beds"] });
  void queryClientRef?.invalidateQueries({ queryKey: ["plants"] });
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
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
      if (!res.ok) throw new Error(await readApiError(res));
      return;
    }
    case "DELETE_TIMELINE_EVENT": {
      const plantId = maps.plant.get(String(p.plantId)) ?? String(p.plantId);
      const eventId = maps.event.get(String(p.eventId)) ?? String(p.eventId);
      const res = await fetch(`/api/plants/${plantId}/timeline/events/${eventId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(await readApiError(res));
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

  for (;;) {
    if (!(await probeServerReachable())) break;
    const rec = await pickNextPendingOutbox();
    if (!rec) break;

    await updateOutboxRecord(rec.id, { status: "syncing" });
    try {
      await applyOne(rec, maps);
      await deleteOutboxRecord(rec.id);
      processed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const retries = rec.retries + 1;
      await updateOutboxRecord(rec.id, {
        status: retries >= 8 ? "failed" : "pending",
        retries,
        lastError: msg,
      });
      errors += 1;
      if (retries >= 8) break;
    }
  }

  if (processed > 0) invalidateGardenQueries();

  return { processed, errors, skippedOffline: false };
}
