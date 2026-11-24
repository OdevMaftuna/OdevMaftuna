import type { Metadata } from "next";
import Link from "next/link";
import { Badge, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { formatDateTimeEn as formatDateTime } from "@/lib/datetime";
import { StudyGuide } from "@/components/study-guide";
import { formatScore } from "@/lib/format";
import { loadStudentAssignments, type StudentAssignment } from "@/lib/student-data";

export const metadata: Metadata = { title: "History" };

function StatusBadge({ a }: { a: StudentAssignment }) {
  if (a.submission) {
    return a.submission.is_late ? (
      <Badge tone="amber">Submitted late</Badge>
    ) : (
      <Badge tone="green">Submitted</Badge>
    );
  }
  return a.state === "closed" ? (
    <Badge tone="red">Not submitted</Badge>
  ) : (
    <Badge tone="brand">Open</Badge>
  );
}

export default async function StudentHistoryPage() {
  await requireStudent();
  const { items, failed } = await loadStudentAssignments();

  // Eng yangi muddat tepada.
  const history = [...items].reverse();
  const scored = history.filter((a) => a.submission?.final_score != null);
  const missed = history.filter((a) => a.state === "closed" && !a.submission).length;
  const average =
    scored.length > 0
      ? scored.reduce(
          (sum, a) => sum + (Number(a.submission!.final_score) / a.max_score) * 100,
          0,
        ) / scored.length
      : null;

  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-neutral-600">
        All your tasks, scores and comments.
      </p>

      <div className="mt-4">
        <StudyGuide topic="history" />
      </div>

      {failed ? (
        <p className="mt-5 text-sm text-red-700">
          Couldn’t load your history. Please refresh the page.
        </p>
      ) : history.length === 0 ? (
        <div className={`${card} mt-5 px-5 py-10 text-center text-sm text-neutral-600`}>
          No tasks yet.
        </div>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Average", value: average === null ? "—" : `${formatScore(Math.round(average))}%` },
              { label: "Submitted", value: String(history.filter((a) => a.submission).length) },
              { label: "Missed", value: String(missed) },
            ].map((stat) => (
              <div key={stat.label} className={`${card} px-2 py-3`}>
                <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
                <dt className="mt-0.5 text-xs text-neutral-500">{stat.label}</dt>
              </div>
            ))}
          </dl>

          <ul className={`${card} mt-4 divide-y divide-neutral-200`}>
            {history.map((a) => {
              const s = a.submission;
              return (
                <li key={a.id}>
                  <Link
                    href={`/oquvchi/vazifa/${a.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Deadline: {formatDateTime(a.due_at)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge a={a} />
                        {s?.teacher_comment ? <Badge>Teacher’s comment</Badge> : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {s?.final_score != null ? (
                        <p className="text-lg font-semibold tabular-nums">
                          {formatScore(s.final_score)}
                          <span className="text-sm font-normal text-neutral-500">
                            {" "}/ {a.max_score}
                          </span>
                        </p>
                      ) : s ? (
                        <p className="text-xs text-neutral-500">Being marked</p>
                      ) : (
                        <p className="text-lg font-semibold text-neutral-400">—</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
