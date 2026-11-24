/** O'quvchi qidiruvi: indeks elementlari va solishtirish (server va brauzerda ishlaydi). */

export type SearchKind = "section" | "course" | "topic" | "word" | "homework" | "test";

export type SearchItem = {
  kind: SearchKind;
  title: string;
  /** Kichik izoh: kurs nomi, tarjima, muddat … */
  sub?: string;
  href: string;
  /** Qo'shimcha qidiriladigan matn (sarlavhada ko'rinmaydi). */
  extra?: string;
};

export const KIND_LABEL: Record<SearchKind, { label: string; icon: string }> = {
  section: { label: "Sections", icon: "🧭" },
  course: { label: "Courses", icon: "📚" },
  topic: { label: "Topics", icon: "📘" },
  word: { label: "Words", icon: "🔤" },
  homework: { label: "Homework", icon: "📝" },
  test: { label: "Exam tests", icon: "🏆" },
};

/** Katta-kichik harf, o‘ / o' / oʻ, tinish belgilari farq qilmasin. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʻʼ`´']/g, "")
    .replace(/[^a-z0-9а-яёқғҳў ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ball: so'z boshidan mos kelsa yuqoriroq. 0 — mos emas.
 * Har bir so'z (bo'shliq bilan ajratilgan) topilishi kerak.
 */
export function score(item: { t: string; x: string }, q: string): number {
  const parts = q.split(" ").filter(Boolean);
  if (!parts.length) return 0;
  let total = 0;
  for (const p of parts) {
    if (item.t === p) total += 100;
    else if (item.t.startsWith(p)) total += 60;
    else if (item.t.includes(` ${p}`)) total += 40;
    else if (item.t.includes(p)) total += 20;
    else if (item.x.includes(p)) total += 10;
    else return 0;
  }
  return total;
}
