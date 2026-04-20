/** События для обновления UI после офлайн-синхронизации (только в браузере). */

export const OUTBOX_CHANGED_EVENT = "dacha-outbox-changed";
export const CHAT_HISTORY_SYNC_EVENT = "dacha-offline-sync-chat";
export const ANALYSES_SYNC_EVENT = "dacha-offline-sync-analyses";
export const GUIDE_DETAIL_READY_EVENT = "dacha-guide-detail-ready";
/** Ответ нейроэксперта из outbox (страница справочника /guide). */
export const GUIDE_AI_SEARCH_READY_EVENT = "dacha-guide-ai-search-ready";
/** Ссылка «Поделиться» создана после отправки из очереди. */
export const SHARE_LINK_READY_EVENT = "dacha-share-link-ready";
/** Лайк/коммент из очереди ушли на сервер — обновить галерею. */
export const GALLERY_SYNCED_EVENT = "dacha-gallery-synced";

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

export function notifyGuideAiSearchReady(searchTerm: string, content: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GUIDE_AI_SEARCH_READY_EVENT, { detail: { searchTerm, content } })
  );
}

export function notifyShareLinkReady(url: string, shareKind: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SHARE_LINK_READY_EVENT, { detail: { url, shareKind } })
  );
}

export function notifyGallerySynced(photoIds: string[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GALLERY_SYNCED_EVENT, { detail: { photoIds } })
  );
}
