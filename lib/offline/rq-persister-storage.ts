import { getLocalDb } from "@/lib/offline/local-db";

export const RQ_PERSIST_STORAGE_KEY = "dacha-rq-persist-v1";

/** AsyncStorage для TanStack Query Persist (IndexedDB через Dexie). */
export function createDexieAsyncStorage() {
  return {
    getItem: async (key: string): Promise<string | null> => {
      const db = getLocalDb();
      if (!db) return null;
      const row = await db.persistKv.get(key);
      return row?.value ?? null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const db = getLocalDb();
      if (!db) return;
      await db.persistKv.put({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
      const db = getLocalDb();
      if (!db) return;
      await db.persistKv.delete(key);
    },
  };
}
