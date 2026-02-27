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

export type PhotoCheck = {
  id: string;
  date: string;
  status: "ok" | "problem";
  verdict: string;
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

const TICK_STEP_DAYS = 10;
const TICK_STEP_MS = TICK_STEP_DAYS * 24 * 60 * 60 * 1000;
const SCALE_INSET = 0.02; // scale content 2%..98% so first/last day not on edge

function scaleLeft(offset: number): string {
  const pct = SCALE_INSET + offset * (1 - 2 * SCALE_INSET);
  return `${pct * 100}%`;
}

export function PlantTimelineBar({
  events,
  plantedDate,
  photoChecks = [],
  onEventClick,
}: {
  events: TimelineEvent[];
  plantedDate: string;
  photoChecks?: PhotoCheck[];
  /** При клике по событию (точка или блок описания) — открыть редактирование */
  onEventClick?: (event: TimelineEvent) => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedPhotoCheck, setSelectedPhotoCheck] = useState<PhotoCheck | null>(null);

  if (events.length === 0 && photoChecks.length === 0) return null;

  const start = new Date(plantedDate);
  const eventEnd = events.length > 0
    ? events.reduce<Date>((acc, e) => {
        const d = e.dateTo ? new Date(e.dateTo) : new Date(e.scheduledDate);
        return d > acc ? d : acc;
      }, new Date(events[0].scheduledDate))
    : null;
  const photoEnd =
    photoChecks.length > 0
      ? new Date(Math.max(...photoChecks.map((p) => new Date(p.date).getTime())))
      : null;
  const end = [eventEnd, photoEnd].filter(Boolean).reduce<Date>(
    (acc, d) => (d && d > acc ? d : acc),
    start
  );
  const totalMs = Math.max(end.getTime() - start.getTime(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const todayOffset =
    totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (today.getTime() - startDay.getTime()) / totalMs));

  // Ticks every 10 days; which get a label (longer tick) — thin so labels don't overlap
  const allTicks: { date: Date; offset: number }[] = [];
  let t = new Date(startDay.getTime());
  while (t.getTime() <= end.getTime()) {
    const offset = (t.getTime() - startDay.getTime()) / totalMs;
    if (offset >= 0 && offset <= 1) allTicks.push({ date: new Date(t), offset });
    t.setTime(t.getTime() + TICK_STEP_MS);
  }
  if (allTicks.length === 0 || allTicks[allTicks.length - 1]!.offset < 1) {
    allTicks.push({ date: new Date(end), offset: 1 });
  }

  // Which ticks get a label (longer tick): max ~6–8 labels so they don't overlap
  const maxLabels = 8;
  const step = Math.max(1, Math.ceil(allTicks.length / maxLabels));
  const ticksWithLabel = new Set<number>(
    allTicks.map((_, i) => i).filter((i) => i % step === 0 || i === 0 || i === allTicks.length - 1)
  );

  return (
    <div className="w-full space-y-0.5">
      {/* Bar with dots — same inset so dots not on gray edge */}
      <div className="relative h-8 w-full rounded-t-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* Today line — orange */}
        {totalMs > 0 && todayOffset > 0 && todayOffset < 1 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10"
            style={{ left: scaleLeft(todayOffset) }}
            title="Сегодня"
            aria-hidden
          />
        )}
        {/* Event markers — green, clickable */}
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
              style={{ left: scaleLeft(pos), marginLeft: "-6px" }}
              title={label}
              onClick={() => {
                setSelectedPhotoCheck(null);
                setSelectedEvent(isSelected ? null : e);
              }}
            />
          );
        })}
        {/* Photo check markers — blue (ok) / red (problem), clickable */}
        {photoChecks.map((p) => {
          const d = new Date(p.date);
          d.setHours(0, 0, 0, 0);
          const pos = totalMs <= 0 ? 0 : Math.min(1, Math.max(0, (d.getTime() - startDay.getTime()) / totalMs));
          const isSelected = selectedPhotoCheck?.id === p.id;
          const isOk = p.status === "ok";
          return (
            <button
              type="button"
              key={p.id}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800 ${
                isOk
                  ? isSelected
                    ? "bg-blue-500 border-blue-700 dark:border-blue-400 scale-110 ring-2 ring-orange-400"
                    : "bg-blue-600 dark:bg-blue-500 border-white dark:border-slate-800"
                  : isSelected
                    ? "bg-red-500 border-red-700 dark:border-red-400 scale-110 ring-2 ring-orange-400"
                    : "bg-red-600 dark:bg-red-500 border-white dark:border-slate-800"
              }`}
              style={{ left: scaleLeft(pos), marginLeft: "-6px" }}
              title={p.verdict}
              onClick={() => {
                setSelectedEvent(null);
                setSelectedPhotoCheck(isSelected ? null : p);
              }}
            />
          );
        })}
      </div>

      {/* Scale: ~3x shorter (tick row), transparent; ticks every 10 days; labels on a subset */}
      <div className="relative w-full rounded-b-lg bg-transparent overflow-visible pt-0.5 min-h-[32px]">
        {/* Tick row: height ~1/3 of former (6–7px) */}
        <div className="relative w-full" style={{ height: "7px" }}>
          {allTicks.map(({ offset }, i) => {
            const hasLabel = ticksWithLabel.has(i);
            return (
              <div
                key={i}
                className="absolute bottom-0 w-px bg-slate-400 dark:bg-slate-500"
                style={{
                  left: scaleLeft(offset),
                  marginLeft: "-1px",
                  height: hasLabel ? "7px" : "4px",
                }}
              />
            );
          })}
          {/* Today: orange line + triangle on scale */}
          {totalMs > 0 && todayOffset > 0 && todayOffset < 1 && (
            <>
              <div
                className="absolute bottom-0 w-0.5 bg-orange-500 -translate-x-1/2"
                style={{ left: scaleLeft(todayOffset), height: "7px", marginLeft: "-1px" }}
              />
              <div
                className="absolute bottom-0 text-orange-500 -translate-x-1/2"
                style={{ left: scaleLeft(todayOffset), marginLeft: "-5px" }}
                title="Сегодня"
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className="sm:w-3 sm:h-2" aria-hidden>
                  <path d="M5 0l5 6H0L5 0z" />
                </svg>
              </div>
            </>
          )}
        </div>
        {/* Date labels below ticks — only where we have room */}
        {allTicks.map(({ date, offset }, i) => {
          if (!ticksWithLabel.has(i)) return null;
          return (
            <span
              key={`label-${i}`}
              className="absolute -translate-x-1/2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
              style={{
                left: scaleLeft(offset),
                top: "18px",
              }}
            >
              {formatDateShort(date)}
            </span>
          );
        })}
      </div>

      {/* Selected point description — строго под шкалой, с отступом; клик открывает редактирование */}
      {selectedEvent && (
        <div className="text-xs text-slate-600 dark:text-slate-400 py-1.5 px-1 mt-1 flex items-start justify-between gap-2">
          <p className="min-w-0">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatDateShort(new Date(selectedEvent.scheduledDate))}
              {selectedEvent.dateTo && selectedEvent.dateTo !== selectedEvent.scheduledDate
                ? ` – ${formatDateShort(new Date(selectedEvent.dateTo))}`
                : ""}
            </span>
            {" — "}
            {selectedEvent.description || selectedEvent.title}
          </p>
          {onEventClick && (
            <button
              type="button"
              onClick={() => onEventClick(selectedEvent)}
              className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Изменить
            </button>
          )}
        </div>
      )}
      {selectedPhotoCheck && (
        <p className="text-xs text-slate-600 dark:text-slate-400 py-1.5 px-1 mt-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatDateShort(new Date(selectedPhotoCheck.date))}
          </span>
          {" — "}
          {selectedPhotoCheck.verdict}
        </p>
      )}
    </div>
  );
}
