import "server-only";
import { APP_TIMEZONE } from "@/lib/config";
import { loadTopics } from "@/lib/practice/data";
import type { StudentAssignment } from "@/lib/student-data";
import { createClient } from "@/lib/supabase/server";

/**
 * "Bugungi missiya" — o'quvchining asosiy guruhi (kursi) bo'yicha bugungi asosiy ishlari:
 *  1) bugungi dars (uy vazifasi) — topshirsa bajarildi;
 *  2) lug'at — navbatdagi o'zlashtirilmagan unit; bugun lug'at mashqini tekshirsa bajarildi;
 *  3) grammatika — navbatdagi mavzu; bugun grammatika mashqini tekshirsa bajarildi.
 */

export type MissionTask = {
  key: "lesson" | "vocab" | "grammar";
  icon: string;
  title: string;
  detail: string;
  href: string;
  done: boolean;
};

export type Mission = { tasks: MissionTask[]; done: number; total: number; percent: number };

const dayKey = (d: Date | string | number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));

/** Natija shu foizdan yuqori bo'lsa, mavzu "o'zlashtirilgan" deb hisoblanadi. */
const MASTERED = 0.8;

export async function loadTodayMission(
  studentId: string,
  courseId: string | null,
  assignments: StudentAssignment[],
  now: number,
): Promise<Mission | null> {
  if (!courseId) return null;
  const today = dayKey(now);
  const supabase = await createClient();
  const [topics, { data: attempts }] = await Promise.all([
    loadTopics({ courseId }),
    supabase.from("practice_attempts").select("topic_id, section, best_score, total, checked_at").eq("student_id", studentId),
  ]);
  const byTopic = new Map<string, { best: number; total: number; today: boolean }[]>();
  for (const a of attempts ?? []) {
    const list = byTopic.get(a.topic_id) ?? [];
    list.push({ best: a.best_score ?? 0, total: a.total ?? 0, today: Boolean(a.checked_at && dayKey(a.checked_at) === today) });
    byTopic.set(a.topic_id, list);
  }

  const tasks: MissionTask[] = [];

  // 1) Bugungi dars: ochiq (yoki bugun topshirilgan) eng yaqin muddatli dars.
  const lesson = assignments
    .filter((a) => a.course_id === courseId && new Date(a.publish_at).getTime() <= now)
    .filter((a) => a.state === "open" || (a.submission && dayKey(a.submission.submitted_at) === today))
    .sort((x, y) => new Date(x.due_at).getTime() - new Date(y.due_at).getTime())[0];
  if (lesson) {
    tasks.push({
      key: "lesson",
      icon: "📅",
      title: "Submit today’s lesson",
      detail: lesson.title,
      href: `/oquvchi/vazifa/${lesson.id}`,
      done: Boolean(lesson.submission),
    });
  }

  // 2–3) Lug'at va grammatika: navbatdagi o'zlashtirilmagan mavzu.
  for (const kind of ["vocab", "grammar"] as const) {
    const list = topics.filter((t) => t.kind === kind).sort((a, b) => a.sort_order - b.sort_order);
    if (!list.length) continue;
    const mastered = (id: string) => (byTopic.get(id) ?? []).some((x) => x.total > 0 && x.best / x.total >= MASTERED);
    const next = list.find((t) => !mastered(t.id)) ?? list[list.length - 1];
    const doneToday = list.some((t) => (byTopic.get(t.id) ?? []).some((x) => x.today));
    tasks.push({
      key: kind,
      icon: kind === "vocab" ? "📚" : "🧩",
      title: kind === "vocab" ? `Vocabulary: Unit ${next.unit}` : `Grammar: ${next.code} ${next.title}`,
      detail: kind === "vocab" ? "Do the exercises and press “Check”" : "Read the rule, then do the test",
      href: `/oquvchi/mashq/${next.id}`,
      done: doneToday,
    });
  }

  if (!tasks.length) return null;
  const done = tasks.filter((t) => t.done).length;
  return { tasks, done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
}

