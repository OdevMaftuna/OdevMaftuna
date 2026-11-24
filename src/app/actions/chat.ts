"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent, requireTeacher } from "@/lib/auth";
import { stickerById } from "@/lib/stickers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Chat amallari. Yozish faqat shu yerdan (service role), har doim rol tekshirilgandan keyin.
 */

type Result = { ok: true } | { ok: false; error: string };
const clean = (s: string) => s.replace(/\s+\n/g, "\n").trim().slice(0, 2000);

/** O'quvchi: matn yoki stiker yuboradi. */
export async function sendStudentMessage(body: string, stickerId: string | null = null): Promise<Result> {
  const me = await requireStudent();
  const text = clean(body);
  if (stickerId && !stickerById(stickerId)) return { ok: false, error: "Stiker topilmadi." };
  if (!text && !stickerId) return { ok: false, error: "Xabar bo‘sh." };
  const { error } = await createAdminClient()
    .from("chat_messages")
    .insert({ student_id: me.id, sender_id: me.id, kind: stickerId ? "sticker" : "text", body: text, sticker_id: stickerId });
  if (error) return { ok: false, error: "Yuborib bo‘lmadi." };
  revalidatePath("/oquvchi/chat");
  revalidatePath("/oqituvchi/chat");
  return { ok: true };
}

/** O'quvchi: vazifani nega bajarmaganini yozadi (har vazifaga bitta sabab). */
export async function sendExcuse(assignmentId: string, body: string): Promise<Result> {
  const me = await requireStudent();
  if (!z.uuid().safeParse(assignmentId).success) return { ok: false, error: "Vazifa topilmadi." };
  const text = clean(body);
  if (text.length < 3) return { ok: false, error: "Sababini yozing." };
  // Vazifa o'quvchiga ko'rinadimi (RLS: faqat o'z kurslari va e'lon qilinganlar).
  const supabase = await createClient();
  const { data: a } = await supabase.from("assignments").select("id").eq("id", assignmentId).maybeSingle();
  if (!a) return { ok: false, error: "Vazifa topilmadi." };
  const { error } = await createAdminClient()
    .from("chat_messages")
    .insert({ student_id: me.id, sender_id: me.id, kind: "excuse", body: text, assignment_id: assignmentId });
  if (error) return { ok: false, error: error.code === "23505" ? "Bu vazifa uchun sabab allaqachon yozilgan." : "Yuborib bo‘lmadi." };
  revalidatePath("/oquvchi");
  revalidatePath("/oquvchi/chat");
  revalidatePath("/oqituvchi/chat");
  return { ok: true };
}

/** O'quvchi chatni ochdi: o'qituvchilardan kelgan xabarlar o'qildi. */
export async function markStudentRead(): Promise<void> {
  const me = await requireStudent();
  await createAdminClient()
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("student_id", me.id)
    .neq("sender_id", me.id)
    .is("read_at", null);
}

/** O'qituvchi: o'quvchiga matn yoki stiker yuboradi. */
export async function sendTeacherMessage(studentId: string, body: string, stickerId: string | null = null): Promise<Result> {
  const me = await requireTeacher();
  if (!z.uuid().safeParse(studentId).success) return { ok: false, error: "O‘quvchi topilmadi." };
  const text = clean(body);
  if (stickerId && !stickerById(stickerId)) return { ok: false, error: "Stiker topilmadi." };
  if (!text && !stickerId) return { ok: false, error: "Xabar bo‘sh." };
  const admin = createAdminClient();
  const { data: st } = await admin.from("profiles").select("role").eq("id", studentId).maybeSingle();
  if (st?.role !== "student") return { ok: false, error: "O‘quvchi topilmadi." };
  const { error } = await admin
    .from("chat_messages")
    .insert({ student_id: studentId, sender_id: me.id, kind: stickerId ? "sticker" : "text", body: text, sticker_id: stickerId });
  if (error) return { ok: false, error: "Yuborib bo‘lmadi." };
  revalidatePath(`/oqituvchi/chat/${studentId}`);
  revalidatePath("/oqituvchi/chat");
  return { ok: true };
}

/** O'qituvchi ipni ochdi: o'quvchidan kelgan xabarlar o'qildi. */
export async function markTeacherRead(studentId: string): Promise<void> {
  await requireTeacher();
  if (!z.uuid().safeParse(studentId).success) return;
  await createAdminClient()
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("sender_id", studentId)
    .is("read_at", null);
}
