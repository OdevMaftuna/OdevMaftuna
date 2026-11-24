import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { COURSE_ACCESS_PRICE, hasCourseAccess } from "@/lib/course-access";
import { formatSom } from "@/lib/paid-tests";
import { groupByUnit, loadMyProgress, loadTopics, type TopicProgress } from "@/lib/practice/data";
import { StudyGuide } from "@/components/study-guide";

export const metadata: Metadata = { title: "Practice" };

const KINDS = { mavzular: "grammar", lugat: "vocab", phrasal: "phrasal", reading: "reading" } as const;

function Chip({ label, p }: { label: string; p?: NonNullable<TopicProgress["test"]> }) {
  if (!p || (!p.checked && !p.started)) return <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">{label}</span>;
  if (!p.checked) return <span className="rounded-full border border-sun-400/40 px-2 py-0.5 text-[11px] text-sun-400">{label}: started</span>;
  const full = p.best !== null && p.total !== null && p.best === p.total;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${full ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-800"}`}>
      {label}: {p.best}/{p.total}
    </span>
  );
}

export default async function TopicListPage({ params }: { params: Promise<{ id: string; kind: string }> }) {
  const profile = await requireStudent();
  const { id, kind } = await params;
  if (!z.uuid().safeParse(id).success || !(kind in KINDS)) notFound();
  const k = KINDS[kind as keyof typeof KINDS];
  const [courses, topics, progress, open] = await Promise.all([loadCourses(), loadTopics({ courseId: id, kind: k }), loadMyProgress(profile.id), hasCourseAccess(profile.id, id)]);
  const course = courses.find((c) => c.id === id);
  if (!course || (course.is_hidden && !open)) notFound();

  return (
    <section className="space-y-5">
      <Link href={`/oquvchi/kurs/${id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← {course.name}
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {course.name} · {k === "grammar" ? "Topics" : k === "phrasal" ? "Useful phrases" : "Vocabulary"}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          No deadline — practise any time. Your answers are saved automatically.
        </p>
      </div>

      {open ? null : (
        <Link
          href={`/oquvchi/kurs/${id}#ochish`}
          className="flex items-center gap-3 rounded-2xl border-2 border-sun-400/50 bg-sun-50 p-4 transition hover:-translate-y-0.5"
        >
          <span aria-hidden className="text-2xl">🔒</span>
          <span className="min-w-0 flex-1 text-sm text-sun-700">
            <b className="block">Preview only — this is not your course</b>
            You can see what’s inside. Unlock the whole {course.name} course for {formatSom(COURSE_ACCESS_PRICE)}.
          </span>
          <span className="shrink-0 text-sm font-bold text-sun-700">Unlock →</span>
        </Link>
      )}

      <StudyGuide topic={k === "grammar" ? "grammar" : k === "phrasal" ? "phrasal" : "vocab"} />

      {topics.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>No exercises in this section yet.</div>
      ) : (
        groupByUnit(topics).map((g) => (
          <div key={g.unit}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Unit {g.unit}</h2>
            <ul className={`${card} divide-y divide-neutral-200`}>
              {g.items.map((t) => {
                const p = progress.get(t.id);
                return (
                  <li key={t.id}>
                    <Link href={open ? `/oquvchi/mashq/${t.id}` : `/oquvchi/kurs/${id}#ochish`} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/40 ${open ? "" : "opacity-70"}`}>
                      <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-neutral-500">{t.code}</span>
                      <div className="min-w-0 flex-1">
                        <p lang="en" className="font-medium">{t.title}</p>
                        {t.title_uz ? <p className="text-xs text-neutral-500">{t.title_uz}</p> : null}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {k === "grammar" ? <Chip label="Translation" p={p?.translate} /> : null}
                          <Chip label={k === "grammar" ? "Test" : "Exercises"} p={p?.test} />
                        </div>
                      </div>
                      <span className="text-neutral-400">{open ? "→" : "🔒"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
