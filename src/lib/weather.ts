import "server-only";
import { currentStop, weatherKind, type Weather } from "@/lib/road-trips";

/**
 * "Your Wanderland" uchun haqiqiy ob-havo: mashina turgan shahar (masalan Amarillo) bo'yicha.
 * Open-Meteo — bepul, kalitsiz. So'rovga faqat shahar koordinatalari ketadi (foydalanuvchi ma'lumoti emas).
 * Natija 30 daqiqa keshlanadi; xato bo'lsa — null (manzara ob-havosiz chiziladi).
 */
export async function loadTripWeather(count: number): Promise<Weather | null> {
  const stop = currentStop(count);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${stop.lat}&longitude=${stop.lon}&current=temperature_2m,weather_code`;
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const c = data.current;
    if (typeof c?.temperature_2m !== "number" || typeof c.weather_code !== "number") return null;
    return { kind: weatherKind(c.weather_code), temp: Math.round(c.temperature_2m), city: stop.name };
  } catch {
    return null;
  }
}
