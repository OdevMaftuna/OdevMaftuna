import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Boshqa (qo‘shimcha) kursni ochish narxi, so‘m. */
export const COURSE_ACCESS_PRICE = 40_000;

export type RequestStatus = "pending" | "approved" | "rejected";

/** O'quvchining kurslari: asosiy, qo'shimcha (ruxsat berilgan) va har bir kurs bo'yicha oxirgi so'rov holati. */
export async function loadMyCourseAccess(userId: string): Promise<{
  primary: string | null;
  extra: string[];
  all: string[];
  lastRequest: Map<string, { status: RequestStatus; created_at: string }>;
}> {
  const supabase = await createClient();
  const [{ data: me }, { data: enrollments }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("course_id").eq("id", userId).maybeSingle(),
    supabase.from("course_enrollments").select("course_id").eq("student_id", userId),
    supabase.from("course_requests").select("course_id, status, created_at").eq("student_id", userId).order("created_at", { ascending: false }),
  ]);
  const primary = (me?.course_id as string | null) ?? null;
  const extra = (enrollments ?? []).map((e) => e.course_id as string).filter((c) => c !== primary);
  const lastRequest = new Map<string, { status: RequestStatus; created_at: string }>();
  for (const r of requests ?? []) {
    if (!lastRequest.has(r.course_id as string)) lastRequest.set(r.course_id as string, { status: r.status as RequestStatus, created_at: r.created_at as string });
  }
  return { primary, extra, all: [...(primary ? [primary] : []), ...extra], lastRequest };
}

/** O'quvchi shu kursga kira oladimi (asosiy yoki to'langan qo'shimcha kurs). */
export async function hasCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const access = await loadMyCourseAccess(userId);
  return access.all.includes(courseId);
}
