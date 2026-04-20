/**
 * Типы исходящей очереди офлайн-синхронизации.
 * `action` можно согласовать с Prisma TaskQueue.action при серверном зеркалировании.
 */
export type OutboxStatus = "pending" | "syncing" | "failed" | "done";

/** Известные операции; список расширяется по мере внедрения (см. docs/ai/OFFLINE_SYNC.md). */
export type OutboxActionType =
  | "CREATE_BED"
  | "UPDATE_BED"
  | "DELETE_BED"
  | "CREATE_PLANT"
  | "UPDATE_PLANT"
  | "DELETE_PLANT"
  | "CREATE_TIMELINE_EVENT"
  | "PATCH_TIMELINE_EVENT"
  | "DELETE_TIMELINE_EVENT"
  | "DELETE_PHOTO"
  | "UPLOAD_PHOTO"
  | "AI_ANALYZE_PHOTO"
  | "AI_CHAT_MESSAGE"
  | "AI_TIMELINE_GENERATE"
  | "GUIDE_DETAIL_FETCH"
  | "SHARE_CONTENT"
  | "GALLERY_LIKE"
  | "GALLERY_COMMENT"
  | "PAGE_VISIT"
  | "PUSH_SUBSCRIBE"
  | "PUSH_UNSUBSCRIBE";

export interface OutboxRecord {
  id: string;
  action: OutboxActionType | string;
  payload: unknown;
  status: OutboxStatus;
  retries: number;
  lastError?: string;
  createdAt: number;
  /** Опционально: id другой записи outbox, которую нужно применить раньше */
  dependsOn?: string;
}

export interface LocalBlobRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}
