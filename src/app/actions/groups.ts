"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireStudent, requireTeacher } from "@/lib/auth";
import { linkStudentByPhone, normPhone, syncGroupCourses } from "@/lib/groups";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupportTeacher } from "@/lib/support";
import type { CurrentProfile } from "@/lib/auth";

/**
 * GURUHLAR: yaratish (faqat asosiy o'qituvchi), a'zo qo'shish — ism + telefon (o'qituvchi taklif qiladi → asosiy
 * o'qituvchi tasdiqlaydi), hisob bilan bog'lash, offline checklist belgilari (istalgan o'qituvchi) va joriy unit.
 */

const uuid = z.uuid();
const ADMIN_ONLY = "Bu amal faqat asosiy o‘qituvchi uchun.";
const MANAGERS_ONLY = "Bu amal asosiy o‘qituvchi va support o‘qituvchi uchun.";

/** Guruh a'zolarini boshqara oladimi: asosiy o'qituvchi yoki "Support" huquqli o'qituvchi. */
async function canManage(me: CurrentProfile): Promise<boolean> {
  return me.isAdmin || (await isSupportTeacher(me.id));
}

const isoDate = z.iso.date();

/** Kursda hali asosiy jadval sanasi bo'lmasa (vazifa yo'q edi) — birinchi guruh sanasi asos bo'ladi. */
async function ensureScheduleStart(courseId: string, date: string) {
  await createAdminClient().from("courses").update({ schedule_start: date }).eq("id", courseId).is("schedule_start", null);
}

/**
 * Guruh boshlanish sanasi — faqat asosiy o'qituvchi. Vazifa muddatlari shu sanadan hisoblanadi:
 * guruh kursning asosiy jadvalidan necha kun keyin boshlansa, barcha sanalar shuncha kunga suriladi.
 */
export async function setGroupStart(groupId: string, date: string | null): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: ADMIN_ONLY };
  if (!uuid.safeParse(groupId).success || (date && !isoDate.safeParse(date).success)) return { error: "Noto‘g‘ri sana." };
  const admin = createAdminClient();
  const { data: g } = await admin.from("class_groups").select("course_id").eq("id", groupId).maybeSingle();
  if (!g) return { error: "Guruh topilmadi." };
  if (date && g.course_id) {
    await ensureScheduleStart(g.course_id as string, date);
    const { data: c } = await admin.from("courses").select("schedule_start").eq("id", g.course_id).maybeSingle();
    const base = (c?.schedule_start as string | null) ?? null;
    if (base && date < base) return { error: `Sana kursning asosiy jadvalidan (${base}) oldin bo‘lishi mumkin emas.` };
  }
  const { error } = await admin.from("class_groups").update({ start_date: date }).eq("id", groupId);
  if (error) return { error: "Saqlab bo‘lmadi." };
  refresh();
  return {};
}

export async function createGroup(input: { name: string; courseId: string | null; teacherId: string | null; schedule: string; units: string; startDate?: string | null }): Promise<{ error?: string; id?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: ADMIN_ONLY };
  const name = input.name.trim().slice(0, 80);
  if (!name) return { error: "Guruh nomini yozing." };
  const units = input.units.split(/[,\s]+/).map((u) => u.trim()).filter(Boolean).slice(0, 30).map((u) => u.slice(0, 8));
  if (!units.length) return { error: "Unitlarni yozing (masalan: I 1 2 3)." };
  const courseId = input.courseId && uuid.safeParse(input.courseId).success ? input.courseId : null;
  const startDate = input.startDate && isoDate.safeParse(input.startDate).success ? input.startDate : null;
  if (courseId && startDate) await ensureScheduleStart(courseId, startDate);
  const { data, error } = await createAdminClient()
    .from("class_groups")
    .insert({
      name,
      start_date: startDate,
      course_id: courseId,
      teacher_id: input.teacherId && uuid.safeParse(input.teacherId).success ? input.teacherId : null,
      schedule: input.schedule.trim().slice(0, 80),
      units,
    })
    .select("id")
    .single();
  if (error) return { error: "Guruhni saqlab bo‘lmadi." };
  refresh();
  return { id: data.id as string };
}

