import "server-only";
import type { LessonAnswers, LessonResult } from "@/lib/lesson/types";
import { createClient } from "@/lib/supabase/server";
import { ASSIGNMENT_LIST_COLUMNS, type Assignment } from "@/lib/types";

/** O'qituvchi sahifalari uchun ma'lumot o'qish. Hammasi o'qituvchi sessiyasi bilan (RLS: to'liq ruxsat). */

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  text_content: string | null;
  image_paths: string[];
  submitted_at: string;
  is_late: boolean;
  ai_status: "pending" | "done" | "error";
  ai_feedback: unknown;
  ai_score: number | null;
  ai_error: string | null;
  teacher_score: number | null;
  teacher_comment: string | null;
  reviewed_at: string | null;
  answers?: LessonAnswers | null;
  lesson_result?: LessonResult | null;
};

export type StudentRow = {
  id: string;
  full_name: string;
  is_active: boolean;
  course_id: string | null;
  /** Asosiy + o'qituvchi ruxsat bergan qo'shimcha kurslar. */
  courses: string[];
};

/** O'qituvchi ruxsat bergan qo'shimcha kurslar: o'quvchi → kurslar. */
async function loadEnrollmentMap(supabase: Client): Promise<Map<string, string[]>> {
  const { data } = await supabase.from("course_enrollments").select("student_id, course_id");
  const map = new Map<string, string[]>();
  for (const e of data ?? []) map.set(e.student_id as string, [...(map.get(e.student_id as string) ?? []), e.course_id as string]);
  return map;
}

const withCourses = (s: Omit<StudentRow, "courses">, extra: Map<string, string[]>): StudentRow => ({
  ...s,
  courses: [...new Set([...(s.course_id ? [s.course_id] : []), ...(extra.get(s.id) ?? [])])],
});

type Client = Awaited<ReturnType<typeof createClient>>;

const PAGE = 1000;

/** Supabase bitta so'rovda ko'pi bilan 1000 qator qaytaradi — shuning uchun sahifalab o'qiymiz. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < 50_000; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error || !data) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

/** O'quvchiga ko'rinadigan yakuniy ball: o'qituvchi bali bo'lsa o'sha, bo'lmasa AI bali. */
export function finalScore(s: Pick<Submission, "teacher_score" | "ai_score">): number | null {
  const value = s.teacher_score ?? s.ai_score;
  return value === null ? null : Number(value);
}

export async function loadStudents(supabase: Client): Promise<StudentRow[]> {
  const [rows, extra] = await Promise.all([
    fetchAll<Omit<StudentRow, "courses">>((from, to) =>
      supabase
        .from("profiles")
        .select("id, full_name, is_active, course_id")
        .eq("role", "student")
        .order("full_name", { ascending: true })
        .range(from, to),
    ),
    loadEnrollmentMap(supabase),
  ]);
  return rows.map((s) => withCourses(s, extra));
}

/** E'lon qilingan vazifalar (eng yangi muddat tepada). */
export async function loadPublishedAssignments(supabase: Client): Promise<{
  assignments: Assignment[];
  now: number;
}> {
  const now = Date.now();
  const assignments = await fetchAll<Assignment>((from, to) =>
    supabase
      .from("assignments")
      .select(ASSIGNMENT_LIST_COLUMNS)
      .lte("publish_at", new Date(now).toISOString())
      .order("due_at", { ascending: false })
      .range(from, to),
  );
  return { assignments, now };
}

export type TrackingRow = {
  assignment: Assignment;
  closed: boolean;
  submitted: number;
  late: number;
  missing: number;
  unreviewed: number;
  aiProblems: number;
};

/**
 * Kuzatuv ro'yxati: har bir vazifa bo'yicha sonlar.
 * "Topshirmagan" — faqat o'sha vazifaning KURSIDAGI faol o'quvchilar ichidan hisoblanadi.
 */
