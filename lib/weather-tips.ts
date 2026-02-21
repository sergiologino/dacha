import type { CurrentWeather, ForecastDay } from "@/lib/hooks/use-weather";

export interface WeatherTip {
  emoji: string;
  text: string;
  severity: "info" | "warning" | "danger";
}

export function generateWeatherTips(
  current: CurrentWeather,
  forecast: ForecastDay[]
): WeatherTip[] {
  const tips: WeatherTip[] = [];
  const tomorrow = forecast[1];

  if (current.temp_c <= 0) {
    tips.push({
      emoji: "🥶",
      text: "Сейчас заморозки! Укройте рассаду и нежные растения.",
      severity: "danger",
    });
  } else if (tomorrow && tomorrow.mintemp_c <= 2) {
    tips.push({
      emoji: "❄️",
      text: `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — подготовьте укрытие для растений.`,
      severity: "warning",
    });
  }

  if (current.temp_c >= 30) {
    tips.push({
      emoji: "🔥",
      text: "Жара! Поливайте утром или вечером, притените рассаду.",
      severity: "warning",
    });
  }

  if (tomorrow && tomorrow.daily_chance_of_rain > 60) {
    tips.push({
      emoji: "🌧️",
      text: `Завтра вероятность дождя ${tomorrow.daily_chance_of_rain}% — можно отложить полив.`,
      severity: "info",
    });
  } else if (
    current.precip_mm === 0 &&
    current.temp_c > 20 &&
    current.humidity < 50
  ) {
    tips.push({
      emoji: "💧",
      text: "Сухо и тепло — хороший день для полива.",
      severity: "info",
    });
  }

  if (current.wind_kph > 40) {
    tips.push({
      emoji: "💨",
      text: "Сильный ветер! Проверьте подвязки и укрепите теплицу.",
      severity: "warning",
    });
  }

  if (current.uv >= 8) {
    tips.push({
      emoji: "☀️",
      text: "Очень высокий UV-индекс. Работайте в тени, наденьте шляпу.",
      severity: "warning",
    });
  }

  if (tomorrow && tomorrow.daily_chance_of_snow > 30) {
    tips.push({
      emoji: "🌨️",
      text: `Завтра возможен снег (${tomorrow.daily_chance_of_snow}%) — укройте посадки.`,
      severity: "danger",
    });
  }

  const totalPrecip3d = forecast.reduce(
    (sum, d) => sum + d.totalprecip_mm,
    0
  );
  if (totalPrecip3d < 1 && current.temp_c > 15) {
    tips.push({
      emoji: "🏜️",
      text: "3 дня без дождя ожидается — запланируйте регулярный полив.",
      severity: "info",
    });
  }

  if (tips.length === 0) {
    tips.push({
      emoji: "🌿",
      text: "Погода благоприятная для работ на участке. Хорошего дня!",
      severity: "info",
    });
  }

  return tips;
}
