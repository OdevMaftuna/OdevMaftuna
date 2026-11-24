import "server-only";
import { getCurrentProfile } from "@/lib/auth";
import { SUBMISSIONS_BUCKET } from "@/lib/config";
import { loadStudentShifts, shiftDates, shiftOf } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";
import { ASSIGNMENT_LIST_COLUMNS, type Assignment, type StudentSubmission } from "@/lib/types";

/**
 * O'quvchi ko'ra oladigan ma'lumotlar. RLS faqat e'lon qilingan vazifalarni, student_submissions view esa
 * faqat o'zining javoblarini qaytaradi. Sanalar o'quvchining guruhi bo'yicha suriladi (lib/schedule.ts).
 */

export type AssignmentState =
  /** Muddat tugamagan. */
  | "open"
  /** Muddat o'tgan, lekin kech topshirish mumkin va hali topshirilmagan. */
  | "late_open"
  /** Yopilgan. */
  | "closed";

export type StudentAssignment = Assignment & {
  submission: StudentSubmission | null;
  state: AssignmentState;
};

function stateOf(a: Assignment, submission: StudentSubmission | null, now: number): AssignmentState {
  if (new Date(a.due_at).getTime() > now) return "open";
  if (a.late_allowed && !submission) return "late_open";
  return "closed";
}

export async function loadStudentAssignments(): Promise<{
  items: StudentAssignment[];
  /** Server soati (ms) — teskari sanoq brauzer soatiga bog'liq bo'lmasligi uchun. */
  now: number;
  failed: boolean;
}> {
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const [assignments, submissions, shifts] = await Promise.all([
    supabase.from("assignments").select(ASSIGNMENT_LIST_COLUMNS).order("due_at", { ascending: true }),
    // Ro'yxatda javoblarning o'zi (answers, text_content) kerak emas.
    supabase
      .from("student_submissions")
      .select("id, assignment_id, student_id, submitted_at, is_late, ai_status, ai_score, teacher_score, teacher_comment, reviewed_at, final_score, score_visible"),
    loadStudentShifts([me.id]),
  ]);

  const byAssignment = new Map(
    ((submissions.data ?? []) as StudentSubmission[]).map((s) => [s.assignment_id, s]),
  );
  const now = Date.now();
  // Guruh keyinroq boshlangan bo'lsa sanalar suriladi; guruhi uchun hali ochilmagan vazifalar yashiriladi.
  const items = ((assignments.data ?? []) as unknown as Assignment[])
    .map((raw) => shiftDates(raw, shiftOf(shifts, me.id, raw.course_id)))
    .filter((a) => Date.parse(a.publish_at) <= now || byAssignment.has(a.id))
    .sort((x, y) => Date.parse(x.due_at) - Date.parse(y.due_at))
    .map((a) => {
      const submission = byAssignment.get(a.id) ?? null;
      return { ...a, submission, state: stateOf(a, submission, now) };
    });

  return { items, now, failed: Boolean(assignments.error || submissions.error) };
}

export async function loadStudentAssignment(id: string): Promise<{
  item: StudentAssignment;
  now: number;
  /** Yuklangan rasmlar uchun 1 soatlik imzolangan havolalar. */
  images: { path: string; url: string }[];
} | null> {
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const [assignment, submission, shifts] = await Promise.all([
    supabase.from("assignments").select("*").eq("id", id).maybeSingle(),
    supabase.from("student_submissions").select("*").eq("assignment_id", id).maybeSingle(),
    loadStudentShifts([me.id]),
  ]);
  if (!assignment.data) return null;

  const raw = assignment.data as Assignment;
  const a = shiftDates(raw, shiftOf(shifts, me.id, raw.course_id));
  const s = (submission.data as StudentSubmission | null) ?? null;
  const now = Date.now();
  // Guruhi uchun hali ochilmagan vazifa.
  if (Date.parse(a.publish_at) > now && !s) return null;

  let images: { path: string; url: string }[] = [];
  if (s && s.image_paths.length > 0) {
    const { data } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUrls(s.image_paths, 3600);
    images = (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl ? [{ path: entry.path, url: entry.signedUrl }] : [],
    );
  }

  return { item: { ...a, submission: s, state: stateOf(a, s, now) }, now, images };
}
