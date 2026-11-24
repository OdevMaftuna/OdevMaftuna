import { APP_LOCALE, APP_TIMEZONE } from "@/lib/config";

/**
 * Sana va vaqt har doim Asia/Tashkent bo'yicha ko'rsatiladi va kiritiladi
 * (server yoki brauzer qaysi vaqt zonasida bo'lishidan qat'i nazar).
 * Bazada esa hammasi UTC (timestamptz) ko'rinishida saqlanadi.
 */
const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

function zonedParts(date: Date) {
  const parts: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  return parts;
}

/** Berilgan lahzada ilova vaqt zonasining UTC'dan farqi (ms). */
function zoneOffsetMs(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export const LOCAL_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** "YYYY-MM-DDTHH:mm" haqiqiy sana-vaqtmi (masalan 31-fevral emasmi)? */
export function isValidLocalDateTime(local: string): boolean {
  const m = LOCAL_DATETIME_RE.exec(local);
  if (!m) return false;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d &&
    h < 24 &&
    mi < 60
  );
}

/** Toshkent vaqti bilan yozilgan "YYYY-MM-DDTHH:mm" → UTC ISO satri. */
export function localInputToIso(local: string): string {
  const m = LOCAL_DATETIME_RE.exec(local);
  if (!m) throw new Error("Sana formati noto'g'ri");
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = zoneOffsetMs(new Date(wallAsUtc));
  return new Date(wallAsUtc - offset).toISOString();
}

/** UTC ISO satri → Toshkent vaqti bilan "YYYY-MM-DDTHH:mm" (forma maydoni uchun). */
export function isoToLocalInput(iso: string | Date): string {
  const p = zonedParts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// --- English (student side) ---
const enDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const enDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "19 Nov 2026, 07:00" — student pages are in English. */
export function formatDateTimeEn(value: string | Date): string {
  return enDateTimeFormatter.format(new Date(value));
}

export function formatDateEn(value: string | Date): string {
  return enDateFormatter.format(new Date(value));
}
