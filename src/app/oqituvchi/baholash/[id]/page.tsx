import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { FeedbackView, parseFeedback } from "@/components/feedback-view";
import { Badge, Notice, PageHeader, btn, card } from "@/components/ui";
import { runAiQueue } from "@/lib/ai/queue";
import { requireTeacher } from "@/lib/auth";
import { SUBMISSIONS_BUCKET } from "@/lib/config";
import { formatDateTime } from "@/lib/datetime";
import { formatScore } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { finalScore, type Submission } from "@/lib/teacher-data";
import type { Assignment } from "@/lib/types";
import { LessonResultView } from "@/app/oquvchi/vazifa/[id]/lesson/lesson-result";
import type { Lesson } from "@/lib/lesson/types";
import { AiWaiting, RerunAiButton } from "./ai-controls";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Baholash" };
export const maxDuration = 60;

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: submissionRow } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!submissionRow) notFound();
  const s = submissionRow as Submission;

  const [{ data: assignmentRow }, { data: student }, signed] = await Promise.all([
    supabase.from("assignments").select("*").eq("id", s.assignment_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", s.student_id).maybeSingle(),
    s.image_paths.length > 0
      ? supabase.storage.from(SUBMISSIONS_BUCKET).createSignedUrls(s.image_paths, 3600)
      : Promise.resolve({ data: [] }),
  ]);
  if (!assignmentRow) notFound();
  const a = assignmentRow as Assignment;
  const images = (signed.data ?? []).flatMap((entry) =>
    entry.path && entry.signedUrl ? [{ path: entry.path, url: entry.signedUrl }] : [],
  );

  if (s.ai_status === "pending") after(() => runAiQueue());

  const feedback = s.ai_status === "done" ? parseFeedback(s.ai_feedback) : null;
  const score = finalScore(s);

  return (
    <section className="space-y-5">
      <PageHeader
        title={student?.full_name || "O‘quvchi"}
        description={`${a.title} · ${formatDateTime(s.submitted_at)} da yuborilgan`}
        actions={
          <Link href={`/oqituvchi/kuzatuv/${a.id}`} className={btn.secondary}>
            Ro‘yxatga qaytish
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {s.is_late ? <Badge tone="amber">Kech topshirilgan</Badge> : <Badge tone="green">O‘z vaqtida</Badge>}
        {s.reviewed_at ? (
          <Badge tone="green">Tekshirilgan · {formatDateTime(s.reviewed_at)}</Badge>
        ) : (
          <Badge tone="brand">Tekshirilmagan</Badge>
        )}
        <span className="text-sm text-neutral-600">
          O‘quvchi ko‘radigan ball:{" "}
          <b className="tabular-nums text-neutral-900">
            {score !== null ? `${formatScore(score)} / ${a.max_score}` : "yo‘q"}
          </b>
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* Chap tomon: o'quvchi javobi */}
        <div className={`${card} space-y-4 p-4`}>
          <h2 className="font-semibold">O‘quvchi javobi</h2>
          <details className="rounded-xl bg-neutral-50 px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-neutral-700">
              Vazifa ko‘rsatmasi va mezonlar
            </summary>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {a.instructions || "Ko‘rsatma yozilmagan."}
            </p>
            {a.rubric ? (
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-neutral-600">
                <b>Mezonlar:</b> {a.rubric}
              </p>
            ) : null}
          </details>
          {a.lesson && s.answers ? (
            <LessonResultView lesson={a.lesson as Lesson} answers={s.answers} result={s.lesson_result ?? null} />
          ) : s.text_content ? (
            <p lang="en" className="whitespace-pre-wrap leading-relaxed">
              {s.text_content}
            </p>
          ) : null}
          {images.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <li key={image.path}>
                  <a href={image.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`${index + 1}-rasm`}
                      className="w-full rounded-xl border border-neutral-200 object-contain"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {!s.text_content && !s.answers && images.length === 0 ? (
            <p className="text-sm text-neutral-600">Javob bo‘sh.</p>
          ) : null}
        </div>

        {/* O'ng tomon: AI fikri va o'qituvchi bahosi */}
        <div className="space-y-5">
          <div className={`${card} space-y-4 p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Sun’iy intellekt fikri</h2>
              {s.ai_status !== "pending" ? <RerunAiButton submissionId={s.id} /> : null}
            </div>

            {s.ai_status === "pending" ? (
              <AiWaiting submissionId={s.id} />
            ) : s.ai_status === "error" || !feedback ? (
              <Notice tone="error">
                <p className="font-semibold">AI bu javobni tekshira olmadi.</p>
                {s.ai_error ? <p className="mt-1 break-words text-xs">{s.ai_error}</p> : null}
                <p className="mt-1">«AI’ni qayta ishga tushirish» tugmasini bosing yoki o‘zingiz baholang.</p>
              </Notice>
            ) : (
              <>
                <p className="text-sm text-neutral-600">
                  AI bali:{" "}
                  <b className="tabular-nums text-neutral-900">
                    {s.ai_score !== null ? `${formatScore(s.ai_score)} / ${a.max_score}` : "yo‘q"}
                  </b>
                  {s.is_late && a.late_penalty_percent > 0 && feedback.score !== undefined
                    ? ` (jarimasiz ${formatScore(feedback.score)}, kech topshirish −${a.late_penalty_percent}%)`
                    : ""}
                </p>
                <FeedbackView feedback={feedback} />
              </>
            )}
          </div>

          <div className={`${card} p-4`}>
            <h2 className="mb-3 font-semibold">Sizning bahoyingiz</h2>
            <ReviewForm
              submissionId={s.id}
              maxScore={a.max_score}
              initialScore={s.teacher_score !== null ? String(Number(s.teacher_score)) : ""}
              initialComment={s.teacher_comment ?? ""}
              aiScore={s.ai_score !== null ? formatScore(s.ai_score) : null}
              reviewed={Boolean(s.reviewed_at)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
