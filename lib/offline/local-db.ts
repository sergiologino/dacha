import Dexie, { type Table } from "dexie";
import type { LocalBlobRecord, OutboxRecord } from "@/lib/offline/outbox-types";

/**
 * Локальная БД PWA. Не использовать на сервере.
 */
export class DachaLocalDb extends Dexie {
  outbox!: Table<OutboxRecord, string>;
  localBlobs!: Table<LocalBlobRecord, string>;
  /** Ключ–значение для персиста React Query */
  persistKv!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("dacha-ai-local");
    this.version(1).stores({
      outbox: "id, status, createdAt, action",
      localBlobs: "id, createdAt",
    });
    this.version(2).stores({
      outbox: "id, status, createdAt, action",
      localBlobs: "id, createdAt",
      persistKv: "key",
    });
  }
}

let dbSingleton: DachaLocalDb | null = null;

export function getLocalDb(): DachaLocalDb | null {
  if (typeof window === "undefined") return null;
  if (!dbSingleton) dbSingleton = new DachaLocalDb();
  return dbSingleton;
}

/** Очистка локальных данных при выходе из аккаунта. */
export async function wipeLocalOfflineStores(): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.outbox.clear();
  await db.localBlobs.clear();
  await db.persistKv.clear();
}
