"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { SubscribeModal } from "@/components/subscribe-modal";
import { PlannedWorkModal, type PlannedWorkEvent } from "@/components/planned-work-modal";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { useQueryClient } from "@tanstack/react-query";
import { useBeds } from "@/lib/hooks/use-beds";
import { getPlannedEventsForMonth, type PlannedWorkItem } from "@/lib/planned-events";
import { ChevronLeft, ChevronRight, ChevronDown, Moon, CalendarDays, Crown, Loader2, Sprout } from "lucide-react";
import {
  calendarTasks,
  monthNames,
  categoryConfig,
} from "@/lib/data/calendar-tasks";
import { crops } from "@/lib/data/crops";
import { LunarCalendar } from "./lunar-calendar";

type CalendarMode = "tasks" | "lunar";

export type { PlannedWorkItem } from "@/lib/planned-events";

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
  const qc = useQueryClient();
  const [mode, setMode] = useState<CalendarMode>("tasks");
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [plannedWorkExpanded, setPlannedWorkExpanded] = useState(false);
  const [plannedWorkModal, setPlannedWorkModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    event: PlannedWorkEvent | null;
    plantId: string;
    bedId: string;
    bedName: string;
    plantName: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((data) => setIsPremium(!!data.isPremium))
      .catch(() => setIsPremium(false));
  }, []);

  const tasks = calendarTasks.filter((t) => t.month === selectedMonth);
  const currentYear = new Date().getFullYear();
  const plannedItems = useMemo(
    () => getPlannedEventsForMonth(beds, selectedMonth, currentYear),
    [beds, selectedMonth]
  );

  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const { userCreatedItems, autoCreatedItems } = useMemo(() => {
    const user: PlannedWorkItem[] = [];
    const auto: PlannedWorkItem[] = [];
    for (const item of plannedItems) {
      const end = item.dateTo ? new Date(item.dateTo) : new Date(item.scheduledDate);
      end.setHours(23, 59, 59, 999);
      if (item.isUserCreated) {
        if (end.getTime() >= todayStart) user.push(item);
      } else {
        auto.push(item);
      }
    }
    user.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return { userCreatedItems: user, autoCreatedItems: auto };
  }, [plannedItems, todayStart]);
  const bedsForPick = useMemo(() => {
    if (!beds?.length) return [];
    return beds.flatMap((b) =>
      (b.plants ?? []).map((p) => ({
        bedId: b.id,
        bedName: b.name,
        plantId: p.id,
        plantName: p.name,
      }))
    );
  }, [beds]);

  const FREE_PLANNED_WORKS_LIMIT = 5;
  const userCreatedPlannedCount = useMemo(() => {
    let n = 0;
    (beds ?? []).forEach((bed) => {
      (bed.plants ?? []).forEach((p) => {
        (p.timelineEvents ?? []).forEach((e: { isUserCreated?: boolean }) => {
          if (e.isUserCreated) n++;
        });
      });
    });
    return n;
  }, [beds]);

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
          <LunarCalendar
            beds={beds}
            onEditPlannedWork={(item) =>
              setPlannedWorkModal({
                open: true,
                mode: "edit",
                event: {
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  scheduledDate: item.scheduledDate,
                  dateTo: item.dateTo,
                  isAction: item.isAction,
                  type: item.type ?? "other",
                },
                plantId: item.plantId,
                bedId: item.bedId,
                bedName: item.bedName,
                plantName: item.plantName,
              })
            }
          />
        </MotionDiv>
      ) : (
        <>
          {isCurrentMonth && (
            <div className="mb-6">
              <WeatherWidget
                lat={location?.latitude ?? null}
                lon={location?.longitude ?? null}
                locationName={location?.locationName || ""}
                bedTypes={(beds ?? []).map((bed) => bed.type)}
                plants={(beds ?? []).flatMap((bed) =>
                  (bed.plants ?? []).map((plant) => ({
                    name: plant.name,
                    cropSlug: plant.cropSlug,
                    bedType: bed.type,
                  }))
                )}
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

          {/* 1) Добавленные вами — всегда видны, только с неистёкшим сроком, по возрастанию даты */}
          {(userCreatedItems.length > 0 || bedsForPick.length > 0) && (
            <MotionDiv variant="fadeUp" delay={0.12}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Добавленные вами</h3>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-xs">
                  С грядок
                </Badge>
                {isPremium === false && (
                  <span className="text-xs text-slate-500 ml-auto mr-2">
                    Добавлено работ: {userCreatedPlannedCount}/{FREE_PLANNED_WORKS_LIMIT} бесплатно
                  </span>
                )}
                {bedsForPick.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-300"
                    onClick={() => {
                      if (
                        isPremium === false &&
                        userCreatedPlannedCount >= FREE_PLANNED_WORKS_LIMIT
                      ) {
                        setShowPaywall(true);
                        return;
                      }
                      setPlannedWorkModal({
                        open: true,
                        mode: "add",
                        event: null,
                        plantId: "",
                        bedId: "",
                        bedName: "",
                        plantName: "",
                      });
                    }}
                  >
                    + Добавить работу
                  </Button>
                )}
              </div>
              {userCreatedItems.length > 0 && (
                <div className="space-y-3 mb-6">
                  {userCreatedItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-5 mb-0 border-l-4 border-emerald-500 dark:border-emerald-600 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                      onClick={() =>
                        setPlannedWorkModal({
                          open: true,
                          mode: "edit",
                          event: {
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            scheduledDate: item.scheduledDate,
                            dateTo: item.dateTo,
                            isAction: item.isAction,
                            type: item.type ?? "other",
                          },
                          plantId: item.plantId,
                          bedId: item.bedId,
                          bedName: item.bedName,
                          plantName: item.plantName,
                        })
                      }
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
                          <p className="text-xs text-slate-400 mt-1.5">Нажмите, чтобы изменить</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </MotionDiv>
          )}

          {/* 2) Созданные автоматически — сворачиваемый блок */}
          {autoCreatedItems.length > 0 && (
            <MotionDiv variant="fadeUp" delay={0.12}>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setPlannedWorkExpanded((v) => !v)}
                  className="w-full flex items-center gap-2 flex-wrap rounded-xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {plannedWorkExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                  <Sprout className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Рекомендованные по растениям</h3>
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Автоматически
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {autoCreatedItems.length} {autoCreatedItems.length === 1 ? "работа" : autoCreatedItems.length >= 2 && autoCreatedItems.length <= 4 ? "работы" : "работ"}
                  </span>
                </button>
              </div>
              {plannedWorkExpanded && (
                <div className="space-y-3 mb-6">
                  {autoCreatedItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-5 mb-0 border-l-4 border-slate-400 dark:border-slate-500 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
                      onClick={() =>
                        setPlannedWorkModal({
                          open: true,
                          mode: "edit",
                          event: {
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            scheduledDate: item.scheduledDate,
                            dateTo: item.dateTo,
                            isAction: item.isAction,
                            type: item.type ?? "other",
                          },
                          plantId: item.plantId,
                          bedId: item.bedId,
                          bedName: item.bedName,
                          plantName: item.plantName,
                        })
                      }
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">📅</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {formatEventDate(item.scheduledDate, item.dateTo)}
                            </span>
                            <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                              {item.bedName}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                              {item.plantName}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1.5">Нажмите, чтобы изменить</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
      {plannedWorkModal && (
        <PlannedWorkModal
          open={plannedWorkModal.open}
          onOpenChange={(open) => setPlannedWorkModal((prev) => (prev ? { ...prev, open } : null))}
          mode={plannedWorkModal.mode}
          plantId={plannedWorkModal.plantId}
          bedId={plannedWorkModal.bedId}
          bedName={plannedWorkModal.bedName}
          plantName={plannedWorkModal.plantName}
          event={plannedWorkModal.event}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["beds"] });
            setPlannedWorkModal(null);
          }}
          bedsForPick={plannedWorkModal.mode === "add" && !plannedWorkModal.plantId ? bedsForPick : undefined}
          onShowPaywall={() => setShowPaywall(true)}
        />
      )}
    </>
  );
}
