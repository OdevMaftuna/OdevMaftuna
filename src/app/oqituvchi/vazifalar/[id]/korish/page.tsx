import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { LessonView } from "@/app/oquvchi/vazifa/[id]/lesson/lesson-view";
import { Badge, Notice, btn, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { lessonAudioUrls } from "@/lib/lesson/audio";
import { gradeLesson } from "@/lib/lesson/grade";
import { emptyAnswers, lessonWeights, type CheckedItem, type Lesson, type LessonKey } from "@/lib/lesson/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Darsni ko‘rish" };

function lessonStatus(publishAt: string, dueAt: string): "scheduled" | "open" | "closed" {
  const now = Date.now();
  if (new Date(publishAt).getTime() > now) return "scheduled";
  return new Date(dueAt).getTime() > now ? "open" : "closed";
}

function KeyBlock({ title, rows }: { title: string; rows: { q: string; item: CheckedItem }[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ol className="mt-1.5 space-y-1 text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-5 shrink-0 text-neutral-500">{i + 1}.</span>
            <span lang="en" className="min-w-0 flex-1 text-neutral-700">{r.q}</span>
            <b lang="en" className="shrink-0 text-emerald-700">{r.item.correct}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

function KeySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-4">
      <h3 className="font-semibold text-sun-400">{title}</h3>
      {children}
    </section>
  );
}

/** Javoblar kaliti: test qismlari uchun to'g'ri javoblar va listening matni. */
function AnswerKey({ lesson, keyData }: { lesson: Lesson; keyData: LessonKey }) {
  // Multilevel: kalit har bir savol ostida, dars ko'rinishining o'zida chiqadi.
  if (lesson.kind === "multilevel") return <Notice tone="info">Multilevel darsi: to‘g‘ri javoblar pastdagi darsda har bir savol ostida ko‘rsatilgan.</Notice>;
  const r = gradeLesson(lesson, keyData, emptyAnswers(lesson));
  return (
    <div className="space-y-4">
      {lesson.kind === "reading"
        ? lesson.readings.map((rd, i) => {
            const res = r.readings?.[i];
            if (!res) return null;
            return (
              <KeySection key={rd.id} title={`Reading ${i + 1}: ${rd.title}`}>
                <KeyBlock title="A. True / False" rows={res.tf.map((item, j) => ({ q: rd.tf[j].q, item }))} />
                <KeyBlock title="B. To‘g‘ri javob" rows={res.mc.map((item, j) => ({ q: rd.mc[j].q, item }))} />
                <KeyBlock title="C. Bo‘sh joy" rows={res.fill.map((item, j) => ({ q: rd.fill.items[j].q, item }))} />
                <KeyBlock title="D. Inglizchaga tarjima" rows={res.wordTr.map((item, j) => ({ q: rd.wordTr[j].uz, item }))} />
                <KeyBlock title="Lug‘at testi" rows={res.vocabQuiz.map((item, j) => ({ q: rd.vocabQuiz[j].q, item }))} />
              </KeySection>
            );
          })
        : r.review ? (
            <KeySection title={lesson.kind === "final" ? "Yakuniy test" : "Takrorlash"}>
              <KeyBlock title="Lug‘at testi" rows={r.review.vocabQuiz.map((item, j) => ({ q: lesson.review.vocabQuiz[j].q, item }))} />
              <KeyBlock title="So‘z tarjimasi" rows={r.review.wordTr.map((item, j) => ({ q: lesson.review.wordTr[j].uz, item }))} />
            </KeySection>
          ) : null}

      {lesson.listening && r.listening ? (
        <KeySection title={`Listening: ${lesson.listening.title}`}>
          <KeyBlock title="A. True / False" rows={r.listening.tf.map((item, j) => ({ q: lesson.listening!.tf[j].q, item }))} />
          <KeyBlock title="B. To‘g‘ri javob" rows={r.listening.mc.map((item, j) => ({ q: lesson.listening!.mc[j].q, item }))} />
          <KeyBlock title="C. Bo‘sh joy" rows={r.listening.gaps.map((item, j) => ({ q: lesson.listening!.gaps[j].q, item }))} />
          <div>
            <h4 className="text-sm font-semibold">Dialog matni</h4>
            <ul lang="en" className="mt-1.5 space-y-1 text-sm">
              {r.listening.lines.map((l, i) => (
                <li key={i}>
                  <b className="text-brand-800">{l.speaker}:</b> {l.text}
                </li>
              ))}
            </ul>
          </div>
        </KeySection>
      ) : null}

      <p className="text-xs text-neutral-500">
        Tarjima, gap tuzish va speaking ovozlarini sun’iy intellekt baholaydi — ularning yagona to‘g‘ri javobi yo‘q.
      </p>
    </div>
  );
}

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: a }, { data: keyRow }] = await Promise.all([
    supabase.from("assignments").select("id, title, publish_at, due_at, lesson, course_id, courses(name)").eq("id", id).maybeSingle(),
    supabase.from("assignment_keys").select("key").eq("assignment_id", id).maybeSingle(),
  ]);
  if (!a) notFound();
  const lesson = a.lesson as Lesson | null;
  if (!lesson) {
    return (
      <section className="mx-auto max-w-2xl space-y-4">
        <Notice tone="info">Bu oddiy vazifa — interaktiv dars emas.</Notice>
        <Link href={`/oqituvchi/vazifalar/${id}`} className={btn.secondary}>Tahrirlash</Link>
      </section>
    );
  }
  const audioUrls = await lessonAudioUrls(lesson);
  const w = lessonWeights(lesson);
  const status = lessonStatus(a.publish_at, a.due_at);
  const courseName = (a.courses as unknown as { name: string } | null)?.name;

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href={`/oqituvchi/vazifalar?kurs=${a.course_id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Vazifalarga qaytish
      </Link>

      <header className={`${card} space-y-2 p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{a.title}</h1>
          {status === "scheduled" ? (
            <Badge tone="brand">Rejalashtirilgan</Badge>
          ) : status === "open" ? (
            <Badge tone="green">Ochiq</Badge>
          ) : (
            <Badge>Yopilgan</Badge>
          )}
          {courseName ? <Badge tone="sun">{courseName}</Badge> : null}
        </div>
        <p className="text-sm text-neutral-600">
          Ochiladi: <b>{formatDateTime(a.publish_at)}</b> · Muddat: <b>{formatDateTime(a.due_at)}</b>
        </p>
        <p className="text-xs text-neutral-500">
          {lesson.kind === "multilevel" ? (
            <>Ballar: hamma savollar kitob kaliti bilan avtomatik tekshiriladi = 100</>
          ) : (
            <>
              Ballar: {lesson.kind === "reading" ? "Reading" : "Takrorlash"} test {w.auto} + yozma {w.written}
              {lesson.listening ? ` · Listening ${w.listening}` : ""}
              {lesson.speaking ? ` · Speaking ${w.speakingDone} + AI ${w.speakingAi}` : ""} = 100
            </>
          )}
        </p>
      </header>

      <details className={`${card} group p-4`}>
        <summary className="cursor-pointer list-none font-semibold">
          <span className="text-brand-800">Javoblar kaliti</span>
          <span className="ml-2 text-xs font-normal text-neutral-500 group-open:hidden">(ochish uchun bosing)</span>
        </summary>
        <div className="mt-4">
          {keyRow ? <AnswerKey lesson={lesson} keyData={keyRow.key as LessonKey} /> : <Notice tone="info">Javoblar kaliti topilmadi.</Notice>}
        </div>
      </details>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">O‘quvchi ko‘radigan dars</h2>
        <LessonView
          assignmentId={a.id}
          lesson={lesson}
          canSubmit={false}
          isLateWindow={false}
          penalty={0}
          userId={teacher.id}
          audioUrls={audioUrls}
          preview
          mlKeys={lesson.kind === "multilevel" ? (keyRow?.key as LessonKey | undefined)?.ml : undefined}
        />
      </div>
    </article>
  );
}
