import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { hasFullAccess } from "@/lib/user-access";
import { getPromptByKey } from "@/lib/get-prompt";
import { logAiCall } from "@/lib/log-ai-call";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const CHAT_SYSTEM_FALLBACK = `Ты — нейроэксперт-агроном, помощник для дачников и садоводов в России. Твоё имя — Любимая Дача.

Правила:
- Отвечай на русском языке
- Давай конкретные, практичные советы по садоводству и огородничеству
- Учитывай российский климат и условия
- При анализе болезней растений описывай симптомы и предлагай лечение
- Будь дружелюбным и кратким (2-4 предложения, если не нужен подробный ответ)
- Если спрашивают о погоде — используй предоставленные данные о погоде
- Отвечай на любые вопросы, связанные с дачей, домом, участком, сезонными работами
- Если не уверен — честно скажи и предложи обратиться к агроному`;

const REFUSAL_PATTERNS = [
  "не могу предоставить",
  "нет доступа к интернету",
  "не имею доступа",
  "не располагаю актуальной информацией",
  "рекомендую проверить",
  "не могу узнать",
  "у меня нет возможности",
  "не имею возможности",
  "i cannot",
  "i don't have access",
];

function looksLikeRefusal(text: string): boolean {
  const lower = text.toLowerCase();
  return REFUSAL_PATTERNS.some((p) => lower.includes(p));
}

function isWeatherRelated(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "погод", "температур", "дождь", "дожд", "снег", "мороз",
    "заморозк", "ветер", "завтра", "прогноз", "сегодня",
    "градус", "тепло", "холод", "осадк",
  ];
  return keywords.some((k) => lower.includes(k));
}

async function getUserLocation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, latitude: true, longitude: true, locationName: true, region: true },
  });
  if (user) return user;
  const freshUser = await getAuthUser();
  if (!freshUser) return null;
  return { id: freshUser.id, latitude: freshUser.latitude, longitude: freshUser.longitude, locationName: freshUser.locationName, region: freshUser.region };
}

const WMO_TEXT: Record<number, string> = {
  0: "Ясно", 1: "Преимущественно ясно", 2: "Переменная облачность", 3: "Пасмурно",
  45: "Туман", 48: "Изморозь", 51: "Лёгкая морось", 53: "Морось", 55: "Сильная морось",
  61: "Небольшой дождь", 63: "Дождь", 65: "Сильный дождь",
  71: "Небольшой снег", 73: "Снег", 75: "Сильный снег", 77: "Снежная крупа",
  80: "Небольшой ливень", 81: "Ливень", 82: "Сильный ливень",
  85: "Небольшой снегопад", 86: "Сильный снегопад",
  95: "Гроза", 96: "Гроза с градом", 99: "Сильная гроза с градом",
};

async function fetchWeatherContext(lat: number, lng: number, locationName: string | null): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum",
      timezone: "auto",
      forecast_days: "3",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
    if (!res.ok) return null;
    const w = await res.json();

    const cur = w.current;
    let ctx = `Актуальная погода для ${locationName || "участка пользователя"}:\n`;
    ctx += `Сейчас: ${cur.temperature_2m}°C, ${WMO_TEXT[cur.weather_code] || "Неизвестно"}, ветер ${cur.wind_speed_10m} км/ч, влажность ${cur.relative_humidity_2m}%\n`;
    const daily = w.daily;
    for (let i = 0; i < daily.time.length; i++) {
      const snow = daily.snowfall_sum?.[i] || 0;
      ctx += `${daily.time[i]}: ${daily.temperature_2m_min[i]}–${daily.temperature_2m_max[i]}°C, ${WMO_TEXT[daily.weather_code[i]] || "Неизвестно"}, осадки ${daily.precipitation_sum[i] || 0} мм${snow > 0 ? `, снег ${snow} см` : ""}\n`;
    }
    return ctx;
  } catch {
    return null;
  }
}

async function buildSystemPrompt(locationName: string | null, hasLocation: boolean): Promise<string> {
  const base = (await getPromptByKey("chat_system")) ?? CHAT_SYSTEM_FALLBACK;
  if (hasLocation && locationName) {
    return `${base}\n\nМестоположение дачи пользователя: ${locationName}. Все рекомендации по срокам, сортам и уходу давай С УЧЁТОМ этого региона.`;
  }
  return `${base}\n\nМестоположение дачи пользователя НЕ УКАЗАНО. Рекомендуй для средней полосы России и отмечай что рекомендации общие, так как дачник не указал местоположение.`;
}

