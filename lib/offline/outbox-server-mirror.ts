"use client";

import type { OutboxRecord } from "@/lib/offline/outbox-types";

/**
 * Зеркало клиентской очереди в PostgreSQL (TaskQueue) для просмотра админом.
 * Вызовы без await — не блокируют UI; при офлайне запрос тихо падает.
 */
export async function mirrorOutboxUpsert(record: OutboxRecord): Promise<void> {
  try {
    await fetch("/api/user/outbox-mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientLocalId: record.id,
        action: record.action,
        payload: record.payload,
        createdAt: record.createdAt,
        status: record.status,
      }),
      credentials: "same-origin",
    });
  } catch {
    /* offline */
  }
}

export async function mirrorOutboxCancelled(clientLocalId: string): Promise<void> {
  try {
    await fetch(
      `/api/user/outbox-mirror?clientLocalId=${encodeURIComponent(clientLocalId)}`,
      { method: "DELETE", credentials: "same-origin" }
    );
  } catch {
    /* */
  }
}

export async function mirrorOutboxCompleted(clientLocalId: string): Promise<void> {
  try {
    await fetch("/api/user/outbox-mirror", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientLocalId, status: "completed" }),
      credentials: "same-origin",
    });
  } catch {
    /* */
  }
}

/** После восстановления сети — синхронизировать все pending/failed с сервером. */
export async function mirrorOutboxSyncAllPending(records: OutboxRecord[]): Promise<void> {
  try {
    await fetch("/api/user/outbox-mirror", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: records.map((r) => ({
          clientLocalId: r.id,
          action: r.action,
          payload: r.payload,
          createdAt: r.createdAt,
          status: r.status,
        })),
      }),
      credentials: "same-origin",
    });
  } catch {
    /* */
  }
}
