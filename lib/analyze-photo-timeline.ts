import { prisma } from "@/lib/prisma";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const BED_TYPE_LABELS: Record<string, string> = {
  open: "открытый грунт",
  greenhouse: "теплица",
  raised: "высокая грядка",
  seedling_home: "рассада дома",
};

type Plant = { name: string; plantedDate: Date };
type Bed = { type: string };

function weeksSince(planted: Date, taken: Date): number {
  const ms = taken.getTime() - new Date(planted).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

/**
 * Анализирует фото растения в контексте таймлайна: дата посадки, сорт, тип грядки.
 * Обновляет фото полями analysisResult, analysisStatus, analyzedAt.
 * При ошибке или недоступности AI поля остаются null.
 */
export async function analyzePhotoForTimeline(
  photoId: string,
  imageBase64: string,
  mimeType: string,
  plant: Plant,
  bed: Bed,
  takenAt: Date,
  userId: string
): Promise<void> {
  if (!AI_URL || !AI_KEY) return;

  const promptBase =
    (await getPromptByKey("photo_timeline_verdict")) ??
    `Ты опытный агроном. По фото растения и контексту (название, сорт, тип грядки, дата посадки, недель с посадки) оцени, в норме ли развитие. Ответь СТРОГО JSON: {"status": "ok" | "problem", "verdict": "текст на русском"}.`;

  const bedLabel = BED_TYPE_LABELS[bed.type] ?? bed.type;
  const weeks = weeksSince(plant.plantedDate, takenAt);
  const context = `Контекст: растение "${plant.name}", тип грядки: ${bedLabel}, дата посадки: ${plant.plantedDate.toISOString().slice(0, 10)}, прошло недель с посадки: ${weeks}, дата съёмки: ${takenAt.toISOString().slice(0, 10)}.`;

  const messages = [
    { role: "system" as const, content: promptBase },
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: `Оцени состояние растения на фото. ${context}` },
        {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: "low" as const,
          },
        },
      ],
    },
  ];

  try {
    const response = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: { "X-API-Key": AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        networkName: "openai-gpt4o",
        requestType: "chat",
        payload: { messages },
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === "failed") {
      await logAiCall({
        userId,
        endpoint: "/api/photos",
        requestType: "vision",
        messages: [{ role: "system", content: promptBase }, { role: "user", content: "[image]" }],
        responseData: data,
        status: "failed",
        errorMessage: (data.errorMessage as string) ?? undefined,
      });
      return;
    }

    const raw =
      (data.response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as { status?: string; verdict?: string };
    const status = parsed.status === "problem" ? "problem" : "ok";
    const verdict = typeof parsed.verdict === "string" ? parsed.verdict : "Нет вердикта.";

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        analysisResult: verdict,
        analysisStatus: status,
        analyzedAt: new Date(),
      },
    });

    await logAiCall({
      userId,
      endpoint: "/api/photos",
      requestType: "vision",
      messages: [{ role: "system", content: promptBase }, { role: "user", content: "[image]" }],
      response: raw,
      responseData: data,
      status: "success",
    });
  } catch (err) {
    await logAiCall({
      userId,
      endpoint: "/api/photos",
      requestType: "vision",
      messages: [{ role: "system", content: promptBase }, { role: "user", content: "[image]" }],
      status: "failed",
      errorMessage: err instanceof Error ? err.message : undefined,
    });
    console.error("analyzePhotoForTimeline failed:", err);
  }
}
