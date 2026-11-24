"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireStudent, requireTeacher } from "@/lib/auth";
import { COURSE_ACCESS_PRICE } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * BOSHQA KURSGA QATNASHISH: o'quvchi so'raydi, o'qituvchi tasdiqlaydi yoki rad etadi.
 * Tasdiqlanganda course_enrollments ga yoziladi — o'quvchi o'sha kursning uy vazifalarini ko'radi va topshiradi.
 */

export async function requestCourseAccess(
  courseId: string,
  message: string,
  receiptPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireStudent();
  if (!z.uuid().safeParse(courseId).success) return { ok: false, error: "Course not found." };
  if (!receiptPath.startsWith(`${profile.id}/`) || receiptPath.length > 300) return { ok: false, error: "Please upload the receipt again." };
  const text = message.trim().slice(0, 500);

  const supabase = await createClient();
  const [{ data: course }, { data: me }, { data: enrolled }] = await Promise.all([
    supabase.from("courses").select("id").eq("id", courseId).maybeSingle(),
    supabase.from("profiles").select("course_id").eq("id", profile.id).maybeSingle(),
    supabase.from("course_enrollments").select("course_id").eq("student_id", profile.id).eq("course_id", courseId).maybeSingle(),
  ]);
  if (!course) return { ok: false, error: "Course not found." };
  if (me?.course_id === courseId || enrolled) return { ok: false, error: "You are already in this course." };

  const { error } = await supabase.from("course_requests").insert({ student_id: profile.id, course_id: courseId, message: text, amount: COURSE_ACCESS_PRICE, receipt_path: receiptPath });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Your payment was already sent — wait for your teacher to confirm." : "Couldn’t send the request. Please try again.",
    };
  }
  refresh();
  return { ok: true };
}

export async function decideCourseRequest(requestId: string, approve: boolean): Promise<{ error?: string }> {
  const teacher = await requireTeacher();
  if (!teacher.isAdmin) return { error: "To‘lovni faqat asosiy o‘qituvchi (Maftuna Ismoilova) tasdiqlaydi." };
  if (!z.uuid().safeParse(requestId).success) return { error: "So‘rov topilmadi." };
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("course_requests")
    .select("id, student_id, course_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.status !== "pending") return { error: "So‘rov topilmadi yoki allaqachon hal qilingan." };

  if (approve) {
    const { error } = await supabase
      .from("course_enrollments")
      .upsert({ student_id: req.student_id, course_id: req.course_id }, { onConflict: "student_id,course_id" });
    if (error) return { error: "Ruxsat berib bo‘lmadi." };
  }
  const { error } = await supabase
    .from("course_requests")
    .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString(), decided_by: teacher.id })
    .eq("id", requestId);
  if (error) return { error: "So‘rovni yangilab bo‘lmadi." };
  refresh();
  return {};
}

/** Qo'shimcha kursdan chiqarish (o'quvchining topshirgan javoblari o'chmaydi). */
export async function removeEnrollment(studentId: string, courseId: string): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!z.uuid().safeParse(studentId).success || !z.uuid().safeParse(courseId).success) return { error: "Topilmadi." };
  const supabase = createAdminClient();
  if (!me.isAdmin) {
    const { data: st } = await supabase.from("profiles").select("teacher_id").eq("id", studentId).maybeSingle();
    if (st?.teacher_id && st.teacher_id !== me.id) return { error: "Bu o‘quvchi boshqa o‘qituvchining guruhida." };
  }
  const { error } = await supabase.from("course_enrollments").delete().eq("student_id", studentId).eq("course_id", courseId);
  if (error) return { error: "Kursdan chiqarib bo‘lmadi." };
  refresh();
  return {};
}

/**
 * O'qituvchi o'quvchiga qo'shimcha kursni BEPUL ochadi (to'lovsiz o'tkazish — faqat o'qituvchi huquqi).
 * Oddiy o'qituvchi — faqat o'z guruhidagi yoki guruhsiz o'quvchiga; admin — hammaga.
 */
export async function grantCourseFree(studentId: string, courseId: string): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireTeacher();
  if (!z.uuid().safeParse(studentId).success || !z.uuid().safeParse(courseId).success) return { error: "O‘quvchi yoki kursni tanlang." };
  const admin = createAdminClient();
  const [{ data: st }, { data: course }] = await Promise.all([
    admin.from("profiles").select("role, teacher_id, course_id").eq("id", studentId).maybeSingle(),
    admin.from("courses").select("id").eq("id", courseId).maybeSingle(),
  ]);
  if (!st || st.role !== "student" || !course) return { error: "Topilmadi." };
  if (!me.isAdmin && st.teacher_id && st.teacher_id !== me.id) return { error: "Bu o‘quvchi boshqa o‘qituvchining guruhida." };
  if (st.course_id === courseId) return { error: "Bu uning asosiy kursi." };
  const { error } = await admin.from("course_enrollments").upsert({ student_id: studentId, course_id: courseId }, { onConflict: "student_id,course_id" });
  if (error) return { error: "Ochib bo‘lmadi." };
  // Kutilayotgan pullik so'rov bo'lsa — yopiladi (endi kerak emas).
  await admin
    .from("course_requests")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: me.id })
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .eq("status", "pending");
  refresh();
  return { ok: true };
}
