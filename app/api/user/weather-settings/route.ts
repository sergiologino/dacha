import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
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

  return NextResponse.json({
    weatherPushEnabled: user.weatherPushEnabled,
    weatherCheckIntervalMinutes:
      user.weatherCheckIntervalMinutes ?? WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT,
    hasLocation: user.latitude != null && user.longitude != null,
    minIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MIN,
    maxIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MAX,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      weatherPushEnabled,
      weatherCheckIntervalMinutes,
      weatherLastCheckedAt: null,
      weatherAlertKeys: [],
      weatherLastPressureMb: null,
    },
  });

  return NextResponse.json({
    weatherPushEnabled: updated.weatherPushEnabled,
    weatherCheckIntervalMinutes: updated.weatherCheckIntervalMinutes,
    hasLocation: updated.latitude != null && updated.longitude != null,
    minIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MIN,
    maxIntervalMinutes: WEATHER_CHECK_INTERVAL_MINUTES_MAX,
  });
}
