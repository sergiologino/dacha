"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sprout } from "lucide-react";
import {
  getMonthLunarDays,
  weekDays,
  monthNamesGen,
  type LunarDay,
} from "@/lib/data/lunar-calendar";
import {
  getPlannedEventsForMonth,
  getPlannedEventsForDay,
  type PlannedWorkItem,
} from "@/lib/planned-events";
import type { Bed } from "@/lib/hooks/use-beds";

const FERTILITY_COLORS: Record<string, string> = {
  high: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700",
  medium: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  low: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  barren: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

const FERTILITY_DOT: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-orange-500",
  barren: "bg-red-400",
};

type LunarCalendarProps = {
  beds?: Bed[] | null;
  onEditPlannedWork?: (item: PlannedWorkItem) => void;
};

export function LunarCalendar({ beds, onEditPlannedWork }: LunarCalendarProps = {}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<LunarDay | null>(null);

  const lunarDays = useMemo(() => getMonthLunarDays(year, month), [year, month]);
  const plannedItems = useMemo(
    () => getPlannedEventsForMonth(beds ?? undefined, month, year),
    [beds, month, year]
  );

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const folkDays = lunarDays.filter((d) => d.folkNote);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {monthNames[month - 1]} {year}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Лунный посевной календарь</p>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px]">
          ● Плодородный
        </Badge>
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px]">
          ● Средний
        </Badge>
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px]">
          ● Малоплодный
        </Badge>
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-[10px]">
          ● Бесплодный
        </Badge>
      </div>

      {/* Calendar grid */}
      <Card className="p-3 sm:p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-slate-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty offset cells */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {lunarDays.map((day) => {
            const isToday = isCurrentMonth && day.dayOfMonth === today;
            const isSelected = selectedDay?.dayOfMonth === day.dayOfMonth;
            const dayPlanned = getPlannedEventsForDay(plannedItems, day.dayOfMonth, month, year);

            return (
              <button
                key={day.dayOfMonth}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl p-1 min-h-[52px] sm:min-h-[60px] transition-all border
                  ${FERTILITY_COLORS[day.fertility]}
                  ${isToday ? "ring-2 ring-emerald-500 ring-offset-1" : ""}
                  ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 scale-105" : ""}
                  hover:scale-105
                `}
              >
                <span className={`text-sm font-semibold ${isToday ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                  {day.dayOfMonth}
                </span>
                <span className="text-[10px] leading-none">{day.phaseEmoji}</span>
                <span className="text-[9px] text-slate-500 leading-none mt-0.5">
                  {day.signEmoji}
                </span>
                {day.folkNote && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
                {dayPlanned.length > 0 && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"
                    title={`Плановых работ: ${dayPlanned.length}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day detail */}
      {selectedDay && (
        <Card className="p-5 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">
                {selectedDay.dayOfMonth} {monthNamesGen[month - 1]}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">
                  {selectedDay.phaseEmoji} {selectedDay.phaseLabel}
                </Badge>
                <Badge variant="secondary">
                  {selectedDay.signEmoji} {selectedDay.signLabel}
                </Badge>
                <Badge className={`${FERTILITY_COLORS[selectedDay.fertility]} text-xs`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${FERTILITY_DOT[selectedDay.fertility]} mr-1`} />
                  {selectedDay.fertilityLabel}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Лунный день: {selectedDay.moonAge}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {(() => {
          const dayPlanned = selectedDay
            ? getPlannedEventsForDay(plannedItems, selectedDay.dayOfMonth, month, year)
            : [];
          return dayPlanned.length > 0 ? (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <Sprout className="w-4 h-4" />
                Плановые работы с грядок
              </h4>
              <ul className="space-y-2">
                {dayPlanned.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onEditPlannedWork?.(item)}
                      className="w-full text-left p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200">
                          {item.bedName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                          {item.plantName}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">Нажмите, чтобы изменить</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

          {selectedDay.recommended.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                ✅ Рекомендуется
              </h4>
              <ul className="space-y-1">
                {selectedDay.recommended.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedDay.avoid.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1.5">
                ❌ Избегать
              </h4>
              <ul className="space-y-1">
                {selectedDay.avoid.map((a, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-red-400">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedDay.folkNote && (
            <div className="mt-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1">
                📜 Народный календарь
              </h4>
              <p className="text-sm text-violet-600 dark:text-violet-400">
                {selectedDay.folkNote}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Folk calendar highlights for this month */}
      {folkDays.length > 0 && !selectedDay && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📜 Народные приметы на {monthNames[month - 1].toLowerCase()}
          </h3>
          <div className="space-y-3">
            {folkDays.map((day) => (
              <div
                key={day.dayOfMonth}
                className="flex gap-3 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl -mx-2 transition-colors"
                onClick={() => setSelectedDay(day)}
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
                    {day.dayOfMonth}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {day.folkNote}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
