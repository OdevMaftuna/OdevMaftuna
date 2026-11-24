"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { runAiQueue } from "@/lib/ai/queue";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = {
  error?: string;
  saved?: boolean;
  values?: { score: string; comment: string };
} | null;

/**
 * O'qituvchi bahosi: ball (ixtiyoriy) va izoh. Saqlanganda javob "tekshirilgan" bo'ladi.
 * Ball bo'sh qoldirilsa, o'quvchiga AI bali ko'rsatiladi.
 */
export async function saveReview(
  submissionId: string,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  await requireTeacher();

  const values = {
    score: String(formData.get("score") ?? "").trim().replace(",", "."),
    comment: String(formData.get("comment") ?? ""),
  };
  if (!z.uuid().safeParse(submissionId).success) {
    return { error: "Javob topilmadi.", values };
  }

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("submissions")
    .select("id, assignment_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) return { error: "Javob topilmadi.", values };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("max_score")
    .eq("id", submission.assignment_id)
    .maybeSingle();
  const maxScore = Number(assignment?.max_score ?? 100);

  const parsed = z
    .object({
      score: z.union([
        z.literal(""),
        z.coerce
          .number("Ball son bo‘lishi kerak")
          .min(0, "Ball 0 dan kam bo‘lmasin")
          .max(maxScore, `Ball ${maxScore} dan oshmasin`),
      ]),
      comment: z.string().trim().max(5000, "Izoh juda uzun"),
    })
    .safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma’lumot noto‘g‘ri.", values };
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      teacher_score: parsed.data.score === "" ? null : Math.round(parsed.data.score * 100) / 100,
      teacher_comment: parsed.data.comment || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) return { error: "Saqlab bo‘lmadi. Qaytadan urinib ko‘ring.", values };

  refresh();
  return { saved: true };
}

/**
 * "AI'ni qayta ishga tushirish": javobni yana navbatga qo'yadi.
 * Xato bilan tugagan (yoki natijasi yoqmagan) tekshiruv uchun.
 */
export async function rerunAi(submissionId: string): Promise<{ error?: string }> {
  await requireTeacher();
  if (!z.uuid().safeParse(submissionId).success) return { error: "Javob topilmadi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({
      ai_status: "pending",
      ai_feedback: null,
      ai_score: null,
      ai_error: null,
      ai_locked_at: null,
      ai_attempts: 0,
    })
    .eq("id", submissionId);
  if (error) return { error: "Qayta ishga tushirib bo‘lmadi." };

  after(() => runAiQueue());
  refresh();
  return {};
}

/** Baholash sahifasi AI natijasini kutayotganda so'raydi (va navbatni turtadi). */
export async function getSubmissionAiStatus(
  submissionId: string,
): Promise<"pending" | "done" | "error" | "none"> {
  await requireTeacher();
  if (!z.uuid().safeParse(submissionId).success) return "none";

  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("ai_status")
    .eq("id", submissionId)
    .maybeSingle();
  if (!data) return "none";
  if (data.ai_status === "pending") after(() => runAiQueue());
  return data.ai_status as "pending" | "done" | "error";
}

const settingsSchema = z.object({
  feedback_language: z.enum(["uz", "en"]),
  show_ai_score_immediately: z.boolean(),
});

export type SettingsState = { error?: string; saved?: boolean } | null;

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };

  const parsed = settingsSchema.safeParse({
    feedback_language: formData.get("feedback_language"),
    show_ai_score_immediately: formData.get("show_ai_score_immediately") === "on",
  });
  if (!parsed.success) return { error: "Sozlamalar noto‘g‘ri." };

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update(parsed.data).eq("id", true);
  if (error) return { error: "Saqlab bo‘lmadi. Qaytadan urinib ko‘ring." };

  refresh();
  return { saved: true };
}
