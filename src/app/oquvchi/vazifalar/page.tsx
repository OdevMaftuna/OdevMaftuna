import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { Badge, btn, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { formatDateTimeEn as formatDateTime } from "@/lib/datetime";
import { StudyGuide } from "@/components/study-guide";
import { loadCourses } from "@/lib/courses";
import { loadStudentAssignments, type StudentAssignment } from "@/lib/student-data";
import { SUBMISSION_TYPE_LABELS_EN as SUBMISSION_TYPE_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Today’s homework" };

function AssignmentCard({ a, now, course }: { a: StudentAssignment; now: number; course?: string }) {
  const submitted = a.submission !== null;
  return (
    <li className={`${card} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 basis-40 text-base font-semibold">{a.title}</h2>
        {course ? <Badge tone="brand">{course}</Badge> : null}
        {submitted ? (
          <Badge tone="green">Submitted</Badge>
        ) : (
          <Badge tone="amber">Not submitted</Badge>
        )}
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">Deadline</dt>
          <dd className="text-right">{formatDateTime(a.due_at)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">
            {a.state === "open" ? "Time left" : "Status"}
          </dt>
          <dd className="text-right">
            {a.state === "open" ? (
              <Countdown dueAt={a.due_at} serverNow={now} />
            ) : (
              <span className="font-medium text-amber-700">
                Deadline passed · you can still submit late (−{a.late_penalty_percent}%)
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">Type</dt>
          <dd className="text-right">
            {a.lesson_kind ? "Interactive lesson" : SUBMISSION_TYPE_LABELS[a.submission_type]} · {a.max_score} points
          </dd>
        </div>
      </dl>

      <Link
        href={`/oquvchi/vazifa/${a.id}`}
        className={`${submitted ? btn.secondary : btn.primary} mt-4 w-full`}
      >
        {submitted
          ? a.lesson_kind
            ? "See the result"
            : "See or change your answer"
          : a.lesson_kind
            ? "Start the lesson"
            : "Open the task"}
      </Link>
    </li>
  );
}

export default async function StudentHomePage({ searchParams }: { searchParams: Promise<{ kurs?: string }> }) {
  const profile = await requireStudent();
  const [{ items, now, failed }, courses, { kurs }] = await Promise.all([loadStudentAssignments(), loadCourses(), searchParams]);
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const myCourses = [...new Set(items.map((a) => a.course_id))];
  const filter = kurs && myCourses.includes(kurs) ? kurs : null;

  // Faqat hozir topshirsa bo'ladigan vazifalar. Kelajakdagilarni baza umuman bermaydi.
  const active = items.filter((a) => a.state !== "closed" && (!filter || a.course_id === filter));
  const todo = active.filter((a) => !a.submission).length;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Hello, {profile.fullName.split(" ")[0] || "student"}!
        </h1>
        {profile.courseName ? <Badge tone="sun">{profile.courseName}</Badge> : null}
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        {failed
          ? "Couldn’t load your homework. Please refresh the page."
          : !profile.courseName
            ? "You don’t have a course yet. Please ask your teacher."
          : active.length === 0
            ? "No open tasks right now."
            : todo === 0
              ? "All open tasks are submitted. Well done!"
              : `You have ${todo} task(s) to submit.`}
      </p>

      <div className="mt-4">
        <StudyGuide topic="homework" />
      </div>

      {myCourses.length > 1 ? (
        <nav className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1" aria-label="Courses">
          {[null, ...myCourses].map((c) => (
            <Link
              key={c ?? "all"}
              href={c ? `/oquvchi/vazifalar?kurs=${c}` : "/oquvchi/vazifalar"}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                filter === c ? "border-brand-600 bg-brand-700 text-white" : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300"
              }`}
            >
              {c ? courseName.get(c) ?? "—" : "All"}
            </Link>
          ))}
        </nav>
      ) : null}

      {active.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {active.map((a) => (
            <AssignmentCard key={a.id} a={a} now={now} course={myCourses.length > 1 ? courseName.get(a.course_id) : undefined} />
          ))}
        </ul>
      ) : !failed && profile.courseName ? (
        <div className={`${card} mt-5 px-5 py-10 text-center`}>
          <p className="font-medium">Time to rest</p>
          <p className="mt-1 text-sm text-neutral-600">
            A new task will appear here when it opens.
          </p>
        </div>
      ) : null}
    </section>
  );
}
