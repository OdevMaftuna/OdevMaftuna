import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { COURSE_ACCESS_PRICE, loadMyCourseAccess } from "@/lib/course-access";
import { formatSom, loadPaymentSettings } from "@/lib/paid-tests";
import { LEVEL_INFO, loadMyProgress, loadTopics } from "@/lib/practice/data";
import { RequestAccess } from "./request-access";
import { loadStudentAssignments } from "@/lib/student-data";
import { StudyGuide } from "@/components/study-guide";
import { PaidTestsCard } from "@/components/paid-tests-card";
import { WRITING_COURSE } from "@/lib/writing/data";
import { loadMyWriting } from "@/lib/writing/load";

export const metadata: Metadata = { title: "Section" };

function SectionCard({
  href,
  title,
  text,
  meta,
  icon,
  disabled,
}: {
  href: string;
  title: string;
  text: string;
  meta: string;
  icon: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-neutral-600">{text}</p>
        <p className="mt-1 text-xs text-sun-400">{meta}</p>
      </div>
      {disabled ? null : <span className="text-neutral-400 transition group-hover:translate-x-0.5">→</span>}
    </>
  );
  return disabled ? (
    <div className={`${card} flex items-center gap-3 p-4 opacity-60`}>{inner}</div>
  ) : (
    <Link href={href} className={`${card} group flex items-center gap-3 p-4 transition hover:border-brand-300`}>
      {inner}
    </Link>
  );
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStudent();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [courses, access, topics, progress] = await Promise.all([
    loadCourses(),
    loadMyCourseAccess(profile.id),
    loadTopics({ courseId: id }),
    loadMyProgress(profile.id),
  ]);
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();
  const mine = id === access.primary;
  const extra = access.extra.includes(id);
  const canHomework = mine || extra;
  // Yashirin kurs (Kids) — faqat kirish huquqi borlarga.
  if (course.is_hidden && !canHomework) notFound();
  const todo = canHomework
    ? (await loadStudentAssignments()).items.filter((a) => a.course_id === id && a.state !== "closed" && !a.submission).length
    : 0;
  const last = access.lastRequest.get(id);
  const payment = canHomework ? null : await loadPaymentSettings();
  const lock = !canHomework;

  const count = (kind: "grammar" | "vocab" | "phrasal" | "reading") => {
    const list = topics.filter((t) => t.kind === kind);
    const done = list.filter((t) => Object.values(progress.get(t.id) ?? {}).some((p) => p && p.checked > 0)).length;
    return { total: list.length, done };
  };
  const g = count("grammar");
  const v = count("vocab");
  const ph = count("phrasal");
  const rd = count("reading");
  const info = LEVEL_INFO[course.name];
  const writingDone =
    course.name === WRITING_COURSE ? [...(await loadMyWriting(profile.id)).values()].filter((a) => a.status === "checked").length : 0;

  return (
    <section className="space-y-5">
      <Link href="/oquvchi" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Home
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{course.name}</h1>
        {info ? <Badge tone="brand">{info.level}</Badge> : null}
        {mine ? <Badge tone="sun">Your course</Badge> : null}
        {extra ? <Badge tone="green">Extra course</Badge> : null}
      </div>

      {/* Pullik imtihon testlari — kurs boshida, ko'zga tashlanadigan joyda */}
      {course.name === "Beginner" ? (
        <PaidTestsCard
          href="/oquvchi/testlar?kurs=Beginner"
          title="Exam tests — prove your level!"
          text="Har bir unitdan keyin haqiqiy imtihon formatida o‘zingizni sinang. Natija darhol, xatolar tushuntiriladi."
          meta="14 ta unit testi · 20 000 so‘m dan · Level test 40 000"
          cta="Testlarni ko‘rish"
          badge="🔥 YANGI"
        />
      ) : course.name === "Pre-Intermediate" ? (
        <PaidTestsCard
          href="/oquvchi/testlar?kurs=Pre-Intermediate"
          title="Exam tests — prove your level!"
          text="Bitta tushlik narxida — butun unit bilimi! Imtihon formatida o‘zingizni sinang, natija darhol. Tushlik unutiladi, bilim qoladi 💪"
          meta="9 ta unit testi · 35 000 so‘m dan · 3 ta umumiy test (Units 1–5, 6–9, Final)"
          cta="Testlarni ko‘rish"
          badge="🔥 YANGI"
          course="Pre-Intermediate"
        />
      ) : null}

      <StudyGuide topic="course" />

      <div className="space-y-3">
        {canHomework ? (
          <SectionCard
            href={`/oquvchi/vazifalar?kurs=${id}`}
            icon="📅"
            title="Homework"
            text="A daily lesson: reading, listening, speaking. Has a deadline."
            meta={todo > 0 ? `${todo} task(s) waiting` : "All submitted"}
          />
        ) : (
          <RequestAccess
            courseId={id}
            courseName={course.name}
            status={last?.status === "pending" ? "pending" : last?.status === "rejected" ? "rejected" : null}
            userId={profile.id}
            priceText={formatSom(COURSE_ACCESS_PRICE)}
            card={payment?.card ?? ""}
            holder={payment?.holder ?? ""}
          />
        )}
        {lock ? (
          <SectionCard
            href={`/oquvchi/kurs/${id}#ochish`}
            icon="📅"
            title="Homework 🔒"
            text="A daily lesson: reading, listening, speaking — opens after you unlock the course."
            meta="Locked"
            disabled
          />
        ) : null}
        <SectionCard
          href={`/oquvchi/kurs/${id}/lugat`}
          icon="📚"
          title="Vocabulary"
          text="The words of each unit: learn them, then practise with exercises. No deadline."
          meta={v.total ? (lock ? `${v.total} units · 🔒 preview` : `${v.total} units · ${v.done} done`) : "Coming soon"}
          disabled={!v.total}
        />
        <SectionCard
          href={`/oquvchi/kurs/${id}/mavzular`}
          icon="🧩"
          title="Topics (grammar)"
          text="The rule and exercises — every mistake is explained. No deadline."
          meta={g.total ? (lock ? `${g.total} topics · 🔒 preview` : `${g.total} topics · ${g.done} done`) : "Coming soon"}
          disabled={!g.total}
        />
        {course.name === WRITING_COURSE ? (
          <SectionCard
            href="/oquvchi/writing"
            icon="✍️"
            title="Writing — Letter & Email"
            text="12 ta xat turi: tuzilma, kalit iboralar, namuna. 36 ta cue card — yozasiz, AI tekshirib, baho va izoh beradi. No deadline."
            meta={lock ? "36 cue cards · 🔒 guide preview" : `36 cue cards · ${writingDone} done`}
          />
        ) : null}
        {rd.total ? (
          <SectionCard
            href={`/oquvchi/kurs/${id}/reading`}
            icon="📖"
            title="Reading"
            text="Matnni o‘qing va savollarga javob bering. No deadline."
            meta={lock ? `${rd.total} texts · 🔒 preview` : `${rd.total} texts · ${rd.done} done`}
          />
        ) : null}
        {ph.total ? (
          <SectionCard
            href={`/oquvchi/kurs/${id}/phrasal`}
            icon="🔗"
            title="Useful phrases"
            text="The key phrases of each unit (I can’t stand…, Why don’t you…?): learn their meaning, then practise. No deadline."
            meta={lock ? `${ph.total} sets · 🔒 preview` : `${ph.total} sets · ${ph.done} done`}
          />
        ) : null}
      </div>
    </section>
  );
}
