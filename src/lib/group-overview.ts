import "server-only";
import { loadStudentShifts, shiftDates, shiftOf } from "@/lib/schedule";
import { avatarUrl } from "@/lib/avatar";
import { loadStreaksForTeacher } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";

/**
 * SUPPORT MARKAZI — butun guruh (barcha o'qituvchilar o'quvchilari) bo'yicha natijalar.
 * Davr: "hafta" (oxirgi 7 kun) yoki "oy" (joriy oy). Har bir o'quvchi uchun: vazifalar, ball, mashq,
 * seriya, oxirgi faollik va "E'tibor kerak" bahosi (sabablari bilan). Hamma narsa Toshkent vaqtida.
 */

const TZ = 5 * 3_600_000;
const DAY = 86_400_000;
export const dayKeyOf = (ms: number) => new Date(ms + TZ).toISOString().slice(0, 10);
/** Vazifa muddati tungi 3:00 — dars kuni oldingi sana (hisobot bilan bir xil). */
const lessonDay = (dueIso: string) => dayKeyOf(Date.parse(dueIso) - 4 * 3_600_000);

export type Period = "hafta" | "oy";
export type Level = "urgent" | "watch" | "ok";
export type DayCell = { due: number; done: number; late: number; pctSum: number; pctN: number };

export type GroupStudent = {
  id: string;
  name: string;
  avatar: string | null;
  courseId: string | null;
  courseName: string;
  teacherId: string | null;
  teacherName: string;
  joined: string;
  due: number;
  submitted: number;
  late: number;
  missed: number;
  avg: number | null;
  prevDue: number;
  prevDone: number;
  prevAvg: number | null;
  practice: number;
  practiceAvg: number | null;
  streak: number;
  today: boolean;
  lost: number;
  lastActive: string | null;
  inactiveDays: number | null;
  pendingToday: { id: string; title: string; dueAt: string } | null;
  days: DayCell[];
  score: number;
  level: Level;
  reasons: string[];
};

export type GroupOverview = {
  period: Period;
  label: string;
  days: string[];
  students: GroupStudent[];
  teachers: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  now: number;
};

function rangeOf(period: Period, now: number) {
  const todayStart = Math.floor((now + TZ) / DAY) * DAY - TZ;
  if (period === "hafta") {
    const start = todayStart - 6 * DAY;
    return { start, prevStart: start - 7 * DAY, label: "Oxirgi 7 kun" };
  }
  const d = new Date(now + TZ);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - TZ;
  const prevStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1) - TZ;
  const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  return { start, prevStart, label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
}

/** "E'tibor kerak" bahosi: qancha katta — shuncha tezroq shug'ullanish kerak. */
function attention(s: Omit<GroupStudent, "score" | "level" | "reasons">): { score: number; level: Level; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (s.missed > 0) {
    score += Math.min(60, s.missed * 20);
    reasons.push(`${s.missed} ta vazifa bajarilmagan`);
  }
  if (s.avg !== null && s.avg < 60) {
    score += Math.round(60 - s.avg);
    reasons.push(`O‘rtacha ball ${Math.round(s.avg)}%`);
  }
  if (s.inactiveDays === null) {
    score += 30;
    reasons.push("Hali umuman ishlamagan");
  } else if (s.inactiveDays >= 3) {
    score += Math.min(30, s.inactiveDays * 5);
    reasons.push(`${s.inactiveDays} kundan beri faol emas`);
  }
  if (s.lost >= 3 && s.streak === 0) {
    score += 10;
    reasons.push(`Seriya uzildi (${s.lost} kun edi)`);
  }
  if (s.prevAvg !== null && s.avg !== null && s.prevAvg - s.avg >= 15) {
    score += 10;
    reasons.push(`Natija tushdi: ${Math.round(s.prevAvg)}% → ${Math.round(s.avg)}%`);
  }
  if (s.practice === 0 && s.due > 0) {
    score += 5;
    reasons.push("Mashq qilmagan");
  }
  if (s.pendingToday) reasons.push("Bugungi vazifa hali topshirilmagan");
  return { score, level: score >= 45 ? "urgent" : score >= 20 ? "watch" : "ok", reasons };
}

