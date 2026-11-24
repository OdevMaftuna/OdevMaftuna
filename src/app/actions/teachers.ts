"use server";

import { refresh } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueMessages, studentSchema } from "@/lib/validation";

/**
 * Yangi o'qituvchi qo'shish. Faqat o'qituvchi bajara oladi.
 * Yangi o'qituvchi barcha kurslar, o'quvchilar va vazifalarni ko'radi va boshqaradi.
 */
export type TeacherFormState = {
  error?: string;
  values?: { full_name: string; email: string };
  created?: { full_name: string; email: string; password: string };
} | null;

export async function createTeacher(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  const values = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  // Ism va e-pochta qoidalari o'quvchinikidek.
  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) return { error: issueMessages(parsed.error).join(". "), values };

  const admin = createAdminClient();
  const password = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (error || !data.user) {
    return {
      error: error?.code === "email_exists" ? "Bu e-pochta allaqachon ro‘yxatda." : "Hisob yaratib bo‘lmadi.",
      values,
    };
  }

  // Profil trigger orqali "student" bo'lib yaratiladi — o'qituvchiga aylantiramiz.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "teacher", course_id: null, full_name: parsed.data.full_name })
    .eq("id", data.user.id);
  if (roleError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "O‘qituvchi huquqini berib bo‘lmadi.", values };
  }

  refresh();
  return { created: { full_name: parsed.data.full_name, email: parsed.data.email, password } };
}

/** Asosiy o'qituvchi: boshqa o'qituvchiga yangi vaqtinchalik parol beradi. */
export async function resetTeacherPassword(teacherId: string): Promise<{ error?: string; password?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  if (teacherId === me.id) return { error: "O‘z parolingizni “Parol” sahifasida almashtiring." };
  const admin = createAdminClient();
  const { data: t } = await admin.from("profiles").select("role").eq("id", teacherId).maybeSingle();
  if (t?.role !== "teacher") return { error: "O‘qituvchi topilmadi." };
  const password = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(teacherId, { password });
  if (error) return { error: "Parolni tiklab bo‘lmadi." };
  return { password };
}

/**
 * SUPPORT HUQUQI: o'qituvchiga butun guruh natijalarini (Support markazi) ko'rish huquqini berish yoki olish.
 * Faqat asosiy o'qituvchi. Huquq Auth app_metadata'da saqlanadi (o'qituvchi o'zi o'zgartira olmaydi).
 */
export async function setTeacherSupport(teacherId: string, on: boolean): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi uchun." };
  const admin = createAdminClient();
  const { data: t } = await admin.from("profiles").select("role").eq("id", teacherId).maybeSingle();
  if (t?.role !== "teacher") return { error: "O‘qituvchi topilmadi." };
  const { data: u, error: getErr } = await admin.auth.admin.getUserById(teacherId);
  if (getErr || !u.user) return { error: "O‘qituvchi hisobi topilmadi." };
  const { error } = await admin.auth.admin.updateUserById(teacherId, { app_metadata: { ...(u.user.app_metadata ?? {}), support: on } });
  if (error) return { error: "Saqlab bo‘lmadi. Qayta urinib ko‘ring." };
  refresh();
  return {};
}
