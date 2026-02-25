import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMergedCrops } from "@/lib/crops-merge";

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
async function generateCropImage(cropName: string, category: string): Promise<string | null> {
  if (!AI_URL || !AI_KEY) return null;
  const prompt = `Реалистичное фото растения или овоща/фрукта: ${cropName}, категория ${category}. Красивое, чёткое, на белом или нейтральном фоне, для каталога растений.`;
  try {
    const res = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: { "X-API-Key": AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "guide@dacha-ai.ru",
        networkName: "openai-dall-e-3",
        requestType: "image_gen",
        payload: { prompt, size: "1024x1024" },
      }),
    });
    const data = await res.json();
    if (data.status === "failed") return null;
    const url =
      data.response?.data?.[0]?.url ??
      data.response?.url ??
      data.response?.data?.[0]?.b64_json
        ? `data:image/png;base64,${data.response.data[0].b64_json}`
        : null;
    return url || null;
  } catch {
    return null;
  }
}

/** Извлечение структурированных данных культуры через AI (из текста ответа нейроэксперта или по запросу). */
async function extractCropFromAI(query: string, aiResult?: string): Promise<{
  name: string;
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
  const systemPrompt = `Ты помощник для справочника растений. Верни ТОЛЬКО валидный JSON без markdown и без комментариев.
Поля: name (строка, название культуры на русском), slug (строка, латиница, lowercase, без пробелов, например tomat), category (строка, одна из: ${CATEGORIES.join(", ")}), description (строка, 1-2 предложения), plantMonths (массив строк месяцев, например ["Май"]), harvestMonths (массив строк месяцев), waterSchedule (строка, как часто поливать), careNotes (строка, краткая заметка), regions (массив строк, например ["Все регионы"]), varieties (массив объектов с полями name и desc, 2-4 сорта).`;
  const userContent = aiResult
    ? `По тексту ниже выдели данные культуры для справочника и верни JSON.\n\nТекст:\n${aiResult.slice(0, 4000)}`
    : `Дай данные для справочника дачника по культуре: "${query}". Верни только JSON.`;

  try {
    const res = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: { "X-API-Key": AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "guide@dacha-ai.ru",
        networkName: "openai-gpt4o-mini",
        requestType: "chat",
        payload: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        },
      }),
    });
    const data = await res.json();
    if (data.status === "failed") return null;
    const raw =
      data.response?.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const name = String(parsed.name || query).trim();
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

    return {
      name,
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
  } catch {
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const aiResult = typeof body?.aiResult === "string" ? body.aiResult : undefined;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const extracted = await extractCropFromAI(query, aiResult);
    if (!extracted) {
      return NextResponse.json(
        { error: "Не удалось извлечь данные культуры из ответа нейросети" },
        { status: 502 }
      );
    }

    const slug = await uniqueSlug(extracted.slug);

    let imageUrl: string | null = null;
    try {
      imageUrl = await generateCropImage(extracted.name, extracted.category);
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
