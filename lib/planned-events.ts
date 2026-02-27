import type { Bed } from "@/lib/hooks/use-beds";

export type PlannedWorkItem = {
  id: string;
  plantId: string;
  bedId: string;
  scheduledDate: string;
  dateTo: string | null;
  bedName: string;
  plantName: string;
  title: string;
  description: string | null;
  isAction: boolean;
  type?: string;
};

export function getPlannedEventsForMonth(
  beds: Bed[] | undefined,
  selectedMonth: number,
  year?: number
): PlannedWorkItem[] {
  if (!beds?.length) return [];
  const items: PlannedWorkItem[] = [];
  const y = year ?? new Date().getFullYear();
  const monthStart = new Date(y, selectedMonth - 1, 1);
  const monthEnd = new Date(y, selectedMonth, 0, 23, 59, 59);

  for (const bed of beds) {
    for (const plant of bed.plants ?? []) {
      const events = plant.timelineEvents ?? [];
      for (const event of events) {
        const start = new Date(event.scheduledDate);
        const end = event.dateTo ? new Date(event.dateTo) : start;
        if (end < monthStart || start > monthEnd) continue;

        items.push({
          id: event.id,
          plantId: plant.id,
          bedId: bed.id,
          scheduledDate: event.scheduledDate,
          dateTo: event.dateTo,
          bedName: bed.name,
          plantName: plant.name,
          title: event.title,
          description: event.description,
          isAction: event.isAction,
          type: event.type,
        });
      }
    }
  }

  items.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  return items;
}

/** События, попадающие на конкретный день (дата по календарю) */
export function getPlannedEventsForDay(
  plannedItems: PlannedWorkItem[],
  dayOfMonth: number,
  month: number,
  year: number
): PlannedWorkItem[] {
  const dayStart = new Date(year, month - 1, dayOfMonth, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, dayOfMonth, 23, 59, 59);
  return plannedItems.filter((item) => {
    const start = new Date(item.scheduledDate);
    const end = item.dateTo ? new Date(item.dateTo) : start;
    return start <= dayEnd && end >= dayStart;
  });
}
