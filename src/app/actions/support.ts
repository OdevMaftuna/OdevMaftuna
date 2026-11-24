"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionKind } from "@/lib/support-kinds";

/**
 * SUPPORT HARAKATLARI: support o'quvchi bilan qilgan ishini belgilaydi (jurnal) — asosiy o'qituvchi shuni ko'radi.
 * "Eslatma" — o'quvchining chatiga xabar ham yuboradi.
 */

const uuid = z.uuid();
const KINDS = ["remind", "call", "explain", "retake", "note"] as const;

/** Guruhga mas'ul supportmi (yoki asosiy o'qituvchi). */
async function canActOn(me: { id: string; isAdmin: boolean }, groupId: string): Promise<boolean> {
  if (me.isAdmin) return true;
  const { data } = await createAdminClient().from("class_groups").select("support_id, teacher_id").eq("id", groupId).maybeSingle();
  return data?.support_id === me.id || data?.teacher_id === me.id;
}

export async function logSupportAction(input: {
  groupId: string;
  studentId: string | null;
  memberId?: string | null;
  kind: ActionKind;
  note?: string;
  /** Eslatma uchun: vazifa nomi va qolgan vaqt (xabar matniga qo'yiladi). */
  taskTitle?: string | null;
}): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!uuid.safeParse(input.groupId).success || !KINDS.includes(input.kind)) return { error: "Noto‘g‘ri so‘rov." };
  if (input.studentId && !uuid.safeParse(input.studentId).success) return { error: "Noto‘g‘ri so‘rov." };
  if (input.memberId && !uuid.safeParse(input.memberId).success) return { error: "Noto‘g‘ri so‘rov." };
  if (!(await canActOn(me, input.groupId))) return { error: "Bu guruh sizga biriktirilmagan." };
  const admin = createAdminClient();
  const note = (input.note ?? "").trim().slice(0, 300);

  if (input.kind === "remind") {
    if (!input.studentId) return { error: "Bu o‘quvchining saytda hisobi yo‘q — telefon qiling." };
    const title = (input.taskTitle ?? "").trim().slice(0, 120);
    const body = title
      ? `⏰ Eslatma: “${title}” vazifasini hali topshirmagansiz. Bugun albatta bajaring — Homework bo‘limi 📋. Qiyin bo‘lsa, menga yozing, tushuntirib beraman 🙂`
      : "⏰ Eslatma: bugungi vazifangizni hali topshirmagansiz. Bugun albatta bajaring — Homework bo‘limi 📋";
    const { error } = await admin.from("chat_messages").insert({ student_id: input.studentId, sender_id: me.id, kind: "text", body });
    if (error) return { error: "Xabarni yuborib bo‘lmadi." };
  }

  const { error } = await admin.from("support_actions").insert({
    support_id: me.id,
    group_id: input.groupId,
    student_id: input.studentId,
    member_id: input.memberId ?? null,
    kind: input.kind,
    note,
  });
  if (error) return { error: "Saqlab bo‘lmadi." };
  refresh();
  return {};
}

/** Guruhga mas'ul support biriktirish — faqat asosiy o'qituvchi. */
export async function setGroupSupport(groupId: string, supportId: string | null): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi uchun." };
  if (!uuid.safeParse(groupId).success || (supportId && !uuid.safeParse(supportId).success)) return { error: "Noto‘g‘ri so‘rov." };
  const admin = createAdminClient();
  if (supportId) {
    const { data: t } = await admin.from("profiles").select("role").eq("id", supportId).maybeSingle();
    if (t?.role !== "teacher") return { error: "O‘qituvchi topilmadi." };
  }
  const { error } = await admin.from("class_groups").update({ support_id: supportId }).eq("id", groupId);
  if (error) return { error: "Saqlab bo‘lmadi." };
  refresh();
  return {};
}
