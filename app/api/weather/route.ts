import { NextRequest, NextResponse } from "next/server";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = "https://api.weatherapi.com/v1";

export async function GET(request: NextRequest) {
  if (!WEATHER_API_KEY) {
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const days = searchParams.get("days") || "3";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon are required" },
      { status: 400 }
    );
  }

  try {
    const q = `${lat},${lon}`;
    const url = `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${q}&days=${days}&lang=ru&aqi=yes&alerts=yes`;

    const response = await fetch(url, { next: { revalidate: 1800 } });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Weather API error", details: err },
        { status: response.status }
      );
    }

    const data = await response.json();

    const result = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        localtime: data.location.localtime,
      },
      current: {
        temp_c: data.current.temp_c,
        feelslike_c: data.current.feelslike_c,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        precip_mm: data.current.precip_mm,
        pressure_mb: data.current.pressure_mb,
        cloud: data.current.cloud,
        uv: data.current.uv,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
          code: data.current.condition.code,
        },
        air_quality: data.current.air_quality
          ? {
              pm2_5: data.current.air_quality.pm2_5,
              pm10: data.current.air_quality.pm10,
              us_epa_index: data.current.air_quality["us-epa-index"],
            }
          : null,
      },
      forecast: data.forecast.forecastday.map(
        (day: Record<string, unknown>) => {
          const d = day.day as Record<string, unknown>;
          const condition = d.condition as Record<string, unknown>;
          const astro = day.astro as Record<string, unknown>;
          return {
            date: day.date,
            maxtemp_c: d.maxtemp_c,
            mintemp_c: d.mintemp_c,
            avgtemp_c: d.avgtemp_c,
            maxwind_kph: d.maxwind_kph,
            totalprecip_mm: d.totalprecip_mm,
            avghumidity: d.avghumidity,
            daily_chance_of_rain: d.daily_chance_of_rain,
            daily_chance_of_snow: d.daily_chance_of_snow,
            uv: d.uv,
            condition: {
              text: condition.text,
              icon: condition.icon,
              code: condition.code,
            },
            astro: {
              sunrise: astro.sunrise,
              sunset: astro.sunset,
            },
          };
        }
      ),
      alerts: (data.alerts?.alert || []).map(
        (a: Record<string, unknown>) => ({
          headline: a.headline,
          severity: a.severity,
          event: a.event,
          desc: a.desc,
        })
      ),
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }
}
