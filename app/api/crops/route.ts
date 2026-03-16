import { NextRequest, NextResponse } from "next/server";
import {
  findExistingCropMatch,
  inferVarietyName,
  mergeVarieties,
  normalizeCropText,
} from "@/lib/crop-community";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { getMergedCrops } from "@/lib/crops-merge";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const CATEGORIES = ["Овощи", "Ягоды", "Зелень", "Пряные травы", "Бобовые", "Плодовые деревья", "Цветы"];

const RU_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
function transliterate(str: string): string {
  return str
    .toLowerCase()
    .split("")
    .map((c) => RU_TO_LAT[c] ?? (c.match(/[a-z0-9]/i) ? c : ""))
    .join("");
}

/** GET — объединённый список культур (статика + БД). */
export async function GET() {
  try {
    const merged = await getMergedCrops(() =>
      prisma.crop.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          plantMonths: true,
          harvestMonths: true,
          waterSchedule: true,
          regions: true,
          careNotes: true,
          imageUrl: true,
          varieties: true,
        },
      })
    );
    return NextResponse.json(merged);
  } catch (err) {
    console.error("Crops GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Генерация изображения культуры через интегратор (image_gen). */
async function generateCropImage(
  cropName: string,
  category: string,
  userId: string | null
): Promise<{ url: string | null; responseData?: Record<string, unknown> }> {
  if (!AI_URL || !AI_KEY) return { url: null };
  const template =
    (await getPromptByKey("crops_image")) ??
    "Ультрареалистичная фотография растения или овоща/фрукта: {{cropName}}, категория {{category}}. Натуральный свет, фотокачество, ботаническая точность, без рисунка, без иллюстративного стиля, без текста, как настоящая предметная фотография для каталога растений.";
  const prompt = template.replace("{{cropName}}", cropName).replace("{{category}}", category);
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
    const url =
      (data.response as { data?: { url?: string; b64_json?: string }[]; url?: string })?.data?.[0]?.url ??
      (data.response as { url?: string })?.url ??
      ((data.response as { data?: { b64_json?: string }[] })?.data?.[0]?.b64_json
        ? `data:image/png;base64,${(data.response as { data: { b64_json: string }[] }).data[0].b64_json}`
        : null);
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

async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  const variants = [
    `${searchTerm} растение`,
    searchTerm,
  ];

  for (const variant of variants) {
    for (const lang of ["ru", "en"]) {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        generator: "search",
        gsrsearch: variant,
        gsrlimit: "5",
        prop: "pageimages",
        piprop: "original",
      });

      try {
        const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) continue;

        const data = (await response.json()) as {
          query?: {
            pages?: Record<string, { original?: { source?: string } }>;
          };
        };

        const image = Object.values(data.query?.pages ?? {}).find(
          (page) => page.original?.source?.includes("upload.wikimedia.org"),
        )?.original?.source;

        if (image) {
          return image;
        }
      } catch {
        // ignore and continue
      }
    }
  }

  return null;
}

