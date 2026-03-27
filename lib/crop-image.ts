import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";
import { normalizeCropText } from "@/lib/crop-community";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

/** Запасные иллюстрации с Commons (все upload.wikimedia.org — уже в remotePatterns). */
export const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  Овощи:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/640px-Tomato_je.jpg",
  Ягоды:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg/640px-Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg",
  Зелень:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Petroselinum.jpg/640px-Petroselinum.jpg",
  "Пряные травы":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Illustration_Anethum_graveolens_clean.jpg/640px-Illustration_Anethum_graveolens_clean.jpg",
  Бобовые:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Peas_in_pods_-_Studio.jpg/640px-Peas_in_pods_-_Studio.jpg",
  "Плодовые деревья":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Malus_domestica_2.jpg/640px-Malus_domestica_2.jpg",
  Цветы:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lavender_flower_field.jpg/640px-Lavender_flower_field.jpg",
};

const GENERIC_FALLBACK =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Allium_sativum_Woodwill_1793.jpg/640px-Allium_sativum_Woodwill_1793.jpg";

function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of labels) {
    const s = raw.trim();
    if (s.length < 2) continue;
    const k = normalizeCropText(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

export function buildImageLabelsForCommunityCrop(params: {
  query: string;
  name: string;
  baseCropName?: string;
  varietyName?: string;
  staticBaseName?: string;
}): string[] {
  const { query, name, baseCropName, varietyName, staticBaseName } = params;
  const base = (staticBaseName || baseCropName || "").trim();
  const variety = (varietyName || "").trim();
  const labels: string[] = [];

  if (base && variety) {
    labels.push(`${base} ${variety}`, `${base}, сорт ${variety}`, `${base} сорт ${variety}`, `${variety} ${base}`);
  }
  labels.push(query, name);
  if (name !== query) labels.push(`${name} овощ`, `${name} растение`);
  return dedupeLabels(labels);
}

function parseImageUrlFromUnknown(obj: unknown, depth = 0): string | null {
  if (depth > 8 || obj == null) return null;
  if (typeof obj === "string" && (obj.startsWith("http://") || obj.startsWith("https://"))) return obj;
  if (typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;

  if (typeof o.url === "string" && o.url.startsWith("http")) return o.url;
  if (typeof o.image_url === "string" && o.image_url.startsWith("http")) return o.image_url;

  if (Array.isArray(o.data)) {
    for (const item of o.data) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      if (typeof e.url === "string" && e.url.startsWith("http")) return e.url;
      if (typeof e.b64_json === "string" && e.b64_json.length > 50)
        return `data:image/png;base64,${e.b64_json}`;
    }
  }

  for (const k of ["response", "output", "result", "body", "data"]) {
    if (k in o) {
      const inner = parseImageUrlFromUnknown(o[k], depth + 1);
      if (inner) return inner;
    }
  }
  return null;
}

export function extractImageUrlFromIntegratorPayload(data: Record<string, unknown>): string | null {
  const fromRoot = parseImageUrlFromUnknown(data);
  if (fromRoot) return fromRoot;
  if (data.response !== undefined) {
    const r = parseImageUrlFromUnknown(data.response);
    if (r) return r;
  }
  return null;
}

export async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  const variants = [`${searchTerm} растение`, `${searchTerm} vegetable`, searchTerm];

  for (const variant of variants) {
    for (const lang of ["ru", "en"]) {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        generator: "search",
        gsrsearch: variant,
        gsrlimit: "8",
        prop: "pageimages",
        piprop: "original",
      });

      try {
        const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) continue;

        const wikiData = (await response.json()) as {
          query?: { pages?: Record<string, { original?: { source?: string } }> };
        };

        const image = Object.values(wikiData.query?.pages ?? {}).find(
          (page) => page.original?.source?.includes("upload.wikimedia.org"),
        )?.original?.source;

        if (image) return image;
      } catch {
        /* next */
      }
    }
  }

  return null;
}

