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

  if (current.temp_c <= -15) {
    tips.push({
      emoji: "🥶",
      text: "Сильные морозы! Проверьте укрытие многолетников и деревьев.",
      severity: "danger",
    });
  } else if (current.temp_c <= 0) {
    tips.push({
      emoji: "❄️",
      text: "Заморозки. Укройте рассаду и нежные растения, если они на улице.",
      severity: "warning",
    });
  }

  if (tomorrow && tomorrow.mintemp_c <= -10 && current.temp_c > -10) {
    tips.push({
      emoji: "📉",
      text: `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — резкое похолодание.`,
      severity: "warning",
    });
  } else if (tomorrow && tomorrow.mintemp_c <= 2 && current.temp_c > 2) {
    tips.push({
      emoji: "⚠️",
      text: `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — возможны заморозки, подготовьте укрытие.`,
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

  if (tomorrow && tomorrow.daily_chance_of_snow > 30) {
    tips.push({
      emoji: "🌨️",
      text: `Завтра возможен снег — укройте посадки если есть незащищённые.`,
      severity: "warning",
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

  const totalPrecip3d = forecast.slice(0, 3).reduce(
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

  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) {
    if (current.temp_c > 5) {
      tips.push({
        emoji: "🌡️",
        text: "Оттепель зимой — проверьте состояние укрытий от влаги.",
        severity: "info",
      });
    }
    if (tips.length === 0) {
      tips.push({
        emoji: "🏠",
        text: "Зимний период — время планировать посадки, проверять семена и инвентарь.",
        severity: "info",
      });
    }
  } else if (month >= 3 && month <= 4) {
    if (current.temp_c > 5 && current.temp_c < 15) {
      tips.push({
        emoji: "🌱",
        text: "Весеннее потепление — самое время для рассады на подоконнике.",
        severity: "info",
      });
    }
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
