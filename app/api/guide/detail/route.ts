import { NextRequest, NextResponse } from "next/server";
import { mergeVarieties } from "@/lib/crop-community";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { crops as staticCrops } from "@/lib/data/crops";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const GUIDE_DETAIL_SYSTEM_FALLBACK =
  "Ты — опытный агроном-практик с 30-летним стажем работы на дачных участках в России. Пишешь руководства для дачников.";

async function buildUserPrompt(
  crop: { name: string; varieties?: { name: string }[] },
  locationName: string | null
): Promise<string> {
  const template =
    (await getPromptByKey("guide_detail_user")) ??
    `Напиши подробное руководство по выращиванию культуры "{{cropName}}" на даче в России.
{{regionNote}}
Структура ответа (используй Markdown): ## Подготовка к посадке, ## Посадка, ## Уход, ## Болезни и вредители, ## Сбор и хранение, ## Советы опытных дачников.
{{varietyListSection}}
Пиши на русском, конкретно и практично.`;
  const regionNote = locationName
    ? `Руководство для региона: ${locationName}. Учитывай климатические особенности этого региона при указании сроков.`
    : "Руководство для средней полосы России.";
  const varietyList = crop.varieties?.map((v) => v.name).join(", ") || "";
  const varietyListSection = varietyList
    ? `\nУпоминаемые сорта: ${varietyList}. Укажи особенности ухода для разных сортов, если они существенно отличаются.`
    : "";
  return template
    .replace("{{cropName}}", crop.name)
    .replace("{{regionNote}}", regionNote)
    .replace("{{varietyListSection}}", varietyListSection);
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  let crop: { name: string; varieties?: { name: string }[] } | null =
    staticCrops.find((c) => c.slug === slug) ?? null;
  try {
    const row = await prisma.crop.findUnique({ where: { slug } });
    if (row) {
      const rowVarieties = Array.isArray(row.varieties)
        ? (row.varieties as { name: string; desc?: string }[]).map((v) => ({ name: v.name, desc: v.desc ?? "" }))
        : undefined;
      if (crop) {
        crop = {
          name: crop.name,
          varieties: mergeVarieties(
            crop.varieties?.map((v) => ({ name: v.name, desc: "" })),
            rowVarieties,
          )?.map((v) => ({ name: v.name })),
        };
      } else {
        crop = { name: row.name, varieties: rowVarieties?.map((v) => ({ name: v.name })) };
      }
    }
  } catch {
    if (!crop) {
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

  let userPrompt: string;
  try {
    userPrompt = await buildUserPrompt(crop, locationName);
  } catch {
    userPrompt = `Напиши подробное руководство по выращиванию культуры "${crop.name}" на даче в России.`;
  }

  const systemPrompt = (await getPromptByKey("guide_detail_system")) ?? GUIDE_DETAIL_SYSTEM_FALLBACK;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

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
        payload: { messages },
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === "failed") {
      const user = await getAuthUser().catch(() => null);
      await logAiCall({
        userId: user?.id ?? null,
        endpoint: "/api/guide/detail",
        requestType: "chat",
        messages,
        responseData: data,
        status: "failed",
        errorMessage: (data.errorMessage as string) ?? undefined,
      });
      return NextResponse.json(
        { error: (data.errorMessage as string) || "AI generation failed" },
        { status: 502 }
      );
    }

    const content =
      (data.response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ||
      "Не удалось сгенерировать руководство.";

    const user = await getAuthUser().catch(() => null);
    await logAiCall({
      userId: user?.id ?? null,
      endpoint: "/api/guide/detail",
      requestType: "chat",
      messages,
      response: content,
      responseData: data,
      status: "success",
    });

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