export async function loadGroupOverview(period: Period, now = Date.now()): Promise<GroupOverview> {
  const { start, prevStart, label } = rangeOf(period, now);
  const supabase = await createClient();
  // Guruh bo‘yicha surilgan muddatlar (lib/schedule.ts): oyna eng katta siljishga kengaytiriladi.
  const shifts = await loadStudentShifts();
  const maxShift = Math.max(0, ...shifts.values());
  const [{ data: studentsRaw }, { data: teachersRaw }, { data: coursesRaw }, { data: assignmentsRaw }, streaks] = await Promise.all([
    supabase.from("profiles").select("id, full_name, course_id, teacher_id, created_at, avatar_path").eq("role", "student").eq("is_active", true).order("full_name").limit(5000),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").eq("is_active", true).order("created_at"),
    supabase.from("courses").select("id, name").order("sort_order"),
    // Oldingi davr boshidan to ertaga kechgacha (bugungi ochiq vazifa ham kerak).
    supabase
      .from("assignments")
      .select("id, title, due_at, max_score, course_id")
      .gte("due_at", new Date(prevStart - maxShift).toISOString())
      .lt("due_at", new Date(now + 1.5 * DAY).toISOString())
      .order("due_at")
      .limit(5000),
    loadStreaksForTeacher(now),
  ]);
  type A = { id: string; title: string; due_at: string; max_score: number; course_id: string | null };
  const assignments = (assignmentsRaw ?? []) as A[];
  const ids = assignments.map((a) => a.id);
  const studentIds = (studentsRaw ?? []).map((s) => s.id as string);

  const [{ data: subsRaw }, { data: practiceRaw }] = await Promise.all([
    ids.length
      ? supabase.from("submissions").select("assignment_id, student_id, is_late, ai_score, teacher_score").in("assignment_id", ids).limit(20000)
      : Promise.resolve({ data: [] as never[] }),
    studentIds.length
      ? supabase.from("practice_attempts").select("student_id, history").in("student_id", studentIds).gte("updated_at", new Date(start).toISOString()).limit(20000)
      : Promise.resolve({ data: [] as never[] }),
  ]);
  type Sub = { assignment_id: string; student_id: string; is_late: boolean; ai_score: number | null; teacher_score: number | null };
  const subMap = new Map(((subsRaw ?? []) as Sub[]).map((s) => [`${s.student_id}:${s.assignment_id}`, s]));

  // Mashq: davr ichidagi har bir tekshiruv (history).
  const prac = new Map<string, number[]>();
  for (const row of (practiceRaw ?? []) as { student_id: string; history: unknown }[]) {
    for (const h of Array.isArray(row.history) ? (row.history as { at?: string; score?: number; total?: number }[]) : []) {
      if (!h?.at || !h.total || Date.parse(h.at) < start) continue;
      prac.set(row.student_id, [...(prac.get(row.student_id) ?? []), ((h.score ?? 0) / h.total) * 100]);
    }
  }

  const teacherName = new Map((teachersRaw ?? []).map((t) => [t.id as string, (t.full_name as string) || "O‘qituvchi"]));
  const courseName = new Map((coursesRaw ?? []).map((c) => [c.id as string, c.name as string]));
  const days: string[] = [];
  for (let t = start; t <= now; t += DAY) days.push(dayKeyOf(t));
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  const students: GroupStudent[] = (studentsRaw ?? []).map((st) => {
    const id = st.id as string;
    const joined = Date.parse(st.created_at as string);
    const shift = shiftOf(shifts, id, st.course_id as string | null);
    const mine = assignments
      .filter((a) => a.course_id === st.course_id)
      .map((a) => shiftDates(a, shift))
      .filter((a) => Date.parse(a.due_at) >= joined && Date.parse(a.due_at) >= prevStart && Date.parse(a.due_at) < now + 1.5 * DAY)
      .sort((x, y) => Date.parse(x.due_at) - Date.parse(y.due_at));
    const cells: DayCell[] = days.map(() => ({ due: 0, done: 0, late: 0, pctSum: 0, pctN: 0 }));
    let due = 0, submitted = 0, late = 0, missed = 0, sum = 0, n = 0, prevDue = 0, prevDone = 0, pSum = 0, pN = 0;
    let pendingToday: GroupStudent["pendingToday"] = null;
    for (const a of mine) {
      const t = Date.parse(a.due_at);
      const s = subMap.get(`${id}:${a.id}`);
      const v = s ? (s.teacher_score ?? s.ai_score) : null;
      const pct = v === null || v === undefined ? null : Math.max(0, Math.min(100, (Number(v) / (a.max_score || 100)) * 100));
      if (t > now) {
        // Hali muddati kelmagan (bugun/ertaga tunda) — topshirilmagan bo'lsa "bugungi vazifa".
        if (!s && !pendingToday) pendingToday = { id: a.id, title: a.title, dueAt: a.due_at };
        continue;
      }
      if (t < start) {
        prevDue++;
        if (s) prevDone++;
        if (pct !== null) {
          pSum += pct;
          pN++;
        }
        continue;
      }
      due++;
      const c = cells[dayIndex.get(lessonDay(a.due_at)) ?? days.length - 1];
      if (c) c.due++;
      if (s) {
        submitted++;
        if (c) c.done++;
        if (s.is_late) {
          late++;
          if (c) c.late++;
        }
        if (pct !== null) {
          sum += pct;
          n++;
          if (c) {
            c.pctSum += pct;
            c.pctN++;
          }
        }
      } else missed++;
    }
    const p = prac.get(id) ?? [];
    const sk = streaks.get(id);
    const lastActive = sk?.lastActive ?? null;
    const base = {
      id,
      name: (st.full_name as string) || "O‘quvchi",
      avatar: avatarUrl(st.avatar_path as string | null),
      courseId: (st.course_id as string | null) ?? null,
      courseName: courseName.get(st.course_id as string) ?? "Kurssiz",
      teacherId: (st.teacher_id as string | null) ?? null,
      teacherName: teacherName.get(st.teacher_id as string) ?? "Guruhsiz",
      joined: st.created_at as string,
      due,
      submitted,
      late,
      missed,
      avg: n ? sum / n : null,
      prevDue,
      prevDone,
      prevAvg: pN ? pSum / pN : null,
      practice: p.length,
      practiceAvg: p.length ? p.reduce((a, b) => a + b, 0) / p.length : null,
      streak: sk?.count ?? 0,
      today: sk?.today ?? false,
      lost: sk?.lost ?? 0,
      lastActive,
      inactiveDays: lastActive ? Math.floor((now - Date.parse(lastActive)) / DAY) : null,
      pendingToday,
      days: cells,
    };
    return { ...base, ...attention(base) };
  });

  return {
    period,
    label,
    days,
    students: students.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    teachers: (teachersRaw ?? []).map((t) => ({ id: t.id as string, name: (t.full_name as string) || "O‘qituvchi" })),
    courses: (coursesRaw ?? []).map((c) => ({ id: c.id as string, name: c.name as string })),
    now,
  };
}

