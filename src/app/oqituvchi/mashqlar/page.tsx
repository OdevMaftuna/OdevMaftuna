import type { Metadata } from "next";
import Link from "next/link";
import { CourseTabs } from "@/components/course-tabs";
import { PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { groupByUnit, loadTopics } from "@/lib/practice/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mashqlar" };

/** Har bir mavzu bo'yicha: nechta o'quvchi ishlagan va o'rtacha eng yaxshi natija. */
async function loadStats() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select("topic_id, student_id, section, best_score, total, checked_count");
  const map = new Map<string, { students: Set<string>; sum: number; max: number }>();
  for (const r of data ?? []) {
    if (!r.checked_count) continue;
    const s = map.get(r.topic_id) ?? { students: new Set<string>(), sum: 0, max: 0 };
    s.students.add(r.student_id);
    s.sum += r.best_score ?? 0;
    s.max += r.total ?? 0;
    map.set(r.topic_id, s);
  }
  return map;
}

export default async function TeacherPracticePage({ searchParams }: { searchParams: Promise<{ kurs?: string }> }) {
  await requireTeacher();
  const [courses, topics, stats, { kurs }] = await Promise.all([loadCourses(), loadTopics(), loadStats(), searchParams]);
  const selected = pickCourse(courses, kurs);
  const list = selected ? topics.filter((t) => t.course_id === selected.id) : topics;
  const counts = Object.fromEntries(courses.map((c) => [c.id, topics.filter((t) => t.course_id === c.id).length]));

  const block = (kind: "grammar" | "vocab" | "phrasal" | "reading", title: string) => {
    const rows = list.filter((t) => t.kind === kind);
    if (!rows.length) return null;
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
        {groupByUnit(rows).map((g) => (
          <div key={g.unit}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Unit {g.unit}</p>
            <ul className={`${card} divide-y divide-neutral-200`}>
              {g.items.map((t) => {
                const s = stats.get(t.id);
                return (
                  <li key={t.id}>
                    <Link href={`/oqituvchi/mashqlar/${t.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/40">
                      <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-neutral-500">{t.code}</span>
                      <div className="min-w-0 flex-1">
                        <p lang="en" className="font-medium">{t.title}</p>
                        <p className="text-xs text-neutral-500">{t.title_uz}</p>
                      </div>
                      <span className="shrink-0 text-right text-xs text-neutral-600">
                        {s ? (
                          <>
                            <b className="tabular-nums">{s.students.size}</b> o‘quvchi
                            <span className="block tabular-nums text-sun-400">o‘rtacha {Math.round((s.sum / Math.max(1, s.max)) * 100)}%</span>
                          </>
                        ) : (
                          <span className="text-neutral-400">hali ishlanmagan</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Mashqlar"
        description="Muddatsiz mashqlar: grammatika mavzulari (qoida, 100 tarjima, 30 test) va lug‘at. O‘quvchilarning natijalarini shu yerda ko‘rasiz."
      />
      <CourseTabs basePath="/oqituvchi/mashqlar" courses={courses} selectedId={selected?.id ?? null} counts={counts} total={topics.length} />
      {list.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>Bu kursda hozircha mashq yo‘q.</div>
      ) : (
        <>
          {block("grammar", "Mavzular (grammatika)")}
          {block("vocab", "Lug‘at")}
          {block("phrasal", "Useful phrases")}
          {block("reading", "Reading")}
        </>
      )}
    </section>
  );
}
