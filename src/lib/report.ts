import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * O'QITUVCHI HISOBOTI — bitta kurs, bitta oy (Toshkent vaqti).
 * Reyting: har bir muddati o'tgan vazifa bo'yicha foiz; topshirilmagani 0 hisoblanadi.
 */

const TZ_OFFSET_MS = 5 * 3_600_000; // Asia/Tashkent = UTC+5, yozgi vaqt yo'q

export type MonthKey = `${number}-${string}`;

export function monthRange(key: string): { start: number; end: number; label: string; prev: string; next: string } {
  const [y, m] = key.split("-").map(Number);
  const start = Date.UTC(y, m - 1, 1) - TZ_OFFSET_MS;
  const end = Date.UTC(y, m, 1) - TZ_OFFSET_MS;
  const fmt = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}`;
  const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  return {
    start,
    end,
    label: `${MONTHS[m - 1]} ${y}`,
    prev: m === 1 ? fmt(y - 1, 12) : fmt(y, m - 1),
    next: m === 12 ? fmt(y + 1, 1) : fmt(y, m + 1),
  };
}

export function currentMonthKey(nowMs: number): string {
  const d = new Date(nowMs + TZ_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Toshkent kuni: "2026-11-20". */
export const dayKey = (ms: number) => new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10);

/** "before" — o'quvchi kursga keyinroq qo'shilgan: o'sha vazifa unga hisoblanmaydi. */
export type CellState = "ontime" | "late" | "missed" | "upcoming" | "open" | "before";

export type StudentRow = {
  id: string;
  name: string;
  /** Muddati o'tgan (yoki topshirilgan) vazifalar soni. */
  due: number;
  submitted: number;
  late: number;
  missed: number;
  /** Topshirilganlarining o'rtacha bali, %. */
  avg: number | null;
  /** Reyting: muddati o'tganlar bo'yicha o'rtacha (topshirilmagan = 0), %. */
  rating: number | null;
  practiceChecks: number;
  practiceAvg: number | null;
  /** Shu oyda mashqlarni necha marta tekshirgani (hamma urinishlar). */
  practiceAttempts: number;
  /** Shu oyda topshirgan pullik testlari va o'rtacha bali (100 dan). */
  testsDone: number;
  testsAvg: number | null;
  /** Har bir vazifa bo'yicha holat (assignments tartibida). */
  cells: { state: CellState; pct: number | null }[];
};

export type AssignmentRow = {
  id: string;
  title: string;
  due_at: string;
  day: string;
  isDue: boolean;
  submitted: number;
  late: number;
  avg: number | null;
};

export type DayPoint = { day: string; avg: number | null; completion: number | null };

export type Report = {
  students: StudentRow[];
  assignments: AssignmentRow[];
  days: DayPoint[];
  totals: {
    students: number;
    dueAssignments: number;
    completion: number | null;
    avg: number | null;
    practiceChecks: number;
    missedTotal: number;
  };
  topics: { id: string; code: string; title: string; students: number; avg: number | null; attempts: number }[];
};

export async function loadReport(courseId: string, month: string, nowMs: number): Promise<Report> {
  const { start, end } = monthRange(month);
  const supabase = await createClient();
  const [{ data: primaryRaw }, { data: enrolledRaw }, { data: assignmentsRaw }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, created_at").eq("role", "student").eq("is_active", true).eq("course_id", courseId).order("full_name"),
    // Qo'shimcha qatnashuvchilar (o'qituvchi ruxsat bergan): hisob ruxsat berilgan kundan boshlanadi.
    supabase.from("course_enrollments").select("created_at, profiles!inner(id, full_name, is_active, role)").eq("course_id", courseId),
    supabase
      .from("assignments")
      .select("id, title, due_at, max_score")
      .eq("course_id", courseId)
      .gte("due_at", new Date(start).toISOString())
      .lt("due_at", new Date(end).toISOString())
      .order("due_at"),
  ]);
  type P = { id: string; full_name: string; created_at: string; extra?: boolean };
  const primary = (primaryRaw ?? []) as P[];
  const enrolled = ((enrolledRaw ?? []) as unknown as { created_at: string; profiles: { id: string; full_name: string; is_active: boolean; role: string } }[])
    .filter((e) => e.profiles.is_active && e.profiles.role === "student" && !primary.some((p) => p.id === e.profiles.id))
    .map((e) => ({ id: e.profiles.id, full_name: e.profiles.full_name, created_at: e.created_at, extra: true }));
  const students: P[] = [...primary, ...enrolled].sort((a, b) => a.full_name.localeCompare(b.full_name));
  const assignments = (assignmentsRaw ?? []) as { id: string; title: string; due_at: string; max_score: number }[];
  const ids = assignments.map((a) => a.id);

  const [{ data: subsRaw }, { data: practiceRaw }, { data: testsRaw }] = await Promise.all([
    ids.length
      ? supabase.from("submissions").select("assignment_id, student_id, is_late, ai_score, teacher_score").in("assignment_id", ids)
      : Promise.resolve({ data: [] as never[] }),
    students.length
      ? supabase
          .from("practice_attempts")
          .select("topic_id, student_id, best_score, total, checked_count, checked_at, practice_topics(code, title)")
          .in("student_id", students.map((s) => s.id))
          .gte("checked_at", new Date(start).toISOString())
          .lt("checked_at", new Date(end).toISOString())
      : Promise.resolve({ data: [] as never[] }),
    students.length
      ? supabase
          .from("test_attempts")
          .select("student_id, score")
          .in("student_id", students.map((s) => s.id))
          .gte("submitted_at", new Date(start).toISOString())
          .lt("submitted_at", new Date(end).toISOString())
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const testAttempts = (testsRaw ?? []) as { student_id: string; score: number | null }[];
  type Sub = { assignment_id: string; student_id: string; is_late: boolean; ai_score: number | null; teacher_score: number | null };
  const subs = (subsRaw ?? []) as Sub[];
  const subMap = new Map(subs.map((s) => [`${s.student_id}:${s.assignment_id}`, s]));
  const pctOf = (s: Sub, max: number) => {
    const v = s.teacher_score ?? s.ai_score;
    return v === null || v === undefined ? null : Math.max(0, Math.min(100, (Number(v) / max) * 100));
  };
  const isDue = (a: { due_at: string }) => Date.parse(a.due_at) <= nowMs;

  type Prac = { topic_id: string; student_id: string; best_score: number | null; total: number | null; checked_count: number; practice_topics: { code: string; title: string } | null };
  const practice = (practiceRaw ?? []) as unknown as Prac[];

  const rows: StudentRow[] = students.map((st) => {
    let due = 0, submitted = 0, late = 0, missed = 0, sum = 0, n = 0, ratingSum = 0;
    const joined = Date.parse(st.created_at as string);
    const cells = assignments.map((a) => {
      const s = subMap.get(`${st.id}:${a.id}`);
      // Kursga qo'shilishidan oldin muddati tugagan vazifa — o'quvchiga hisoblanmaydi.
      if (!s && Date.parse(a.due_at) < joined) return { state: "before" as CellState, pct: null };
      const pct = s ? pctOf(s, a.max_score) : null;
      if (s) {
        submitted++;
        if (s.is_late) late++;
        if (pct !== null) {
          sum += pct;
          n++;
        }
      }
      if (isDue(a) || s) {
        due++;
        ratingSum += pct ?? 0;
        if (!s) missed++;
      }
      const state: CellState = s ? (s.is_late ? "late" : "ontime") : isDue(a) ? "missed" : Date.parse(a.due_at) - nowMs < 86_400_000 ? "open" : "upcoming";
      return { state, pct };
    });
    const mine = practice.filter((p) => p.student_id === st.id && p.total);
    const myTests = testAttempts.filter((t) => t.student_id === st.id);
    return {
      id: st.id,
      name: (st.full_name as string) || "—",
      due,
      submitted,
      late,
      missed,
      avg: n ? sum / n : null,
      rating: due ? ratingSum / due : null,
      practiceChecks: mine.length,
      practiceAvg: mine.length ? mine.reduce((t, p) => t + (p.best_score ?? 0) / (p.total || 1), 0) / mine.length * 100 : null,
      practiceAttempts: mine.reduce((t, p) => t + (p.checked_count ?? 0), 0),
      testsDone: myTests.length,
      testsAvg: myTests.length ? myTests.reduce((t, x) => t + Number(x.score ?? 0), 0) / myTests.length : null,
      cells,
    };
  });

  const assignmentRows: AssignmentRow[] = assignments.map((a, i) => {
    const got = rows.map((r) => r.cells[i]).filter((c) => c.state === "ontime" || c.state === "late");
    const scored = got.filter((c) => c.pct !== null);
    return {
      id: a.id,
      title: a.title,
      due_at: a.due_at,
      day: dayKey(Date.parse(a.due_at) - 4 * 3_600_000), // muddati tungi 3:00 — dars kuni oldingi sana
      isDue: isDue(a),
      submitted: got.length,
      late: got.filter((c) => c.state === "late").length,
      avg: scored.length ? scored.reduce((t, c) => t + (c.pct ?? 0), 0) / scored.length : null,
    };
  });

  const due = assignmentRows.filter((a) => a.isDue);
  const days: DayPoint[] = assignmentRows.map((a) => ({
    day: a.day,
    avg: a.avg,
    completion: a.isDue && students.length ? (a.submitted / students.length) * 100 : null,
  }));

  const topicMap = new Map<string, { code: string; title: string; students: Set<string>; sum: number; n: number; attempts: number }>();
  for (const p of practice) {
    if (!p.total || !p.practice_topics) continue;
    const t = topicMap.get(p.topic_id) ?? { code: p.practice_topics.code, title: p.practice_topics.title, students: new Set(), sum: 0, n: 0, attempts: 0 };
    t.students.add(p.student_id);
    t.sum += ((p.best_score ?? 0) / p.total) * 100;
    t.n++;
    t.attempts += p.checked_count ?? 0;
    topicMap.set(p.topic_id, t);
  }

  const allScored = rows.filter((r) => r.avg !== null);
  const totalDueCells = rows.reduce((t, r) => t + r.due, 0);
  return {
    students: rows,
    assignments: assignmentRows,
    days,
    totals: {
      students: students.length,
      dueAssignments: due.length,
      completion: totalDueCells ? (rows.reduce((t, r) => t + (r.due - r.missed), 0) / totalDueCells) * 100 : null,
      avg: allScored.length ? allScored.reduce((t, r) => t + (r.avg ?? 0), 0) / allScored.length : null,
      practiceChecks: practice.length,
      missedTotal: rows.reduce((t, r) => t + r.missed, 0),
    },
    topics: [...topicMap.entries()]
      .map(([id, t]) => ({ id, code: t.code, title: t.title, students: t.students.size, avg: t.n ? t.sum / t.n : null, attempts: t.attempts }))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
  };
}