/** Guruh ma'lumotlarini tahrirlash (nomi, vaqti, o'qituvchisi) — faqat asosiy o'qituvchi. */
export async function updateGroup(groupId: string, input: { name: string; schedule: string; teacherId: string | null }): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: ADMIN_ONLY };
  if (!uuid.safeParse(groupId).success || !input.name.trim()) return { error: "Noto‘g‘ri ma’lumot." };
  const { error } = await createAdminClient()
    .from("class_groups")
    .update({ name: input.name.trim().slice(0, 80), schedule: input.schedule.trim().slice(0, 80), teacher_id: input.teacherId && uuid.safeParse(input.teacherId).success ? input.teacherId : null })
    .eq("id", groupId);
  if (error) return { error: "Saqlab bo‘lmadi." };
  refresh();
  return {};
}

/**
 * O'quvchi qo'shish: ism + telefon (saytdagi hisob ixtiyoriy). Asosiy o'qituvchi — darhol; boshqa o'qituvchi — tasdiq kutadi.
 * Telefon bo'yicha saytda hisob topilsa — avtomatik bog'lanadi.
 */
export async function addMember(groupId: string, input: { fullName: string; phone: string; studentId?: string | null }): Promise<{ error?: string; id?: string; status?: "pending" | "approved"; studentId?: string | null }> {
  const me = await requireTeacher();
  if (!uuid.safeParse(groupId).success) return { error: "Noto‘g‘ri so‘rov." };
  const fullName = input.fullName.trim().replace(/\s+/g, " ").slice(0, 120);
  if (fullName.length < 2) return { error: "Ism familiyani yozing." };
  const phone = input.phone.trim() ? normPhone(input.phone) : null;
  if (input.phone.trim() && !phone) return { error: "Telefon raqami noto‘g‘ri (masalan: +998 90 123 45 67)." };
  const admin = createAdminClient();
  let studentId = input.studentId && uuid.safeParse(input.studentId).success ? input.studentId : null;
  if (!studentId && phone) {
    const { data: byPhone } = await admin.from("profiles").select("id").eq("role", "student").eq("phone", phone).limit(1).maybeSingle();
    studentId = (byPhone?.id as string | undefined) ?? null;
  }
  const manager = await canManage(me);
  const status = manager ? "approved" : "pending";
  const now = new Date().toISOString();
  // Ilgari ketgan o'quvchi qaytsa — eski qator (belgilari bilan) tiklanadi.
  if (phone) {
    const { data: old } = await admin.from("group_members").select("id, status").eq("group_id", groupId).eq("phone", phone).maybeSingle();
    if (old?.status === "left") {
      await admin.from("group_members").update({ status, full_name: fullName, left_at: null, left_by: null, created_at: now, added_by: me.id, ...(manager ? { decided_by: me.id, decided_at: now } : {}) }).eq("id", old.id);
      refresh();
      return { id: old.id as string, status, studentId };
    }
  }
  const { data, error } = await admin
    .from("group_members")
    .insert({ group_id: groupId, full_name: fullName, phone, student_id: studentId, status, added_by: me.id, ...(manager ? { decided_by: me.id, decided_at: now } : {}) })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Bu o‘quvchi (yoki telefon) guruhda allaqachon bor." : "Qo‘shib bo‘lmadi." };
  if (studentId && status === "approved") await syncGroupCourses(studentId);
  refresh();
  return { id: data.id as string, status, studentId };
}