export async function POST(request: NextRequest) {
  if (!AI_URL || !AI_KEY) {
    return NextResponse.json(
      { error: "AI integration not configured" },
      { status: 500 }
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasFullAccess(user)) {
    return NextResponse.json(
      {
        error:
          "Пробный период закончился. Оформите подписку Премиум, чтобы пользоваться чатом с агрономом.",
        code: "PAYMENT_REQUIRED",
      },
      { status: 402 }
    );
  }

  try {
    const { messages, networkName } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const userInfo = await getUserLocation(user.id);
    const hasLocation = !!(userInfo?.latitude && userInfo?.longitude);

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const needsWeather = isWeatherRelated(lastUserMsg);

    let systemPrompt = await buildSystemPrompt(userInfo?.locationName || null, hasLocation);

    if (needsWeather && hasLocation && userInfo?.latitude && userInfo?.longitude) {
      const weatherCtx = await fetchWeatherContext(userInfo.latitude, userInfo.longitude, userInfo.locationName);
      if (weatherCtx) {
        systemPrompt += `\n\nДанные о погоде (актуальные):\n${weatherCtx}`;
      }
    }

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const { content: aiMessage, responseData } = await callAI(
      fullMessages,
      user.email ?? user.phone ?? user.id,
      networkName || "openai-gpt4o-mini"
    );

    await logAiCall({
      userId: userInfo?.id ?? null,
      endpoint: "/api/chat",
      requestType: "chat",
      messages: fullMessages,
      response: aiMessage,
      responseData,
      status: "success",
    });

    if (looksLikeRefusal(aiMessage) && !networkName) {
      let retryPrompt = systemPrompt;
      if (!needsWeather && hasLocation && userInfo?.latitude && userInfo?.longitude) {
        const weatherCtx = await fetchWeatherContext(userInfo.latitude, userInfo.longitude, userInfo.locationName);
        if (weatherCtx) {
          retryPrompt += `\n\nДанные о погоде (актуальные):\n${weatherCtx}`;
        }
      }
      const retryMessages = [
        { role: "system", content: retryPrompt + "\n\nВАЖНО: Ты ДОЛЖЕН ответить на вопрос пользователя используя предоставленные данные. НЕ говори что у тебя нет доступа к информации — данные о погоде предоставлены выше." },
        ...messages,
      ];
      const { content: retryMessage, responseData: retryData } = await callAI(
        retryMessages,
        user.email ?? user.phone ?? user.id,
        "openai-gpt4o"
      );

      await logAiCall({
        userId: userInfo?.id ?? null,
        endpoint: "/api/chat",
        requestType: "chat",
        messages: retryMessages,
        response: retryMessage,
        responseData: retryData,
        status: "success",
      });

      if (userInfo?.id) {
        await saveMessages(userInfo.id, lastUserMsg, retryMessage);
      }

      return NextResponse.json({ message: retryMessage });
    }

    if (userInfo?.id) {
      await saveMessages(userInfo.id, lastUserMsg, aiMessage);
    }

    return NextResponse.json({ message: aiMessage });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to process AI request";
    try {
      const user = await getAuthUser();
      const userInfo = user ? await getUserLocation(user.id) : null;
      await logAiCall({
        userId: userInfo?.id ?? null,
        endpoint: "/api/chat",
        requestType: "chat",
        messages: [],
        status: "failed",
        errorMessage,
      });
    } catch {
      // ignore log failure
    }
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 502 }
    );
  }
}

async function saveMessages(userId: string, userContent: string, aiContent: string) {
  try {
    await prisma.chatMessage.createMany({
      data: [
        { userId, role: "user", content: userContent },
        { userId, role: "assistant", content: aiContent },
      ],
    });
  } catch {
    // non-critical, don't fail the request
  }
}

async function callAI(
  messages: { role: string; content: string }[],
  userId: string,
  networkName: string
): Promise<{ content: string; responseData: Record<string, unknown> }> {
  const response = await fetch(`${AI_URL}/api/ai/process`, {
    method: "POST",
    headers: {
      "X-API-Key": AI_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      networkName,
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
