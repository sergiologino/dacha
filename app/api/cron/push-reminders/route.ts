import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasFullAccess } from "@/lib/user-access";
import { isPushConfigured, sendPushToUser } from "@/lib/push-server";
import {
  buildReminderDedupeKey,
  getReminderEventsByUserForDate,
  formatReminderPayload,
  formatCombinedReminderPayload,
  getDayBoundsInTimezone,
} from "@/lib/push-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.nextUrl.searchParams.get("secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push not configured", sent: 0 },
      { status: 503 }
    );
  }

  const tz = process.env.PUSH_REMINDERS_TZ ?? process.env.TZ ?? "Europe/Moscow";
  const { dayStart: todayStart, dayEnd: todayEnd } = getDayBoundsInTimezone(new Date(), tz);
  const nextDayInTz = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const { dayStart: tomorrowStart, dayEnd: tomorrowEnd } = getDayBoundsInTimezone(nextDayInTz, tz);

  const todayByUser = await getReminderEventsByUserForDate(todayStart, todayEnd);
  const tomorrowByUser = await getReminderEventsByUserForDate(tomorrowStart, tomorrowEnd);
  const todayKey = todayStart.toISOString().slice(0, 10);
  const tomorrowKey = tomorrowStart.toISOString().slice(0, 10);

  const allUserIds = new Set([...todayByUser.keys(), ...tomorrowByUser.keys()]);
  const userRows =
    allUserIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...allUserIds] } },
          select: { id: true, isPremium: true, createdAt: true },
        })
      : [];
  const eligibleIds = new Set(userRows.filter((u) => hasFullAccess(u)).map((r) => r.id));

  let totalSent = 0;
  let totalFailed = 0;
  let totalSkippedDuplicates = 0;
  let totalSkippedWithoutSubscriptions = 0;
  let totalStaleDeleted = 0;

  for (const userId of allUserIds) {
    if (!eligibleIds.has(userId)) continue;
    const todayEvents = todayByUser.get(userId) ?? [];
    const tomorrowEvents = tomorrowByUser.get(userId) ?? [];
    if (todayEvents.length === 0 && tomorrowEvents.length === 0) continue;

    let payload: { title: string; body: string; url: string };
    if (todayEvents.length > 0 && tomorrowEvents.length > 0) {
      payload = formatCombinedReminderPayload(todayEvents, tomorrowEvents);
    } else if (todayEvents.length > 0) {
      payload = formatReminderPayload(todayEvents, true);
    } else {
      payload = formatReminderPayload(tomorrowEvents, false);
    }

    const dedupeKey = buildReminderDedupeKey({
      userId,
      todayKey,
      todayEvents,
      tomorrowKey,
      tomorrowEvents,
    });

    try {
      await prisma.pushDeliveryLog.create({
        data: {
          userId,
          dedupeKey,
        },
      });
    } catch (error) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        totalSkippedDuplicates++;
        continue;
      }
      throw error;
    }

    const { sent, failed, subscriptions, staleDeleted } = await sendPushToUser(
      userId,
      payload
    );

    if (subscriptions === 0) {
      totalSkippedWithoutSubscriptions++;
      await prisma.pushDeliveryLog.deleteMany({
        where: { dedupeKey },
      });
      continue;
    }

    if (sent === 0) {
      await prisma.pushDeliveryLog.deleteMany({
        where: { dedupeKey },
      });
    }

    totalSent += sent;
    totalFailed += failed;
    totalStaleDeleted += staleDeleted;
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    failed: totalFailed,
    skippedDuplicates: totalSkippedDuplicates,
    skippedWithoutSubscriptions: totalSkippedWithoutSubscriptions,
    staleDeleted: totalStaleDeleted,
    users: allUserIds.size,
  });
}
