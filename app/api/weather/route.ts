import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const result = await fetchWeatherData(lat, lon);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Weather fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 502 });
  }
}
