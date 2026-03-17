export const WEATHER_CHECK_INTERVAL_MINUTES_MIN = 15;
export const WEATHER_CHECK_INTERVAL_MINUTES_MAX = 6 * 60;
export const WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT = 60;

export const WEATHER_CHECK_INTERVAL_OPTIONS = [
  15,
  30,
  60,
  120,
  180,
  360,
] as const;

export function normalizeWeatherCheckIntervalMinutes(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return WEATHER_CHECK_INTERVAL_MINUTES_DEFAULT;
  }

  const rounded = Math.round(num);
  return Math.min(
    WEATHER_CHECK_INTERVAL_MINUTES_MAX,
    Math.max(WEATHER_CHECK_INTERVAL_MINUTES_MIN, rounded)
  );
}
