import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

const VISION_PROMPT =
  "Ты опытный агроном. Проанализируй фото растения и дай короткий, понятный ответ на русском: " +
  "1) Что за растение (если понятно), 2) Какая проблема видна, 3) Как лечить или что делать. " +
  "Не используй сложные термины. Если на фото нет растения — скажи об этом.";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AI_URL || !AI_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  const { image } = await request.json();
  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  try {
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
        userId: session.user.email,
        networkName: "openai-gpt4o",
        requestType: "chat",
        payload: {
          messages: [
            { role: "system", content: VISION_PROMPT },
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

    const data = await response.json();

    if (data.status === "failed") {
      return NextResponse.json(
        { error: data.errorMessage || "AI analysis failed" },
        { status: 502 }
      );
    }

    const result =
      data.response?.choices?.[0]?.message?.content ||
      "Не удалось распознать. Попробуйте другое фото.";

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
