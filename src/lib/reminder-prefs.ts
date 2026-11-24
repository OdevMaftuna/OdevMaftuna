/**
 * O'quvchining eslatma sozlamalari (shu qurilmada, localStorage'da saqlanadi).
 *  - every: vazifa eslatmasi qanchalik tez-tez chiqadi
 *  - tone:  "strict" — "jahli chiqqan" stikerlar; "soft" — yumshoq, kattalar uchun
 * Standart: 18 yoshdan kattalarga — 2 soatda bir, yumshoq; kichiklarga — 30 daqiqada bir, qattiq.
 */

export type ReminderEvery = "30m" | "2h" | "visit" | "off";
export type ReminderTone = "strict" | "soft";
export type ReminderPrefs = { every: ReminderEvery; tone: ReminderTone };

const KEY = "nsp-reminder-prefs";
const EVENT = "nsp-reminder-prefs";

export const EVERY_MS: Record<ReminderEvery, number> = {
  "30m": 30 * 60 * 1000,
  "2h": 2 * 60 * 60 * 1000,
  visit: Number.POSITIVE_INFINITY,
  off: Number.POSITIVE_INFINITY,
};

export function defaultPrefs(age: number | null | undefined): ReminderPrefs {
  return age != null && age >= 18 ? { every: "2h", tone: "soft" } : { every: "30m", tone: "strict" };
}

export function readPrefs(age: number | null | undefined): ReminderPrefs {
  const base = defaultPrefs(age);
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<ReminderPrefs> | null;
    const every = raw?.every && raw.every in EVERY_MS ? raw.every : base.every;
    const tone = raw?.tone === "soft" || raw?.tone === "strict" ? raw.tone : base.tone;
    return { every, tone };
  } catch {
    return base;
  }
}

export function writePrefs(prefs: ReminderPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/** Sozlama o'zgarganda (shu yoki boshqa tabda) chaqiriladi. */
export function onPrefsChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
