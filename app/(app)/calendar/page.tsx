"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { WeatherWidget } from "@/components/weather-widget";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { crops, regions } from "@/lib/data/crops";

export default function CalendarPage() {
  const [selectedRegion, setSelectedRegion] = useState("Москва");
  const { data: location } = useUserLocation();

  const filteredCrops = crops.filter(
    (c) => c.region.includes(selectedRegion) || c.region.includes("Все регионы")
  );

  return (
    <>
      <MotionDiv variant="fadeUp">
        <h1 className="text-2xl font-semibold mb-4">
          Календарь — {format(new Date(), "LLLL yyyy", { locale: ru })}
        </h1>
      </MotionDiv>

      {/* Weather widget */}
      <div className="mb-6">
        <WeatherWidget
          lat={location?.latitude ?? null}
          lon={location?.longitude ?? null}
        />
      </div>

      <MotionDiv variant="fadeUp" delay={0.1}>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full p-4 rounded-3xl border mb-6 bg-white dark:bg-slate-900"
        >
          {regions
            .filter((r) => r.value !== "Все регионы")
            .map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
        </select>
      </MotionDiv>

      <MotionDiv variant="fadeUp" delay={0.15}>
        <Card className="p-6">
          <p className="font-medium text-emerald-600 mb-4">
            Сейчас можно сажать в твоём регионе:
          </p>
          <StaggerContainer staggerDelay={0.03}>
            {filteredCrops.map((c) => (
              <StaggerItem key={c.id}>
                <div className="border-t py-4 first:border-t-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-slate-500">
                    Посадка: {c.plantMonth} · Урожай: {c.harvestMonth}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{c.note}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Card>
      </MotionDiv>
    </>
  );
}
