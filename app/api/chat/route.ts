import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;
const WEATHER_KEY = process.env.WEATHER_API_KEY;

const REFUSAL_PATTERNS = [
  "не могу предоставить",
  "нет доступа к интернету",
  "не имею доступа",
  "не располагаю актуальн",
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

async function getUserLocation(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, latitude: true, longitude: true, locationName: true, region: true },
  });
  if (user) return user;
  const freshUser = await getAuthUser();
  if (!freshUser) return null;
  return { id: freshUser.id, latitude: freshUser.latitude, longitude: freshUser.longitude, locationName: freshUser.locationName, region: freshUser.region };
}

async function fetchWeatherContext(lat: number, lng: number, locationName: string | null): Promise<string | null> {
  if (!WEATHER_KEY) return null;
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_KEY}&q=${lat},${lng}&days=3&lang=ru&aqi=no`
    );
    if (!res.ok) return null;
    const w = await res.json();

    const current = w.current;
    const forecasts = w.forecast?.forecastday || [];
    let ctx = `Актуальная погода для ${locationName || w.location?.name || "участка пользователя"}:\n`;
    ctx += `Сейчас: ${current.temp_c}°C, ${current.condition?.text}, ветер ${current.wind_kph} км/ч, влажность ${current.humidity}%\n`;
    for (const day of forecasts) {
      ctx += `${day.date}: ${day.day.mintemp_c}–${day.day.maxtemp_c}°C, ${day.day.condition?.text}, осадки ${day.day.totalprecip_mm} мм\n`;
    }
    return ctx;
  } catch {
    return null;
  }
}

function buildSystemPrompt(locationName: string | null, hasLocation: boolean): string {
  let prompt = `Ты — нейроэксперт-агроном, помощник для дачников и садоводов в России. Твоё имя — ДачаAI.

Правила:
- Отвечай на русском языке
- Давай конкретные, практичные советы по садоводству и огородничеству
- Учитывай российский климат и условия
- При анализе болезней растений описывай симптомы и предлагай лечение
- Будь дружелюбным и кратким (2-4 предложения, если не нужен подробный ответ)
- Если спрашивают о погоде — используй предоставленные данные о погоде
- Отвечай на любые вопросы, связанные с дачей, домом, участком, сезонными работами
- Если не уверен — честно скажи и предложи обратиться к агроному`;

  if (hasLocation && locationName) {
    prompt += `\n\nМестоположение дачи пользователя: ${locationName}. Все рекомендации по срокам, сортам и уходу давай С УЧЁТОМ этого региона.`;
  } else {
    prompt += `\n\nМестоположение дачи пользователя НЕ УКАЗАНО. Рекомендуй для средней полосы России и отмечай что рекомендации общие, так как дачник не указал местоположение.`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  if (!AI_URL || !AI_KEY) {
    return NextResponse.json(
      { error: "AI integration not configured" },
      { status: 500 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages, networkName } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const userInfo = await getUserLocation(session.user.email);
    const hasLocation = !!(userInfo?.latitude && userInfo?.longitude);

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const needsWeather = isWeatherRelated(lastUserMsg);

    let systemPrompt = buildSystemPrompt(userInfo?.locationName || null, hasLocation);

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

    const aiMessage = await callAI(
      fullMessages,
      session.user.email,
      networkName || "openai-gpt4o-mini"
    );

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
      const retryMessage = await callAI(
        retryMessages,
        session.user.email,
        "openai-gpt4o"
      );

      if (userInfo?.id) {
        await saveMessages(userInfo.id, lastUserMsg, retryMessage);
      }

      return NextResponse.json({ message: retryMessage });
    }

    if (userInfo?.id) {
      await saveMessages(userInfo.id, lastUserMsg, aiMessage);
    }

    return NextResponse.json({ message: aiMessage });
  } catch {
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
): Promise<string> {
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

  const data = await response.json();

  if (data.status === "failed") {
    throw new Error(data.errorMessage || "AI request failed");
  }

  return (
    data.response?.choices?.[0]?.message?.content ||
    "Не удалось получить ответ от ИИ."
  );
}
