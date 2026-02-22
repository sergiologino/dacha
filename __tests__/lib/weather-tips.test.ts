import { describe, it, expect } from "vitest";
import { generateWeatherTips } from "@/lib/weather-tips";
import type { CurrentWeather, ForecastDay } from "@/lib/hooks/use-weather";

function makeCondition() {
  return { text: "Ясно", icon: "☀️", code: 0 };
}

function makeCurrent(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temp_c: 22,
    feelslike_c: 21,
    humidity: 55,
    wind_kph: 10,
    wind_dir: "N",
    precip_mm: 0,
    pressure_mb: 1013,
    cloud: 20,
    uv: 5,
    condition: makeCondition(),
    ...overrides,
  };
}

function makeForecast(overrides: Partial<ForecastDay>[] = []): ForecastDay[] {
  const base: ForecastDay = {
    date: "2026-06-15",
    maxtemp_c: 25,
    mintemp_c: 14,
    avgtemp_c: 20,
    maxwind_kph: 15,
    totalprecip_mm: 0,
    avghumidity: 50,
    daily_chance_of_rain: 10,
    daily_chance_of_snow: 0,
    uv: 5,
    condition: makeCondition(),
    astro: { sunrise: "05:30 AM", sunset: "09:15 PM" },
  };

  return [
    { ...base, date: "2026-06-15", ...overrides[0] },
    { ...base, date: "2026-06-16", ...overrides[1] },
    { ...base, date: "2026-06-17", ...overrides[2] },
  ];
}

describe("generateWeatherTips", () => {
  it("returns 'good weather' tip when conditions are normal", () => {
    const tips = generateWeatherTips(makeCurrent(), makeForecast());
    expect(tips.length).toBeGreaterThanOrEqual(1);
    const hasGood = tips.some((t) => t.severity === "info");
    expect(hasGood).toBe(true);
  });

  it("warns about current frost", () => {
    const tips = generateWeatherTips(makeCurrent({ temp_c: -2 }), makeForecast());
    const frost = tips.find((t) => t.emoji === "❄️");
    expect(frost).toBeDefined();
    expect(frost!.text).toContain("Заморозки");
  });

  it("warns about tomorrow night frost", () => {
    const forecast = makeForecast([{}, { mintemp_c: 1 }]);
    const tips = generateWeatherTips(makeCurrent({ temp_c: 8 }), forecast);
    const frost = tips.find((t) => t.emoji === "⚠️");
    expect(frost).toBeDefined();
    expect(frost!.text).toContain("1°C");
  });

  it("advises about heat", () => {
    const tips = generateWeatherTips(makeCurrent({ temp_c: 33 }), makeForecast());
    const heat = tips.find((t) => t.emoji === "🔥");
    expect(heat).toBeDefined();
    expect(heat!.text).toContain("Жара");
  });

  it("suggests skipping watering before rain", () => {
    const forecast = makeForecast([{}, { daily_chance_of_rain: 80 }]);
    const tips = generateWeatherTips(makeCurrent(), forecast);
    const rain = tips.find((t) => t.emoji === "🌧️");
    expect(rain).toBeDefined();
    expect(rain!.text).toContain("80%");
  });

  it("suggests watering in dry hot weather", () => {
    const tips = generateWeatherTips(
      makeCurrent({ temp_c: 25, precip_mm: 0, humidity: 35 }),
      makeForecast()
    );
    const water = tips.find((t) => t.emoji === "💧");
    expect(water).toBeDefined();
  });

  it("warns about strong wind", () => {
    const tips = generateWeatherTips(makeCurrent({ wind_kph: 50 }), makeForecast());
    const wind = tips.find((t) => t.emoji === "💨");
    expect(wind).toBeDefined();
    expect(wind!.text).toContain("ветер");
  });

  it("warns about high UV", () => {
    const tips = generateWeatherTips(makeCurrent({ uv: 9 }), makeForecast());
    const uv = tips.find((t) => t.emoji === "☀️");
    expect(uv).toBeDefined();
    expect(uv!.text).toContain("UV");
  });

  it("warns about upcoming snow", () => {
    const forecast = makeForecast([{}, { daily_chance_of_snow: 50 }]);
    const tips = generateWeatherTips(makeCurrent({ temp_c: 5 }), forecast);
    const snow = tips.find((t) => t.emoji === "🌨️");
    expect(snow).toBeDefined();
  });

  it("warns about 3 dry days", () => {
    const forecast = makeForecast([
      { totalprecip_mm: 0 },
      { totalprecip_mm: 0 },
      { totalprecip_mm: 0 },
    ]);
    const tips = generateWeatherTips(makeCurrent({ temp_c: 20 }), forecast);
    const dry = tips.find((t) => t.emoji === "🏜️");
    expect(dry).toBeDefined();
    expect(dry!.text).toContain("3 дня");
  });
});
