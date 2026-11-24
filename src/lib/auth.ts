import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { REQUIRE_PASSWORD_CHANGE } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, homeFor, type Role } from "@/lib/routes";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
  /** O'quvchining kursi (o'qituvchida yoki biriktirilmagan bo'lsa null). */
  courseName: string | null;
  /** Asosiy o‘qituvchi (Maftuna): pul, narx, sozlamalar, o‘qituvchilar — faqat u. */
  isAdmin: boolean;
  /** O'quvchi yoshi (ro'yxatdan o'tishda kiritiladi; bo'lmasa null). */
  age: number | null;
};

/**
 * Joriy foydalanuvchi profili. Proxy'dagi tekshiruvga qo'shimcha ravishda
 * har bir sahifa va server action shu funksiya orqali o'zi ham tekshiradi.
 * Bitta so'rov davomida natija qayta ishlatiladi (cache).
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const supabase = await createClient();
  // Imzosi tekshirilgan token (proxy bilan bir xil usul; tarmoqqa odatda chiqmaydi).
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect(ROUTES.login);
  const user = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };

  const { data: profile } = await supabase
    .from("profiles")
    // Aniq bog'lanish: profiles ↔ courses o'rtasida course_enrollments ham bor (bo'lmasa so'rov noaniq bo'lib xato beradi).
    .select("full_name, role, is_active, is_admin, must_change_password, age, courses!profiles_course_id_fkey(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect(`${ROUTES.login}?xato=nofaol`);

  const course = profile.courses as { name: string } | { name: string }[] | null;
  const courseName = Array.isArray(course) ? (course[0]?.name ?? null) : (course?.name ?? null);

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role as Role,
    mustChangePassword: REQUIRE_PASSWORD_CHANGE && profile.must_change_password,
    courseName,
    isAdmin: profile.role === "teacher" && Boolean(profile.is_admin),
    age: typeof profile.age === "number" ? profile.age : null,
  };
});

async function requireRole(role: Role): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (profile.mustChangePassword) redirect(ROUTES.changePassword);
  if (profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}

export const requireTeacher = () => requireRole("teacher");
export const requireStudent = () => requireRole("student");

/** Faqat asosiy o‘qituvchi (admin). Boshqa o‘qituvchi bosh sahifaga qaytariladi. */
export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await requireTeacher();
  if (!profile.isAdmin) redirect(ROUTES.teacher);
  return profile;
}
