import { getLocalDb } from "@/lib/offline/local-db";
import type { OutboxActionType, OutboxRecord } from "@/lib/offline/outbox-types";

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
  return id;
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

export async function updateOutboxRecord(
  id: string,
  patch: Partial<Pick<OutboxRecord, "status" | "retries" | "lastError">>
): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.outbox.update(id, patch);
}

export async function deleteOutboxRecord(id: string): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.outbox.delete(id);
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
