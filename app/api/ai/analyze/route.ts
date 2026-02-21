import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image } = await request.json();
  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;

  if (!apiKey || !folderId) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  try {
    const base64 = image.includes(",") ? image.split(",")[1] : image;

    const response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json",
          "x-folder-id": folderId,
        },
        body: JSON.stringify({
          modelUri: `gpt://${folderId}/yandexgpt/latest`,
          messages: [
            {
              role: "system",
              text: "Ты опытный агроном. Анализируй фото растения и дай короткий, понятный ответ на русском: что за проблема, как лечить, что делать срочно. Не используй сложные термины.",
            },
            {
              role: "user",
              text: "Что не так с этим растением? Дай рекомендацию.",
              image: base64,
            },
          ],
          temperature: 0.3,
          maxTokens: 500,
        }),
      }
    );

    const data = await response.json();
    const result =
      data.result?.alternatives?.[0]?.message?.text ||
      "Не удалось распознать. Попробуйте другое фото.";

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
