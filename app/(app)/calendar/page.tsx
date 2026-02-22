"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { SubscribeModal } from "@/components/subscribe-modal";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { ChevronLeft, ChevronRight, Moon, CalendarDays, Crown, Loader2 } from "lucide-react";
import {
  calendarTasks,
  monthNames,
  categoryConfig,
} from "@/lib/data/calendar-tasks";
import { crops } from "@/lib/data/crops";
import { LunarCalendar } from "./lunar-calendar";

type CalendarMode = "tasks" | "lunar";

export default function CalendarPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const { data: location } = useUserLocation();
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
