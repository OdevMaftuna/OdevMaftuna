"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { runAiQueue } from "@/lib/ai/queue";
import { requireStudent } from "@/lib/auth";
import { MAX_IMAGES_PER_SUBMISSION } from "@/lib/config";
import { DB_ERRORS, dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  assignmentId: z.uuid(),
  text: z.string().max(20000),
  imagePaths: z.array(z.string().max(300)).max(MAX_IMAGES_PER_SUBMISSION),
});


/**
 * Javobni saqlaydi (yoki yangilaydi).
 * Muddat BRAUZERDA emas, shu yerda — bazaning o'zida, server soati bilan tekshiriladi:
 * tugma ko'rinib tursa ham, muddat o'tgan bo'lsa javob rad etiladi.
 */
export async function submitAssignment(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireStudent();

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Couldn’t send your answer. Refresh the page and try again." };
  }
  const { assignmentId, text, imagePaths } = parsed.data;

  // Rasm yo'llari faqat shu o'quvchining shu vazifa papkasida bo'lishi kerak
  // (baza ham buni qayta tekshiradi).
  const prefix = `${profile.id}/${assignmentId}/`;
  const validPath = /^[a-z0-9-]+\.(jpg|png|webp|heic)$/;
  if (!imagePaths.every((p) => p.startsWith(prefix) && validPath.test(p.slice(prefix.length)))) {
    return { ok: false, error: DB_ERRORS.INVALID_IMAGE_PATH };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_assignment", {
    p_assignment_id: assignmentId,
    p_text: text,
    p_image_paths: imagePaths,
  });

  if (error) {
    return {
      ok: false,
      error: dbErrorMessage(error.message, "Couldn’t save your answer. Please try again."),
    };
  }

  // Javob saqlandi. AI tekshiruvi javob qaytarilgandan KEYIN, fonda boshlanadi —
  // o'quvchi kutib qolmaydi, natijani sahifa o'zi so'rab turadi.
  after(() => runAiQueue());

  refresh();
  return { ok: true };
}

/**
 * Vazifa sahifasi AI tekshiruvi tugaganini bilish uchun har bir necha soniyada chaqiradi.
 * Javob hali navbatda bo'lsa, navbatni yana turtib qo'yadi (oldingi urinish vaqtga sig'magan bo'lishi mumkin).
 */
export async function getAiStatus(
  assignmentId: string,
): Promise<"pending" | "done" | "error" | "none"> {
  await requireStudent();
  if (!z.uuid().safeParse(assignmentId).success) return "none";

  const supabase = await createClient();
  const { data } = await supabase
    .from("student_submissions")
    .select("ai_status")
    .eq("assignment_id", assignmentId)
    .maybeSingle();
  if (!data) return "none";

  if (data.ai_status === "pending") after(() => runAiQueue());
  return data.ai_status as "pending" | "done" | "error";
}
