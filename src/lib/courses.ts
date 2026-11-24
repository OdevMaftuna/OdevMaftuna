import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** is_hidden — o‘quvchilar ro‘yxatida ko‘rinmaydi (masalan, Kids): faqat kirish huquqi borlarga. */
export type Course = { id: string; name: string; sort_order: number; is_hidden: boolean };

/** Kurslar ro'yxati (tartib bo'yicha). Bitta so'rov davomida bir marta o'qiladi. */
export const loadCourses = cache(async (): Promise<Course[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, name, sort_order, is_hidden")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Course[];
});

/**
 * URL'dagi `?kurs=` qiymatidan tanlangan kursni topadi.
 * Noto'g'ri yoki bo'sh bo'lsa — null ("Hammasi").
 */
export function pickCourse(courses: Course[], value: string | string[] | undefined): Course | null {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !z.uuid().safeParse(id).success) return null;
  return courses.find((c) => c.id === id) ?? null;
}
