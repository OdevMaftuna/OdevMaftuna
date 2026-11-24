import "server-only";
import { avatarUrl } from "@/lib/avatar";
import { currentStop, tripFor } from "@/lib/road-trips";
import { loadStreaksForTeacher } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";

/** O'qituvchi uchun: har bir faol o'quvchining seriyasi va Wanderland'dagi joyi. */
export type StudentTrip = {
  id: string;
  name: string;
  avatar: string | null;
  courseId: string | null;
  teacherId: string | null;
  count: number;
  today: boolean;
  lost: number;
  lastActive: string | null;
  tripIndex: number;
  tripTitle: string;
  inTrip: number;
  cycle: number;
  city: string;
};

export async function loadStudentTrips(): Promise<StudentTrip[]> {
  const nowMs = Date.now();
  const supabase = await createClient();
  const [{ data: students }, streaks] = await Promise.all([
    supabase.from("profiles").select("id, full_name, course_id, teacher_id, avatar_path").eq("role", "student").eq("is_active", true).order("full_name").limit(5000),
    loadStreaksForTeacher(nowMs),
  ]);
  return (students ?? [])
    .map((s) => {
      const st = streaks.get(s.id as string);
      const count = st?.count ?? 0;
      const { trip, inTrip, cycle } = tripFor(count);
      return {
        id: s.id as string,
        name: (s.full_name as string) || "O‘quvchi",
        avatar: avatarUrl(s.avatar_path as string | null),
        courseId: (s.course_id as string | null) ?? null,
        teacherId: (s.teacher_id as string | null) ?? null,
        count,
        today: st?.today ?? false,
        lost: st?.lost ?? 0,
        lastActive: st?.lastActive ?? null,
        tripIndex: (cycle - 1) % 3,
        tripTitle: trip.title,
        inTrip,
        cycle,
        city: currentStop(count).name,
      };
    })
    .sort((a, b) => b.count - a.count || Number(b.today) - Number(a.today) || a.name.localeCompare(b.name));
}
