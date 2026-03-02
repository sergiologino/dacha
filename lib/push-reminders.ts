import { prisma } from "@/lib/prisma";

/** Смещение Москвы от UTC в миллисекундах (UTC+3). */
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Возвращает границы дня (00:00:00.000 и 23:59:59.999) в указанной таймзоне как UTC Date.
 * Поддерживается Europe/Moscow (жёстко UTC+3). Для других TZ используется Intl и приближение.
 */
export function getDayBoundsInTimezone(
  date: Date,
  timeZone: string
): { dayStart: Date; dayEnd: Date } {
  const str = date.toLocaleDateString("en-CA", { timeZone });
  const [y, m, d] = str.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    const fallback = new Date(date);
    fallback.setUTCHours(0, 0, 0, 0);
    const start = new Date(fallback);
    const end = new Date(fallback);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
    return { dayStart: start, dayEnd: end };
  }
  if (timeZone === "Europe/Moscow") {
    const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - MOSCOW_OFFSET_MS);
    const dayEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - MOSCOW_OFFSET_MS);
    return { dayStart, dayEnd };
  }
  const fallback = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { dayStart: fallback, dayEnd: end };
}

export type ReminderEvent = {
  title: string;
  bedName: string;
  plantName: string;
  description: string | null;
};

/**
 * События-напоминания на указанный день (dayStart..dayEnd в UTC): isAction, не выполнено (doneAt null),
 * дата события пересекается с диапазоном.
 */
export async function getReminderEventsByUserForDate(
  dayStart: Date,
  dayEnd: Date
): Promise<Map<string, ReminderEvent[]>> {
  const events = await prisma.plantTimelineEvent.findMany({
    where: {
      isAction: true,
      doneAt: null,
      scheduledDate: { lte: dayEnd },
      OR: [
        { dateTo: null, scheduledDate: { gte: dayStart } },
        { dateTo: { gte: dayStart } },
      ],
    },
    include: {
      plant: {
        include: {
          bed: true,
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const byUser = new Map<string, ReminderEvent[]>();
  for (const e of events) {
    const start = new Date(e.scheduledDate);
    const end = e.dateTo ? new Date(e.dateTo) : start;
    if (end < dayStart || start > dayEnd) continue;
    const userId = e.plant.userId;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId)!.push({
      title: e.title,
      bedName: e.plant.bed?.name ?? "Без грядки",
      plantName: e.plant.name,
      description: e.description,
    });
  }
  return byUser;
}

export function formatReminderPayload(
  events: ReminderEvent[],
  isToday: boolean
): { title: string; body: string; url: string } {
  const dateLabel = isToday ? "Сегодня" : "Завтра";
  if (events.length === 0) {
    return {
      title: "Любимая Дача",
      body: `${dateLabel} запланированных работ нет`,
      url: "/calendar",
    };
  }
  if (events.length === 1) {
    const e = events[0]!;
    return {
      title: `${dateLabel}: ${e.title}`,
      body: [e.bedName, e.plantName].filter(Boolean).join(" · ") + (e.description ? ` — ${e.description.slice(0, 60)}${e.description.length > 60 ? "…" : ""}` : ""),
      url: "/calendar",
    };
  }
  const first = events[0]!;
  return {
    title: `${dateLabel}: ${events.length} задач`,
    body: first.title + (events.length > 1 ? ` и ещё ${events.length - 1}` : ""),
    url: "/calendar",
  };
}
