"use client";

import { useState } from "react";

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

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
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

const TICK_STEP_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export function PlantTimelineBar({
  events,
  plantedDate,
}: {
  events: TimelineEvent[];
  plantedDate: string;
}) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  if (events.length === 0) return null;

  const start = new Date(plantedDate);
  const endDate = events.reduce<Date>((acc, e) => {
    const d = e.dateTo ? new Date(e.dateTo) : new Date(e.scheduledDate);
    return d > acc ? d : acc;
  }, new Date(events[0].scheduledDate));
  const end = endDate;
  const totalMs = Math.max(end.getTime() - start.getTime(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const todayOffset =
    totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (today.getTime() - startDay.getTime()) / totalMs));

  // Tick positions for scale (vertical lines)
  const ticks: { date: Date; offset: number }[] = [];
  let t = new Date(startDay.getTime());
  while (t.getTime() <= end.getTime()) {
    const offset = (t.getTime() - startDay.getTime()) / totalMs;
    if (offset >= 0 && offset <= 1) ticks.push({ date: new Date(t), offset });
    t.setTime(t.getTime() + TICK_STEP_MS);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1]?.offset < 1) {
    ticks.push({ date: new Date(end), offset: 1 });
  }

  const toPct = (offset: number) => `${offset * 100}%`;

  return (
    <div className="w-full space-y-1">
      {/* Bar with dots */}
      <div className="relative h-8 w-full rounded-t-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* Today line — orange, full height */}
        {totalMs > 0 && todayOffset > 0 && todayOffset < 1 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10"
            style={{ left: toPct(todayOffset) }}
            title="Сегодня"
            aria-hidden
          />
        )}
        {/* Event markers — clickable */}
        {events.map((e) => {
          const d = new Date(e.scheduledDate);
          d.setHours(0, 0, 0, 0);
          const pos = totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (d.getTime() - startDay.getTime()) / totalMs));
          const label = e.description || e.title;
          const isSelected = selectedEvent?.id === e.id;
          return (
            <button
              type="button"
              key={e.id}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800 ${
                isSelected
                  ? "bg-emerald-500 border-emerald-700 dark:border-emerald-400 scale-110 ring-2 ring-orange-400"
                  : "bg-emerald-600 dark:bg-emerald-500 border-white dark:border-slate-800"
              }`}
              style={{ left: toPct(pos), marginLeft: "-6px" }}
              title={label}
              onClick={() => setSelectedEvent(isSelected ? null : e)}
            />
          );
        })}
      </div>

      {/* Scale: ticks + today triangle */}
      <div className="relative h-5 w-full rounded-b-lg bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
        {/* Vertical tick marks */}
        {ticks.map(({ offset }, i) => (
          <div
            key={i}
            className="absolute bottom-0 top-0 w-px bg-slate-400 dark:bg-slate-500"
            style={{ left: toPct(offset) }}
          />
        ))}
        {/* Today: orange line + triangle pointer */}
        {totalMs > 0 && todayOffset > 0 && todayOffset < 1 && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500"
              style={{ left: toPct(todayOffset), marginLeft: "-1px" }}
            />
            <div
              className="absolute bottom-0 text-orange-500 -translate-x-1/2"
              style={{ left: toPct(todayOffset), marginLeft: "-6px" }}
              title="Сегодня"
            >
              <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor" className="drop-shadow-sm">
                <path d="M6 0l6 8H0L6 0z" />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Selected point description */}
      {selectedEvent && (
        <p className="text-xs text-slate-600 dark:text-slate-400 py-0.5 px-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatDateShort(new Date(selectedEvent.scheduledDate))}
            {selectedEvent.dateTo && selectedEvent.dateTo !== selectedEvent.scheduledDate
              ? ` – ${formatDateShort(new Date(selectedEvent.dateTo))}`
              : ""}
          </span>
          {" — "}
          {selectedEvent.description || selectedEvent.title}
        </p>
      )}
    </div>
  );
}
