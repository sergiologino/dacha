/**
 * Прямые запросы к upload.wikimedia.org из браузера часто блокируются (гео/сеть).
 * Иллюстрации справочника и лайфхаков должны открываться через POST/GET нашего прокси
 * `/api/guide-image`, чтобы байты шли с origin приложения.
 */
export function proxifyGuideMediaUrl(src: string): string {
  const s = src.trim();
  if (!s) return s;
  if (s.startsWith("/api/guide-image")) return s;
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return s;
  try {
    const u = new URL(s);
    if (u.protocol === "https:" && u.hostname === "upload.wikimedia.org") {
      return `/api/guide-image?url=${encodeURIComponent(s)}`;
    }
  } catch {
    return s;
  }
  return s;
}
