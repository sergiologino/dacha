/**
 * Скачивает иллюстрации справочника и лайфхаков в public/images/guide/
 * и обновляет lib/data/crops.ts, imageUrl лайфхаков в БД, lib/crop-image.ts.
 *
 * Повторный запуск: уже локальные пути (/) пропускает.
 *
 * Запуск: npx tsx scripts/sync-guide-assets.ts
 */
import "dotenv/config";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { crops } from "../lib/data/crops";
import {
  CATEGORY_FALLBACK_IMAGE,
  GENERIC_FALLBACK,
} from "../lib/crop-image";

const ROOT = join(process.cwd(), "public/images/guide");
const UA =
  "DachaAI-GuideAssetSync/1.0 (https://dacha-ai.ru; local mirror of guide images)";

const prisma = new PrismaClient();

/** Если thumb отдаёт 404, пробуем оригинал без /thumb/…/NNpx- (хеш в пути может быть устаревшим). */
function directCommonsFromThumbUrl(url: string): string | null {
  if (!url.includes("/commons/thumb/")) return null;
  try {
    const u = new URL(url);
    let path = u.pathname.replace("/commons/thumb/", "/commons/");
    path = path.replace(/\/\d+px-[^/]+$/i, "");
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

/** Имя файла из URL upload.wikimedia.org (thumb или прямой /commons/…/file). */
function commonsFilenameFromUploadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("wikimedia.org")) return null;
    if (u.pathname.includes("/commons/thumb/")) {
      const after = u.pathname.split("/commons/thumb/")[1] ?? "";
      const segs = after.split("/").filter(Boolean);
      if (segs.length >= 3) {
        try {
          return decodeURIComponent(segs[2]);
        } catch {
          return segs[2];
        }
      }
    }
    if (u.pathname.includes("/commons/") && !u.pathname.includes("/commons/thumb/")) {
      const seg = u.pathname.split("/").pop();
      if (!seg) return null;
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Актуальный URL файла по имени (если сменился путь MD5 на Commons). */
async function resolveCommonsCanonicalUploadUrl(
  filename: string
): Promise<string | null> {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(`File:${filename}`) +
    "&prop=imageinfo&iiprop=url&format=json";
  const res = await fetch(api, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { missing?: true; imageinfo?: { url: string }[] }
      >;
    };
  };
  const page = Object.values(j.query?.pages ?? {})[0];
  if (!page || page.missing || !page.imageinfo?.[0]?.url) return null;
  return page.imageinfo[0].url;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRemote(url: string): Promise<{ buf: Buffer; ext: string }> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
          "User-Agent": UA,
        },
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429) {
        const ra = res.headers.get("retry-after");
        const parsed = ra ? Number.parseInt(ra, 10) : NaN;
        const fromHeader =
          Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 0;
        const wait = Math.max(fromHeader, 5000 + attempt * 3000);
        console.warn(`429, ждём ${wait}ms и повтор…`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(800 * (attempt + 1));
        continue;
      }
      const ct = res.headers.get("content-type") ?? "";
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) {
        lastErr = new Error("empty body");
        continue;
      }
      const ext = extFromContentType(ct, url);
      return { buf, ext };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

