"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface CurrentWeather {
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  precip_mm: number;
  pressure_mb: number;
  cloud: number;
  uv: number;
  condition: WeatherCondition;
}

export interface ForecastDay {
  date: string;
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  maxwind_kph: number;
  totalprecip_mm: number;
  avghumidity: number;
  daily_chance_of_rain: number;
  daily_chance_of_snow: number;
  uv: number;
  condition: WeatherCondition;
  astro: {
    sunrise: string;
    sunset: string;
  };
}

export interface WeatherAlert {
  headline: string;
  severity: string;
  event: string;
  desc: string;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: CurrentWeather;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

export function useWeather(lat: number | null, lon: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchWeather(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const refresh = () => {
    if (lat !== null && lon !== null) {
      queryClient.invalidateQueries({ queryKey: ["weather", lat, lon] });
    }
  };

  return { ...query, refresh };
}
