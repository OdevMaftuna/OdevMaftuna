"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_BULK_STUDENTS,
  issueMessages,
  studentSchema,
  type StudentInput,
} from "@/lib/validation";

/**
 * Bu fayldagi hamma amal avval requireTeacher() dan o'tadi,
 * shundan keyingina service role (admin) client ishlatiladi.
 */

type AdminClient = ReturnType<typeof createAdminClient>;

export type CreatedStudent = {
  full_name: string;
  email: string;
  /** Vaqtinchalik parol — faqat shu javobda qaytadi, hech qayerda saqlanmaydi. */
  password?: string;
  error?: string;
};

export type StudentFormState = {
  error?: string;
  values?: { full_name: string; email: string; course_id: string; teacher_id: string };
  created?: CreatedStudent;
} | null;

// Amalda cheksiz: hisob qayta faollashtirilmaguncha kira olmaydi.
const BAN_FOREVER = "876000h";

/** Kurs id'si to'g'ri va bazada borligini tekshiradi. */
async function courseExists(courseId: string): Promise<boolean> {
  if (!z.uuid().safeParse(courseId).success) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id").eq("id", courseId).maybeSingle();
  return Boolean(data);
}

/** O'qituvchi id'si to'g'ri va u haqiqatan o'qituvchimi. Bo'sh = guruhsiz. */
async function teacherOk(teacherId: string): Promise<boolean> {
  if (teacherId === "") return true;
  if (!z.uuid().safeParse(teacherId).success) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", teacherId).maybeSingle();
  return data?.role === "teacher";
}

async function createOne(
  admin: AdminClient,
  input: StudentInput,
  courseId: string,
  teacherId: string,
): Promise<CreatedStudent> {
  const password = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error) {
    return {
      ...input,
      error:
        error.code === "email_exists"
          ? "Bu e-pochta allaqachon ro‘yxatda"
          : "Hisob yaratib bo‘lmadi",
    };
  }
  // Profil trigger orqali yaratiladi; kursni shu yerda biriktiramiz.
  const { error: courseError } = await admin
    .from("profiles")
    .update({ course_id: courseId, teacher_id: teacherId || null })
    .eq("id", data.user.id);
  if (courseError) {
    return { ...input, password, error: "Hisob ochildi, lekin kurs biriktirilmadi" };
  }
  return { ...input, password };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const me = await requireTeacher();

  const values = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    course_id: String(formData.get("course_id") ?? ""),
    // Oddiy o'qituvchi qo'shgan o'quvchi doim o'z guruhiga tushadi.
    teacher_id: me.isAdmin ? String(formData.get("teacher_id") ?? "") : me.id,
  };
  if (!(await teacherOk(values.teacher_id))) {
    return { error: "O‘qituvchini tanlang.", values };
  }
  if (!(await courseExists(values.course_id))) {
    return { error: "Kursni tanlang.", values };
  }
  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: issueMessages(parsed.error).join(". "), values };
  }

  const created = await createOne(createAdminClient(), parsed.data, values.course_id, values.teacher_id);
  if (created.error && !created.password) return { error: `${created.error}.`, values };

  refresh();
  return { created };
}

export async function bulkCreateStudents(
  courseId: string,
  rows: unknown,
  teacherIdRaw = "",
): Promise<{ ok: true; results: CreatedStudent[] } | { ok: false; error: string }> {
  const me = await requireTeacher();
  const teacherId = me.isAdmin ? teacherIdRaw : me.id;
  if (!(await teacherOk(teacherId))) {
    return { ok: false, error: "O‘qituvchini tanlang." };
  }
  if (!(await courseExists(courseId))) {
    return { ok: false, error: "Kursni tanlang." };
  }

  const parsed = z
    .array(studentSchema)
    .min(1, "Qo‘shish uchun qator yo‘q")
    .max(MAX_BULK_STUDENTS, `Bir martada ${MAX_BULK_STUDENTS} tadan ko‘p o‘quvchi qo‘shib bo‘lmaydi`)
    .safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: issueMessages(parsed.error).slice(0, 3).join(". ") };
  }

  const admin = createAdminClient();
  const results: CreatedStudent[] = [];
  // Ketma-ket: Supabase auth cheklovlariga (rate limit) urilmaslik uchun.
  for (const input of parsed.data) {
    results.push(await createOne(admin, input, courseId, teacherId));
  }

  refresh();
  return { ok: true, results };
}

/**
 * Oddiy o'qituvchi faqat o'z guruhidagi yoki guruhsiz o'quvchini boshqaradi; admin — hammasini.
 */
async function canManage(me: { id: string; isAdmin: boolean }, studentId: string): Promise<boolean> {
  if (me.isAdmin) return true;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("teacher_id").eq("id", studentId).maybeSingle();
  return !data?.teacher_id || data.teacher_id === me.id;
}

