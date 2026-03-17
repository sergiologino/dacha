import { describe, expect, it } from "vitest";
import {
  buildWeatherAlerts,
  summarizeWeatherAlertsForPush,
} from "@/lib/weather-alerts";
import { buildCropWeatherProfile } from "@/lib/crop-weather-context";

describe("weather alerts", () => {
  it("builds frost and wind alerts for risky forecast", () => {
    const alerts = buildWeatherAlerts({
      current: {
        temp_c: 4,
        wind_kph: 18,
        pressure_mb: 1012,
      },
      forecast: [
        {
          date: "2026-03-18",
          maxtemp_c: 12,
          mintemp_c: -3,
          maxwind_kph: 58,
          totalprecip_mm: 1,
          daily_chance_of_rain: 10,
          daily_chance_of_snow: 0,
        },
      ],
    });

    expect(alerts.some((alert) => alert.key === "frost:2026-03-18:danger")).toBe(true);
    expect(alerts.some((alert) => alert.key === "wind:2026-03-18:danger")).toBe(true);
  });

  it("builds rain and heat alerts", () => {
    const alerts = buildWeatherAlerts({
      current: {
        temp_c: 22,
        wind_kph: 10,
        pressure_mb: 1010,
      },
      forecast: [
        {
          date: "2026-07-01",
          maxtemp_c: 34,
          mintemp_c: 20,
          maxwind_kph: 25,
          totalprecip_mm: 22,
          daily_chance_of_rain: 90,
          daily_chance_of_snow: 0,
        },
      ],
    });

    expect(alerts.some((alert) => alert.event === "heat")).toBe(true);
    expect(alerts.some((alert) => alert.event === "rain")).toBe(true);
  });

  it("formats single alert push", () => {
    const payload = summarizeWeatherAlertsForPush([
      {
        key: "frost:2026-03-18:warning",
        headline: "Риск заморозков 18 марта",
        severity: "warning",
        event: "frost",
        desc: "Ночью возможно похолодание до 1°C.",
      },
    ]);

    expect(payload.title).toContain("Погода:");
    expect(payload.body).toContain("1°C");
  });

  it("formats multiple alerts push", () => {
    const payload = summarizeWeatherAlertsForPush([
      {
        key: "frost:2026-03-18:warning",
        headline: "Риск заморозков",
        severity: "warning",
        event: "frost",
        desc: "Первое предупреждение",
      },
      {
        key: "wind:2026-03-18:danger",
        headline: "Сильный ветер",
        severity: "danger",
        event: "wind",
        desc: "Второе предупреждение",
      },
    ]);

    expect(payload.title).toContain("2 предупреждения");
    expect(payload.body).toContain("Риск заморозков");
    expect(payload.body).toContain("Сильный ветер");
  });

  it("adds greenhouse-specific frost advice", () => {
    const alerts = buildWeatherAlerts(
      {
        current: {
          temp_c: 3,
          wind_kph: 10,
          pressure_mb: 1014,
        },
        forecast: [
          {
            date: "2026-04-10",
            maxtemp_c: 11,
            mintemp_c: 1,
            maxwind_kph: 20,
            totalprecip_mm: 0,
            daily_chance_of_rain: 10,
            daily_chance_of_snow: 0,
          },
        ],
      },
      {
        context: {
          openBeds: 0,
          greenhouseBeds: 1,
          raisedBeds: 0,
          seedlingHomeBeds: 0,
        },
        cropProfile: buildCropWeatherProfile([
          { name: "Томат", cropSlug: "tomat" },
          { name: "Огурец", cropSlug: "ogurets" },
        ]),
      }
    );

    expect(alerts[0]?.desc).toContain("закройте");
    expect(alerts[0]?.desc).toContain("теплиц");
    expect(alerts[0]?.desc).toContain("томаты");
  });

  it("uses pressure and draft logic for seedling_home only", () => {
    const alerts = buildWeatherAlerts(
      {
        current: {
          temp_c: 18,
          wind_kph: 38,
          pressure_mb: 1000,
        },
        forecast: [
          {
            date: "2026-03-18",
            maxtemp_c: 19,
            mintemp_c: 8,
            maxwind_kph: 42,
            totalprecip_mm: 5,
            daily_chance_of_rain: 40,
            daily_chance_of_snow: 0,
          },
        ],
      },
      {
        context: {
          openBeds: 0,
          greenhouseBeds: 0,
          raisedBeds: 0,
          seedlingHomeBeds: 1,
        },
        previousPressureMb: 1011,
      }
    );

    expect(alerts.some((alert) => alert.event === "draft")).toBe(true);
    expect(alerts.some((alert) => alert.event === "pressure")).toBe(true);
  });
});
