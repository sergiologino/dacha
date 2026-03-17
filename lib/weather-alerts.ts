import {
  type GardenWeatherContext,
  hasOutdoorCultivation,
  isSeedlingHomeOnly,
} from "@/lib/garden-weather-context";
import {
  buildCropRiskSentence,
  type CropWeatherProfile,
} from "@/lib/crop-weather-context";

export type WeatherAlertSeverity = "warning" | "danger";

export type WeatherAlert = {
  key: string;
  headline: string;
  severity: WeatherAlertSeverity;
  event: string;
  desc: string;
};

export type WeatherAlertInput = {
  current: {
    temp_c: number;
    wind_kph: number;
    pressure_mb: number;
  };
  forecast: Array<{
    date: string;
    maxtemp_c: number;
    mintemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    daily_chance_of_rain: number;
    daily_chance_of_snow: number;
  }>;
};

const severityWeight: Record<WeatherAlertSeverity, number> = {
  warning: 1,
  danger: 2,
};

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function getSeason(date: string): "winter" | "spring" | "summer" | "autumn" {
  const month = new Date(`${date}T12:00:00`).getMonth() + 1;
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

function joinAdvice(parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

function buildFrostAdvice(
  temp: number,
  date: string,
  context?: GardenWeatherContext
): string {
  const season = getSeason(date);
  const advice: string[] = [
    `Ночью ожидается до ${Math.round(temp)}°C.`,
  ];

  if (!context) {
    advice.push("Укройте рассаду и теплолюбивые культуры.");
    return joinAdvice(advice);
  }

  if (context.greenhouseBeds > 0) {
    advice.push(
      season === "spring"
        ? "К вечеру закройте парник или теплицу и при необходимости добавьте второй слой укрытия."
        : "На ночь держите теплицу закрытой и проверьте, чтобы холод не тянул через щели."
    );
  }
  if (context.openBeds > 0) {
    advice.push("В открытом грунте укройте молодые культуры агроволокном.");
  }
  if (context.raisedBeds > 0) {
    advice.push("Высокие грядки остывают быстрее, особенно по краям.");
  }

  return joinAdvice(advice);
}

function buildHeatAdvice(
  temp: number,
  date: string,
  context?: GardenWeatherContext
): string {
  const season = getSeason(date);
  const advice: string[] = [
    `Днём ожидается до ${Math.round(temp)}°C.`,
  ];

  if (!context) {
    advice.push("Поливайте утром или вечером и не допускайте пересыхания почвы.");
    return joinAdvice(advice);
  }

  if (context.greenhouseBeds > 0) {
    advice.push(
      season === "summer"
        ? "Днём обязательно проветрите теплицу или парник, а на пике солнца притените чувствительные культуры."
        : "При потеплении быстро проветрите теплицу, чтобы не получить перегрев и конденсат."
    );
  }
  if (context.openBeds > 0) {
    advice.push("Для открытого грунта лучше перенести полив на раннее утро или вечер.");
  }
  if (context.raisedBeds > 0) {
    advice.push("Высокие грядки пересыхают быстрее, проверьте мульчу и влажность верхнего слоя.");
  }

  return joinAdvice(advice);
}

function buildWindAdvice(
  windKph: number,
  date: string,
  context?: GardenWeatherContext
): string {
  const season = getSeason(date);
  const advice: string[] = [
    `Порывы могут достигать ${Math.round(windKph)} км/ч.`,
  ];

  if (!context) {
    advice.push("Проверьте подвязки и по возможности отложите работы на участке.");
    return joinAdvice(advice);
  }

  if (isSeedlingHomeOnly(context)) {
    advice.push(
      "Для рассады дома это риск сквозняка: не держите подоконник у открытого окна и не переохлаждайте корни."
    );
    return joinAdvice(advice);
  }

  if (context.greenhouseBeds > 0) {
    advice.push(
      season === "spring" || season === "autumn"
        ? "Закройте парник или теплицу заранее и проверьте крепления дверей, форточек и плёнки."
        : "Перед усилением ветра закройте теплицу и проверьте крепления форточек."
    );
  }
  if (context.openBeds > 0 || context.raisedBeds > 0) {
    advice.push("Подвяжите высокие культуры и проверьте опоры.");
  }

  return joinAdvice(advice);
}

function buildRainAdvice(
  precipMm: number,
  rainChance: number,
  context?: GardenWeatherContext
): string {
  const advice: string[] = [
    `Ожидается дождь с вероятностью ${rainChance}% и осадками до ${Math.round(precipMm)} мм.`,
  ];

  if (!context) {
    advice.push("Проверьте дренаж и скорректируйте полив.");
    return joinAdvice(advice);
  }

  if (context.greenhouseBeds > 0) {
    advice.push("Закройте парник или теплицу и проверьте, не затекает ли вода у входа и стыков.");
  }
  if (context.openBeds > 0) {
    advice.push("Для открытого грунта лучше отложить полив и проверить низины, где может застаиваться вода.");
  }
  if (context.raisedBeds > 0) {
    advice.push("На высоких грядках проверьте края и сток, чтобы не размывало грунт.");
  }

  return joinAdvice(advice);
}

function buildSnowAdvice(context?: GardenWeatherContext): string {
  const advice: string[] = [];

  if (!context) {
    return "Если есть незащищённые посадки, лучше заранее подготовить укрытие.";
  }

  if (context.greenhouseBeds > 0) {
    advice.push("Закройте теплицу и проверьте, чтобы укрытия не продувало.");
  }
  if (context.openBeds > 0 || context.raisedBeds > 0) {
    advice.push("Незащищённые посадки лучше укрыть заранее.");
  }

  return advice.length > 0
    ? joinAdvice(advice)
    : "Если рассада уже вынесена на улицу, лучше защитить её от холода.";
}

function buildPressureAdvice(
  currentPressure: number,
  previousPressure: number
): string {
  const diff = Math.round((currentPressure - previousPressure) * 10) / 10;
  const direction = diff > 0 ? "рост" : "падение";
  return `Резкий ${direction} давления на ${Math.abs(diff)} гПа. Для рассады дома сегодня важен стабильный режим без перелива и переохлаждения на подоконнике.`;
}

function pushAlert(
  alerts: WeatherAlert[],
  alert: WeatherAlert
) {
  alerts.push(alert);
}

export function buildWeatherAlerts(
  input: WeatherAlertInput,
  options?: {
    context?: GardenWeatherContext;
    cropProfile?: CropWeatherProfile;
    previousPressureMb?: number | null;
  }
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const context = options?.context;
  const cropProfile = options?.cropProfile;
  const seedlingOnly = context ? isSeedlingHomeOnly(context) : false;
  const outdoorRelevant = context ? hasOutdoorCultivation(context) : true;
  const relevantDays = input.forecast.slice(0, 2);

  if (seedlingOnly) {
    if (input.current.wind_kph >= 35) {
      pushAlert(alerts, {
        key: "draft:current:warning",
        headline: "Сильный ветер и риск сквозняков",
        severity: "warning",
        event: "draft",
        desc: joinAdvice([
          buildWindAdvice(
            input.current.wind_kph,
            relevantDays[0]?.date ?? new Date().toISOString(),
            context
          ),
          buildCropRiskSentence(cropProfile, "home_seedling"),
        ]),
      });
    }
  } else {
    for (const day of relevantDays) {
      const dateLabel = formatDateLabel(day.date);

      if (outdoorRelevant && day.mintemp_c <= -2) {
        pushAlert(alerts, {
          key: `frost:${day.date}:danger`,
          headline: `Сильные заморозки ${dateLabel}`,
          severity: "danger",
          event: "frost",
          desc: joinAdvice([
            buildFrostAdvice(day.mintemp_c, day.date, context),
            buildCropRiskSentence(cropProfile, "cold"),
          ]),
        });
      } else if (outdoorRelevant && day.mintemp_c <= 2) {
        pushAlert(alerts, {
          key: `frost:${day.date}:warning`,
          headline: `Риск заморозков ${dateLabel}`,
          severity: "warning",
          event: "frost",
          desc: joinAdvice([
            buildFrostAdvice(day.mintemp_c, day.date, context),
            buildCropRiskSentence(cropProfile, "cold"),
          ]),
        });
      }

      if (outdoorRelevant && day.maxtemp_c >= 35) {
        pushAlert(alerts, {
          key: `heat:${day.date}:danger`,
          headline: `Сильная жара ${dateLabel}`,
          severity: "danger",
          event: "heat",
          desc: joinAdvice([
            buildHeatAdvice(day.maxtemp_c, day.date, context),
            buildCropRiskSentence(cropProfile, "heat"),
          ]),
        });
      } else if (outdoorRelevant && day.maxtemp_c >= 30) {
        pushAlert(alerts, {
          key: `heat:${day.date}:warning`,
          headline: `Жара ${dateLabel}`,
          severity: "warning",
          event: "heat",
          desc: joinAdvice([
            buildHeatAdvice(day.maxtemp_c, day.date, context),
            buildCropRiskSentence(cropProfile, "heat"),
          ]),
        });
      }

      if (day.maxwind_kph >= 55) {
        pushAlert(alerts, {
          key: `wind:${day.date}:danger`,
          headline: `Очень сильный ветер ${dateLabel}`,
          severity: "danger",
          event: "wind",
          desc: joinAdvice([
            buildWindAdvice(day.maxwind_kph, day.date, context),
            buildCropRiskSentence(cropProfile, "wind"),
          ]),
        });
      } else if (day.maxwind_kph >= 40) {
        pushAlert(alerts, {
          key: `wind:${day.date}:warning`,
          headline: `Сильный ветер ${dateLabel}`,
          severity: "warning",
          event: "wind",
          desc: joinAdvice([
            buildWindAdvice(day.maxwind_kph, day.date, context),
            buildCropRiskSentence(cropProfile, "wind"),
          ]),
        });
      }

      if (outdoorRelevant && day.totalprecip_mm >= 20 && day.daily_chance_of_rain >= 80) {
        pushAlert(alerts, {
          key: `rain:${day.date}:danger`,
          headline: `Сильный дождь ${dateLabel}`,
          severity: "danger",
          event: "rain",
          desc: joinAdvice([
            buildRainAdvice(day.totalprecip_mm, day.daily_chance_of_rain, context),
            buildCropRiskSentence(cropProfile, "humidity"),
          ]),
        });
      } else if (outdoorRelevant && day.totalprecip_mm >= 8 && day.daily_chance_of_rain >= 60) {
        pushAlert(alerts, {
          key: `rain:${day.date}:warning`,
          headline: `Дождь ${dateLabel}`,
          severity: "warning",
          event: "rain",
          desc: joinAdvice([
            buildRainAdvice(day.totalprecip_mm, day.daily_chance_of_rain, context),
            buildCropRiskSentence(cropProfile, "humidity"),
          ]),
        });
      }

      if (outdoorRelevant && day.daily_chance_of_snow >= 70) {
        pushAlert(alerts, {
          key: `snow:${day.date}:warning`,
          headline: `Вероятен снег ${dateLabel}`,
          severity: "warning",
          event: "snow",
          desc: buildSnowAdvice(context),
        });
      }
    }
  }

  if (!seedlingOnly && input.current.wind_kph >= 55) {
    pushAlert(alerts, {
      key: "wind:current:danger",
      headline: "Сильный ветер уже сейчас",
      severity: "danger",
      event: "wind",
      desc: joinAdvice([
        buildWindAdvice(
          input.current.wind_kph,
          relevantDays[0]?.date ?? new Date().toISOString(),
          context
        ),
        buildCropRiskSentence(cropProfile, "wind"),
      ]),
    });
  } else if (!seedlingOnly && input.current.temp_c <= 0) {
    pushAlert(alerts, {
      key: "frost:current:warning",
      headline: "Похолодание уже сейчас",
      severity: "warning",
      event: "frost",
      desc: joinAdvice([
        buildFrostAdvice(
          input.current.temp_c,
          relevantDays[0]?.date ?? new Date().toISOString(),
          context
        ),
        buildCropRiskSentence(cropProfile, "cold"),
      ]),
    });
  }

  if (
    context?.seedlingHomeBeds &&
    options?.previousPressureMb != null &&
    Math.abs(input.current.pressure_mb - options.previousPressureMb) >= 8
  ) {
    pushAlert(alerts, {
      key: `pressure:current:${input.current.pressure_mb > options.previousPressureMb ? "rise" : "fall"}`,
      headline: "Резкий перепад давления",
      severity: "warning",
      event: "pressure",
      desc: joinAdvice([
        buildPressureAdvice(input.current.pressure_mb, options.previousPressureMb),
        buildCropRiskSentence(cropProfile, "home_seedling"),
      ]),
    });
  }

  return alerts.sort((a, b) => {
    const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.headline.localeCompare(b.headline, "ru");
  });
}

export function summarizeWeatherAlertsForPush(
  alerts: WeatherAlert[]
): { title: string; body: string; url: string } {
  if (alerts.length === 1) {
    const alert = alerts[0]!;
    return {
      title: `Погода: ${alert.headline}`,
      body: alert.desc,
      url: "/garden",
    };
  }

  const first = alerts[0]!;
  const second = alerts[1];
  return {
    title: `Погода меняется: ${alerts.length} предупреждения`,
    body: second
      ? `${first.headline}. ${second.headline}.`
      : first.headline,
    url: "/garden",
  };
}
