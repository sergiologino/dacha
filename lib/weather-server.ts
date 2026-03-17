import { buildWeatherAlerts, type WeatherAlert } from "@/lib/weather-alerts";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const WMO_CODES: Record<number, { text: string; icon: string }> = {
  0: { text: "Ясно", icon: "☀️" },
  1: { text: "Преимущественно ясно", icon: "🌤️" },
  2: { text: "Переменная облачность", icon: "⛅" },
  3: { text: "Пасмурно", icon: "☁️" },
  45: { text: "Туман", icon: "🌫️" },
  48: { text: "Изморозь", icon: "🌫️" },
  51: { text: "Лёгкая морось", icon: "🌦️" },
  53: { text: "Морось", icon: "🌦️" },
  55: { text: "Сильная морось", icon: "🌧️" },
  56: { text: "Ледяная морось", icon: "🌧️" },
  57: { text: "Сильная ледяная морось", icon: "🌧️" },
  61: { text: "Небольшой дождь", icon: "🌦️" },
  63: { text: "Дождь", icon: "🌧️" },
  65: { text: "Сильный дождь", icon: "🌧️" },
  66: { text: "Ледяной дождь", icon: "🌧️" },
  67: { text: "Сильный ледяной дождь", icon: "🌧️" },
  71: { text: "Небольшой снег", icon: "🌨️" },
  73: { text: "Снег", icon: "🌨️" },
  75: { text: "Сильный снег", icon: "❄️" },
  77: { text: "Снежная крупа", icon: "🌨️" },
  80: { text: "Небольшой ливень", icon: "🌦️" },
  81: { text: "Ливень", icon: "🌧️" },
  82: { text: "Сильный ливень", icon: "⛈️" },
  85: { text: "Небольшой снегопад", icon: "🌨️" },
  86: { text: "Сильный снегопад", icon: "❄️" },
  95: { text: "Гроза", icon: "⛈️" },
  96: { text: "Гроза с градом", icon: "⛈️" },
  99: { text: "Сильная гроза с градом", icon: "⛈️" },
};

export type WeatherData = {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    wind_dir: string;
    precip_mm: number;
    pressure_mb: number;
    cloud: number;
    uv: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
  };
  forecast: Array<{
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
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    astro: {
      sunrise: string;
      sunset: string;
    };
  }>;
  alerts: WeatherAlert[];
};

function getCondition(code: number) {
  return WMO_CODES[code] || { text: "Неизвестно", icon: "🌡️" };
}

function getWindDirection(degrees: number): string {
  const dirs = ["С", "ССВ", "СВ", "ВСВ", "В", "ВЮВ", "ЮВ", "ЮЮВ", "Ю", "ЮЮЗ", "ЮЗ", "ЗЮЗ", "З", "ЗСЗ", "СЗ", "ССЗ"];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export async function fetchWeatherData(lat: string | number, lon: string | number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,uv_index",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset,snowfall_sum",
    timezone: "auto",
    forecast_days: "5",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(`${BASE_URL}?${params}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  const daily = data.daily;
  const currentCondition = getCondition(current.weather_code);

  const result: WeatherData = {
    location: {
      name: "",
      region: "",
      country: "",
      localtime: new Date().toISOString(),
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
    },
    current: {
      temp_c: Math.round(current.temperature_2m * 10) / 10,
      feelslike_c: Math.round(current.apparent_temperature * 10) / 10,
      humidity: current.relative_humidity_2m,
      wind_kph: Math.round(current.wind_speed_10m),
      wind_dir: getWindDirection(current.wind_direction_10m),
      precip_mm: 0,
      pressure_mb: Math.round(current.surface_pressure),
      cloud: current.cloud_cover,
      uv: current.uv_index || 0,
      condition: {
        text: currentCondition.text,
        icon: currentCondition.icon,
        code: current.weather_code,
      },
    },
    forecast: (daily.time as string[]).map((date: string, i: number) => {
      const dayCondition = getCondition(daily.weather_code[i]);
      const precipProb = daily.precipitation_probability_max?.[i] ?? 0;
      const snowfall = daily.snowfall_sum?.[i] ?? 0;

      return {
        date,
        maxtemp_c: Math.round(daily.temperature_2m_max[i] * 10) / 10,
        mintemp_c: Math.round(daily.temperature_2m_min[i] * 10) / 10,
        avgtemp_c:
          Math.round(
            ((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2) * 10
          ) / 10,
        maxwind_kph: Math.round(daily.wind_speed_10m_max[i]),
        totalprecip_mm: Math.round((daily.precipitation_sum[i] || 0) * 10) / 10,
        avghumidity: 0,
        daily_chance_of_rain: precipProb,
        daily_chance_of_snow:
          snowfall > 0 ? Math.min(100, Math.round(snowfall * 10)) : 0,
        uv: daily.uv_index_max[i] || 0,
        condition: {
          text: dayCondition.text,
          icon: dayCondition.icon,
          code: daily.weather_code[i],
        },
        astro: {
          sunrise: daily.sunrise?.[i]?.split("T")[1] || "",
          sunset: daily.sunset?.[i]?.split("T")[1] || "",
        },
      };
    }),
    alerts: [],
  };

  result.alerts = buildWeatherAlerts({
    current: result.current,
    forecast: result.forecast,
  });

  return result;
}
