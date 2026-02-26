"use client";

type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  dateTo: string | null;
  isAction: boolean;
  sortOrder: number;
  doneAt: string | null;
};

function formatDateRange(scheduledDate: string, dateTo: string | null): string {
  const from = new Date(scheduledDate);
  const to = dateTo ? new Date(dateTo) : null;
  const fromStr = from.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  if (!to || to.getTime() === from.getTime()) return fromStr;
  const toStr = to.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${fromStr}–${toStr}`;
}

export function PlantTimelineLabels({
  events,
  plantedDate,
}: {
  events: TimelineEvent[];
  plantedDate: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureActions = events.filter(
    (e) => e.isAction && !e.doneAt && new Date(e.scheduledDate) >= today
  );
  const futureExpected = events.filter(
    (e) => !e.isAction && new Date(e.scheduledDate) >= today
  );
  const nextAction = futureActions[0];
  const nextExpected = futureExpected[0];

  if (!nextAction && !nextExpected) return null;

  return (
    <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
      {nextAction && (
        <p className="font-medium text-amber-700 dark:text-amber-400">
          Сделать: {nextAction.description || nextAction.title}
          {nextAction.scheduledDate && (
            <span className="text-slate-500 ml-1">
              ({formatDateRange(nextAction.scheduledDate, nextAction.dateTo)})
            </span>
          )}
        </p>
      )}
      {nextExpected && (
        <p>
          Ожидается: {nextExpected.description || nextExpected.title}{" "}
          <span className="text-slate-500">
            {formatDateRange(nextExpected.scheduledDate, nextExpected.dateTo)}
          </span>
        </p>
      )}
    </div>
  );
}

export function PlantTimelineBar({
  events,
  plantedDate,
}: {
  events: TimelineEvent[];
  plantedDate: string;
}) {
  if (events.length === 0) return null;

  const start = new Date(plantedDate);
  const endDate = events.reduce<Date>((acc, e) => {
    const d = e.dateTo ? new Date(e.dateTo) : new Date(e.scheduledDate);
    return d > acc ? d : acc;
  }, new Date(events[0].scheduledDate));
  const end = endDate;
  const totalMs = end.getTime() - start.getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const todayOffset =
    totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (today.getTime() - startDay.getTime()) / totalMs));

  return (
    <div className="relative h-8 w-full rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
      {/* Today line */}
      {totalMs > 0 && todayOffset > 0 && todayOffset < 1 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
          style={{ left: `${todayOffset * 100}%` }}
          title="Сегодня"
        />
      )}
      {/* Event markers */}
      {events.map((e) => {
        const d = new Date(e.scheduledDate);
        d.setHours(0, 0, 0, 0);
        const pos = totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (d.getTime() - startDay.getTime()) / totalMs));
        return (
          <div
            key={e.id}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 border border-white dark:border-slate-800 shadow"
            style={{ left: `${pos * 100}%`, marginLeft: "-4px" }}
            title={`${e.title}${e.description ? `: ${e.description}` : ""}`}
          />
        );
      })}
    </div>
  );
}
