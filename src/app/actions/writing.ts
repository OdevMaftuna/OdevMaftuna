"use server";

import { requireStudent } from "@/lib/auth";
import { hasCourseAccess } from "@/lib/course-access";
import type { Feedback } from "@/lib/ai/feedback";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { WRITING_COURSE, countWords } from "@/lib/writing/data";
import { findMock } from "@/lib/writing/multilevel";
import { gradeAndStore, resolveTask } from "@/lib/writing/grade";

/**
 * WRITING (letter / email): qoralama saqlash va AI tekshiruvi. Muddat yo'q, istalgancha qayta yozish mumkin.
 * Yozish faqat shu yerda (service role) — o'quvchi bahoni o'zi o'zgartira olmaydi.
 */

const MAX_TEXT = 6000;

async function canWrite(studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id").eq("name", WRITING_COURSE).maybeSingle();
  return Boolean(data?.id) && (await hasCourseAccess(studentId, data!.id as string));
}

export async function saveWritingDraft(cardId: string, text: string): Promise<{ ok: boolean }> {
  const me = await requireStudent();
  if (!resolveTask(cardId) || typeof text !== "string" || text.length > MAX_TEXT) return { ok: false };
  if (!(await canWrite(me.id))) return { ok: false };
  const admin = createAdminClient();
  const { data: prev } = await admin.from("writing_attempts").select("status").eq("student_id", me.id).eq("card_id", cardId).maybeSingle();
  const { error } = await admin.from("writing_attempts").upsert(
    {
      student_id: me.id,
      card_id: cardId,
      text,
      words: countWords(text),
      // Tekshirilgan ish qayta tahrirlansa ham bahosi saqlanadi (keyingi tekshiruvgacha).
      ...(prev ? {} : { status: "draft" }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,card_id" },
  );
  return { ok: !error };
}

/** Multilevel phrase mashqi natijasi (20 savoldan nechta to'g'ri) — eng yaxshisi saqlanadi. */
export async function saveMlQuiz(mockId: string, correct: number): Promise<{ ok: boolean; best: number }> {
  const me = await requireStudent();
  const mock = findMock(mockId);
  if (!mock || !Number.isInteger(correct) || correct < 0 || correct > mock.practice.length) return { ok: false, best: 0 };
  if (!(await canWrite(me.id))) return { ok: false, best: 0 };
  const admin = createAdminClient();
  const cardId = `${mockId}-quiz`;
  const { data: prev } = await admin.from("writing_attempts").select("score, history, checked_count").eq("student_id", me.id).eq("card_id", cardId).maybeSingle();
  const best = Math.max(correct, Number(prev?.score ?? 0));
  const now = new Date().toISOString();
  const history = [...(Array.isArray(prev?.history) ? (prev.history as unknown[]) : []), { at: now, score: correct, words: 0 }].slice(-30);
  const { error } = await admin.from("writing_attempts").upsert(
    { student_id: me.id, card_id: cardId, text: "", words: 0, status: "checked", score: best, history, checked_count: (prev?.checked_count ?? 0) + 1, checked_at: now, updated_at: now },
    { onConflict: "student_id,card_id" },
  );
  return { ok: !error, best };
}

export type WritingCheckResult =
  | { ok: true; score: number; feedback: Feedback; checks: number }
  | { ok: false; error: string };

export async function checkWriting(cardId: string, text: string): Promise<WritingCheckResult> {
  const me = await requireStudent();
  const task = resolveTask(cardId);
  if (!task || typeof text !== "string" || text.length > MAX_TEXT) return { ok: false, error: "Topshiriq topilmadi." };
  if (!(await canWrite(me.id))) return { ok: false, error: "Bu bo‘lim Pre-Intermediate kursi uchun." };
  const words = countWords(text);
  if (words < task.minWords) return { ok: false, error: `Juda qisqa: ${words} so‘z. Avval xatni to‘liqroq yozing.` };

  const r = await gradeAndStore(me.id, cardId, text, Date.now() + 50_000);
  if (r.ok) return r;
  return {
    ok: false,
    error: r.limited
      ? "AI tekshiruvchi hozir juda band (limit). Xatingiz saqlandi va navbatga qo‘yildi — bir necha daqiqada avtomatik tekshiriladi. Keyinroq shu sahifani yangilang."
      : "AI hozir band. Xatingiz saqlandi va navbatga qo‘yildi — bir necha daqiqada avtomatik tekshiriladi. Keyinroq shu sahifani yangilang.",
  };
}
