import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { Badge, PageHeader, btn, card } from "@/components/ui";
import { runAiQueue } from "@/lib/ai/queue";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { formatDateTime } from "@/lib/datetime";
import { formatScore } from "@/lib/format";
import { finalScore, loadAssignmentTracking } from "@/lib/teacher-data";

export const metadata: Metadata = { title: "Kuzatuv" };
export const maxDuration = 60;

export default async function AssignmentTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const data = await loadAssignmentTracking(id);
  if (!data) notFound();
  const { submitted } = data;

  // Navbatda qolib ketgan javob bo'lsa, sahifa ochilganda tekshiruv davom ettiriladi.
  if (submitted.some(({ submission }) => submission.ai_status === "pending")) {
    after(() => runAiQueue());
  }

  const courses = await loadCourses();
  const courseName = courses.find((c) => c.id === data.assignment.course_id)?.name ?? "";
  return <TrackingView data={data} courseName={courseName} />;
}

type Tracking = NonNullable<Awaited<ReturnType<typeof loadAssignmentTracking>>>;

function SubmittedList({ rows, maxScore }: { rows: Tracking["submitted"]; maxScore: number }) {
  return (
    <ul className={`${card} divide-y divide-neutral-200`}>
      {rows.map(({ student, submission: s }) => {
        const score = finalScore(s);
        return (
          <li key={s.id}>
            <Link
              href={`/oqituvchi/baholash/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-neutral-50"
            >
              <div className="min-w-0 flex-1 basis-48">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{student.full_name || "Ismsiz"}</p>
                  {s.reviewed_at ? (
                    <Badge tone="green">Tekshirilgan</Badge>
                  ) : (
                    <Badge tone="brand">Tekshirilmagan</Badge>
                  )}
                  {s.ai_status === "pending" ? <Badge>AI tekshirmoqda</Badge> : null}
                  {s.ai_status === "error" ? <Badge tone="red">AI xatosi</Badge> : null}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatDateTime(s.submitted_at)}
                </p>
              </div>
              <p className="shrink-0 text-right">
                {score !== null ? (
                  <>
                    <span className="text-lg font-semibold tabular-nums">{formatScore(score)}</span>
                    <span className="text-sm text-neutral-500"> / {maxScore}</span>
                    <span className="block text-xs text-neutral-500">
                      {s.teacher_score !== null ? "o‘qituvchi bali" : "AI bali"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-neutral-500">Ball yo‘q</span>
                )}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TrackingView({ data, courseName }: { data: Tracking; courseName: string }) {
  const { assignment: a, closed, submitted, missing } = data;
  const onTime = submitted.filter(({ submission }) => !submission.is_late);
  const late = submitted.filter(({ submission }) => submission.is_late);

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.title}
        description={`${courseName} · Muddat: ${formatDateTime(a.due_at)} · ${closed ? "yopilgan" : "ochiq"} · ${a.max_score} ball`}
        actions={
          <Link href={`/oqituvchi/kuzatuv?kurs=${a.course_id}`} className={btn.secondary}>
            Kuzatuvga qaytish
          </Link>
        }
      />

      <div>
        <h2 className="mb-2 font-semibold">
          Topshirganlar <span className="font-normal text-neutral-500">· {onTime.length} ta</span>
        </h2>
        {onTime.length > 0 ? (
          <SubmittedList rows={onTime} maxScore={a.max_score} />
        ) : (
          <p className="text-sm text-neutral-600">Hali hech kim topshirmagan.</p>
        )}
      </div>

      {late.length > 0 ? (
        <div>
          <h2 className="mb-2 font-semibold text-amber-800">
            Kech topshirganlar{" "}
            <span className="font-normal text-neutral-500">· {late.length} ta</span>
          </h2>
          <SubmittedList rows={late} maxScore={a.max_score} />
        </div>
      ) : null}

      <div>
        <h2 className={`mb-2 font-semibold ${closed && missing.length > 0 ? "text-red-700" : ""}`}>
          {closed ? "Topshirmaganlar" : "Hali topshirmaganlar"} ({courseName}){" "}
          <span className="font-normal text-neutral-500">· {missing.length} ta</span>
        </h2>
        {missing.length > 0 ? (
          <ul className={`${card} divide-y divide-neutral-200`}>
            {missing.map((student) => (
              <li key={student.id}>
                <Link
                  href={`/oqituvchi/oquvchilar/${student.id}`}
                  className="block px-4 py-2.5 text-sm transition hover:bg-neutral-50"
                >
                  {student.full_name || "Ismsiz"}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-emerald-700">Hamma faol o‘quvchilar topshirgan.</p>
        )}
      </div>
    </section>
  );
}
