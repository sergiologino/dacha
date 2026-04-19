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

/** Очистка таблиц без удаления БД (например, после успешного drain). */
export async function wipeLocalOfflineStores(): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.outbox.clear();
  await db.localBlobs.clear();
  await db.persistKv.clear();
}

/** Полное удаление IndexedDB «dacha-ai-local» и сброс синглтона (выход из аккаунта). */
export async function deleteLocalDatabaseEntirely(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = dbSingleton;
  try {
    if (db) {
      await db.delete();
    } else {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase("dacha-ai-local");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  } catch (e) {
    console.warn("[local-db] deleteLocalDatabaseEntirely:", e);
    try {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase("dacha-ai-local");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      /* */
    }
  } finally {
    dbSingleton = null;
  }
}
