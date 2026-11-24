import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { groupByUnit, loadTopics } from "@/lib/practice/data";

export const metadata: Metadata = { title: "Mashqlar" };

const KINDS = { mavzular: "grammar", lugat: "vocab", phrasal: "phrasal" } as const;

export default async function TeacherTopicListPage({ params }: { params: Promise<{ id: string; kind: string }> }) {
  await requireTeacher();
  const { id, kind } = await params;
  if (!z.uuid().safeParse(id).success || !(kind in KINDS)) notFound();
  const k = KINDS[kind as keyof typeof KINDS];
  const [courses, topics] = await Promise.all([loadCourses(), loadTopics({ courseId: id, kind: k })]);
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <section className="space-y-5">
      <Link href={`/oqituvchi/kurs/${id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← {course.name}
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">
        {course.name} · {k === "grammar" ? "Mavzular" : k === "phrasal" ? "Useful phrases" : "Lug‘at"}
      </h1>
      {topics.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>Bu bo‘limda hozircha mashq yo‘q.</div>
      ) : (
        groupByUnit(topics).map((g) => (
          <div key={g.unit}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Unit {g.unit}</h2>
            <ul className={`${card} divide-y divide-neutral-200`}>
              {g.items.map((t) => (
                <li key={t.id}>
                  <Link href={`/oqituvchi/mashqlar/${t.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/40">
                    <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-neutral-500">{t.code}</span>
                    <div className="min-w-0 flex-1">
                      <p lang="en" className="font-medium">{t.title}</p>
                      <p className="text-xs text-neutral-500">{t.title_uz}</p>
                    </div>
                    <span className="text-neutral-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
