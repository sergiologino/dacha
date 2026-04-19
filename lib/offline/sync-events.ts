/** События для обновления UI после офлайн-синхронизации (только в браузере). */

export const OUTBOX_CHANGED_EVENT = "dacha-outbox-changed";
export const CHAT_HISTORY_SYNC_EVENT = "dacha-offline-sync-chat";
export const ANALYSES_SYNC_EVENT = "dacha-offline-sync-analyses";
export const GUIDE_DETAIL_READY_EVENT = "dacha-guide-detail-ready";

export function notifyOutboxChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OUTBOX_CHANGED_EVENT));
}

export function notifyChatHistorySynced(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHAT_HISTORY_SYNC_EVENT));
}

export function notifyAnalysesSynced(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ANALYSES_SYNC_EVENT));
}

export function notifyGuideDetailReady(slug: string, content: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GUIDE_DETAIL_READY_EVENT, { detail: { slug, content } })
  );
}
