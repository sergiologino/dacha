import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { hasFullAccess } from "@/lib/user-access";
import {
  WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT,
  WEATHER_CHECK_INTERVAL_MINUTES_MAX,
  WEATHER_CHECK_INTERVAL_MINUTES_MIN,
  normalizeWeatherCheckIntervalMinutes,
} from "@/lib/weather-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        latitude: true,
        longitude: true,
        weatherPushEnabled: true,
        weatherCheckIntervalMinutes: true,
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interval = normalizeWeatherCheckIntervalMinutes(
      row.weatherCheckIntervalMinutes
    );

    return NextResponse.json({
      weatherPushEnabled: hasFullAccess(user) && row.weatherPushEnabled,
      weatherCheckIntervalMinutes: interval,
      hasLocation: row.latitude != null && row.longitude != null,
      minIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MIN,
      maxIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MAX,
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2022") {
      return NextResponse.json(
        {
          error:
            "Погодные уведомления временно недоступны: в рабочей базе ещё не применена миграция настроек погоды.",
          weatherPushEnabled: false,
          weatherCheckIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT,
          hasLocation: user.latitude != null && user.longitude != null,
          minIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MIN,
          maxIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MAX,
        },
        { status: 503 }
      );
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasFullAccess(user)) {
    return NextResponse.json(
      {
        error:
          "Погодные предупреждения доступны в пробном периоде или с подпиской Премиум. Оформите подписку в приложении.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const weatherPushEnabled = body.weatherPushEnabled;
  const weatherCheckIntervalMinutes = normalizeWeatherCheckIntervalMinutes(
    body.weatherCheckIntervalMinutes
  );

  if (typeof weatherPushEnabled !== "boolean") {
    return NextResponse.json(
      { error: "weatherPushEnabled must be boolean" },
      { status: 400 }
    );
  }

  if (
    weatherPushEnabled &&
    (user.latitude == null || user.longitude == null)
  ) {
    return NextResponse.json(
      { error: "Для погодных предупреждений сначала сохраните местоположение участка." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        weatherPushEnabled,
        weatherCheckIntervalMinutes,
        weatherLastCheckedAt: null,
        weatherAlertKeys: [],
        weatherLastPressureMb: null,
      },
      select: {
        latitude: true,
        longitude: true,
        weatherPushEnabled: true,
        weatherCheckIntervalMinutes: true,
      },
    });

    return NextResponse.json({
      weatherPushEnabled: updated.weatherPushEnabled,
      weatherCheckIntervalMinutes: updated.weatherCheckIntervalMinutes,
      hasLocation: updated.latitude != null && updated.longitude != null,
      minIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MIN,
      maxIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MAX,
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2022") {
      return NextResponse.json(
        {
          error:
            "Погодные уведомления временно недоступны: в рабочей базе ещё не применена миграция настроек погоды.",
        },
        { status: 503 }
      );
    }

    throw error;
  }
}
