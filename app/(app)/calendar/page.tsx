"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { SubscribeModal } from "@/components/subscribe-modal";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { useBeds, type Bed } from "@/lib/hooks/use-beds";
import { ChevronLeft, ChevronRight, Moon, CalendarDays, Crown, Loader2, Sprout } from "lucide-react";
import {
  calendarTasks,
  monthNames,
  categoryConfig,
} from "@/lib/data/calendar-tasks";
import { crops } from "@/lib/data/crops";
import { LunarCalendar } from "./lunar-calendar";

type CalendarMode = "tasks" | "lunar";

export type PlannedWorkItem = {
  id: string;
  scheduledDate: string;
  dateTo: string | null;
  bedName: string;
  plantName: string;
  title: string;
  description: string | null;
  isAction: boolean;
};

function getPlannedEventsForMonth(beds: Bed[] | undefined, selectedMonth: number): PlannedWorkItem[] {
  if (!beds?.length) return [];
  const items: PlannedWorkItem[] = [];
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, selectedMonth - 1, 1);
  const monthEnd = new Date(currentYear, selectedMonth, 0, 23, 59, 59);

  for (const bed of beds) {
    for (const plant of bed.plants ?? []) {
      const events = plant.timelineEvents ?? [];
      for (const event of events) {
        const start = new Date(event.scheduledDate);
        const end = event.dateTo ? new Date(event.dateTo) : start;
        if (end < monthStart || start > monthEnd) continue;

        items.push({
          id: event.id,
          scheduledDate: event.scheduledDate,
          dateTo: event.dateTo,
          bedName: bed.name,
          plantName: plant.name,
          title: event.title,
          description: event.description,
          isAction: event.isAction,
        });
      }
    }
  }

  items.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  return items;
}

function formatEventDate(scheduledDate: string, dateTo: string | null): string {
  const d = new Date(scheduledDate);
  const day = d.getDate();
  const month = monthNames[d.getMonth()].slice(0, 3); // кратко: Март, Апр
  if (!dateTo) return `${day} ${month}`;
  const d2 = new Date(dateTo);
  const day2 = d2.getDate();
  const month2 = monthNames[d2.getMonth()].slice(0, 3);
  if (month === month2) return `${day}–${day2} ${month}`;
  return `${day} ${month} – ${day2} ${month2}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const { data: location } = useUserLocation();
  const { data: beds } = useBeds();
  const [mode, setMode] = useState<CalendarMode>("tasks");
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((data) => setIsPremium(!!data.isPremium))
      .catch(() => setIsPremium(false));
  }, []);

  const tasks = calendarTasks.filter((t) => t.month === selectedMonth);
  const plannedItems = useMemo(() => getPlannedEventsForMonth(beds, selectedMonth), [beds, selectedMonth]);

  const prevMonth = () =>
    setSelectedMonth((m) => (m === 1 ? 12 : m - 1));
  const nextMonth = () =>
    setSelectedMonth((m) => (m === 12 ? 1 : m + 1));

  const isCurrentMonth = selectedMonth === now.getMonth() + 1;

  const cropSlugs = new Map(crops.map((c) => [c.name, c.slug]));

  const handleLunarClick = () => {
    if (isPremium) {
      setMode("lunar");
    } else {
      setShowPaywall(true);
    }
  };

  if (isPremium === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <MotionDiv variant="fadeUp">
        <h1 className="text-2xl font-semibold mb-4">Календарь дачника</h1>
      </MotionDiv>

      {/* Mode toggle */}
      <MotionDiv variant="fadeUp" delay={0.05}>
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "tasks" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("tasks")}
            className={mode === "tasks" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <CalendarDays className="w-4 h-4 mr-1.5" />
            Задачи
          </Button>
          <Button
            variant={mode === "lunar" ? "default" : "outline"}
            size="sm"
            onClick={handleLunarClick}
            className={
              mode === "lunar"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : isPremium
                  ? ""
                  : "border-amber-300 text-amber-700 dark:text-amber-400"
            }
          >
            <Moon className="w-4 h-4 mr-1.5" />
            Лунный календарь
            {!isPremium && <Crown className="w-3.5 h-3.5 ml-1 text-amber-500" />}
          </Button>
        </div>
      </MotionDiv>

      {mode === "lunar" && isPremium ? (
        <MotionDiv variant="fadeUp" delay={0.1}>
          <LunarCalendar />
        </MotionDiv>
      ) : (
        <>
          {isCurrentMonth && (
            <div className="mb-6">
              <WeatherWidget
                lat={location?.latitude ?? null}
                lon={location?.longitude ?? null}
                locationName={location?.locationName || ""}
              />
            </div>
          )}

          {/* Month selector */}
          <MotionDiv variant="fadeUp" delay={0.1}>
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold">
                  {monthNames[selectedMonth - 1]}
                </h2>
                {isCurrentMonth && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Сейчас
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </MotionDiv>

          {/* Запланированные работы с грядок */}
          {plannedItems.length > 0 && (
            <MotionDiv variant="fadeUp" delay={0.12}>
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Запланированные работы</h3>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-xs">
                  С грядок
                </Badge>
              </div>
              <div className="space-y-3 mb-6">
                {plannedItems.map((item) => (
                  <Card
                    key={item.id}
                    className="p-5 mb-0 border-l-4 border-emerald-500 dark:border-emerald-600 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">📅</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {formatEventDate(item.scheduledDate, item.dateTo)}
                          </span>
                          <Badge variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200">
                            {item.bedName}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                            {item.plantName}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </MotionDiv>
          )}

          {/* Category legend */}
          <MotionDiv variant="fadeUp" delay={0.15}>
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(categoryConfig).map(([cat, cfg]) => (
                <Badge key={cat} variant="secondary" className={cfg.color}>
                  {cfg.emoji} {cat}
                </Badge>
              ))}
            </div>
          </MotionDiv>

          {/* Tasks */}
          <StaggerContainer key={selectedMonth} staggerDelay={0.05}>
            {tasks.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                Задач на этот месяц пока нет
              </Card>
            ) : (
              tasks.map((task, idx) => {
                const cfg = categoryConfig[task.category] || categoryConfig.уход;
                return (
                  <StaggerItem key={idx}>
                    <Card className="p-5 mb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${cfg.color}`}
                            >
                              {task.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {task.description}
                          </p>
                          {task.crops && task.crops.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {task.crops.map((name) => {
                                const slug = cropSlugs.get(name);
                                return slug ? (
                                  <Link key={name} href={`/guide/${slug}`}>
                                    <Badge
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                    >
                                      {name}
                                    </Badge>
                                  </Link>
                                ) : (
                                  <Badge
                                    key={name}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {name}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })
            )}
          </StaggerContainer>
        </>
      )}

      <SubscribeModal open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
