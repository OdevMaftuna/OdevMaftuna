import "server-only";
import { hasCourseAccess } from "@/lib/course-access";
import { createClient } from "@/lib/supabase/server";
import { WRITING_COURSE } from "./data";

export type WritingAttempt = {
  card_id: string;
  text: string;
  words: number;
  status: "draft" | "checking" | "checked" | "failed";
  score: number | null;
  feedback: unknown;
  history: { at: string; score: number; words: number }[];
  checked_count: number;
  checked_at: string | null;
  updated_at: string;
};

const COLS = "card_id, text, words, status, score, feedback, history, checked_count, checked_at, updated_at";

/** O'quvchining barcha writing ishlari (card_id → ish). */
export async function loadMyWriting(studentId: string): Promise<Map<string, WritingAttempt>> {
  const supabase = await createClient();
  const { data } = await supabase.from("writing_attempts").select(COLS).eq("student_id", studentId);
  return new Map(((data ?? []) as WritingAttempt[]).map((a) => [a.card_id, { ...a, score: a.score === null ? null : Number(a.score) }]));
}

/** Writing ochiqmi (Pre-Intermediate kursiga kirish bormi) va kurs id'si. */
export async function writingAccess(studentId: string): Promise<{ open: boolean; courseId: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id").eq("name", WRITING_COURSE).maybeSingle();
  const courseId = (data?.id as string | undefined) ?? null;
  return { open: courseId ? await hasCourseAccess(studentId, courseId) : false, courseId };
}

/** Ballga qarab rang (0–10). */
export const scoreColor = (s: number | null | undefined) => (s == null ? "#6f7d78" : s >= 8 ? "#3ddc97" : s >= 6 ? "#F5C76A" : s >= 4 ? "#ffb347" : "#ff6a8a");