/** Asosiy o'qituvchi: so'rovni tasdiqlash yoki rad etish (rad = ro'yxatdan olib tashlash). */
export async function decideMember(memberId: string, approve: boolean): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await canManage(me))) return { error: MANAGERS_ONLY };
  if (!uuid.safeParse(memberId).success) return { error: "Noto‘g‘ri so‘rov." };
  const admin = createAdminClient();
  const { error } = approve
    ? await admin.from("group_members").update({ status: "approved", decided_by: me.id, decided_at: new Date().toISOString() }).eq("id", memberId)
    : await admin.from("group_members").delete().eq("id", memberId);
  if (error) return { error: "Saqlab bo‘lmadi." };
  if (approve) {
    const { data: m } = await admin.from("group_members").select("student_id").eq("id", memberId).maybeSingle();
    if (m?.student_id) await syncGroupCourses(m.student_id as string);
  }
  refresh();
  return {};
}

/** Guruhdan chiqarish (o'quvchi ketdi) — asosiy va support o'qituvchi. O'chirilmaydi: "ketgan" bo'lib tarixda qoladi. */
export async function removeMember(memberId: string): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await canManage(me))) return { error: MANAGERS_ONLY };
  if (!uuid.safeParse(memberId).success) return { error: "Noto‘g‘ri so‘rov." };
  const { error } = await createAdminClient().from("group_members").update({ status: "left", left_at: new Date().toISOString(), left_by: me.id }).eq("id", memberId);
  if (error) return { error: "Chiqarib bo‘lmadi." };
  refresh();
  return {};
}

/** Ketgan o'quvchini guruhga qaytarish — asosiy va support o'qituvchi. */
export async function restoreMember(memberId: string): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await canManage(me))) return { error: MANAGERS_ONLY };
  if (!uuid.safeParse(memberId).success) return { error: "Noto‘g‘ri so‘rov." };
  const now = new Date().toISOString();
  const { data: m, error } = await createAdminClient().from("group_members").update({ status: "approved", left_at: null, left_by: null, decided_by: me.id, decided_at: now }).eq("id", memberId).select("student_id").maybeSingle();
  if (error) return { error: "Qaytarib bo‘lmadi." };
  if (m?.student_id) await syncGroupCourses(m.student_id as string);
  refresh();
  return {};
}

/** Ro'yxatdagi o'quvchini saytdagi hisob bilan bog'lash yoki ajratish — asosiy o'qituvchi. */
export async function linkMember(memberId: string, studentId: string | null): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!(await canManage(me))) return { error: MANAGERS_ONLY };
  if (!uuid.safeParse(memberId).success || (studentId && !uuid.safeParse(studentId).success)) return { error: "Noto‘g‘ri so‘rov." };
  const admin = createAdminClient();
  const { data: row, error } = await admin.from("group_members").update({ student_id: studentId }).eq("id", memberId).select("phone").single();
  if (error) return { error: error.code === "23505" ? "Bu hisob shu guruhda boshqa qatorga bog‘langan." : "Bog‘lab bo‘lmadi." };
  // Hisobga telefon yozilmagan bo'lsa — ro'yxatdagi telefon qo'yiladi.
  if (studentId && row?.phone) await admin.from("profiles").update({ phone: row.phone }).eq("id", studentId).is("phone", null);
  if (studentId) await syncGroupCourses(studentId);
  refresh();
  return {};
}

/** Offline ish belgisi (mavzu / lug'at) — istalgan o'qituvchi qo'yadi yoki olib tashlaydi. */
export async function setCheck(memberId: string, kind: "topic" | "vocab", unit: string, done: boolean): Promise<{ ok: boolean }> {
  const me = await requireTeacher();
  if (!uuid.safeParse(memberId).success || (kind !== "topic" && kind !== "vocab")) return { ok: false };
  const admin = createAdminClient();
  const { data: m } = await admin.from("group_members").select("status, class_groups(units)").eq("id", memberId).maybeSingle();
  const units = (m?.class_groups as unknown as { units: string[] } | null)?.units ?? [];
  if (m?.status !== "approved" || !units.includes(unit)) return { ok: false };
  const { error } = done
    ? await admin.from("group_checks").upsert({ member_id: memberId, kind, unit, marked_by: me.id, marked_at: new Date().toISOString() }, { onConflict: "member_id,kind,unit" })
    : await admin.from("group_checks").delete().eq("member_id", memberId).eq("kind", kind).eq("unit", unit);
  return { ok: !error };
}

