import { prisma } from "@/lib/prisma";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const VALID_TYPES = new Set([
  "sprout",
  "transplant",
  "water",
  "loosen",
  "light_temp",
  "feed",
  "pinch",
  "harvest",
  "other",
]);

const BED_TYPE_LABELS: Record<string, string> = {
  open: "открытый грунт",
  greenhouse: "теплица",
  raised: "высокая грядка",
  seedling_home: "рассада дома",
};

type RawEvent = {
  type?: string;
  title?: string;
  description?: string;
  scheduledDate?: string;
  dateTo?: string;
  isAction?: boolean;
};

async function callAI(
  messages: { role: string; content: string }[],
  userId: string
): Promise<{ content: string; responseData: Record<string, unknown> }> {
  if (!AI_URL || !AI_KEY) throw new Error("AI integration not configured");
  const response = await fetch(`${AI_URL}/api/ai/process`, {
    method: "POST",
    headers: {
      "X-API-Key": AI_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      networkName: "openai-gpt4o-mini",
      requestType: "chat",
      payload: { messages },
    }),
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (data.status === "failed") {
    throw new Error((data.errorMessage as string) || "AI request failed");
  }
  const content =
    (data.response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ||
    "Не удалось получить ответ от ИИ.";
  return { content, responseData: data };
}

function extractJsonFromResponse(text: string): RawEvent[] {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as RawEvent[];
}

function parseEvent(
  raw: RawEvent,
  index: number
): {
  type: string;
  title: string;
  description: string | null;
  scheduledDate: Date;
  dateTo: Date | null;
  isAction: boolean;
  sortOrder: number;
} | null {
  const type = (raw.type && VALID_TYPES.has(String(raw.type).toLowerCase())
    ? String(raw.type).toLowerCase()
    : "other") as string;
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : type;
  const description =
    typeof raw.description === "string" && raw.description.trim() ? raw.description.trim() : null;
  let scheduledDate: Date;
  try {
    scheduledDate = new Date(raw.scheduledDate ?? 0);
    if (Number.isNaN(scheduledDate.getTime())) return null;
  } catch {
    return null;
  }
  let dateTo: Date | null = null;
  if (raw.dateTo != null) {
    try {
      dateTo = new Date(raw.dateTo);
      if (Number.isNaN(dateTo.getTime())) dateTo = null;
    } catch {
      dateTo = null;
    }
  }
  const isAction = typeof raw.isAction === "boolean" ? raw.isAction : true;
  return { type, title, description, scheduledDate, dateTo, isAction, sortOrder: index };
}

/**
 * Генерирует таймлайн событий для растения через нейросеть и сохраняет в БД.
 * Вызывать после создания растения (асинхронно, не блокируя ответ).
 */
export async function generateTimelineForPlant(plantId: string): Promise<void> {
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: {
      bed: true,
      user: { select: { id: true, email: true, phone: true, region: true, locationName: true } },
    },
  });
  if (!plant?.user?.email) return;

  const bedType = plant.bed?.type ?? "open";
  const bedLabel = BED_TYPE_LABELS[bedType] ?? bedType;
  const cultureName = plant.name;
  const plantedDateIso = new Date(plant.plantedDate).toISOString().slice(0, 10);
  const region =
    bedType === "seedling_home"
      ? "рассада в помещении (дома), учитывай освещение и температуру в доме, без привязки к региону"
      : [plant.user.region, plant.user.locationName].filter(Boolean).join(", ") || "средняя полоса России";

  const systemTemplate =
    (await getPromptByKey("timeline_system")) ??
    `Ты — агроном-консультант для дачников в России. Ответь СТРОГО в формате JSON: один массив объектов без markdown и без пояснений вне JSON. Растение уже растёт в указанной грядке (тип: {{bedLabel}}). Не включай пересадку в теплицу/в грунт, если грядка уже теплица, открытый грунт или высокая грядка. Пересадку — только если тип грядки «рассада дома». Для каждого события укажи: type, title, description, scheduledDate, dateTo?, isAction. Учитывай: культура "{{cultureName}}", дата посадки: {{plantedDateIso}}, местоположение: {{region}}.`;
  const systemPrompt = systemTemplate
    .replace("{{cultureName}}", cultureName)
    .replace("{{bedLabel}}", bedLabel)
    .replace("{{plantedDateIso}}", plantedDateIso)
    .replace("{{region}}", region);

  const userPrompt =
    (await getPromptByKey("timeline_user")) ??
    "Построй календарь ключевых событий и действий по уходу от даты посадки до ориентировочного урожая/конца ухода. Верни массив объектов в JSON. Минимум 5–8 событий: всходы, поливы, рыхление, подкормки, пасынкование (если нужно), урожай. Пересадку включай только для рассады дома; для теплицы/открытого грунта/высокой грядки событий пересадки не добавляй. Для рассады дома добавь события по освещению и температуре.";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const { content, responseData } = await callAI(
      messages,
      plant.user.email ?? plant.user.phone ?? plant.user.id,
    );

    await logAiCall({
      userId: plant.user.id,
      endpoint: "/api/plants/[id]/timeline/generate",
      requestType: "chat",
      messages,
      response: content,
      responseData,
      status: "success",
    });

    const rawEvents = extractJsonFromResponse(content);
    const events = rawEvents
      .map((raw, i) => parseEvent(raw, i))
      .filter((e): e is NonNullable<typeof e> => e !== null);

    if (events.length === 0) return;

    await prisma.plantTimelineEvent.deleteMany({ where: { plantId } });
    await prisma.plantTimelineEvent.createMany({
      data: events.map((e) => ({
        plantId,
        type: e.type,
        title: e.title,
        description: e.description,
        scheduledDate: e.scheduledDate,
        dateTo: e.dateTo,
        isAction: e.isAction,
        sortOrder: e.sortOrder,
      })),
    });
  } catch (err) {
    await logAiCall({
      userId: plant.user.id,
      endpoint: "/api/plants/[id]/timeline/generate",
      requestType: "chat",
      messages: messages ?? [],
      status: "failed",
      errorMessage: err instanceof Error ? err.message : undefined,
    });
    console.error("Timeline generation failed for plant", plantId, err);
  }
}
