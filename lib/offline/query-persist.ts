import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import {
  createDexieAsyncStorage,
  RQ_PERSIST_STORAGE_KEY,
} from "@/lib/offline/rq-persister-storage";

/** Смените при несовместимом формате кэша. */
export const QUERY_PERSIST_BUSTER = "v1";

export function createGardenQueryPersister() {
  return createAsyncStoragePersister({
    storage: createDexieAsyncStorage(),
    key: RQ_PERSIST_STORAGE_KEY,
    throttleTime: 1000,
  });
}

export function shouldPersistGardenQuery(query: Query): boolean {
  if (query.state.status !== "success") return false;
  const root = query.queryKey[0];
  return root === "beds" || root === "plants";
}
