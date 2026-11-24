"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { runAiQueue } from "@/lib/ai/queue";
import { requireStudent } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-errors";
import { SPEAKING_BUCKET } from "@/lib/config";
import { answersSchema, gradeLesson, lessonRawScore, speakingCompletion, writtenText } from "@/lib/lesson/grade";
import {
  MAX_ML_ATTEMPTS,
  SPEAKING_BYTES_PER_SECOND,
  type Lesson,
  type LessonAnswers,
  type LessonKey,
  type LessonResult,
  type Recording,
  type SpeakingContent,
} from "@/lib/lesson/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** O'quvchining shu darsga yozgan ovozlari: 1..required.mp3, kamida minSeconds (5% bag'rikenglik). */
async function countRecordings(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string,
  assignmentId: string,
  s: SpeakingContent,
): Promise<Recording[]> {
  const { data } = await admin.storage.from(SPEAKING_BUCKET).list(`${studentId}/${assignmentId}`, { limit: 200 });
  const minBytes = s.minSeconds * SPEAKING_BYTES_PER_SECOND * 0.95;
  const out: Recording[] = [];
  for (const f of data ?? []) {
    const n = Number(f.name.match(/^(\d+)\.mp3$/)?.[1]);
    const bytes = Number((f.metadata as { size?: number } | null)?.size ?? 0);
    if (!Number.isInteger(n) || n < 1 || n > s.required || bytes < minBytes) continue;
    out.push({ n, bytes, seconds: Math.round(bytes / SPEAKING_BYTES_PER_SECOND) });
  }
  return out.sort((a, b) => a.n - b.n);
}

/**
 * Interaktiv darsni topshirish (bir marta).
 *  1. Dars o'quvchiga ochiqmi — RLS orqali (e'lon qilingan + o'z kursi).
 *  2. Muddat, kurs, kechikish — bazadagi submit_assignment() orqali, server soati bilan.
 *  3. Test qismlari shu yerda, yopiq kalit bilan tekshiriladi (kalit brauzerga chiqmaydi).
 *  4. Yozma qismni AI navbatda tekshiradi.
 */
export async function submitLesson(
  assignmentId: string,
  rawAnswers: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireStudent();
  if (!z.uuid().safeParse(assignmentId).success) {
    return { ok: false, error: "Lesson not found." };
  }

  const supabase = await createClient();
  const [{ data: assignment }, { data: existing }] = await Promise.all([
    supabase.from("assignments").select("id, lesson").eq("id", assignmentId).maybeSingle(),
    supabase
      .from("student_submissions")
      .select("id, answers")
      .eq("assignment_id", assignmentId)
      .maybeSingle(),
  ]);
  const lesson = assignment?.lesson as Lesson | null | undefined;
  if (!assignment || !lesson) return { ok: false, error: "Lesson not found or not open yet." };
  if (existing?.answers) return { ok: false, error: "This lesson has already been submitted." };

  const parsed = answersSchema(lesson).safeParse(rawAnswers);
  if (!parsed.success) {
    return { ok: false, error: "Couldn’t read your answers. Refresh the page and try again." };
  }
  const answers = parsed.data as LessonAnswers;

  // Yozma qism matn sifatida saqlanadi (bo'sh bo'lsa ham, javob baribir qabul qilinadi).
  const text = writtenText(lesson, answers) || "(yozma qism bo'sh)";
  const { data: submissionId, error } = await supabase.rpc("submit_assignment", {
    p_assignment_id: assignmentId,
    p_text: text.slice(0, 20000),
    p_image_paths: [],
  });
  if (error || !submissionId) {
    return { ok: false, error: dbErrorMessage(error?.message ?? "", "Couldn’t save your answer. Please try again.") };
  }

  // Javoblar kaliti faqat service role bilan o'qiladi.
  const admin = createAdminClient();
  const { data: keyRow } = await admin
    .from("assignment_keys")
    .select("key")
    .eq("assignment_id", assignmentId)
    .maybeSingle();
  const result = keyRow ? gradeLesson(lesson, keyRow.key as LessonKey, answers) : null;

  // Speaking: Storage'dagi haqiqiy fayllar sanaladi (hajmi bo'yicha davomiyligi tekshiriladi).
  if (lesson.speaking && answers.speaking) {
    const recordings = await countRecordings(admin, profile.id, assignmentId, lesson.speaking);
    answers.speaking = { ...answers.speaking, recordings };
    if (result) {
      const completion = speakingCompletion(lesson, recordings.length);
      result.speaking = {
        count: recordings.length,
        required: lesson.speaking.required,
        score: completion.score,
        max: completion.max,
        recordings,
      };
    }
  }

  const { error: saveError } = await admin
    .from("submissions")
    .update({ answers, lesson_result: result })
    .eq("id", submissionId as string);
  if (saveError) {
    return { ok: false, error: "Your answers were received, but the result couldn’t be saved. Please tell your teacher." };
  }

  after(() => runAiQueue());
  refresh();
  return { ok: true };
}

