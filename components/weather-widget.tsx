"use client";

import { Cloud, Droplets, Wind, Thermometer, AlertTriangle, Sun, RefreshCw, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion";
import { useWeather, type ForecastDay } from "@/lib/hooks/use-weather";
import { generateWeatherTips, type WeatherTip } from "@/lib/weather-tips";
import type { PlantWeatherInfo } from "@/lib/crop-weather-context";

interface WeatherWidgetProps {
  lat: number | null;
  lon: number | null;
  locationName?: string;
  compact?: boolean;
  bedTypes?: string[];
  plants?: PlantWeatherInfo[];
}

const severityColors: Record<string, string> = {
  info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
};

function TipBadge({ tip }: { tip: WeatherTip }) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border ${severityColors[tip.severity]}`}>
      <span className="text-lg flex-shrink-0">{tip.emoji}</span>
      <p className="text-sm">{tip.text}</p>
    </div>
  );
}

function ForecastCard({ day }: { day: ForecastDay }) {
  const date = new Date(day.date + "T12:00:00");
  const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
  const dayMonth = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 min-w-[80px]">
      <span className="text-xs font-medium text-slate-500 capitalize">{weekday}</span>
      <span className="text-xs text-slate-400">{dayMonth}</span>
      <span className="text-2xl">{day.condition.icon}</span>
      <div className="text-sm font-semibold">
        {Math.round(day.maxtemp_c)}°
        <span className="text-slate-400 font-normal"> / {Math.round(day.mintemp_c)}°</span>
      </div>
      {day.daily_chance_of_rain > 0 && (
        <div className="flex items-center gap-0.5 text-xs text-blue-500">
          <Droplets className="w-3 h-3" />
          {day.daily_chance_of_rain}%
        </div>
      )}
      {day.daily_chance_of_snow > 0 && day.daily_chance_of_rain === 0 && (
        <div className="flex items-center gap-0.5 text-xs text-sky-400">
          <span className="text-xs">❄️</span>
          {day.daily_chance_of_snow}%
        </div>
      )}
      {day.astro.sunrise && (
        <div className="text-[10px] text-slate-400 mt-0.5">
          🌅 {day.astro.sunrise} &nbsp; 🌇 {day.astro.sunset}
        </div>
      )}
    </div>
  );
}

export function WeatherWidget({
  lat,
  lon,
  locationName,
  compact = false,
  bedTypes,
  plants,
}: WeatherWidgetProps) {
  const { data, isLoading, isFetching, isError, refresh } = useWeather(lat, lon);

  if (!lat || !lon) return null;

  const staleForecast = Boolean(isError && data);

  if (isLoading && !data) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </Card>
    );
  }

  if (!data) return null;

  const tips = generateWeatherTips(data.current, data.forecast, {
    bedTypes,
    plants,
  });
  const displayName = locationName || data.location.name || "";
  const updatedAt = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (compact) {
    return (
      <MotionDiv variant="fadeUp">
        <Card className="p-4 min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-3xl flex-shrink-0">{data.current.condition.icon}</span>
              <div className="min-w-0">
                <span className="text-2xl font-bold">{Math.round(data.current.temp_c)}°C</span>
                <p className="text-xs text-slate-500 truncate">{data.current.condition.text}</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 flex-shrink-0 max-w-[45%] sm:max-w-none">
              {displayName && (
                <p className="flex items-center gap-1 justify-end min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{displayName}</span>
                </p>
              )}
              <p className="flex items-center gap-1 justify-end mt-0.5">
                <Droplets className="w-3 h-3" /> {data.current.humidity}%
                <Wind className="w-3 h-3 ml-1" /> {Math.round(data.current.wind_kph)} км/ч
              </p>
              <button
                onClick={refresh}
                className="mt-1 text-emerald-600 hover:text-emerald-700 flex items-center gap-1 ml-auto"
                title="Обновить погоду"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          {tips.length > 0 && tips[0].severity !== "info" && (
            <div className="mt-3">
              <TipBadge tip={tips[0]} />
            </div>
          )}
          {staleForecast && (
            <p className="mt-3 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-tight">
              Актуальный прогноз сейчас недоступен — нет интернета. Показаны последние сохранённые
              данные.
            </p>
          )}
        </Card>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="fadeUp">
      <Card className="p-6">
        {/* Header with location and refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {displayName && (
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {displayName}
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{data.current.condition.icon}</span>
              <div>
                <span className="text-4xl font-bold">{Math.round(data.current.temp_c)}°C</span>
                <p className="text-sm text-slate-500">
                  Ощущается как {Math.round(data.current.feelslike_c)}°
                </p>
              </div>
            </div>
            <p className="text-sm mt-1">{data.current.condition.text}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isFetching}
              title="Обновить погоду"
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <span className="text-[10px] text-slate-400">
              {updatedAt}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-slate-500">Влажность</p>
            <p className="font-semibold text-sm">{data.current.humidity}%</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Wind className="w-4 h-4 mx-auto text-slate-500 mb-1" />
            <p className="text-xs text-slate-500">Ветер</p>
            <p className="font-semibold text-sm">{Math.round(data.current.wind_kph)} <span className="text-xs font-normal">{data.current.wind_dir}</span></p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Cloud className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-xs text-slate-500">Облачность</p>
            <p className="font-semibold text-sm">{data.current.cloud}%</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Sun className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <p className="text-xs text-slate-500">UV</p>
            <p className="font-semibold text-sm">{data.current.uv}</p>
          </div>
        </div>

        {/* Pressure row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            Давление: {data.current.pressure_mb} гПа ({Math.round(data.current.pressure_mb * 0.750062)} мм рт.ст.)
          </span>
        </div>

        {/* 5-day forecast */}
        <h3 className="font-semibold text-sm mb-2">Прогноз на {data.forecast.length} дней</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {data.forecast.map((day) => (
            <ForecastCard key={day.date} day={day} />
          ))}
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {data.alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{alert.headline}</p>
                  {alert.desc && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">{alert.desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Garden tips */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
            🌿 Рекомендации для дачи
          </h3>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <TipBadge key={i} tip={tip} />
            ))}
          </div>
        </div>
        {staleForecast && (
          <p className="mt-4 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-tight">
            Актуальный прогноз сейчас недоступен — нет интернета. Показаны последние сохранённые
            данные.
          </p>
        )}
      </Card>
    </MotionDiv>
  );
}