/** Joriy unit (jadvalda yorqin yashil ustun) — istalgan o'qituvchi belgilaydi. */
export async function setCurrentUnit(groupId: string, unit: string | null): Promise<{ ok: boolean }> {
  await requireTeacher();
  if (!uuid.safeParse(groupId).success) return { ok: false };
  const { error } = await createAdminClient().from("class_groups").update({ current_unit: unit ? unit.slice(0, 8) : null }).eq("id", groupId);
  if (!error) refresh();
  return { ok: !error };
}

/** O'quvchi: telefon raqamini kiritib, o'z guruhini topadi (ro'yxatdagi telefon bilan bog'lanadi). */
export async function linkMyPhone(rawPhone: string): Promise<{ error?: string; linked?: number }> {
  const me = await requireStudent();
  if (!normPhone(rawPhone)) return { error: "Telefon raqamini to‘liq yozing, masalan: +998 90 123 45 67" };
  const linked = await linkStudentByPhone(me.id, rawPhone);
  refresh();
  return linked ? { linked } : { error: "Bu raqam bilan guruh topilmadi. Raqamni tekshiring yoki ustozingizga ayting." };
}

/**
 * Bajarmaganlarni ogohlantirish: guruhning bugungi vazifasini hali topshirmagan (saytda hisobi bor) o'quvchilarga
 * chat orqali eslatma yuboradi. Oxirgi 30 daqiqada eslatma olganlarga qayta yubormaydi. Asosiy va support o'qituvchi.
 */
export async function warnGroup(groupId: string): Promise<{ error?: string; sent?: number; skipped?: number }> {
  const me = await requireTeacher();
  if (!uuid.safeParse(groupId).success) return { error: "Noto‘g‘ri so‘rov." };
  const { data: grp } = await createAdminClient().from("class_groups").select("teacher_id").eq("id", groupId).maybeSingle();
  if (grp?.teacher_id !== me.id && !(await canManage(me))) return { error: "Bu guruh sizniki emas." };
  const { loadDailyHomework } = await import("@/lib/daily-homework");
  const g = (await loadDailyHomework()).find((x) => x.groupId === groupId);
  if (!g?.today) return { error: "Bu guruhda hozir ochiq vazifa yo‘q." };
  const targets = g.today.notDone.filter((p) => p.studentId);
  if (!targets.length) return { sent: 0, skipped: 0 };
  const ms = Date.parse(g.today.dueAt) - Date.now();
  const h = Math.max(0, Math.floor(ms / 3_600_000));
  const m = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));
  const left = h > 0 ? `${h} soat ${m} daqiqa` : `${m} daqiqa`;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: recent } = await admin
    .from("chat_messages")
    .select("student_id")
    .in("student_id", targets.map((t) => t.studentId!))
    .like("body", "⏰ Eslatma:%")
    .gte("created_at", since);
  const skip = new Set(((recent ?? []) as { student_id: string }[]).map((r) => r.student_id));
  const rows = targets
    .filter((t) => !skip.has(t.studentId!))
    .map((t) => ({
      student_id: t.studentId!,
      sender_id: me.id,
      kind: "text",
      body: `⏰ Eslatma: “${g.today!.title}” vazifasi muddatigacha ${left} qoldi. Siz hali topshirmagansiz — hozir bajaring: Homework bo‘limi 📋`,
    }));
  if (rows.length) {
    const { error } = await admin.from("chat_messages").insert(rows);
    if (error) return { error: "Eslatmani yuborib bo‘lmadi." };
  }
  refresh();
  return { sent: rows.length, skipped: targets.length - rows.length };
}