/** Поиск файла на Wikimedia Commons по тексту (часто лучше для сортов). */
export async function fetchWikimediaCommonsImage(searchTerm: string): Promise<string | null> {
  const searchParams = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "search",
    srsearch: searchTerm,
    srnamespace: "6",
    srlimit: "10",
  });

  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${searchParams}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { query?: { search?: { title: string }[] } };
    const titles = data.query?.search?.map((s) => s.title).filter(Boolean) ?? [];
    for (const title of titles.slice(0, 6)) {
      const ii = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        titles: title,
        prop: "imageinfo",
        iiprop: "url",
        iiurlwidth: "1280",
      });
      const ir = await fetch(`https://commons.wikimedia.org/w/api.php?${ii}`, { cache: "no-store" });
      if (!ir.ok) continue;
      const idata = (await ir.json()) as {
        query?: { pages?: Record<string, { imageinfo?: { url?: string }[] }> };
      };
      const url = Object.values(idata.query?.pages ?? {})
        .flatMap((p) => p.imageinfo ?? [])
        .find((info) => info.url?.includes("upload.wikimedia.org"))?.url;
      if (url) return url;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function generateCropImage(
  cropLabel: string,
  category: string,
  userId: string | null,
): Promise<{ url: string | null; responseData?: Record<string, unknown> }> {
  if (!AI_URL || !AI_KEY) return { url: null };
  const template =
    (await getPromptByKey("crops_image")) ??
    "Ультрареалистичная фотография {{{cropLabel}}}, категория культуры: {{category}}. Именно этот сорт или вид — внешний вид плодов и растения должны соответствовать названию. Натуральный свет, фотокачество, ботаническая точность, без рисунка и текста, как предметное фото для каталога.";
  const prompt = template
    .replace(/\{\{cropLabel\}\}/g, cropLabel)
    .replace(/\{\{cropName\}\}/g, cropLabel)
    .replace(/\{\{category\}\}/g, category);
  try {
    const res = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: { "X-API-Key": AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "guide@dacha-ai.ru",
        networkName: "openai-gpt-image-1.5",
        requestType: "image_gen",
        payload: { prompt, size: "1024x1024" },
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    const url = extractImageUrlFromIntegratorPayload(data);
    await logAiCall({
      userId,
      endpoint: "/api/crops",
      requestType: "image_gen",
      messages: [{ role: "user", content: prompt }],
      response: url ? "[image generated]" : null,
      responseData: data,
      status: data.status === "failed" ? "failed" : "success",
      errorMessage: data.status === "failed" ? (data.errorMessage as string) : undefined,
    });
    if (data.status === "failed") return { url: null, responseData: data };
    return { url: url || null, responseData: data };
  } catch (err) {
    await logAiCall({
      userId,
      endpoint: "/api/crops",
      requestType: "image_gen",
      messages: [{ role: "user", content: prompt }],
      status: "failed",
      errorMessage: err instanceof Error ? err.message : undefined,
    });
    return { url: null };
  }
}

export type ResolveCropImageParams = {
  labels: string[];
  category: string;
  userId: string | null;
};

/** Всегда возвращает URL (последний шаг — заглушка категории). */
export async function resolveCropImageUrl(params: ResolveCropImageParams): Promise<string> {
  const { labels, category, userId } = params;
  const fallback =
    CATEGORY_FALLBACK_IMAGE[category] ?? CATEGORY_FALLBACK_IMAGE["Овощи"] ?? GENERIC_FALLBACK;

  for (const label of labels) {
    const wiki = await fetchWikipediaImage(label);
    if (wiki) return wiki;
  }
  for (const label of labels) {
    const commons = await fetchWikimediaCommonsImage(label);
    if (commons) return commons;
  }

  for (const label of labels) {
    const { url } = await generateCropImage(label, category, userId);
    if (url) return url;
  }

  if (AI_URL && AI_KEY) {
    const genericLabel = `${labels[0] ?? "культура"}, реалистичное фото урожая и растения`;
    const { url: retry } = await generateCropImage(genericLabel, category, userId);
    if (retry) return retry;
  }

  return fallback;
}

export function attachVarietyImage<T extends { name: string; desc: string; imageUrl?: string }>(
  varieties: T[] | undefined,
  varietyName: string,
  imageUrl: string,
): T[] | undefined {
  if (!varieties?.length || !varietyName?.trim() || !imageUrl) return varieties;
  const key = normalizeCropText(varietyName);
  let touched = false;
  const next = varieties.map((v) => {
    if (normalizeCropText(v.name) !== key) return v;
    touched = true;
    return { ...v, imageUrl };
  });
  return touched ? next : varieties;
}
