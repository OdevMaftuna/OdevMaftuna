import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Countdown } from "@/components/countdown";
import { FeedbackView, parseFeedback } from "@/components/feedback-view";
import { Badge, Notice, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { formatDateTimeEn as formatDateTime } from "@/lib/datetime";
import { formatScore } from "@/lib/format";
import { lessonAudioUrls } from "@/lib/lesson/audio";
import { ScoreSticker } from "@/components/score-sticker";
import { freshSeed, moodForPercent, pickText } from "@/lib/stickers";
import { loadStudentAssignment } from "@/lib/student-data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonKey } from "@/lib/lesson/types";
import { AiPending } from "./ai-pending";
import { LessonResultView } from "./lesson/lesson-result";
import { LessonAttempts } from "./lesson/attempts";
import { LessonView } from "./lesson/lesson-view";
import { SubmissionForm } from "./submission-form";

export const metadata: Metadata = { title: "Homework" };

// Javob yuborilgach AI tekshiruvi shu so'rov ichida fonda ishlaydi (Vercel'da 60 soniyagacha).
export const maxDuration = 60;

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStudent();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  // E'lon qilinmagan vazifani baza qaytarmaydi — o'quvchi uchun u "yo'q".
  const loaded = await loadStudentAssignment(id);
  if (!loaded) notFound();
  const { item: a, now, images } = loaded;
  const stickerSeed = freshSeed();
  const s = a.submission;
  const canSubmit = a.state !== "closed";
  const feedback = s?.ai_status === "done" ? parseFeedback(s.ai_feedback) : null;
  const lesson = a.lesson ?? null;
  const lessonDone = Boolean(lesson && s?.answers);
  const audioUrls = lesson ? await lessonAudioUrls(lesson) : {};
  // Multilevel: topshirilgandan keyin — kalitdan audio matnlari va izohlar (kalit o'zi brauzerga chiqmaydi).
  const mlInfo =
    lesson?.kind === "multilevel" && lessonDone
      ? (((await createAdminClient().from("assignment_keys").select("key").eq("assignment_id", a.id).maybeSingle()).data?.key as LessonKey | undefined)?.mlInfo ?? undefined)
      : undefined;

  return (
    <article className="space-y-5">
      <Link href="/oquvchi/vazifalar" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Back to homework
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{a.title}</h1>
          {s ? (
            <Badge tone={s.is_late ? "amber" : "green"}>
              {s.is_late ? "Submitted late" : "Submitted"}
            </Badge>
          ) : a.state === "closed" ? (
            <Badge tone="red">Not submitted</Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Deadline: {formatDateTime(a.due_at)} · {a.max_score} points
        </p>
        {a.state === "open" ? (
          <p className="mt-1 text-sm">
            <span className="text-neutral-600">Time left: </span>
            <Countdown dueAt={a.due_at} serverNow={now} />
          </p>
        ) : null}
      </header>

      {a.state === "late_open" ? (
        <Notice tone="info">
          The deadline has passed. If you submit now, it will be marked <b>late</b> and
          {a.late_penalty_percent}% will be taken off your score.
        </Notice>
      ) : null}

      {/* Darsda ko'rsatma odatda yashirin; CEFR kunlik plan kabi ko'p qatorli reja bo'lsa — ko'rsatiladi. */}
      {lesson && !(lesson.kind === "multilevel" && a.instructions?.includes("\n")) ? null : (
      <section className={`${card} p-4`}>
        <h2 className="text-sm font-semibold text-neutral-500">{lesson ? "Today’s plan" : "Instructions"}</h2>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed">
          {a.instructions || "No instructions."}
        </p>
      </section>
      )}

      {s && (!lesson || lessonDone) ? (
        <section className={`${card} space-y-4 p-4`}>
          <h2 className="text-sm font-semibold text-neutral-500">Result</h2>

          {s.final_score !== null ? (
            <div className="flex flex-wrap items-center gap-4">
              <ScoreSticker percent={(s.final_score / a.max_score) * 100} size={96} showText={false} seed={stickerSeed} />
              <div className="min-w-0 flex-1">
              <p className="text-2xl font-semibold tabular-nums">
                {formatScore(s.final_score)}
                <span className="text-base font-normal text-neutral-500"> / {a.max_score}</span>
              </p>
              <p className="text-sm font-semibold" style={{ color: "#F5C76A" }}>
                {pickText(moodForPercent((s.final_score / a.max_score) * 100), stickerSeed).title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {s.teacher_score !== null
                  ? "Score given by the teacher"
                  : s.is_late && a.late_penalty_percent > 0
                    ? `AI score · ${a.late_penalty_percent}% taken off for late submission`
                    : lesson
                      ? "Tests (automatic) + writing and speaking (AI) · the teacher may change it"
                      : "AI score · the teacher may change it"}
              </p>
              </div>
            </div>
          ) : s.ai_status === "done" ? (
            <p className="text-sm text-neutral-600">
              Your score will appear after the teacher checks it.
            </p>
          ) : null}

          {s.teacher_comment ? (
            <div>
              <h3 className="text-sm font-semibold">Teacher’s comment</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                {s.teacher_comment}
              </p>
            </div>
          ) : null}

          {s.ai_status === "pending" ? (
            <AiPending assignmentId={a.id} />
          ) : feedback ? (
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-500">
                AI feedback
              </h3>
              <FeedbackView feedback={feedback} />
            </div>
          ) : (
            <Notice tone="info">
              Your work was received. The mark will come later.
            </Notice>
          )}
        </section>
      ) : null}

      {lesson ? (
        lessonDone ? (
          lesson.kind === "multilevel" ? (
            <LessonResultView lesson={lesson} answers={s!.answers!} result={s!.lesson_result} audioUrls={audioUrls} mlInfo={mlInfo} retryAssignmentId={a.id} />
          ) : (
            <LessonAttempts lesson={lesson} answers={s!.answers!} result={s!.lesson_result} audioUrls={audioUrls} assignmentId={a.id} userId={profile.id} />
          )
        ) : canSubmit ? (
          <LessonView
            assignmentId={a.id}
            userId={profile.id}
            audioUrls={audioUrls}
            lesson={lesson}
            canSubmit={canSubmit}
            isLateWindow={a.state === "late_open"}
            penalty={a.late_penalty_percent}
          />
        ) : (
          <Notice tone="info">The deadline is over. No answers were sent for this lesson.</Notice>
        )
      ) : canSubmit ? (
        <section className={`${card} p-4`}>
          <h2 className="font-semibold">{s ? "Your answer" : "Send your answer"}</h2>
          {s ? (
            <p className="mt-1 text-sm text-neutral-600">
              Sent on {formatDateTime(s.submitted_at)}. You can change it until
              the deadline.
            </p>
          ) : null}
          <div className="mt-4">
            <SubmissionForm
              key={s?.submitted_at ?? "new"}
              assignmentId={a.id}
              userId={profile.id}
              submissionType={a.submission_type}
              initialText={s?.text_content ?? ""}
              initialImages={images}
              hasSubmission={Boolean(s)}
            />
          </div>
        </section>
      ) : (
        <section className={`${card} p-4`}>
          <h2 className="font-semibold">Your answer</h2>
          {s ? (
            <>
              <p className="mt-1 text-sm text-neutral-600">
                Sent on {formatDateTime(s.submitted_at)}.
              </p>
              {s.text_content ? (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 leading-relaxed">
                  {s.text_content}
                </p>
              ) : null}
              {images.length > 0 ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image) => (
                    <li key={image.path}>
                      <a href={image.url} target="_blank" rel="noreferrer">
                        {/* Imzolangan vaqtinchalik havola — next/image mos kelmaydi. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt="Uploaded photo"
                          className="aspect-[3/4] w-full rounded-xl border border-neutral-200 object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">
              The deadline is over. No answer was sent for this task.
            </p>
          )}
        </section>
      )}
    </article>
  );
}