const NOT_YOURS = "Bu o‘quvchi boshqa o‘qituvchining guruhida.";

/** Amal faqat o'quvchi hisobiga qo'llanishini tekshiradi (o'qituvchiga emas). */
async function isStudent(id: string): Promise<boolean> {
  if (!z.uuid().safeParse(id).success) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  return data?.role === "student";
}

export async function setStudentActive(
  id: string,
  active: boolean,
): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  if (!(await isStudent(id))) return { error: "O‘quvchi topilmadi." };

  // 1) Auth darajasida: nofaol hisob umuman kira olmaydi.
  const { error: banError } = await createAdminClient().auth.admin.updateUserById(id, {
    ban_duration: active ? "none" : BAN_FOREVER,
    // Faollashtirish o'zi tasdiqlash hisoblanadi.
    ...(active ? { app_metadata: { pending_approval: false } } : {}),
  });
  if (banError) return { error: "Holatni o‘zgartirib bo‘lmadi." };

  // 2) Profil darajasida: ochiq sessiyasi bo'lsa ham RLS va proxy uni to'xtatadi.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", id);
  if (error) return { error: "Holatni o‘zgartirib bo‘lmadi." };

  refresh();
  return {};
}

export async function resetStudentPassword(
  id: string,
): Promise<{ error?: string; password?: string }> {
  const me = await requireTeacher();
  if (!(await isStudent(id))) return { error: "O‘quvchi topilmadi." };
  if (!(await canManage(me, id))) return { error: NOT_YOURS };

  const password = generateTempPassword();
  const { error: authError } = await createAdminClient().auth.admin.updateUserById(id, {
    password,
  });
  if (authError) return { error: "Parolni tiklab bo‘lmadi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", id);
  if (error) return { error: "Parol o‘zgardi, lekin holatni saqlab bo‘lmadi." };

  refresh();
  return { password };
}

/** O'quvchini boshqa kursga o'tkazish (yoki kursdan chiqarish: courseId = ""). */
export async function setStudentCourse(
  id: string,
  courseId: string,
): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await isStudent(id))) return { error: "O‘quvchi topilmadi." };
  if (!(await canManage(me, id))) return { error: NOT_YOURS };
  if (courseId !== "" && !(await courseExists(courseId))) return { error: "Kurs topilmadi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ course_id: courseId === "" ? null : courseId })
    .eq("id", id);
  if (error) return { error: "Kursni o‘zgartirib bo‘lmadi." };

  refresh();
  return {};
}

/** O'quvchini boshqa o'qituvchining guruhiga o'tkazish (teacherId = "" — guruhsiz). */
export async function setStudentTeacher(
  id: string,
  teacherId: string,
): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await isStudent(id))) return { error: "O‘quvchi topilmadi." };
  if (!(await canManage(me, id))) return { error: NOT_YOURS };
  // Oddiy o'qituvchi: o'quvchini faqat o'z guruhiga oladi yoki guruhsiz qiladi.
  if (!me.isAdmin && teacherId !== "" && teacherId !== me.id) return { error: "Boshqa o‘qituvchiga faqat asosiy o‘qituvchi o‘tkaza oladi." };
  if (!(await teacherOk(teacherId))) return { error: "O‘qituvchi topilmadi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ teacher_id: teacherId === "" ? null : teacherId })
    .eq("id", id);
  if (error) return { error: "O‘qituvchini o‘zgartirib bo‘lmadi." };

  refresh();
  return {};
}

/**
 * O'zi ro'yxatdan o'tgan o'quvchini tasdiqlash: auth blokini olib tashlaydi va profilni faollashtiradi.
 * Har qanday o'qituvchi o'z guruhidagi yoki guruhsiz o'quvchini tasdiqlay oladi; admin — hammasini.
 */
export async function approveStudent(id: string): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await isStudent(id))) return { error: "O‘quvchi topilmadi." };
  if (!(await canManage(me, id))) return { error: NOT_YOURS };

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  if (authUser?.user?.app_metadata?.pending_approval !== true) {
    return { error: "Bu o‘quvchi tasdiq kutmayapti." };
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "none",
    app_metadata: { pending_approval: false },
  });
  if (authError) return { error: "Tasdiqlab bo‘lmadi." };

  // Ruxsat yuqorida tekshirildi; oddiy o'qituvchida is_active'ni o'zgartirish RLS'da yopiq bo'lishi mumkin.
  const { error } = await admin.from("profiles").update({ is_active: true }).eq("id", id);
  if (error) return { error: "Tasdiqlab bo‘lmadi." };

  refresh();
  return {};
}
