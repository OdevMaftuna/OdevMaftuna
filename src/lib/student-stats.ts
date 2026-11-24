import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StudentAssignment } from "@/lib/student-data";

/**
 * O'QUVCHI STATISTIKASI (kabinetdagi "Natijalarim" kartasi uchun).
 * Barcha baholangan ishlarni bitta ro'yxatga yig'adi (foiz ko'rinishida) va
 * hafta / oy / umumiy kesimda: chiziqli grafik nuqtalari, bo'limlar bo'yicha o'rtacha va umumiy ko'rsatkichlar.
 */

export type StatCat = "homework" | "grammar" | "vocab" | "phrasal" | "exam";
export type StatPeriod = "week" | "month" | "all";

export type PeriodStats = {
  /** Grafik nuqtalari: o'sha kun/hafta/oydagi o'rtacha foiz (ish bo'lmasa — null). */
  points: { label: string; value: number | null; count: number }[];
  cats: { cat: StatCat; avg: number | null; count: number }[];
  count: number;
  avg: number | null;
  best: number | null;
  /** Oldingi shu uzunlikdagi davrga nisbatan o'rtacha foiz o'zgarishi (punkt). */
  delta: number | null;
  /** Faol kunlar soni (kamida bitta ish qilingan). */
  activeDays: number;
};

export type StudentStats = Record<StatPeriod, PeriodStats>;

type Ev = { at: number; pct: number; cat: StatCat };

const DAY = 86_400_000;
const TZ_OFFSET = 5 * 3_600_000; // Toshkent (UTC+5, yozgi vaqt yo'q)
const dayIdx = (t: number) => Math.floor((t + TZ_OFFSET) / DAY);
const WEEKDAY = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const MONTH = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
export const CATS: StatCat[] = ["homework", "grammar", "vocab", "phrasal", "exam"];

const avgOf = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const clamp = (n: number) => Math.max(0, Math.min(100, n));

function summarize(evs: Ev[], from: number, to: number, prevFrom: number | null): Omit<PeriodStats, "points"> {
  const inside = evs.filter((e) => e.at >= from && e.at < to);
  const pcts = inside.map((e) => e.pct);
  const prev = prevFrom == null ? [] : evs.filter((e) => e.at >= prevFrom && e.at < from).map((e) => e.pct);
  const avg = avgOf(pcts);
  const prevAvg = avgOf(prev);
  return {
    cats: CATS.map((cat) => {
      const xs = inside.filter((e) => e.cat === cat).map((e) => e.pct);
      return { cat, avg: avgOf(xs), count: xs.length };
    }),
    count: inside.length,
    avg,
    best: pcts.length ? Math.round(Math.max(...pcts)) : null,
    delta: avg != null && prevAvg != null ? avg - prevAvg : null,
    activeDays: new Set(inside.map((e) => dayIdx(e.at))).size,
  };
}

function bucketPoints(evs: Ev[], edges: number[], labels: string[]) {
  return labels.map((label, i) => {
    const xs = evs.filter((e) => e.at >= edges[i] && e.at < edges[i + 1]).map((e) => e.pct);
    return { label, value: avgOf(xs), count: xs.length };
  });
}

export async function loadStudentStats(studentId: string, items: StudentAssignment[], now: number): Promise<StudentStats> {
  const supabase = await createClient();
  const [{ data: practice }, { data: exams }] = await Promise.all([
    supabase.from("practice_attempts").select("history, topic:practice_topics(kind)").eq("student_id", studentId),
    supabase.from("test_attempts").select("score, max_score, submitted_at").eq("student_id", studentId).not("submitted_at", "is", null),
  ]);

  const evs: Ev[] = [];
  // 1) Uy vazifalar (faqat ball ko'rinadiganlari — view ko'rinmaydigan ballni null qiladi).
  for (const a of items) {
    const s = a.submission;
    if (s?.final_score == null || !s.submitted_at || !a.max_score) continue;
    evs.push({ at: new Date(s.submitted_at).getTime(), pct: clamp((Number(s.final_score) / a.max_score) * 100), cat: "homework" });
  }
  // 2) Mashqlar: har bir tekshiruv alohida (history).
  for (const row of practice ?? []) {
    const topic = row.topic as { kind?: string } | { kind?: string }[] | null;
    const kind = (Array.isArray(topic) ? topic[0]?.kind : topic?.kind) ?? "grammar";
    const cat: StatCat = kind === "vocab" ? "vocab" : kind === "phrasal" ? "phrasal" : "grammar";
    for (const h of Array.isArray(row.history) ? (row.history as { at?: string; score?: number; total?: number }[]) : []) {
      if (!h?.at || !h.total) continue;
      evs.push({ at: new Date(h.at).getTime(), pct: clamp(((h.score ?? 0) / h.total) * 100), cat });
    }
  }
  // 3) Imtihon testlari.
  for (const t of exams ?? []) {
    if (t.score == null || !t.submitted_at) continue;
    evs.push({ at: new Date(t.submitted_at).getTime(), pct: clamp((Number(t.score) / (t.max_score || 100)) * 100), cat: "exam" });
  }
  evs.sort((a, b) => a.at - b.at);

  // Kun chegaralari (Toshkent vaqti bo'yicha yarim tun).
  const todayStart = dayIdx(now) * DAY - TZ_OFFSET;
  const dayStart = (back: number) => todayStart - back * DAY;

  // HAFTA: oxirgi 7 kun, har kun — nuqta.
  const wEdges = Array.from({ length: 8 }, (_, i) => dayStart(6 - i));
  const wLabels = wEdges.slice(0, 7).map((t) => WEEKDAY[new Date(t + TZ_OFFSET).getUTCDay()]);
  // OY: oxirgi 28 kun, 4 haftalik bo'lak + "bu hafta".
  const mEdges = Array.from({ length: 5 }, (_, i) => dayStart(27 - i * 7));
  mEdges[4] = todayStart + DAY;
  const fmt = (t: number) => {
    const d = new Date(t + TZ_OFFSET);
    return `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`;
  };
  const mLabels = mEdges.slice(0, 4).map(fmt);
  // UMUMIY: oxirgi 6 oy, har oy — nuqta.
  const nowD = new Date(now + TZ_OFFSET);
  const aEdges = Array.from({ length: 7 }, (_, i) => Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - 5 + i, 1) - TZ_OFFSET);
  const aLabels = aEdges.slice(0, 6).map((t) => MONTH[new Date(t + TZ_OFFSET).getUTCMonth()]);
  const end = todayStart + DAY;

  return {
    week: { points: bucketPoints(evs, wEdges, wLabels), ...summarize(evs, wEdges[0], end, wEdges[0] - 7 * DAY) },
    month: { points: bucketPoints(evs, mEdges, mLabels), ...summarize(evs, mEdges[0], end, mEdges[0] - 28 * DAY) },
    all: { points: bucketPoints(evs, aEdges, aLabels), ...summarize(evs, 0, end, null) },
  };
}
