import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { hasFullAccess } from "@/lib/user-access";
import { isPushConfigured, sendPushToUser } from "@/lib/push-server";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFullAccess(user)) {
      return NextResponse.json(
        { error: "Push-уведомления доступны с Премиум или активным пробным периодом." },
        { status: 403 }
      );
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Push на сервере не настроен: отсутствуют VAPID_PUBLIC_KEY или VAPID_PRIVATE_KEY." },
        { status: 503 }
      );
    }

    const result = await sendPushToUser(user.id, {
      title: "Любимая Дача",
      body: "Тестовое уведомление работает. Напоминания по уходу будут приходить на это устройство.",
      url: "/settings",
    });

    if (result.subscriptions === 0) {
      return NextResponse.json(
        { ...result, error: "Для пользователя нет активной push-подписки. Нажмите «Включить уведомления» ещё раз." },
        { status: 409 }
      );
    }

    if (result.sent === 0) {
      return NextResponse.json(
        { ...result, error: "Подписка найдена, но push не доставлен. Попробуйте выключить и включить уведомления заново." },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