/** Tanlangan o'quvchilar to'plami bo'yicha jamlanma (filtrlangan ro'yxat uchun ham ishlaydi). */
export function summarize(list: GroupStudent[], days: string[]) {
  const due = list.reduce((t, s) => t + s.due, 0);
  const done = list.reduce((t, s) => t + s.submitted, 0);
  const prevDue = list.reduce((t, s) => t + s.prevDue, 0);
  const prevDone = list.reduce((t, s) => t + s.prevDone, 0);
  const scored = list.filter((s) => s.avg !== null);
  const prevScored = list.filter((s) => s.prevAvg !== null);
  const avg = scored.length ? scored.reduce((t, s) => t + (s.avg ?? 0), 0) / scored.length : null;
  const prevAvg = prevScored.length ? prevScored.reduce((t, s) => t + (s.prevAvg ?? 0), 0) / prevScored.length : null;
  const completion = due ? (done / due) * 100 : null;
  const prevCompletion = prevDue ? (prevDone / prevDue) * 100 : null;
  return {
    students: list.length,
    due,
    done,
    missed: list.reduce((t, s) => t + s.missed, 0),
    completion,
    completionDelta: completion !== null && prevCompletion !== null ? completion - prevCompletion : null,
    avg,
    avgDelta: avg !== null && prevAvg !== null ? avg - prevAvg : null,
    activeToday: list.filter((s) => s.today).length,
    pendingToday: list.filter((s) => s.pendingToday).length,
    urgent: list.filter((s) => s.level === "urgent").length,
    watch: list.filter((s) => s.level === "watch").length,
    practice: list.reduce((t, s) => t + s.practice, 0),
    trend: days.map((day, i) => {
      const cs = list.map((s) => s.days[i]);
      const d = cs.reduce((t, c) => t + c.due, 0);
      const ok = cs.reduce((t, c) => t + c.done, 0);
      const pn = cs.reduce((t, c) => t + c.pctN, 0);
      return { day, completion: d ? (ok / d) * 100 : null, avg: pn ? cs.reduce((t, c) => t + c.pctSum, 0) / pn : null, due: d, done: ok };
    }),
  };
}

/** Faqat asosiy o'qituvchi uchun: pul va o'sish ko'rsatkichlari (shu davr va oldingi davr). */
export async function loadDirectorExtras(period: Period, now = Date.now()) {
  const { start, prevStart } = rangeOf(period, now);
  const supabase = await createClient();
  const [{ data: buys }, { data: fresh }] = await Promise.all([
    supabase.from("test_purchases").select("amount, status, created_at").gte("created_at", new Date(prevStart).toISOString()).limit(10000),
    supabase.from("profiles").select("id, created_at").eq("role", "student").gte("created_at", new Date(prevStart).toISOString()).limit(10000),
  ]);
  const inCur = (iso: string) => Date.parse(iso) >= start;
  const b = (buys ?? []) as { amount: number; status: string; created_at: string }[];
  const f = (fresh ?? []) as { created_at: string }[];
  const sum = (xs: typeof b) => xs.reduce((t, x) => t + (Number(x.amount) || 0), 0);
  const approved = b.filter((x) => x.status === "approved");
  return {
    revenue: sum(approved.filter((x) => inCur(x.created_at))),
    prevRevenue: sum(approved.filter((x) => !inCur(x.created_at))),
    sales: approved.filter((x) => inCur(x.created_at)).length,
    pending: b.filter((x) => x.status === "pending").length,
    newStudents: f.filter((x) => inCur(x.created_at)).length,
    prevNewStudents: f.filter((x) => !inCur(x.created_at)).length,
  };
}