export async function loadTracking(): Promise<{
  rows: TrackingRow[];
  activeStudents: number;
  activeByCourse: Record<string, number>;
}> {
  const supabase = await createClient();
  const [{ assignments, now }, students, submissions] = await Promise.all([
    loadPublishedAssignments(supabase),
    loadStudents(supabase),
    fetchAll<Pick<Submission, "assignment_id" | "student_id" | "is_late" | "ai_status" | "reviewed_at">>(
      (from, to) =>
        supabase
          .from("submissions")
          .select("assignment_id, student_id, is_late, ai_status, reviewed_at")
          .order("submitted_at", { ascending: true })
          .range(from, to),
    ),
  ]);

  const activeStudents = students.filter((s) => s.is_active);
  const activeCoursesOf = new Map(activeStudents.map((s) => [s.id, s.courses]));
  const activeByCourse: Record<string, number> = {};
  for (const s of activeStudents) {
    for (const c of s.courses) activeByCourse[c] = (activeByCourse[c] ?? 0) + 1;
  }
  const byAssignment = new Map<string, typeof submissions>();
  for (const s of submissions) {
    const list = byAssignment.get(s.assignment_id) ?? [];
    list.push(s);
    byAssignment.set(s.assignment_id, list);
  }

  const rows = assignments.map((assignment) => {
    const list = byAssignment.get(assignment.id) ?? [];
    const submittedByCourse = list.filter(
      (s) => activeCoursesOf.get(s.student_id)?.includes(assignment.course_id),
    ).length;
    return {
      assignment,
      closed: new Date(assignment.due_at).getTime() <= now,
      submitted: list.length,
      late: list.filter((s) => s.is_late).length,
      missing: Math.max(0, (activeByCourse[assignment.course_id] ?? 0) - submittedByCourse),
      unreviewed: list.filter((s) => !s.reviewed_at).length,
      aiProblems: list.filter((s) => s.ai_status === "error").length,
    };
  });
  return { rows, activeStudents: activeStudents.length, activeByCourse };
}

/** Bitta vazifa: kim topshirdi, kim yo'q. */
export async function loadAssignmentTracking(assignmentId: string): Promise<{
  assignment: Assignment;
  closed: boolean;
  submitted: { student: StudentRow; submission: Submission }[];
  missing: StudentRow[];
} | null> {
  const supabase = await createClient();
  const [{ data: assignment }, students, submissions] = await Promise.all([
    supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle(),
    loadStudents(supabase),
    fetchAll<Submission>((from, to) =>
      supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    ),
  ]);
  if (!assignment) return null;
  const a = assignment as Assignment;

  const byStudent = new Map(submissions.map((s) => [s.student_id, s]));
  const submitted = students.flatMap((student) => {
    const submission = byStudent.get(student.id);
    return submission ? [{ student, submission }] : [];
  });
  // Topshirmaganlar — faqat shu vazifaning kursidagi faol o'quvchilar.
  const missing = students.filter(
    (s) => s.is_active && s.courses.includes(a.course_id) && !byStudent.has(s.id),
  );

  return {
    assignment: a,
    closed: new Date(a.due_at).getTime() <= Date.now(),
    submitted,
    missing,
  };
}

/** Bitta o'quvchining barcha e'lon qilingan vazifalar bo'yicha holati. */
export async function loadStudentProgress(studentId: string): Promise<{
  student: StudentRow;
  items: { assignment: Assignment; submission: Submission | null; missed: boolean }[];
} | null> {
  const supabase = await createClient();
  const [{ data: profile }, { assignments, now }, submissions, extra] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, is_active, course_id")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle(),
    loadPublishedAssignments(supabase),
    fetchAll<Submission>((from, to) =>
      supabase
        .from("submissions")
        .select("id, assignment_id, student_id, submitted_at, is_late, ai_status, ai_score, ai_error, teacher_score, teacher_comment, reviewed_at")
        .eq("student_id", studentId)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    ),
    loadEnrollmentMap(supabase),
  ]);
  if (!profile) return null;
  const student = withCourses(profile as Omit<StudentRow, "courses">, extra);

  const byAssignment = new Map(submissions.map((s) => [s.assignment_id, s]));
  // O'z kurslarining (asosiy + qo'shimcha) vazifalari + boshqa kursda bo'lganida topshirganlari.
  const relevant = assignments.filter(
    (a) => student.courses.includes(a.course_id) || byAssignment.has(a.id),
  );
  const items = relevant.map((assignment) => {
    const submission = byAssignment.get(assignment.id) ?? null;
    const closed = new Date(assignment.due_at).getTime() <= now;
    return { assignment, submission, missed: closed && !submission };
  });
  return { student, items };
}
