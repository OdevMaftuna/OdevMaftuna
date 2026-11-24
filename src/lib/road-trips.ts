/**
 * "Your Wanderland" — kunlik seriya sayohatlari (server va brauzer uchun umumiy ma'lumot).
 * Har sayohat 30 kun; har 5 kunda yangi shahar. 90 kundan keyin boshidan aylanadi.
 */

export type Scenery = "desert" | "coast" | "plains";
export type Stop = { name: string; day: number; mile: number; lat: number; lon: number };
export type Trip = { title: string; badge: string; total: number; scenery: Scenery; stops: Stop[] };

export const TRIPS: Trip[] = [
  {
    title: "Route 66",
    badge: "66",
    total: 2448,
    scenery: "desert",
    stops: [
      { name: "Chicago", day: 0, mile: 0, lat: 41.88, lon: -87.63 },
      { name: "St. Louis", day: 5, mile: 300, lat: 38.63, lon: -90.2 },
      { name: "Tulsa", day: 10, mile: 690, lat: 36.15, lon: -95.99 },
      { name: "Amarillo", day: 15, mile: 1170, lat: 35.22, lon: -101.83 },
      { name: "Albuquerque", day: 20, mile: 1450, lat: 35.08, lon: -106.65 },
      { name: "Flagstaff", day: 25, mile: 1800, lat: 35.2, lon: -111.65 },
      { name: "Santa Monica", day: 30, mile: 2448, lat: 34.02, lon: -118.49 },
    ],
  },
  {
    title: "Pacific Coast Hwy",
    badge: "1",
    total: 1650,
    scenery: "coast",
    stops: [
      { name: "Seattle", day: 0, mile: 0, lat: 47.61, lon: -122.33 },
      { name: "Portland", day: 5, mile: 175, lat: 45.52, lon: -122.68 },
      { name: "Redwoods", day: 10, mile: 560, lat: 41.76, lon: -124.2 },
      { name: "San Francisco", day: 15, mile: 870, lat: 37.77, lon: -122.42 },
      { name: "Big Sur", day: 20, mile: 1020, lat: 36.27, lon: -121.81 },
      { name: "Los Angeles", day: 25, mile: 1470, lat: 34.05, lon: -118.24 },
      { name: "San Diego", day: 30, mile: 1650, lat: 32.72, lon: -117.16 },
    ],
  },
  {
    title: "Lincoln Highway",
    badge: "L",
    total: 3389,
    scenery: "plains",
    stops: [
      { name: "New York", day: 0, mile: 0, lat: 40.71, lon: -74.01 },
      { name: "Pittsburgh", day: 5, mile: 370, lat: 40.44, lon: -79.99 },
      { name: "Chicago", day: 10, mile: 830, lat: 41.88, lon: -87.63 },
      { name: "Omaha", day: 15, mile: 1300, lat: 41.26, lon: -95.93 },
      { name: "Cheyenne", day: 20, mile: 1810, lat: 41.14, lon: -104.82 },
      { name: "Salt Lake City", day: 25, mile: 2280, lat: 40.76, lon: -111.89 },
      { name: "San Francisco", day: 30, mile: 3389, lat: 37.77, lon: -122.42 },
    ],
  },
];

/** Seriya → qaysi sayohat, sayohat ichidagi kun va nechanchi aylanish. */
export function tripFor(count: number) {
  const done30 = count > 0 && count % 30 === 0;
  const cycle = done30 ? count / 30 : Math.floor(count / 30) + 1;
  const inTrip = done30 ? 30 : count % 30;
  return { trip: TRIPS[(cycle - 1) % TRIPS.length], inTrip, cycle };
}

/** Mashina hozir turgan (oxirgi yetib kelgan) shahar — ob-havo shu yerdan olinadi. */
export function currentStop(count: number): Stop {
  const { trip, inTrip } = tripFor(count);
  return [...trip.stops].reverse().find((s) => s.day <= inTrip) ?? trip.stops[0];
}

export type WeatherKind = "clear" | "clouds" | "fog" | "rain" | "snow" | "storm";
export type Weather = { kind: WeatherKind; temp: number; city: string };

/** Open-Meteo WMO kodi → bizning ob-havo turi. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "clouds";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "clouds";
}

export const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: "Ochiq osmon",
  clouds: "Bulutli",
  fog: "Tuman",
  rain: "Yomg‘ir",
  snow: "Qor",
  storm: "Momaqaldiroq",
};