async function fetchRemoteMaybeDirect(url: string): Promise<{ buf: Buffer; ext: string }> {
  let lastErr: unknown;
  try {
    return await fetchRemote(url);
  } catch (e) {
    lastErr = e;
  }
  const direct = directCommonsFromThumbUrl(url);
  if (direct && direct !== url) {
    try {
      console.warn("retry direct:", direct);
      await sleep(500);
      return await fetchRemote(direct);
    } catch (e) {
      lastErr = e;
    }
  }
  const fn = commonsFilenameFromUploadUrl(url);
  if (fn) {
    const canonical = await resolveCommonsCanonicalUploadUrl(fn);
    if (canonical && canonical !== url && canonical !== direct) {
      try {
        console.warn("retry commons API:", canonical);
        await sleep(400);
        return await fetchRemote(canonical);
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function extFromContentType(ct: string, url: string): string {
  const lower = ct.toLowerCase();
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (/\.png(\?|$)/i.test(url)) return ".png";
  if (/\.webp(\?|$)/i.test(url)) return ".webp";
  if (/\.gif(\?|$)/i.test(url)) return ".gif";
  return ".jpg";
}

function writeIfChanged(abs: string, buf: Buffer) {
  if (existsSync(abs)) {
    const old = readFileSync(abs);
    if (Buffer.compare(old, buf) === 0) return;
  }
  writeFileSync(abs, buf);
  console.log("wrote", abs);
}

async function main() {
  try {
  mkdirSync(join(ROOT, "crops"), { recursive: true });
  mkdirSync(join(ROOT, "lifehacks"), { recursive: true });
  mkdirSync(join(ROOT, "fallbacks"), { recursive: true });

  const cropPaths = new Map<string, string>();

  for (const c of crops) {
    const url = c.imageUrl?.trim();
    if (!url) continue;
    if (url.startsWith("/")) {
      cropPaths.set(c.slug, url);
      continue;
    }
    if (!/^https?:\/\//i.test(url)) continue;
    const { buf, ext } = await fetchRemoteMaybeDirect(url);
    const safeSlug = c.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const rel = `/images/guide/crops/${safeSlug}${ext}`;
    const abs = join(process.cwd(), "public", rel.slice(1));
    writeIfChanged(abs, buf);
    cropPaths.set(c.slug, rel);
    await sleep(1200);
  }

  const hacks = await prisma.guideHack.findMany({
    select: { slug: true, imageUrl: true },
  });
  for (const h of hacks) {
    const url = h.imageUrl?.trim();
    if (!url) continue;
    if (url.startsWith("/")) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    const { buf, ext } = await fetchRemoteMaybeDirect(url);
    const safeSlug = h.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const rel = `/images/guide/lifehacks/${safeSlug}${ext}`;
    const abs = join(process.cwd(), "public", rel.slice(1));
    writeIfChanged(abs, buf);
    await prisma.guideHack.update({
      where: { slug: h.slug },
      data: { imageUrl: rel },
    });
    await sleep(1200);
  }

  const fallbackKeyToFile: Record<string, string> = {
    Овощи: "category-vegetables",
    Ягоды: "category-berries",
    Зелень: "category-greens",
    "Пряные травы": "category-herbs",
    Бобовые: "category-legumes",
    "Плодовые деревья": "category-fruit-trees",
    Цветы: "category-flowers",
  };

  const fallbackPaths: Record<string, string> = {};

  for (const [cat, fname] of Object.entries(fallbackKeyToFile)) {
    const url = CATEGORY_FALLBACK_IMAGE[cat as keyof typeof CATEGORY_FALLBACK_IMAGE];
    if (!url) continue;
    let rel: string;
    if (url.startsWith("/")) {
      rel = url;
    } else {
      const { buf, ext } = await fetchRemoteMaybeDirect(url);
      rel = `/images/guide/fallbacks/${fname}${ext}`;
      const abs = join(process.cwd(), "public", rel.slice(1));
      writeIfChanged(abs, buf);
      await sleep(1200);
    }
    fallbackPaths[cat] = rel;
  }

  {
    let rel: string;
    if (GENERIC_FALLBACK.startsWith("/")) {
      rel = GENERIC_FALLBACK;
    } else {
      const { buf, ext } = await fetchRemoteMaybeDirect(GENERIC_FALLBACK);
      rel = `/images/guide/fallbacks/generic-allium${ext}`;
      const abs = join(process.cwd(), "public", rel.slice(1));
      writeIfChanged(abs, buf);
      await sleep(1200);
    }
    fallbackPaths["__generic"] = rel;
  }

  // --- crops.ts
  const cropsPath = join(process.cwd(), "lib/data/crops.ts");
  const cropLines = readFileSync(cropsPath, "utf8").split("\n");
  for (let i = 0; i < cropLines.length; i++) {
    const line = cropLines[i];
    const slugMatch = line.match(/slug:\s*"([^"]+)"/);
    if (!slugMatch || !line.includes("imageUrl:")) continue;
    const slug = slugMatch[1];
    const newPath = cropPaths.get(slug);
    if (!newPath) continue;
    cropLines[i] = line.replace(
      /imageUrl:\s*"[^"]*"/,
      `imageUrl: "${newPath}"`
    );
  }
  writeFileSync(cropsPath, cropLines.join("\n"), "utf8");
  console.log("updated", cropsPath);

  // --- crop-image.ts
  const newCategoryBlock = `/** Запасные иллюстрации (локальные файлы в public/images/guide/fallbacks). */
export const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  Овощи: "${fallbackPaths["Овощи"]}",
  Ягоды: "${fallbackPaths["Ягоды"]}",
  Зелень: "${fallbackPaths["Зелень"]}",
  "Пряные травы": "${fallbackPaths["Пряные травы"]}",
  Бобовые: "${fallbackPaths["Бобовые"]}",
  "Плодовые деревья": "${fallbackPaths["Плодовые деревья"]}",
  Цветы: "${fallbackPaths["Цветы"]}",
};

export const GENERIC_FALLBACK = "${fallbackPaths["__generic"]}";`;

  const cropImagePath = join(process.cwd(), "lib/crop-image.ts");
  let ci = readFileSync(cropImagePath, "utf8");
  ci = ci.replace(
    /\/\*\* Запасные иллюстрации[\s\S]*?const GENERIC_FALLBACK =\s*\n\s*"[^"]+";/,
    newCategoryBlock
  );
  writeFileSync(cropImagePath, ci, "utf8");
  console.log("updated lib/crop-image.ts");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
