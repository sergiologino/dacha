import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Публичная конфигурация для клиента (ссылки обратной связи и т.п.).
 * Читается на сервере в рантайме — после деплоя достаточно задать
 * переменные окружения на сервере, перезапуск приложения без пересборки.
 */
export async function GET() {
  const telegramUrl = process.env.NEXT_PUBLIC_FEEDBACK_TELEGRAM_URL || "";
  const maxUrl = process.env.NEXT_PUBLIC_FEEDBACK_MAX_URL || "";
  return NextResponse.json({
    feedbackTelegramUrl: telegramUrl,
    feedbackMaxUrl: maxUrl,
  });
}
