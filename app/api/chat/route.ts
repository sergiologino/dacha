import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const SYSTEM_PROMPT = `Ты — AI-агроном, помощник для дачников и садоводов в России. Твоё имя — ДачаAI.

Правила:
- Отвечай на русском языке
- Давай конкретные, практичные советы по садоводству и огородничеству
- Учитывай российский климат и условия
- При анализе болезней растений описывай симптомы и предлагай лечение
- Рекомендуй сроки посадки для средней полосы России, если не указан регион
- Будь дружелюбным и кратким (2-4 предложения, если не нужен подробный ответ)
- Если не уверен — честно скажи и предложи обратиться к агроному`;

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

    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch(`${AI_URL}/api/ai/process`, {
      method: "POST",
      headers: {
        "X-API-Key": AI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session.user.email,
        networkName: networkName || "openai-gpt4o-mini",
        requestType: "chat",
        payload: { messages: fullMessages },
      }),
    });

    const data = await response.json();

    if (data.status === "failed") {
      return NextResponse.json(
        {
          error: data.errorMessage || "AI request failed",
          networkUsed: data.networkUsed,
        },
        { status: 502 }
      );
    }

    const aiMessage =
      data.response?.choices?.[0]?.message?.content ||
      "Не удалось получить ответ от ИИ.";

    return NextResponse.json({
      message: aiMessage,
      networkUsed: data.networkUsed,
      tokensUsed: data.tokensUsed,
      executionTimeMs: data.executionTimeMs,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 502 }
    );
  }
}
