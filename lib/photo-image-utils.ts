/**
 * Нормализация поля url в Photo для отдачи файла (юнит-тестируется).
 */
export function normalizeStoredPhotoUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("data:") && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.replace(/^\/+/, "");
    if (url.startsWith("uploads/")) url = `/${url}`;
  }
  return url;
}
