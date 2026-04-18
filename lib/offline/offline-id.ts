/** Стабильный клиентский id до ответа сервера (префикс для маппинга в sync-engine). */
export function newOfflineClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `offline-${crypto.randomUUID()}`;
  }
  return `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
