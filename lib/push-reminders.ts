import { prisma } from "@/lib/prisma";

export type ReminderEvent = {
  title: string;
  bedName: string;
  plantName: string;
  description: string | null;
};

/**
 * События-напоминания на указанную дату (день целиком): isAction, не выполнено (doneAt null),
 * дата события пересекается с targetDate.
 */
export async function getReminderEventsByUserForDate(
  targetDate: Date
): Promise<Map<string, ReminderEvent[]>> {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const events = await prisma.plantTimelineEvent.findMany({
    where: {
      isAction: true,
      doneAt: null,
      scheduledDate: { lte: dayEnd },
      OR: [
        { dateTo: null },
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
