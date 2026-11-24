import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasCourseAccess } from "@/lib/course-access";
import { z } from "zod";
import { requireStudent } from "@/lib/auth";
import { KIND_PATH, loadMyAttempts, loadTopic } from "@/lib/practice/data";
import { PracticeView } from "./practice-view";
import { StudyGuide } from "@/components/study-guide";

export const metadata: Metadata = { title: "Practice" };

// Tarjimalarni AI tekshirishi uchun vaqt (Vercel'da 60 soniyagacha).
export const maxDuration = 60;

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStudent();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const topic = await loadTopic(id);
  if (!topic) notFound();
  // Boshqa kurs — faqat ko‘rish: mashq ochilmaydi, kurs sahifasida to‘lov paneli turibdi.
  if (!(await hasCourseAccess(profile.id, topic.course_id))) redirect(`/oquvchi/kurs/${topic.course_id}`);
  const attempts = await loadMyAttempts(id, profile.id);

  return (
    <article className="space-y-4">
      <Link href={`/oquvchi/kurs/${topic.course_id}/${KIND_PATH[topic.kind]}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← {topic.courses?.name ?? "Back"} · {topic.kind === "grammar" ? "Topics" : topic.kind === "phrasal" ? "Useful phrases" : topic.kind === "reading" ? "Reading" : "Vocabulary"}
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">
          Unit {topic.unit} · {topic.code}
        </p>
        <h1 lang="en" className="mt-1 text-xl font-semibold tracking-tight">{topic.title}</h1>
        {topic.title_uz ? <p className="mt-0.5 text-sm text-neutral-600">{topic.title_uz}</p> : null}
      </header>
      {topic.kind === "reading" ? null : <StudyGuide topic={topic.kind === "grammar" ? "grammar" : topic.kind === "phrasal" ? "phrasal" : "vocab"} />}
      <PracticeView topicId={topic.id} content={topic.content} attempts={attempts} introLabel={topic.kind === "phrasal" ? "Learn" : "Rule"} />
    </article>
  );
}
