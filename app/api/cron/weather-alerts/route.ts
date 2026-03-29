import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPushConfigured, sendPushToUser } from "@/lib/push-server";
import { buildWeatherAlerts, summarizeWeatherAlertsForPush } from "@/lib/weather-alerts";
import { buildCropWeatherProfile } from "@/lib/crop-weather-context";
import { buildGardenWeatherContext } from "@/lib/garden-weather-context";
import { fetchWeatherData } from "@/lib/weather-server";

export const dynamic = "force-dynamic";

function isUserDue(lastCheckedAt: Date | null, intervalMinutes: number, now: Date) {
  if (!lastCheckedAt) return true;
  return now.getTime() - lastCheckedAt.getTime() >= intervalMinutes * 60 * 1000;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push not configured", sent: 0 },
      { status: 503 }
    );
  }

  const now = new Date();
  const candidates = await prisma.user.findMany({
    where: {
      isPremium: true,
      weatherPushEnabled: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      locationName: true,
      weatherCheckIntervalMinutes: true,
      weatherLastCheckedAt: true,
      weatherAlertKeys: true,
      weatherLastPressureMb: true,
      beds: {
        select: {
          type: true,
          plants: {
            select: {
              name: true,
              cropSlug: true,
            },
          },
        },
      },
    },
  });

  let checked = 0;
  let due = 0;
  let sent = 0;
  let failed = 0;
  let skippedDuplicates = 0;
  let staleDeleted = 0;
  let fetchErrors = 0;

  for (const user of candidates) {
    checked++;
    if (
      !isUserDue(user.weatherLastCheckedAt, user.weatherCheckIntervalMinutes, now)
    ) {
      continue;
    }

    due++;

    try {
      const weather = await fetchWeatherData(user.latitude!, user.longitude!);
      const context = buildGardenWeatherContext(user.beds.map((bed) => bed.type));
      const cropProfile = buildCropWeatherProfile(
        user.beds.flatMap((bed) =>
          bed.plants.map((plant) => ({
            name: plant.name,
            cropSlug: plant.cropSlug,
            bedType: bed.type,
          }))
        )
      );
      const activeAlerts = buildWeatherAlerts(
        {
          current: {
            temp_c: weather.current.temp_c,
            wind_kph: weather.current.wind_kph,
            pressure_mb: weather.current.pressure_mb,
          },
          forecast: weather.forecast.map((day) => ({
            date: day.date,
            maxtemp_c: day.maxtemp_c,
            mintemp_c: day.mintemp_c,
            maxwind_kph: day.maxwind_kph,
            totalprecip_mm: day.totalprecip_mm,
            daily_chance_of_rain: day.daily_chance_of_rain,
            daily_chance_of_snow: day.daily_chance_of_snow,
          })),
        },
        {
          context,
          cropProfile,
          previousPressureMb: user.weatherLastPressureMb,
        }
      );
      const activeKeys = activeAlerts.map((alert) => alert.key);
      const previousKeys = user.weatherAlertKeys ?? [];
      const newAlerts = activeAlerts.filter(
        (alert) => !previousKeys.includes(alert.key)
      );

      if (newAlerts.length === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            weatherLastCheckedAt: now,
            weatherAlertKeys: activeKeys,
            weatherLastPressureMb: weather.current.pressure_mb,
          },
        });
        continue;
      }

      const dedupeKey = [
        "weather",
        user.id,
        ...activeKeys.slice().sort(),
      ].join(":");

      try {
        await prisma.pushDeliveryLog.create({
          data: {
            userId: user.id,
            dedupeKey,
          },
        });
      } catch (error) {
        if ((error as { code?: string } | null)?.code === "P2002") {
          skippedDuplicates++;
          continue;
        }
        throw error;
      }

      const payload = summarizeWeatherAlertsForPush(newAlerts);
      if (user.locationName) {
        payload.body = `${user.locationName}: ${payload.body}`;
      }

      const result = await sendPushToUser(user.id, payload);
      sent += result.sent;
      failed += result.failed;
      staleDeleted += result.staleDeleted;

      if (result.sent > 0 || result.subscriptions === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            weatherLastCheckedAt: now,
            weatherAlertKeys: activeKeys,
            weatherLastPressureMb: weather.current.pressure_mb,
          },
        });
      } else {
        await prisma.pushDeliveryLog.deleteMany({
          where: { dedupeKey },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            weatherLastCheckedAt: now,
            weatherLastPressureMb: weather.current.pressure_mb,
          },
        });
      }
    } catch (error) {
      fetchErrors++;
      console.error("[cron][weather-alerts]", {
        userId: user.id,
        error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    due,
    sent,
    failed,
    skippedDuplicates,
    staleDeleted,
    fetchErrors,
  });
}
