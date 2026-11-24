/**
 * "Har kuni boshqacha": bosh sahifadagi kunlik elementlar — sana (Toshkent) bo'yicha tanlanadi,
 * shuning uchun bir kun davomida o'zgarmaydi, ertasi kuni yangisi chiqadi.
 *  - kunlik rang mavzusi (haftaning har kuni o'z ranglari);
 *  - kun so'zi (o'quvchining kursidagi lug'atdan);
 *  - kun iqtibosi (inglizcha + o'zbekcha).
 */

const TZ = "Asia/Tashkent";

export function todayKey(nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(nowMs));
}

/** Kun tartib raqami (1970-01-01 dan beri) — ketma-ket kunlarda albatta har xil. */
export function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / 86_400_000);
}

export type DayTheme = { name: string; from: string; via: string; to: string; accent: string; emoji: string };

/** Haftaning har kuni o'z rangi va kayfiyati (0 = yakshanba). */
export const DAY_THEMES: DayTheme[] = [
  { name: "Sunday", from: "#7c3aed", via: "#4c1d95", to: "#14112a", accent: "#d8b4fe", emoji: "🌙" },
  { name: "Monday", from: "#10956c", via: "#0a5c45", to: "#0b1f19", accent: "#9ee0c4", emoji: "🚀" },
  { name: "Tuesday", from: "#2f6fd8", via: "#1f3c88", to: "#0d1830", accent: "#a5c8ff", emoji: "💡" },
  { name: "Wednesday", from: "#e0752e", via: "#8a3b12", to: "#1f130b", accent: "#ffd2a8", emoji: "🔥" },
  { name: "Thursday", from: "#1aa0b3", via: "#0e5966", to: "#0b1d21", accent: "#9fe6ef", emoji: "🌊" },
  { name: "Friday", from: "#d14f7a", via: "#7a1f3d", to: "#1f0d16", accent: "#ffb3cb", emoji: "🎉" },
  { name: "Saturday", from: "#c9922e", via: "#6b4a10", to: "#1d160a", accent: "#F5C76A", emoji: "⭐" },
];

export function dayTheme(key: string): DayTheme {
  return DAY_THEMES[new Date(`${key}T12:00:00Z`).getUTCDay()];
}

export const QUOTES: { en: string; uz: string }[] = [
  { en: "Small steps every day lead to big results.", uz: "Har kungi kichik qadamlar katta natijaga olib keladi." },
  { en: "Mistakes are proof that you are trying.", uz: "Xatolar — harakat qilayotganingizning isboti." },
  { en: "A new language is a new life.", uz: "Yangi til — yangi hayot." },
  { en: "Don’t wait to be ready. Start, and you will get ready.", uz: "Tayyor bo‘lishni kutmang. Boshlang — tayyor bo‘lasiz." },
  { en: "Practice makes progress, not perfect.", uz: "Mashq mukammallikka emas, o‘sishga olib boradi." },
  { en: "Every expert was once a beginner.", uz: "Har bir usta bir paytlar boshlovchi bo‘lgan." },
  { en: "Speak with confidence — your accent is your story.", uz: "Ishonch bilan gapiring — talaffuzingiz sizning hikoyangiz." },
  { en: "Learn one word today. Use it tomorrow.", uz: "Bugun bitta so‘z o‘rganing. Ertaga uni ishlating." },
  { en: "Your future self will thank you for today.", uz: "Kelajakdagi o‘zingiz bugungi kun uchun sizga rahmat aytadi." },
  { en: "Consistency beats talent.", uz: "Muntazamlik iste’doddan kuchli." },
  { en: "The best time to start was yesterday. The next best time is now.", uz: "Boshlash uchun eng yaxshi vaqt — kecha edi. Keyingisi — hozir." },
  { en: "English opens doors. Keep knocking.", uz: "Ingliz tili eshiklarni ochadi. Taqillatishda davom eting." },
  { en: "Read, listen, speak — repeat.", uz: "O‘qing, tinglang, gapiring — takrorlang." },
  { en: "You don’t have to be great to start, but you have to start to be great.", uz: "Boshlash uchun zo‘r bo‘lish shart emas, zo‘r bo‘lish uchun boshlash shart." },
];

export function quoteOfDay(key: string) {
  // Ketma-ket: har kuni keyingi iqtibos, 14 kunda aylanadi.
  return QUOTES[dayNumber(key) % QUOTES.length];
}

export function wordOfDay<T>(words: T[], key: string): T | null {
  // Katta tub songa ko'paytirish — so'zlar tartibsiz, lekin har kuni boshqasi chiqadi.
  return words.length ? words[(dayNumber(key) * 7919) % words.length] : null;
}

/** Seriya uchun keyingi bosqich (milestone). */
const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];
export function nextMilestone(count: number) {
  const target = MILESTONES.find((m) => m > count) ?? count + 100;
  return { target, left: target - count };
}

/** Kun vaqtiga qarab salom. */
export function greeting(nowMs: number): { text: string; emoji: string } {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date(nowMs)));
  if (h < 5) return { text: "Good night", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 18) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌆" };
}
