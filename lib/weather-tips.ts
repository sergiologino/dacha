import type { CurrentWeather, ForecastDay } from "@/lib/hooks/use-weather";
import {
  buildGardenWeatherContext,
  hasOutdoorCultivation,
  isSeedlingHomeOnly,
} from "@/lib/garden-weather-context";
import {
  buildCropRiskSentence,
  buildCropWeatherProfile,
  type PlantWeatherInfo,
} from "@/lib/crop-weather-context";

export interface WeatherTip {
  emoji: string;
  text: string;
  severity: "info" | "warning" | "danger";
}

type GenerateWeatherTipsOptions = {
  bedTypes?: string[];
  plants?: PlantWeatherInfo[];
};

function getCurrentSeason(): "winter" | "spring" | "summer" | "autumn" {
  const month = new Date().getMonth() + 1;
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

export function generateWeatherTips(
  current: CurrentWeather,
  forecast: ForecastDay[],
  options?: GenerateWeatherTipsOptions
): WeatherTip[] {
  const tips: WeatherTip[] = [];
  const tomorrow = forecast[1];
  const season = getCurrentSeason();
  const hasExplicitBedContext = (options?.bedTypes?.length ?? 0) > 0;
  const context = buildGardenWeatherContext(options?.bedTypes);
  const cropProfile = buildCropWeatherProfile(options?.plants);
  const seedlingOnly = hasExplicitBedContext && isSeedlingHomeOnly(context);
  const outdoorRelevant = hasExplicitBedContext
    ? hasOutdoorCultivation(context)
    : true;

  if (seedlingOnly) {
    if (current.wind_kph >= 30) {
      tips.push({
        emoji: "🪟",
        text: [
          "Для рассады дома сейчас важнее всего безсквознячный режим: не держите её у открытого окна и не переохлаждайте подоконник.",
          buildCropRiskSentence(cropProfile, "home_seedling"),
        ].filter(Boolean).join(" "),
        severity: "warning",
      });
    }

    if (current.pressure_mb <= 1000 || current.pressure_mb >= 1025) {
      tips.push({
        emoji: "🌡️",
        text: [
          "Для рассады дома держите сегодня стабильный режим: без перелива, холодного стекла и резких проветриваний при скачках давления.",
          buildCropRiskSentence(cropProfile, "home_seedling"),
        ].filter(Boolean).join(" "),
        severity: "info",
      });
    }

    if (tips.length === 0) {
      tips.push({
        emoji: "🪴",
        text: "Для домашней рассады сегодня главное - ровная температура, аккуратное проветривание и без резких перепадов влажности.",
        severity: "info",
      });
    }

    return tips;
  }

  if (outdoorRelevant && current.temp_c <= -15) {
    tips.push({
      emoji: "🥶",
      text: "Сильные морозы! Проверьте укрытие многолетников, деревьев и всё, что зимует в открытом грунте.",
      severity: "danger",
    });
  } else if (outdoorRelevant && current.temp_c <= 0) {
    tips.push({
      emoji: "❄️",
      text: [
        context.greenhouseBeds > 0
          ? "Заморозки. Закройте парник или теплицу на ночь и проверьте укрытие растений снаружи."
          : "Заморозки. Укройте рассаду и нежные растения, если они на улице.",
        buildCropRiskSentence(cropProfile, "cold"),
      ].filter(Boolean).join(" "),
      severity: "warning",
    });
  }

  if (outdoorRelevant && tomorrow && tomorrow.mintemp_c <= -10 && current.temp_c > -10) {
    tips.push({
      emoji: "📉",
      text: [
        `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — резкое похолодание. Подготовьте укрытия заранее.`,
        buildCropRiskSentence(cropProfile, "cold"),
      ].filter(Boolean).join(" "),
      severity: "warning",
    });
  } else if (outdoorRelevant && tomorrow && tomorrow.mintemp_c <= 2 && current.temp_c > 2) {
    tips.push({
      emoji: "⚠️",
      text: [
        context.greenhouseBeds > 0
          ? `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — вечером закройте парник или теплицу и приготовьте укрытие снаружи.`
          : `Завтра ночью до ${Math.round(tomorrow.mintemp_c)}°C — возможны заморозки, подготовьте укрытие.`,
        buildCropRiskSentence(cropProfile, "cold"),
      ].filter(Boolean).join(" "),
      severity: "warning",
    });
  }

  if (outdoorRelevant && current.temp_c >= 30) {
    tips.push({
      emoji: "🔥",
      text: [
        context.greenhouseBeds > 0
          ? "Жара! Днём проветрите теплицу или парник, а полив лучше перенести на утро или вечер."
          : "Жара! Поливайте утром или вечером, притените чувствительные культуры.",
        buildCropRiskSentence(cropProfile, "heat"),
      ].filter(Boolean).join(" "),
      severity: "warning",
    });
  }

  if (outdoorRelevant && tomorrow && tomorrow.daily_chance_of_rain > 60) {
    tips.push({
      emoji: "🌧️",
      text: [
        context.greenhouseBeds > 0
          ? `Завтра вероятность дождя ${tomorrow.daily_chance_of_rain}% — для улицы можно отложить полив, а парник лучше закрыть заранее.`
          : `Завтра вероятность дождя ${tomorrow.daily_chance_of_rain}% — можно отложить полив.`,
        buildCropRiskSentence(cropProfile, "humidity"),
      ].filter(Boolean).join(" "),
      severity: "info",
    });
  } else if (
    outdoorRelevant &&
    current.precip_mm === 0 &&
    current.temp_c > 20 &&
    current.humidity < 50
  ) {
    tips.push({
      emoji: "💧",
      text: [
        context.raisedBeds > 0
          ? "Сухо и тепло — высокий риск пересыхания, особенно на высоких грядках. Проверьте верхний слой почвы."
          : "Сухо и тепло — хороший день для полива.",
        buildCropRiskSentence(cropProfile, "drought"),
      ].filter(Boolean).join(" "),
      severity: "info",
    });
  }

  if (outdoorRelevant && tomorrow && tomorrow.daily_chance_of_snow > 30) {
    tips.push({
      emoji: "🌨️",
      text: [
        context.greenhouseBeds > 0
          ? "Завтра возможен снег — заранее закройте теплицу и проверьте укрытие незащищённых культур."
          : "Завтра возможен снег — укройте посадки, если есть незащищённые.",
        buildCropRiskSentence(cropProfile, "cold"),
      ].filter(Boolean).join(" "),
      severity: "warning",
    });
  }

  if (current.wind_kph > 40) {
    tips.push({
      emoji: "💨",
      text: [
        context.greenhouseBeds > 0
          ? "Сильный ветер! Закройте парник или теплицу, проверьте крепления плёнки, форточек и подвязки."
          : "Сильный ветер! Проверьте подвязки и опоры у высоких культур.",
        buildCropRiskSentence(cropProfile, "wind"),
      ].filter(Boolean).join(" "),
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
  if (outdoorRelevant && totalPrecip3d < 1 && current.temp_c > 15) {
    tips.push({
      emoji: "🏜️",
      text: [
        context.raisedBeds > 0
          ? "3 дня без дождя ожидается — высокие грядки будут сохнуть быстрее, запланируйте регулярный полив."
          : "3 дня без дождя ожидается — запланируйте регулярный полив.",
        buildCropRiskSentence(cropProfile, "drought"),
      ].filter(Boolean).join(" "),
      severity: "info",
    });
  }

  if (season === "winter") {
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
  } else if (season === "spring") {
    if (current.temp_c > 5 && current.temp_c < 15) {
      tips.push({
        emoji: "🌱",
        text:
          context.greenhouseBeds > 0
            ? "Весной погода обманчива: днём можно проветривать теплицу, но к вечеру лучше снова закрывать."
            : "Весеннее потепление — хорошее окно для рассады и аккуратной закалки, но ночи ещё рискованные.",
        severity: "info",
      });
    }
  } else if (season === "summer" && current.temp_c >= 24) {
    tips.push({
      emoji: "🍅",
      text: "Летом следите не только за поливом, но и за вентиляцией посадок: застой влажности повышает риск болезней.",
      severity: "info",
    });
  } else if (season === "autumn" && current.temp_c <= 10) {
    tips.push({
      emoji: "🍂",
      text: "Осенью особенно важно не оставлять теплицу сырой на ночь и вовремя закрывать укрытия.",
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
