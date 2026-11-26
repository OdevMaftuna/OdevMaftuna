import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge, PageHeader, btn, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { formatScore } from "@/lib/format";
import { loadPracticeInsights, loadTestInsights } from "@/lib/student-insights";
import { finalScore, loadStudentProgress } from "@/lib/teacher-data";
import { PracticeInsights, TestInsights } from "./insights";
import { StudentActions } from "../student-actions";

export const metadata: Metadata = { title: "O‘quvchi rivoji" };

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [data, practice, tests] = await Promise.all([loadStudentProgress(id), loadPracticeInsights(id), loadTestInsights(id)]);
  if (!data) notFound();
  const { student, items } = data;

  const scored = items.flatMap(({ assignment, submission }) => {
    const score = submission ? finalScore(submission) : null;
    return score === null ? [] : [(score / assignment.max_score) * 100];
  });
  const average =
    scored.length > 0 ? scored.reduce((sum, value) => sum + value, 0) / scored.length : null;
  const submittedCount = items.filter((i) => i.submission).length;
  const lateCount = items.filter((i) => i.submission?.is_late).length;
  const missedCount = items.filter((i) => i.missed).length;

  const stats = [
    { label: "O‘rtacha natija", value: average === null ? "—" : `${formatScore(Math.round(average))}%` },
    { label: "Topshirilgan", value: String(submittedCount) },
    { label: "Kech topshirilgan", value: String(lateCount) },
    { label: "O‘tkazib yuborilgan", value: String(missedCount) },
    {
      label: "Mashqlar (o‘rtacha eng yaxshi)",
      value: practice.length ? `${Math.round(practice.reduce((t, r) => t + (r.best ?? 0), 0) / practice.length)}%` : "—",
    },
    { label: "Mashq urinishlari", value: String(practice.reduce((t, r) => t + r.attempts, 0)) },
    {
      label: "Pullik testlar (o‘rtacha)",
      value: tests.length ? `${Math.round(tests.reduce((t, r) => t + r.score, 0) / tests.length)}/100` : "—",
    },
    { label: "Topshirilgan testlar", value: String(tests.length) },
  ];

  return (
    <section className="space-y-5">
      <PageHeader
        title={student.full_name || "Ismsiz"}
        description={
          student.is_active
            ? "O‘quvchining hamma natijalari: uy vazifalari, mashqlar (foizi, urinishlari, xatolari) va pullik testlar."
            : "Bu o‘quvchi nofaol qilingan."
        }
        actions={
          <>
            <StudentActions
              id={id}
              name={student.full_name}
              isActive={student.is_active}
              canDeactivate={me.isAdmin}
            />
            <Link href="/oqituvchi/oquvchilar" className={btn.secondary}>
              O‘quvchilarga qaytish
            </Link>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${card} px-3 py-3 text-center`}>
            <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
            <dt className="mt-0.5 text-xs text-neutral-500">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <PracticeInsights rows={practice} />
      <TestInsights rows={tests} />

      <h2 className="pt-1 font-semibold">Uy vazifalari</h2>
      {items.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>
          Hali e’lon qilingan vazifa yo‘q.
        </div>
      ) : (
        <ul className={`${card} divide-y divide-neutral-200`}>
          {items.map(({ assignment: a, submission: s, missed }) => {
            const score = s ? finalScore(s) : null;
            const row = (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{a.title}</p>
                    {s ? (
                      s.is_late ? (
                        <Badge tone="amber">Kech topshirildi</Badge>
                      ) : (
                        <Badge tone="green">Topshirildi</Badge>
                      )
                    ) : missed ? (
                      <Badge tone="red">Topshirmadi</Badge>
                    ) : (
                      <Badge>Hali ochiq</Badge>
                    )}
                    {s && !s.reviewed_at ? <Badge tone="brand">Tekshirilmagan</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Muddat: {formatDateTime(a.due_at)}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  {score !== null ? (
                    <>
                      <span className="text-lg font-semibold tabular-nums">{formatScore(score)}</span>
                      <span className="text-sm text-neutral-500"> / {a.max_score}</span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-neutral-400">—</span>
                  )}
                </p>
              </div>
            );
            return (
              <li key={a.id}>
                {s ? (
                  <Link
                    href={`/oqituvchi/baholash/${s.id}`}
                    className="block transition hover:bg-neutral-50"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
