import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { crops as staticCrops } from "@/lib/data/crops";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

function buildPrompt(
  crop: { name: string; varieties?: { name: string }[] },
  locationName: string | null
) {
  const varietyList = crop.varieties?.map((v) => v.name).join(", ") || "";
  const regionNote = locationName
    ? `Руководство для региона: ${locationName}. Учитывай климатические особенности этого региона при указании сроков.`
    : "Руководство для средней полосы России.";

  return `Напиши подробное руководство по выращиванию культуры "${crop.name}" на даче в России.
${regionNote}

Структура ответа (используй Markdown):

## Подготовка к посадке
- Выбор места и подготовка почвы
- Подготовка семян/рассады
- Сроки (для указанного региона)

## Посадка
- Схема посадки (расстояния)
- Глубина заделки
- Особенности (рассада vs прямой посев)

## Уход
- Полив (частота, способ, температура воды)
- Подкормки (какие, когда, сколько)
- Формирование и пасынкование (если применимо)
- Рыхление и мульчирование
- Подвязка (если нужна)

## Болезни и вредители
- Основные болезни и признаки
- Главные вредители
- Профилактика и лечение (народные + препараты)

## Сбор и хранение
- Когда собирать (признаки спелости)
- Как правильно собирать
- Хранение (условия, сроки)

## Советы опытных дачников
- 3–5 практических лайфхаков

${varietyList ? `\nУпоминаемые сорта: ${varietyList}. Укажи особенности ухода для разных сортов, если они существенно отличаются.` : ""}

Пиши на русском, конкретно и практично. Без воды и общих фраз. Указывай точные цифры (температуры, расстояния, дозировки).`;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  let crop: { name: string; varieties?: { name: string }[] } | null =
    staticCrops.find((c) => c.slug === slug) ?? null;
  if (!crop) {
    try {
      const row = await prisma.crop.findUnique({ where: { slug } });
      if (row) {
        const varieties = Array.isArray(row.varieties)
          ? (row.varieties as { name: string; desc?: string }[]).map((v) => ({ name: v.name }))
          : undefined;
        crop = { name: row.name, varieties };
      }
    } catch {
      crop = null;
    }
  }
  if (!crop) {
    return NextResponse.json({ error: "Crop not found" }, { status: 404 });
  }

  let locationName: string | null = null;
  try {
    const user = await getAuthUser();
    locationName = user?.locationName || null;
  } catch {
    // proceed without location
  }

  try {
    const cached = await prisma.cropGuide.findUnique({
      where: { cropSlug: slug },
    });

    if (cached) {
      return NextResponse.json({ content: cached.content, cached: true });
    }
  } catch {
    // DB unavailable — proceed to AI
  }

  if (!AI_URL || !AI_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: {
        "X-API-Key": AI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "guide-generator",
        networkName: "openai-gpt4o-mini",
        requestType: "chat",
        payload: {
          messages: [
            {
              role: "system",
              content:
                "Ты — опытный агроном-практик с 30-летним стажем работы на дачных участках в России. Пишешь руководства для дачников.",
            },
            { role: "user", content: buildPrompt(crop, locationName) },
          ],
        },
      }),
    });

    const data = await response.json();

    if (data.status === "failed") {
      return NextResponse.json(
        { error: data.errorMessage || "AI generation failed" },
        { status: 502 }
      );
    }

    const content =
      data.response?.choices?.[0]?.message?.content ||
      "Не удалось сгенерировать руководство.";

    try {
      await prisma.cropGuide.upsert({
        where: { cropSlug: slug },
        create: { cropSlug: slug, content },
        update: { content },
      });
    } catch {
      // Cache save failed — still return the content
    }

    return NextResponse.json({ content, cached: false });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate guide" },
      { status: 502 }
    );
  }
}
