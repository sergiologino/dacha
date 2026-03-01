import { NextRequest, NextResponse } from "next/server";
import { isPushConfigured, sendPushToUser } from "@/lib/push-server";
import {
  getReminderEventsByUserForDate,
  formatReminderPayload,
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

  const allUserIds = new Set([...todayByUser.keys(), ...tomorrowByUser.keys()]);
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of allUserIds) {
    const todayEvents = todayByUser.get(userId) ?? [];
    const tomorrowEvents = tomorrowByUser.get(userId) ?? [];
    if (todayEvents.length === 0 && tomorrowEvents.length === 0) continue;

    let title: string;
    let body: string;
    if (todayEvents.length > 0 && tomorrowEvents.length > 0) {
      title = "Напоминание: задачи на сегодня и завтра";
      body = `Сегодня: ${todayEvents.length} ${todayEvents.length === 1 ? "задача" : "задач"}. Завтра: ${tomorrowEvents.length} ${tomorrowEvents.length === 1 ? "задача" : "задач"}.`;
    } else if (todayEvents.length > 0) {
      const p = formatReminderPayload(todayEvents, true);
      title = p.title;
      body = p.body;
    } else {
      const p = formatReminderPayload(tomorrowEvents, false);
      title = p.title;
      body = p.body;
    }

    const { sent, failed } = await sendPushToUser(userId, {
      title,
      body,
      url: "/calendar",
    });
    totalSent += sent;
    totalFailed += failed;
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    failed: totalFailed,
    users: allUserIds.size,
  });
}
