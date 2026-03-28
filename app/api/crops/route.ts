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
import {
  attachVarietyImage,
  buildImageLabelsForCommunityCrop,
  resolveCropImageUrl,
} from "@/lib/crop-image";

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
    `Ты помощник для справочника растений. Верни ТОЛЬКО валидный JSON без markdown и без комментариев. Поля: name, baseCropName?, varietyName?, slug, category (одна из: {{categories}}), description, plantMonths, harvestMonths, waterSchedule, careNotes, regions, varieties. Важно: если пользователь назвал сорт (например «томат черри», «помидоры бычье сердце»), обязательно заполни varietyName точным названием сорта, baseCropName — базовая культура («Томат»), а в name можно дать полную форму («Томат черри»). Сорта сильно отличаются внешне — это нужно для иллюстраций.`;
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
            ? (existingOverlay.varieties as { name: string; desc: string; imageUrl?: string }[])
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

      let mergedVarietiesForDb = mergedVarieties;
      if (inferredVarietyName) {
        const varietyLabels = buildImageLabelsForCommunityCrop({
          query,
          name: `${targetStaticCrop.name} ${inferredVarietyName}`,
          baseCropName: targetStaticCrop.name,
          varietyName: inferredVarietyName,
          staticBaseName: targetStaticCrop.name,
        });
        const varietyImageUrl = await resolveCropImageUrl({
          labels: varietyLabels,
          category: targetStaticCrop.category,
          userId: user.id,
        });
        mergedVarietiesForDb = attachVarietyImage(mergedVarieties, inferredVarietyName, varietyImageUrl);
      }

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
        varieties:
          mergedVarietiesForDb && mergedVarietiesForDb.length > 0
            ? (mergedVarietiesForDb as object)
            : undefined,
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
          varieties: mergedVarietiesForDb ?? mergedVarieties,
          addedByCommunity: true,
        },
        { status: existingOverlay ? 200 : 201 },
      );
    }

    const slug = await uniqueSlug(extracted.slug);

    const labels = buildImageLabelsForCommunityCrop({
      query,
      name: extracted.name,
      baseCropName: extracted.baseCropName,
      varietyName: extracted.varietyName,
    });
    const imageUrl = await resolveCropImageUrl({
      labels,
      category: extracted.category,
      userId: user.id,
    });

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
        imageUrl: imageUrl || null,
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
