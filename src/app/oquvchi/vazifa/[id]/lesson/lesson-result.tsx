import type { ReactNode } from "react";
import { MultilevelResult } from "./multilevel";
import { FeedbackView, parseFeedback } from "@/components/feedback-view";
import { formatScore } from "@/lib/format";
import {
  lessonWeights,
  type CheckedItem,
  type Lesson,
  type LessonAnswers,
  type LessonResult,
  type MlInfo,
  type ReadingAnswers,
  type ReadingContent,
} from "@/lib/lesson/types";

/** Topshirilgan dars natijasi: har bir savol bo'yicha ✓/✗, to'g'ri javob va yozma qism. O'quvchi va o'qituvchi uchun. */

function Mark({ ok }: { ok: boolean }) {
  return (
    <span
      aria-label={ok ? "Correct" : "Wrong"}
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

function Block({ title, score, children }: { title: string; score?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {score ? <span className="text-sm tabular-nums text-neutral-500">{score}</span> : null}
      </div>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </section>
  );
}

function Row({ n, question, given, item }: { n: number; question: string; given: string; item: CheckedItem }) {
  return (
    <li className="flex gap-2.5 text-sm">
      <Mark ok={item.ok} />
      <div className="min-w-0">
        <p lang="en">
          <span className="text-neutral-500">{n}.</span> {question}
        </p>
        <p className="mt-1">
          <span
            translate="no"
            className={`inline-block rounded-md border px-2 py-0.5 font-medium ${
              item.ok ? "border-emerald-500/60 bg-emerald-50 text-emerald-800" : "border-red-500/60 bg-red-50 text-red-700"
            }`}
          >
            {given || "—"}
          </span>
        </p>
        {item.ok ? null : (
          <p translate="no" className="mt-1 border-l-4 border-emerald-500/70 pl-2 text-xs font-semibold text-emerald-800">
            To‘g‘ri javob: {item.correct}
          </p>
        )}
      </div>
    </li>
  );
}

/** AI'ning har bir yozma javob bo'yicha hukmi (writtenText dagi #1, #2… tartibida). */
type Verdict = { n: number; verdict: "correct" | "partly" | "wrong" | "empty"; correct: string; explain: string };

function verdictsOf(result: LessonResult | null): Verdict[] {
  const items = (result as (LessonResult & { writtenFeedback?: { items?: Verdict[] } }) | null)?.writtenFeedback?.items ?? [];
  return [...items].sort((a, b) => a.n - b.n);
}

const count = (items: CheckedItem[]) => `${items.filter((i) => i.ok).length}/${items.length}`;

function ReadingResultView({ r, a, res, verdicts }: { r: ReadingContent; a: ReadingAnswers; res: NonNullable<LessonResult["readings"]>[number]; verdicts: Verdict[] }) {
  return (
    <div className="space-y-3">
      <h2 lang="en" className="text-lg font-semibold">
        <span className="text-sun-400">Unit {r.unit}</span> · {r.title}
      </h2>
      <Block title="A. True or False" score={count(res.tf)}>
        {res.tf.map((it, i) => (
          <Row key={i} n={i + 1} question={r.tf[i].q} given={a.tf[i] === null ? "" : a.tf[i] ? "True" : "False"} item={it} />
        ))}
      </Block>
      <Block title="B. Correct answer" score={count(res.mc)}>
        {res.mc.map((it, i) => (
          <Row key={i} n={i + 1} question={r.mc[i].q} given={a.mc[i] === null ? "" : `${"ABC"[a.mc[i]!]}) ${r.mc[i].options[a.mc[i]!]}`} item={it} />
        ))}
      </Block>
      <Block title="C. Gaps" score={count(res.fill)}>
        {res.fill.map((it, i) => (
          <Row key={i} n={i + 1} question={r.fill.items[i].q} given={a.fill[i] ?? ""} item={it} />
        ))}
      </Block>
      {res.wordTr.length ? (
        <Block title="D. Translate into English" score={count(res.wordTr)}>
          {res.wordTr.map((it, i) => (
            <Row key={i} n={i + 1} question={r.wordTr[i].uz} given={a.wordTr[i]} item={it} />
          ))}
        </Block>
      ) : null}
      <Block title="Vocabulary test" score={count(res.vocabQuiz)}>
        {res.vocabQuiz.map((it, i) => (
          <Row key={i} n={i + 1} question={r.vocabQuiz[i].q} given={a.vocabQuiz[i] === null ? "" : r.vocabQuiz[i].options[a.vocabQuiz[i]!]} item={it} />
        ))}
      </Block>
      <WrittenBlock
        items={[
          ...r.translate.map((t, i) => ({ label: `Translation: “${t.en}”`, value: a.translate[i] })),
          ...r.sentences.map((s, i) => ({ label: `Sentence: ${s.en} (${s.uz})`, value: a.sentences[i] })),
        ]}
        verdicts={verdicts}
      />
    </div>
  );
}

const VERDICT = {
  correct: { icon: "✓", box: "border-emerald-500/60 bg-emerald-50 text-emerald-800", label: "To‘g‘ri" },
  partly: { icon: "≈", box: "border-amber-500/60 bg-amber-50 text-amber-800", label: "Qisman to‘g‘ri" },
  wrong: { icon: "✗", box: "border-red-500/60 bg-red-50 text-red-700", label: "Xato" },
  empty: { icon: "—", box: "border-neutral-300 bg-neutral-50 text-neutral-500", label: "Javob yo‘q" },
} as const;

/**
 * Yozma qism — test-english uslubida: har bir javob rangli ramkada (✓ / ≈ / ✗),
 * ostida to'g'ri javob va nega shunday ekanining qisqa izohi.
 */
function WrittenBlock({ items, verdicts = [] }: { items: { label: string; value: string }[]; verdicts?: Verdict[] }) {
  const has = verdicts.length > 0;
  const ok = verdicts.slice(0, items.length).filter((v) => v.verdict === "correct").length;
  return (
    <section className="rounded-2xl border border-neutral-200 bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">
          Writing <span className="text-xs font-normal text-neutral-500">· marked by AI</span>
        </h3>
        {has ? <span className="text-sm tabular-nums text-neutral-500">{ok}/{items.length}</span> : null}
      </div>
      <ul className="mt-3 space-y-4 text-sm">
        {items.map((it, i) => {
          const v = verdicts[i];
          const st = v ? VERDICT[v.verdict] : null;
          const answer = it.value.trim();
          return (
            <li key={i}>
              <p lang="en" className="text-xs text-neutral-500">
                <span className="font-semibold">{i + 1}.</span> {it.label}
              </p>
              <div className="mt-1 flex items-start gap-2">
                <p translate="no" className={`min-w-0 flex-1 whitespace-pre-wrap rounded-lg border px-2.5 py-1.5 ${st ? st.box : "border-neutral-200"}`}>
                  {answer || <span className="text-neutral-400">— no answer</span>}
                </p>
                {st ? (
                  <span aria-label={st.label} title={st.label} className="mt-1.5 shrink-0 text-base font-bold leading-none">
                    {st.icon}
                  </span>
                ) : null}
              </div>
              {v && v.verdict !== "correct" ? (
                <div className="mt-1.5 rounded-lg border-l-4 border-emerald-500/70 bg-emerald-50/50 px-3 py-2">
                  <p translate="no" className="font-semibold text-emerald-800">To‘g‘ri javob: {v.correct}</p>
                  {v.explain ? <p className="mt-0.5 text-xs text-neutral-600">{v.explain}</p> : null}
                </div>
              ) : v?.explain ? (
                <p className="mt-1 text-xs text-emerald-700">👍 {v.explain}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!has ? <p className="mt-3 text-xs text-neutral-500">Har bir javob bo‘yicha izoh AI tekshirgach shu yerda chiqadi.</p> : null}
    </section>
  );
}

function Tile({ label, score, max, note }: { label: string; score: number | null; max: number; note: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-surface p-3.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {score === null ? "…" : formatScore(score)}
        <span className="text-sm font-normal text-neutral-500"> / {max}</span>
      </p>
      <p className="text-xs text-neutral-500">{note}</p>
    </div>
  );
}

function ListeningResultView({
  l,
  a,
  res,
  audioUrl,
}: {
  l: NonNullable<Lesson["listening"]>;
  a: NonNullable<LessonAnswers["listening"]>;
  res: NonNullable<LessonResult["listening"]>;
  audioUrl: string | null;
}) {
  return (
    <div className="space-y-3">
      <h2 lang="en" className="text-lg font-semibold">
        <span className="text-sun-400">Listening</span> · {l.title}
      </h2>
      <Block title="A. True or False" score={count(res.tf)}>
        {res.tf.map((it, i) => (
          <Row key={i} n={i + 1} question={l.tf[i].q} given={a.tf[i] === null ? "" : a.tf[i] ? "True" : "False"} item={it} />
        ))}
      </Block>
      <Block title="B. Correct answer" score={count(res.mc)}>
        {res.mc.map((it, i) => (
          <Row key={i} n={i + 1} question={l.mc[i].q} given={a.mc[i] === null ? "" : `${"ABC"[a.mc[i]!]}) ${l.mc[i].options[a.mc[i]!]}`} item={it} />
        ))}
      </Block>
      <Block title="C. Gaps" score={count(res.gaps)}>
        {res.gaps.map((it, i) => (
          <Row key={i} n={i + 1} question={l.gaps[i].q} given={a.gaps[i]} item={it} />
        ))}
      </Block>
      <section className="rounded-2xl border border-neutral-200 bg-surface p-4">
        <h3 className="font-semibold">Dialogue script</h3>
        <p className="mt-0.5 text-xs text-neutral-500">Now listen once more while reading the script.</p>
        {audioUrl ? (
          <audio controls preload="none" src={audioUrl} className="mt-3 w-full" />
        ) : null}
        <ul lang="en" className="mt-3 space-y-1.5 text-sm">
          {res.lines.map((line, i) => (
            <li key={i}>
              <b className={l.speakers.indexOf(line.speaker) === 1 ? "text-sun-400" : "text-brand-800"}>{line.speaker}:</b> {line.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SpeakingResultView({ s, a, res, verdicts }: { s: NonNullable<Lesson["speaking"]>; a: NonNullable<LessonAnswers["speaking"]>; res: NonNullable<LessonResult["speaking"]>; verdicts: Verdict[] }) {
  const fb = res.ai?.feedback ? parseFeedback(res.ai.feedback) : null;
  return (
    <div className="space-y-3">
      <h2 lang="en" className="text-lg font-semibold">
        <span className="text-sun-400">Speaking</span> · {s.title}
      </h2>
      <section className="rounded-2xl border border-neutral-200 bg-surface p-4 text-sm">
        <p>
          Recordings: <b className="tabular-nums">{res.count}</b> / {res.required}
          {res.recordings.length ? (
            <span className="text-neutral-500"> · total {Math.round(res.recordings.reduce((t, r) => t + r.seconds, 0) / 60)} min</span>
          ) : null}
        </p>
        {res.ai ? (
          <p className="mt-1 text-neutral-600">
            {res.ai.checked.length
              ? `The AI listened to recording(s) ${res.ai.checked.join(" and ")}.`
              : "There were no recordings to check."}
          </p>
        ) : (
          <p className="mt-1 text-neutral-600">The AI is listening to your recordings…</p>
        )}
        {res.deleted ? <p className="mt-1 text-xs text-neutral-500">Recordings were deleted after checking (score and comments are kept).</p> : null}
        {fb ? (
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <FeedbackView feedback={fb} />
          </div>
        ) : null}
      </section>
      <WrittenBlock items={s.sentenceWords.map((w, i) => ({ label: `Sentence: ${w.en} (${w.uz})`, value: a.sentences[i] ?? "" }))} verdicts={verdicts} />
    </div>
  );
}

export function LessonResultView({
  lesson,
  answers,
  result,
  audioUrls = {},
  mlInfo,
  retryAssignmentId,
}: {
  lesson: Lesson;
  answers: LessonAnswers;
  result: LessonResult | null;
  audioUrls?: Record<string, string>;
  /** Multilevel: audio matnlari va izohlar. */
  mlInfo?: MlInfo[];
  /** Multilevel: berilsa — o'quvchi qayta ishlay oladi. */
  retryAssignmentId?: string;
}) {
  if (lesson.kind === "multilevel")
    return <MultilevelResult lesson={lesson} answers={answers} result={result} urls={audioUrls} mlInfo={mlInfo} assignmentId={retryAssignmentId} />;
  // writtenText tartibi: (reading: har bir matn — tarjimalar, gaplar | review: gaplar, insho), keyin speaking gaplari.
  const verdicts = verdictsOf(result);
  const readingStarts: number[] = [];
  let off = 0;
  if (lesson.kind === "reading") {
    for (const r of lesson.readings) {
      readingStarts.push(off);
      off += r.translate.length + r.sentences.length;
    }
  } else {
    off = lesson.review.sentences.length + (lesson.review.writing ? 1 : 0);
  }
  const speakingStart = off;
  return (
    <div className="space-y-4">
      {result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile
            label={lesson.kind === "reading" ? "Reading — test" : "Review — test"}
            score={result.auto.score}
            max={result.auto.max}
            note={`${result.auto.correct} / ${result.auto.total} correct`}
          />
          <Tile
            label="Writing (AI)"
            score={result.ai?.score ?? null}
            max={result.ai?.max ?? lessonWeights(lesson).written}
            note={result.ai ? "marked" : "checking…"}
          />
          {result.listening ? (
            <Tile label="Listening" score={result.listening.score} max={result.listening.max} note={`${result.listening.correct} / ${result.listening.total} correct`} />
          ) : null}
          {result.speaking ? (
            <>
              <Tile label="Speaking — recordings" score={result.speaking.score} max={result.speaking.max} note={`${result.speaking.count} / ${result.speaking.required}`} />
              <Tile
                label="Speaking (AI)"
                score={result.speaking.ai?.score ?? null}
                max={result.speaking.ai?.max ?? lessonWeights(lesson).speakingAi}
                note={result.speaking.ai ? "marked" : "checking…"}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {lesson.listening && result?.listening && answers.listening ? (
        <ListeningResultView
          l={lesson.listening}
          a={answers.listening}
          res={result.listening}
          audioUrl={lesson.listening.audio ? (audioUrls[lesson.listening.audio] ?? null) : null}
        />
      ) : null}

      {lesson.speaking && result?.speaking && answers.speaking ? (
        <SpeakingResultView s={lesson.speaking} a={answers.speaking} res={result.speaking} verdicts={verdicts.slice(speakingStart)} />
      ) : null}

      {lesson.kind === "reading" && result?.readings
        ? lesson.readings.map((r, i) => (
            <ReadingResultView
              key={r.id}
              r={r}
              a={answers.readings![i]}
              res={result.readings![i]}
              verdicts={verdicts.slice(readingStarts[i], readingStarts[i] + r.translate.length + r.sentences.length)}
            />
          ))
        : null}

      {lesson.kind !== "reading" && result?.review && answers.review ? (
        <div className="space-y-3">
          <Block title="Vocabulary test" score={count(result.review.vocabQuiz)}>
            {result.review.vocabQuiz.map((it, i) => (
              <Row
                key={i}
                n={i + 1}
                question={lesson.review.vocabQuiz[i].q}
                given={answers.review!.vocabQuiz[i] === null ? "" : lesson.review.vocabQuiz[i].options[answers.review!.vocabQuiz[i]!]}
                item={it}
              />
            ))}
          </Block>
          <Block title="Word translation" score={count(result.review.wordTr)}>
            {result.review.wordTr.map((it, i) => (
              <Row key={i} n={i + 1} question={lesson.review.wordTr[i].uz} given={answers.review!.wordTr[i]} item={it} />
            ))}
          </Block>
          <WrittenBlock
            items={[
              ...lesson.review.sentences.map((s, i) => ({ label: `Sentence: ${s.en} (${s.uz})`, value: answers.review!.sentences[i] })),
              ...(lesson.review.writing ? [{ label: `Essay: ${lesson.review.writing}`, value: answers.review!.writing }] : []),
            ]}
            verdicts={verdicts.slice(0, speakingStart)}
          />
        </div>
      ) : null}
    </div>
  );
}
