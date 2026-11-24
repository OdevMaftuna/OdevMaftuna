import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GURUH BO'YICHA MUDDATLAR (0022).
 * Vazifa sanalari kursning asosiy jadvali (courses.schedule_start) bo'yicha yoziladi.
 * Guruh keyinroq boshlansa (class_groups.start_date), shu guruh o'quvchilari uchun sanalar
 * (start_date − schedule_start) kunga suriladi. Siljish faqat oldinga. Bazadagi trigger ham xuddi shunday hisoblaydi.
 */

const DAY = 86_400_000;

type GroupRow = { id: string; course_id: string | null; start_date: string | null };
type CourseRow = { id: string; schedule_start: string | null };

/** Guruhning siljishi (ms). Boshlanish sanasi yoki asosiy jadval yo'q bo'lsa — 0. */
export function groupShiftMs(startDate: string | null, scheduleStart: string | null): number {
  if (!startDate || !scheduleStart) return 0;
  const days = Math.round((Date.parse(startDate) - Date.parse(scheduleStart)) / DAY);
  return Math.max(0, days) * DAY;
}

/** Sanani siljitadi (ISO). */
export function shiftIso(iso: string, ms: number): string {
  return ms ? new Date(Date.parse(iso) + ms).toISOString() : iso;
}

export function shiftDates<T extends { publish_at?: string; due_at: string }>(a: T, ms: number): T {
  if (!ms) return a;
  return { ...a, due_at: shiftIso(a.due_at, ms), ...(a.publish_at ? { publish_at: shiftIso(a.publish_at, ms) } : {}) };
}

/** Kurslarning asosiy jadval sanasi. */
export async function loadScheduleStarts(): Promise<Map<string, string | null>> {
  const { data } = await createAdminClient().from("courses").select("id, schedule_start");
  return new Map(((data ?? []) as CourseRow[]).map((c) => [c.id, c.schedule_start]));
}

/** Har bir guruhning siljishi (ms), groupId → ms. */
export async function loadGroupShifts(): Promise<Map<string, number>> {
  const admin = createAdminClient();
  const [{ data: groups }, starts] = await Promise.all([admin.from("class_groups").select("id, course_id, start_date"), loadScheduleStarts()]);
  return new Map(
    ((groups ?? []) as GroupRow[]).map((g) => [g.id, g.course_id ? groupShiftMs(g.start_date, starts.get(g.course_id) ?? null) : 0]),
  );
}

/**
 * O'quvchilarning kurs bo'yicha siljishi: "studentId:courseId" → ms.
 * Bir nechta guruhda bo'lsa — eng katta siljish (bazadagi assignment_shift bilan bir xil).
 */
export async function loadStudentShifts(studentIds?: string[]): Promise<Map<string, number>> {
  const admin = createAdminClient();
  let q = admin.from("group_members").select("student_id, group_id").eq("status", "approved").not("student_id", "is", null);
  if (studentIds) {
    if (!studentIds.length) return new Map();
    q = q.in("student_id", studentIds);
  }
  const [{ data: members }, { data: groups }, starts] = await Promise.all([
    q,
    admin.from("class_groups").select("id, course_id, start_date"),
    loadScheduleStarts(),
  ]);
  const gById = new Map(((groups ?? []) as GroupRow[]).map((g) => [g.id, g]));
  const out = new Map<string, number>();
  for (const m of (members ?? []) as { student_id: string; group_id: string }[]) {
    const g = gById.get(m.group_id);
    if (!g?.course_id) continue;
    const ms = groupShiftMs(g.start_date, starts.get(g.course_id) ?? null);
    const key = `${m.student_id}:${g.course_id}`;
    if (ms > (out.get(key) ?? 0)) out.set(key, ms);
  }
  return out;
}

export function shiftOf(shifts: Map<string, number>, studentId: string, courseId: string | null | undefined): number {
  return courseId ? (shifts.get(`${studentId}:${courseId}`) ?? 0) : 0;
}
