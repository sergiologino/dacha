import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";
import { prisma } from "@/lib/prisma";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const VISION_PROMPT_FALLBACK =
  "Ты опытный агроном. Проанализируй фото растения и дай короткий, понятный ответ на русском: 1) Что за растение (если понятно), 2) Какая проблема видна, 3) Как лечить или что делать. Не используй сложные термины. Если на фото нет растения — скажи об этом.";

export async function POST(request: NextRequest) {
  try {
    if (!AI_URL || !AI_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("Analyze: body parse error:", parseErr);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const image = body?.image as string | undefined;
    if (!image) {
      console.error("Analyze: no image field in body. Keys:", Object.keys(body || {}));
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const visionBase = (await getPromptByKey("vision_system")) ?? VISION_PROMPT_FALLBACK;
    const locationNote = user.locationName
      ? ` Учитывай, что растение находится в регионе: ${user.locationName}.`
      : "";
    const systemContent = visionBase + locationNote;

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/^data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const response = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: {
        "X-API-Key": AI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.email ?? user.phone ?? user.id,
        networkName: "openai-gpt4o",
        requestType: "chat",
        payload: {
          messages: [
            { role: "system", content: systemContent },
            {
              role: "user",
              content: [
                { type: "text", text: "Что не так с этим растением? Дай рекомендацию." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
        },
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === "failed") {
      await logAiCall({
        userId: user.id,
        endpoint: "/api/ai/analyze",
        requestType: "vision",
        messages: [{ role: "system", content: systemContent }, { role: "user", content: "[image]" }],
        responseData: data,
        status: "failed",
        errorMessage: (data.errorMessage as string) ?? undefined,
      });
      return NextResponse.json(
        { error: (data.errorMessage as string) || "AI analysis failed" },
        { status: 502 }
      );
    }

    const result =
      (data.response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ||
      "Не удалось распознать. Попробуйте другое фото.";

    await logAiCall({
      userId: user.id,
      endpoint: "/api/ai/analyze",
      requestType: "vision",
      messages: [{ role: "system", content: systemContent }, { role: "user", content: "[image]" }],
      response: result,
      responseData: data,
      status: "success",
    });

    const thumbData = base64Data.substring(0, 200000);
    const thumbUrl = `data:${mimeType};base64,${thumbData}`;

    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        imageUrl: thumbUrl,
        result,
        status: "completed",
      },
    });

    return NextResponse.json({
      result,
      analysisId: analysis.id,
    });
  } catch (err) {
    console.error("Analyze POST error:", err);
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}

const FREE_ANALYSIS_LIMIT = 3;

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyses = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let freeLeft = FREE_ANALYSIS_LIMIT;
  if (!user.isPremium) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await prisma.analysis.count({
      where: {
        userId: user.id,
        createdAt: { gte: monthStart },
      },
    });
    freeLeft = Math.max(0, FREE_ANALYSIS_LIMIT - thisMonthCount);
  } else {
    freeLeft = -1; // unlimited
  }

  return NextResponse.json({
    analyses: analyses.map((a) => ({
      id: a.id,
      imageUrl: a.imageUrl,
      result: a.result,
      date: a.createdAt.toLocaleDateString("ru-RU"),
      createdAt: a.createdAt.toISOString(),
    })),
    freeLeft,
  });
}
