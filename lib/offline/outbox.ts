import { getLocalDb } from "@/lib/offline/local-db";
import type { OutboxActionType, OutboxRecord } from "@/lib/offline/outbox-types";
import {
  mirrorOutboxCancelled,
  mirrorOutboxUpsert,
} from "@/lib/offline/outbox-server-mirror";
import { notifyOutboxChanged } from "@/lib/offline/sync-events";

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function enqueueOutbox(params: {
  action: OutboxActionType | string;
  payload: unknown;
  dependsOn?: string;
}): Promise<string | null> {
  const db = getLocalDb();
  if (!db) return null;
  const id = randomId();
  const row: OutboxRecord = {
    id,
    action: params.action,
    payload: params.payload,
    status: "pending",
    retries: 0,
    createdAt: Date.now(),
    dependsOn: params.dependsOn,
  };
  await db.outbox.put(row);
  notifyOutboxChanged();
  void mirrorOutboxUpsert(row);
  return id;
}

async function releaseOutboxResourcesForRecord(record: OutboxRecord): Promise<void> {
  const p = record.payload as { localBlobId?: string };
  if (!p?.localBlobId) return;
  if (record.action === "UPLOAD_PHOTO" || record.action === "AI_ANALYZE_PHOTO") {
    await deleteLocalBlob(p.localBlobId);
  }
}

/** Pending + failed для синхронизации зеркала на сервер. */
export async function listOutboxTasksForMirrorSync(): Promise<OutboxRecord[]> {
  const db = getLocalDb();
  if (!db) return [];
  const [pending, failed] = await Promise.all([
    db.outbox.where("status").equals("pending").toArray(),
    db.outbox.where("status").equals("failed").toArray(),
  ]);
  return [...pending, ...failed].sort((a, b) => a.createdAt - b.createdAt);
}

/** Все задачи для экрана «Очередь» (кроме успешно удалённых). */
export async function listOutboxTasksForDisplay(): Promise<OutboxRecord[]> {
  const db = getLocalDb();
  if (!db) return [];
  const rows = await db.outbox
    .filter((r) => r.status === "pending" || r.status === "failed" || r.status === "syncing")
    .toArray();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPendingOutbox(): Promise<OutboxRecord[]> {
  const db = getLocalDb();
  if (!db) return [];
  return db.outbox
    .where("status")
    .equals("pending")
    .sortBy("createdAt");
}

/**
 * Первая pending-запись, у которой зависимость уже убрана из outbox
 * (применена) или отсутствует. Записи в статусе `syncing` всё ещё в таблице —
 * ждём, пока зависимость удалят.
 */
export async function pickNextPendingOutbox(): Promise<OutboxRecord | null> {
  const db = getLocalDb();
  if (!db) return null;
  const all = await db.outbox.where("status").equals("pending").sortBy("createdAt");
  for (const r of all) {
    if (!r.dependsOn) return r;
    const dep = await db.outbox.get(r.dependsOn);
    if (!dep) return r;
  }
  return null;
}

export async function countPendingOutbox(): Promise<number> {
  const db = getLocalDb();
  if (!db) return 0;
  return db.outbox.where("status").equals("pending").count();
}

export async function countFailedOutbox(): Promise<number> {
  const db = getLocalDb();
  if (!db) return 0;
  return db.outbox.where("status").equals("failed").count();
}

export async function updateOutboxRecord(
  id: string,
  patch: Partial<Pick<OutboxRecord, "status" | "retries" | "lastError">>
): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.outbox.update(id, patch);
  notifyOutboxChanged();
}

export async function deleteOutboxRecord(
  id: string,
  opts?: { skipMirrorCancel?: boolean }
): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  const row = await db.outbox.get(id);
  if (row) await releaseOutboxResourcesForRecord(row);
  await db.outbox.delete(id);
  notifyOutboxChanged();
  if (!opts?.skipMirrorCancel) void mirrorOutboxCancelled(id);
}

export async function putLocalBlob(blob: Blob, mimeType: string): Promise<string | null> {
  const db = getLocalDb();
  if (!db) return null;
  const id = randomId();
  await db.localBlobs.put({
    id,
    blob,
    mimeType,
    createdAt: Date.now(),
  });
  return id;
}

export async function getLocalBlob(id: string): Promise<Blob | null> {
  const db = getLocalDb();
  if (!db) return null;
  const row = await db.localBlobs.get(id);
  return row?.blob ?? null;
}

export async function deleteLocalBlob(id: string): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.localBlobs.delete(id);
}

/** Отмена неотправленной загрузки фото (temp id в кэше = tempPhotoId в payload). */
export async function cancelPendingPhotoUploadByTempId(tempPhotoId: string): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  const rows = await db.outbox.filter((r) => r.action === "UPLOAD_PHOTO").toArray();
  for (const r of rows) {
    const p = r.payload as { tempPhotoId?: string; localBlobId?: string };
    if (p.tempPhotoId !== tempPhotoId) continue;
    if (p.localBlobId) await deleteLocalBlob(p.localBlobId);
    await db.outbox.delete(r.id);
    void mirrorOutboxCancelled(r.id);
  }
  notifyOutboxChanged();
}