/** Извлечение структурированных данных культуры через AI (из текста ответа нейроэксперта или по запросу). */
async function extractCropFromAI(
  query: string,
  userId: string | null,
  aiResult?: string
): Promise<{
  name: string;
  baseCropName?: string;
  varietyName?: string;
  slug: string;
  category: string;
  description: string;
  plantMonths: string[];
  harvestMonths: string[];
  waterSchedule: string;
  careNotes: string;
  regions: string[];
  varieties: { name: string; desc: string }[];
} | null> {
  if (!AI_URL || !AI_KEY) return null;
  const systemTemplate =
    (await getPromptByKey("crops_extract_system")) ??
    `Ты помощник для справочника растений. Верни ТОЛЬКО валидный JSON без markdown и без комментариев. Поля: name, baseCropName?, varietyName?, slug, category (одна из: {{categories}}), description, plantMonths, harvestMonths, waterSchedule, careNotes, regions, varieties. Если запрос относится к сорту существующей культуры, укажи baseCropName как базовую культуру, а varietyName как название сорта.`;
  const systemPrompt = systemTemplate.replace("{{categories}}", CATEGORIES.join(", "));
  const userContent = aiResult
    ? `По тексту ниже выдели данные культуры для справочника и верни JSON.\n\nТекст:\n${aiResult.slice(0, 4000)}`
    : `Дай данные для справочника дачника по культуре: "${query}". Верни только JSON.`;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  try {
    const res = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: { "X-API-Key": AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "guide@dacha-ai.ru",
        networkName: "openai-gpt4o-mini",
        requestType: "chat",
        payload: { messages },
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (data.status === "failed") {
      await logAiCall({
        userId,
        endpoint: "/api/crops",
        requestType: "chat",
        messages,
        responseData: data,
        status: "failed",
        errorMessage: (data.errorMessage as string) ?? undefined,
      });
      return null;
    }
    const raw =
      (data.response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const name = String(parsed.name || query).trim();
    const baseCropName = String(parsed.baseCropName ?? "").trim() || undefined;
    const varietyName = String(parsed.varietyName ?? "").trim() || undefined;
    const rawSlug = (parsed.slug as string)?.trim();
    const slugBase =
      rawSlug && /^[a-z0-9-]+$/i.test(rawSlug)
        ? rawSlug
        : transliterate(name).replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "crop";
    const category = CATEGORIES.includes(String(parsed.category)) ? String(parsed.category) : "Овощи";
    const description = String(parsed.description ?? "").trim() || name;
    const plantMonths = Array.isArray(parsed.plantMonths) ? (parsed.plantMonths as string[]).map(String) : ["Май"];
    const harvestMonths = Array.isArray(parsed.harvestMonths) ? (parsed.harvestMonths as string[]).map(String) : ["Август"];
    const waterSchedule = String(parsed.waterSchedule ?? "").trim() || "По мере необходимости";
    const careNotes = String(parsed.careNotes ?? "").trim() || "Добавлено дачниками.";
    const regions = Array.isArray(parsed.regions) ? (parsed.regions as string[]).map(String) : ["Все регионы"];
    const varieties = Array.isArray(parsed.varieties)
      ? (parsed.varieties as { name?: string; desc?: string }[]).map((v) => ({
          name: String(v?.name ?? "").trim() || "—",
          desc: String(v?.desc ?? "").trim() || "—",
        }))
      : [];

    const extracted = {
      name,
      baseCropName,
      varietyName,
      slug: slugBase,
      category,
      description,
      plantMonths,
      harvestMonths,
      waterSchedule,
      careNotes: careNotes.includes("Добавлено дачниками") ? careNotes : `${careNotes} Добавлено дачниками.`,
      regions,
      varieties,
    };
    await logAiCall({
      userId,
      endpoint: "/api/crops",
      requestType: "chat",
      messages,
      response: raw,
      responseData: data,
      status: "success",
    });
    return extracted;
  } catch (err) {
    await logAiCall({
      userId,
      endpoint: "/api/crops",
      requestType: "chat",
      messages,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : undefined,
    });
    return null;
  }
}

/** Уникальный slug: если занят — добавляем суффикс -2, -3, ... */
async function uniqueSlug(base: string): Promise<string> {
  let slug = base.replace(/[^a-z0-9-]/gi, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "crop";
  let n = 1;
  while (true) {
    const exists = await prisma.crop.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base.replace(/[^a-z0-9-]/gi, "").replace(/-+/g, "-") || "crop"}-${++n}`;
  }
}

/** POST — добавить культуру в справочник (по запросу + опционально текст от нейроэксперта), с генерацией фото. */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const aiResult = typeof body?.aiResult === "string" ? body.aiResult : undefined;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const extracted = await extractCropFromAI(query, user.id, aiResult);
    if (!extracted) {
      return NextResponse.json(
        { error: "Не удалось извлечь данные культуры из ответа нейросети" },
        { status: 502 }
      );
    }

    const targetStaticCrop = findExistingCropMatch(query, extracted.name, extracted.baseCropName);
    const inferredVarietyName = inferVarietyName(
      query,
      targetStaticCrop,
      extracted.name,
      extracted.varietyName,
    );

    if (targetStaticCrop) {
      const existingOverlay = await prisma.crop.findUnique({
        where: { slug: targetStaticCrop.slug },
      });

      if (!inferredVarietyName && !existingOverlay) {
        return NextResponse.json(
          {
            ...targetStaticCrop,
            addedByCommunity: false,
          },
          { status: 200 },
        );
      }

      const mergedVarieties = mergeVarieties(
        targetStaticCrop.varieties,
        mergeVarieties(
          existingOverlay && Array.isArray(existingOverlay.varieties)
            ? (existingOverlay.varieties as { name: string; desc: string }[])
            : undefined,
          inferredVarietyName
            ? [
                {
                  name: inferredVarietyName,
                  desc:
                    extracted.description ||
                    `Пользовательский сорт культуры «${targetStaticCrop.name}».`,
                },
              ]
            : extracted.varieties,
        ),
      );

      const payload = {
        name: targetStaticCrop.name,
        slug: targetStaticCrop.slug,
        category: targetStaticCrop.category,
        description: existingOverlay?.description ?? targetStaticCrop.description ?? extracted.description,
        plantMonths: existingOverlay?.plantMonths ?? [targetStaticCrop.plantMonth],
        harvestMonths: existingOverlay?.harvestMonths ?? [targetStaticCrop.harvestMonth],
        waterSchedule: existingOverlay?.waterSchedule ?? targetStaticCrop.water,
        regions: existingOverlay?.regions ?? targetStaticCrop.region,
        careNotes: existingOverlay?.careNotes ?? targetStaticCrop.note,
        imageUrl: existingOverlay?.imageUrl ?? targetStaticCrop.imageUrl ?? null,
        varieties: mergedVarieties && mergedVarieties.length > 0 ? (mergedVarieties as object) : undefined,
      };

      const crop = await prisma.crop.upsert({
        where: { slug: targetStaticCrop.slug },
        create: payload,
        update: payload,
      });

      return NextResponse.json(
        {
          id: crop.id,
          name: crop.name,
          slug: crop.slug,
          category: crop.category,
          description: crop.description ?? undefined,
          region: crop.regions,
          plantMonth: crop.plantMonths[0] ?? "",
          harvestMonth: crop.harvestMonths[0] ?? "",
          water: crop.waterSchedule ?? "",
          note: crop.careNotes ?? "",
          imageUrl: crop.imageUrl ?? targetStaticCrop.imageUrl ?? undefined,
          varieties: mergedVarieties,
          addedByCommunity: true,
        },
        { status: existingOverlay ? 200 : 201 },
      );
    }

    const slug = await uniqueSlug(extracted.slug);

    let imageUrl: string | null = null;
    try {
      imageUrl = await fetchWikipediaImage(extracted.name);
      if (!imageUrl) {
        const { url } = await generateCropImage(extracted.name, extracted.category, user.id);
        imageUrl = url;
      }
    } catch {
      // сохраняем без фото
    }

    const crop = await prisma.crop.create({
      data: {
        name: extracted.name,
        slug,
        category: extracted.category,
        description: extracted.description,
        plantMonths: extracted.plantMonths,
        harvestMonths: extracted.harvestMonths,
        waterSchedule: extracted.waterSchedule,
        regions: extracted.regions,
        careNotes: extracted.careNotes,
        imageUrl,
        varieties: extracted.varieties.length > 0 ? (extracted.varieties as object) : undefined,
      },
    });

    const clientCrop = {
      id: crop.id,
      name: crop.name,
      slug: crop.slug,
      category: crop.category,
      description: crop.description ?? undefined,
      region: crop.regions,
      plantMonth: crop.plantMonths[0] ?? "",
      harvestMonth: crop.harvestMonths[0] ?? "",
      water: crop.waterSchedule ?? "",
      note: crop.careNotes ?? "",
      imageUrl: crop.imageUrl ?? undefined,
      varieties: (Array.isArray(crop.varieties) ? crop.varieties : []) as { name: string; desc: string }[],
      addedByCommunity: true,
    };

    return NextResponse.json(clientCrop, { status: 201 });
  } catch (err) {
    console.error("Crops POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
