import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * KUNLIK SERIYA: o'quvchi har kuni (Toshkent vaqti bilan) kamida bitta ish qilgan bo'lsa —
 * uy vazifasini topshirgan yoki mashqni tekshirgan — seriya davom etadi.
 * Bugun hali ish qilinmagan bo'lsa ham, kechagi kun bilan seriya "tirik" hisoblanadi.
 */

const TZ = "Asia/Tashkent";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD

export type Streak = {
  /** Ketma-ket kunlar soni. */
  count: number;
  /** Bugun ish qilinganmi. */
  today: boolean;
  /** Oxirgi 7 kun (eskidan yangiga): sana kaliti, hafta kuni, faol bo'lganmi. */
  week: { key: string; label: string; active: boolean; isToday: boolean }[];
  /** Kecha uzilgan seriya uzunligi ("Your Wanderland" halokat sahnasi uchun); aks holda 0. */
  lost: number;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export async function loadStreak(studentId: string, nowMs: number): Promise<Streak> {
  const supabase = await createClient();
  const since = new Date(nowMs - 120 * 86_400_000).toISOString();
  const [{ data: subs }, { data: practice }] = await Promise.all([
    supabase.from("student_submissions").select("submitted_at").gte("submitted_at", since),
    supabase
      .from("practice_attempts")
      .select("checked_at")
      .eq("student_id", studentId)
      .not("checked_at", "is", null)
      .gte("checked_at", since),
  ]);
  return computeStreak(
    [...(subs ?? []).map((s) => s.submitted_at as string), ...(practice ?? []).map((p) => p.checked_at as string)],
    nowMs,
  );
}

/** Faollik vaqtlaridan seriyani hisoblaydi (o'z va do'stlar seriyasi uchun umumiy). */
function computeStreak(times: string[], nowMs: number): Streak {
  const active = new Set<string>();
  for (const t of times) active.add(dayKey(new Date(t)));

  const keyAt = (offset: number) => dayKey(new Date(nowMs - offset * 86_400_000));
  const today = active.has(keyAt(0));
  let count = 0;
  for (let i = today ? 0 : 1; i < 120 && active.has(keyAt(i)); i++) count++;
  // Seriya kecha uzilgan bo'lsa (kecha ham, bugun ham ish yo'q, lekin oldingi kun bor edi) — necha kunlik edi.
  let lost = 0;
  if (count === 0 && active.has(keyAt(2))) for (let i = 2; i < 120 && active.has(keyAt(i)); i++) lost++;

  const week = Array.from({ length: 7 }, (_, j) => {
    const offset = 6 - j;
    const key = keyAt(offset);
    const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
    return { key, label: WEEKDAYS[weekday], active: active.has(key), isToday: offset === 0 };
  });
  return { count, today, week, lost };
}

/**
 * O'qituvchi uchun: ko'p o'quvchining seriyasi bir yo'la (o'qituvchi sessiyasi bilan — RLS hammasini ko'rsatadi).
 * Supabase 1000 qatordan ko'p bermaydi, shuning uchun sahifalab o'qiladi.
 */
export async function loadStreaksForTeacher(nowMs: number): Promise<Map<string, Streak & { lastActive: string | null }>> {
  const supabase = await createClient();
  const since = new Date(nowMs - 120 * 86_400_000).toISOString();
  const pageAll = async (table: "submissions" | "practice_attempts", col: "submitted_at" | "checked_at") => {
    const rows: { student_id: string; t: string }[] = [];
    for (let from = 0; from < 100_000; from += 1000) {
      const { data, error } = await supabase
        .from(table)
        .select(`student_id, ${col}`)
        .not(col, "is", null)
        .gte(col, since)
        .order(col, { ascending: true })
        .range(from, from + 999);
      if (error || !data) break;
      for (const r of data as unknown as Record<string, string>[]) rows.push({ student_id: r.student_id, t: r[col] });
      if (data.length < 1000) break;
    }
    return rows;
  };
  const [subs, practice] = await Promise.all([pageAll("submissions", "submitted_at"), pageAll("practice_attempts", "checked_at")]);
  const times = new Map<string, string[]>();
  for (const r of [...subs, ...practice]) times.set(r.student_id, [...(times.get(r.student_id) ?? []), r.t]);
  const out = new Map<string, Streak & { lastActive: string | null }>();
  for (const [id, list] of times) {
    const lastActive = list.reduce((a, b) => (a > b ? a : b), "");
    out.set(id, { ...computeStreak(list, nowMs), lastActive: lastActive || null });
  }
  return out;
}

/**
 * Boshqa o'quvchining seriyasi ("Your Wanderland" do'stlari uchun). Faqat server: service role bilan,
 * aniq student_id bo'yicha filtrlanadi. Chaqiruvchi avval ular haqiqatan do'st ekanini tekshirgan bo'lishi shart.
 */
export async function loadStreakFor(studentId: string, nowMs: number): Promise<Streak> {
  const admin = createAdminClient();
  const since = new Date(nowMs - 120 * 86_400_000).toISOString();
  const [{ data: subs }, { data: practice }] = await Promise.all([
    admin.from("submissions").select("submitted_at").eq("student_id", studentId).gte("submitted_at", since),
    admin.from("practice_attempts").select("checked_at").eq("student_id", studentId).not("checked_at", "is", null).gte("checked_at", since),
  ]);
  return computeStreak(
    [...(subs ?? []).map((s) => s.submitted_at as string), ...(practice ?? []).map((p) => p.checked_at as string)],
    nowMs,
  );
}