/** Darsni qayta ishlash: 2-urinish — testlar qayta tekshiriladi (rasmiy ball birinchi urinishdan qoladi). */
export async function retryLesson(
  assignmentId: string,
  rawAnswers: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStudent();
  if (!z.uuid().safeParse(assignmentId).success) return { ok: false, error: "Lesson not found." };
  const supabase = await createClient();
  const [{ data: assignment }, { data: sub }] = await Promise.all([
    supabase.from("assignments").select("id, lesson").eq("id", assignmentId).maybeSingle(),
    supabase.from("student_submissions").select("id, answers").eq("assignment_id", assignmentId).maybeSingle(),
  ]);
  const lesson = assignment?.lesson as Lesson | null | undefined;
  if (!lesson) return { ok: false, error: "This lesson can’t be retried." };
  if (!sub?.answers) return { ok: false, error: "Submit the lesson first." };

  const parsed = answersSchema(lesson).safeParse(rawAnswers);
  if (!parsed.success) return { ok: false, error: "Couldn’t read your answers. Refresh the page and try again." };

  const admin = createAdminClient();
  const [{ data: keyRow }, { data: row }] = await Promise.all([
    admin.from("assignment_keys").select("key").eq("assignment_id", assignmentId).maybeSingle(),
    admin.from("submissions").select("lesson_result").eq("id", sub.id as string).maybeSingle(),
  ]);
  if (!keyRow || !row?.lesson_result) return { ok: false, error: "Result not found." };
  const first = row.lesson_result as LessonResult;
  const retries = first.retries ?? [];
  if (retries.length + 1 >= MAX_ML_ATTEMPTS) return { ok: false, error: "You have already used all your attempts." };

  const answers = parsed.data as LessonAnswers;
  // Faqat avtomatik qismlar (testlar, listening) qayta tekshiriladi; yozma va speaking — 1-urinishdan.
  const result = gradeLesson(lesson, keyRow.key as LessonKey, answers);
  const updated: LessonResult = { ...first, retries: [...retries, { answers, result, at: new Date().toISOString() }] };
  // Ball — oxirgi urinish bo'yicha (AI tekshiruvi tugagan bo'lsa darhol; aks holda AI tugaganda shu hisoblanadi).
  const [{ data: state }, { data: asg }] = await Promise.all([
    admin.from("submissions").select("ai_status, is_late").eq("id", sub.id as string).maybeSingle(),
    admin.from("assignments").select("late_penalty_percent, max_score").eq("id", assignmentId).maybeSingle(),
  ]);
  const patch: Record<string, unknown> = { lesson_result: updated };
  if (state?.ai_status === "done") {
    const penalty = state.is_late ? Number(asg?.late_penalty_percent ?? 0) : 0;
    const raw = Math.min(Number(asg?.max_score ?? 100), lessonRawScore(updated));
    patch.ai_score = Math.round(raw * (100 - penalty)) / 100;
  }
  const { error } = await admin.from("submissions").update(patch).eq("id", sub.id as string);
  if (error) return { ok: false, error: "Couldn’t save your answers. Please try again." };
  refresh();
  return { ok: true };
}
