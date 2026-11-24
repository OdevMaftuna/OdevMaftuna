"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { retryLesson, submitLesson } from "@/app/actions/lessons";
import { Notice, btn } from "@/components/ui";
import {
  emptyAnswers,
  lessonWeights,
  progress,
  type Lesson,
  type LessonAnswers,
  type ReadingAnswers,
  type ReadingContent,
  type ReviewAnswers,
} from "@/lib/lesson/types";
import { AudioPlayer, Choice, QuizOptions, FillItem, Section, SpeakButton, Tabs, VocabList, inputClass } from "./lesson-ui";
import { ListeningPanel } from "./listening-panel";
import { SpeakingPanel } from "./speaking-panel";
import { StudyGuide, type LessonStep } from "@/components/study-guide";
import { MultilevelView } from "./multilevel";

// ---------------------------------------------------------------------------
// Bitta matn (reading)
// ---------------------------------------------------------------------------
type ReadingTab = "text" | "vocab" | "exercises" | "writing";

function ReadingPanel({
  r,
  a,
  set,
  audioUrl,
}: {
  r: ReadingContent;
  a: ReadingAnswers;
  set: (fn: (a: ReadingAnswers) => ReadingAnswers) => void;
  audioUrl: string | null;
}) {
  const [tab, setTab] = useState<ReadingTab>("text");
  const exDone =
    a.tf.filter((v) => v !== null).length + a.mc.filter((v) => v !== null).length + a.fill.filter(Boolean).length +
    a.wordTr.filter((v) => v.trim()).length + a.vocabQuiz.filter((v) => v !== null).length;
  const exTotal = r.tf.length + r.mc.length + r.fill.items.length + r.wordTr.length + r.vocabQuiz.length;
  const wrDone = a.translate.filter((v) => v.trim()).length + a.sentences.filter((v) => v.trim()).length;
  const wrTotal = r.translate.length + r.sentences.length;

  const upd = <K extends keyof ReadingAnswers>(k: K, i: number, v: ReadingAnswers[K][number]) =>
    set((prev) => {
      const arr = [...(prev[k] as unknown[])];
      arr[i] = v;
      return { ...prev, [k]: arr };
    });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">
          Unit {r.unit} · {r.unitTitle}
        </p>
        <h2 lang="en" className="mt-1 text-xl font-semibold tracking-tight">{r.title}</h2>
      </div>

      <Tabs
        items={[
          { id: "text", label: "Text" },
          { id: "vocab", label: "Vocabulary", badge: String(r.vocab.length) },
          { id: "exercises", label: "Exercises", badge: `${exDone}/${exTotal}` },
          { id: "writing", label: "Writing", badge: `${wrDone}/${wrTotal}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "text" ? (
        <Section title="Read the text" hint="Read it once without looking at the vocabulary, then listen.">
          {audioUrl ? (
            <AudioPlayer src={audioUrl} label="Listen to the text" segments={r.segments} segmentLabel="Listen paragraph by paragraph (1 — title)" />
          ) : (
            <SpeakButton text={r.text.join(" ")} label="Listen to the whole text" />
          )}
          <div lang="en" className="space-y-3 text-[15px] leading-7 text-neutral-800">
            {r.text.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <button type="button" className={btn.secondary} onClick={() => setTab("vocab")}>
            Go to vocabulary →
          </button>
        </Section>
      ) : null}

      {tab === "vocab" ? (
        <Section title="New words" hint="Listen to each word and revise with the flashcards.">
          <VocabList vocab={r.vocab} />
          <button type="button" className={btn.secondary} onClick={() => setTab("exercises")}>
            Go to exercises →
          </button>
        </Section>
      ) : null}

      {tab === "exercises" ? (
        <div className="space-y-4">
          <Section title="A. True or False?" hint="According to the text, is it true or false?">
            {r.tf.map((q, i) => (
              <div key={i}>
                <p lang="en" className="text-sm font-medium">
                  <span className="text-neutral-500">{i + 1}.</span> {q.q}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Choice selected={a.tf[i] === true} onClick={() => upd("tf", i, true)}>True</Choice>
                  <Choice selected={a.tf[i] === false} onClick={() => upd("tf", i, false)}>False</Choice>
                </div>
              </div>
            ))}
          </Section>
          <Section title="B. Choose the correct answer" hint="Choose the correct answer.">
            {r.mc.map((q, i) => (
              <QuizOptions key={i} n={i + 1} q={q.q} options={q.options} letters value={a.mc[i]} onChange={(v) => upd("mc", i, v)} />
            ))}
          </Section>
          <Section title="C. Complete the sentences" hint="Choose the right word for each gap.">
            {r.fill.items.map((q, i) => (
              <FillItem key={i} n={i + 1} q={q.q} box={r.fill.box} value={a.fill[i]} onChange={(v) => upd("fill", i, v)} />
            ))}
          </Section>
          {r.wordTr.length ? (
            <Section title="D. Translate into English" hint="Write the English word.">
              {r.wordTr.map((q, i) => (
                <label key={i} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm"><span className="text-neutral-500">{i + 1}.</span> {q.uz}</span>
                  <input
                    lang="en"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={a.wordTr[i]}
                    onChange={(e) => upd("wordTr", i, e.target.value)}
                    className={inputClass}
                    placeholder="English"
                  />
                </label>
              ))}
            </Section>
          ) : null}
          <Section title="Vocabulary test" hint="Choose the correct translation.">
            {r.vocabQuiz.map((q, i) => (
              <QuizOptions key={i} n={i + 1} q={q.q} options={q.options} value={a.vocabQuiz[i]} onChange={(v) => upd("vocabQuiz", i, v)} />
            ))}
          </Section>
          <button type="button" className={btn.secondary} onClick={() => setTab("writing")}>
            Go to writing →
          </button>
        </div>
      ) : null}

      {tab === "writing" ? (
        <div className="space-y-4">
          <Section title="Translation" hint="Translate the sentences from the text into Uzbek.">
            {r.translate.map((t, i) => (
              <label key={i} className="block">
                <span lang="en" className="mb-1.5 flex items-start gap-2 text-sm font-medium">
                  <span className="text-neutral-500">{i + 1}.</span>
                  <span className="flex-1">{t.en}</span>
                  <SpeakButton text={t.en} small />
                </span>
                <textarea
                  rows={2}
                  value={a.translate[i]}
                  onChange={(e) => upd("translate", i, e.target.value)}
                  className={inputClass}
                  placeholder="Uzbek translation"
                />
              </label>
            ))}
          </Section>
          <Section title="Make sentences" hint="Write your own English sentence with each word.">
            {r.sentences.map((s, i) => (
              <label key={i} className="block">
                <span className="mb-1.5 block text-sm">
                  <span className="text-neutral-500">{i + 1}.</span>{" "}
                  <span lang="en" className="font-semibold text-brand-800">{s.en}</span>{" "}
                  <span className="text-neutral-500">— {s.uz}</span>
                </span>
                <input
                  lang="en"
                  autoComplete="off"
                  value={a.sentences[i]}
                  onChange={(e) => upd("sentences", i, e.target.value)}
                  className={inputClass}
                  placeholder="Your sentence…"
                />
              </label>
            ))}
          </Section>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Takrorlash / yakuniy test
// ---------------------------------------------------------------------------
function ReviewPanel({
  lesson,
  a,
  set,
}: {
  lesson: Extract<Lesson, { kind: "review" | "final" }>;
  a: ReviewAnswers;
  set: (fn: (a: ReviewAnswers) => ReviewAnswers) => void;
}) {
  const v = lesson.review;
  const upd = <K extends "vocabQuiz" | "wordTr" | "sentences">(k: K, i: number, val: ReviewAnswers[K][number]) =>
    set((prev) => {
      const arr = [...(prev[k] as unknown[])];
      arr[i] = val;
      return { ...prev, [k]: arr };
    });
  return (
    <div className="space-y-4">
      <Section title="Vocabulary test" hint={`Words from Units ${v.units[0]}–${v.units.at(-1)}. Choose the correct translation.`}>
        {v.vocabQuiz.map((q, i) => (
          <QuizOptions key={i} n={i + 1} q={q.q} options={q.options} value={a.vocabQuiz[i]} onChange={(val) => upd("vocabQuiz", i, val)} />
        ))}
      </Section>
      <Section title="Translate the words into English">
        {v.wordTr.map((q, i) => (
          <label key={i} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-sm"><span className="text-neutral-500">{i + 1}.</span> {q.uz}</span>
            <input lang="en" autoCapitalize="none" autoComplete="off" spellCheck={false} value={a.wordTr[i]} onChange={(e) => upd("wordTr", i, e.target.value)} className={inputClass} placeholder="English" />
          </label>
        ))}
      </Section>
      <Section title="Make sentences" hint="Write your own English sentence with each word.">
        {v.sentences.map((s, i) => (
          <label key={i} className="block">
            <span className="mb-1.5 block text-sm">
              <span className="text-neutral-500">{i + 1}.</span> <span lang="en" className="font-semibold text-brand-800">{s.en}</span>{" "}
              <span className="text-neutral-500">— {s.uz}</span>
            </span>
            <input lang="en" autoComplete="off" value={a.sentences[i]} onChange={(e) => upd("sentences", i, e.target.value)} className={inputClass} placeholder="Your sentence…" />
          </label>
        ))}
      </Section>
      {v.writing ? (
        <Section title="Essay" hint={v.writing}>
          <textarea
            lang="en"
            rows={10}
            value={a.writing}
            onChange={(e) => set((prev) => ({ ...prev, writing: e.target.value }))}
            className={inputClass}
            placeholder="Write here…"
          />
        </Section>
      ) : null}
    </div>
  );
}

function NextButton<T extends string>({ tab, go }: { tab?: { id: T; label: string }; go: (t: T) => void }) {
  if (!tab) return null;
  return (
    <button type="button" className={`${btn.primary} w-full`} onClick={() => go(tab.id)}>
      {tab.id === "submit" ? "Go to submit →" : `${tab.label} →`}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Asosiy komponent
// ---------------------------------------------------------------------------
type BeginnerLesson = Exclude<Lesson, { kind: "multilevel" }>;
type LessonViewProps = {
  preview?: boolean;
  assignmentId: string;
  lesson: Lesson;
  canSubmit: boolean;
  isLateWindow: boolean;
  penalty: number;
  userId: string;
  audioUrls: Record<string, string>;
  /** Faqat Multilevel o'qituvchi ko'rinishi: javoblar kaliti. */
  mlKeys?: string[][][];
  /** Qayta ishlash (2-urinish): testlar qayta tekshiriladi, javoblar retryLesson orqali. */
  retry?: boolean;
};

/** Dars turiga qarab: Multilevel (kitob mashqlari) yoki Beginner kunlik darsi. */
export function LessonView(props: LessonViewProps) {
  const { lesson } = props;
  if (lesson.kind === "multilevel") {
    return (
      <MultilevelView
        assignmentId={props.assignmentId}
        lesson={lesson}
        canSubmit={props.canSubmit}
        isLateWindow={props.isLateWindow}
        penalty={props.penalty}
        urls={props.audioUrls}
        preview={props.preview}
        keys={props.mlKeys}
        retry={props.retry}
      />
    );
  }
  return <BeginnerLessonView {...props} lesson={lesson} />;
}

function BeginnerLessonView({
  retry = false,
  assignmentId,
  lesson,
  canSubmit,
  isLateWindow,
  penalty,
  userId,
  audioUrls,
  preview = false,
}: {
  /** O'qituvchi ko'rish rejimi: topshirish va ovoz yozish o'chirilgan. */
  preview?: boolean;
  retry?: boolean;
  mlKeys?: string[][][];
  assignmentId: string;
  lesson: BeginnerLesson;
  canSubmit: boolean;
  isLateWindow: boolean;
  penalty: number;
  userId: string;
  /** lesson-audio yo'li → vaqtinchalik (imzolangan) havola. */
  audioUrls: Record<string, string>;
}) {
  const url = (path?: string | null) => (path ? (audioUrls[path] ?? null) : null);
  const w = lessonWeights(lesson);
  const router = useRouter();
  const draftKey = `${preview ? "lesson-preview" : retry ? "lesson-retry" : "lesson-draft"}:${assignmentId}`;
  const [answers, setAnswers] = useState<LessonAnswers>(() => emptyAnswers(lesson));
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  type Tab = `r${number}` | "review" | "listening" | "speaking" | "submit";
  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      ...(lesson.kind === "reading"
        ? lesson.readings.map((_, i) => ({ id: `r${i}` as Tab, label: `Text ${i + 1}` }))
        : [{ id: "review" as Tab, label: lesson.kind === "final" ? "Final test" : "Review" }]),
      ...(lesson.listening ? [{ id: "listening" as Tab, label: "Listening" }] : []),
      ...(lesson.speaking && !retry ? [{ id: "speaking" as Tab, label: "Speaking" }] : []),
      { id: "submit" as Tab, label: "Submit" },
    ],
    [lesson, retry],
  );
  const nextTab = (t: Tab) => tabs[tabs.findIndex((x) => x.id === t) + 1];
  const [tab, setTab] = useState<Tab>(tabs[0].id);

  // Qoralamani tiklash (telefonda sahifa yopilsa ham javoblar yo'qolmaydi).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw) as LessonAnswers;
        const base = emptyAnswers(lesson);
        // Shakli mos kelsa tiklaymiz.
        if (JSON.stringify(Object.keys(saved).sort()) === JSON.stringify(Object.keys(base).sort())) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- bir martalik tiklash
          setAnswers(saved);
        }
      }
    } catch {
      // saqlash imkoni yo'q — muammo emas
    }
    setRestored(true);
  }, [draftKey, lesson]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      // e'tiborsiz
    }
  }, [answers, draftKey, restored]);

  const { done, total } = progress(lesson, answers);
  const percent = total ? Math.round((done / total) * 100) : 0;

  const goTab = (t: Tab) => {
    setTab(t);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = () => {
    setError(null);
    const missing = total - done;
    const message =
      (missing > 0 ? `${missing} question(s) not answered. ` : "") +
      "Submit the lesson? You can’t change your answers after submitting.";
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const result = retry ? await retryLesson(assignmentId, answers) : await submitLesson(assignmentId, answers);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.refresh();
    });
  };

  const guideStep: LessonStep =
    tab === "listening" ? "listening" : tab === "speaking" ? "speaking" : tab === "submit" ? "submit" : "reading";

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-4">
      <StudyGuide
        topic="lesson"
        active={guideStep}
        recordings={lesson.speaking?.required}
        minutes={lesson.speaking ? Math.max(1, Math.round(lesson.speaking.minSeconds / 60)) : undefined}
      />
      <div className="sticky top-16 z-[5] -mx-4 border-b border-neutral-200 bg-background/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span>Done: {done} / {total}</span>
          <span className="font-semibold tabular-nums text-sun-400">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sun-400 transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2.5">
          <Tabs items={tabs} value={tab} onChange={goTab} />
        </div>
      </div>

      <div key={tab} className="page-in space-y-4">
      {lesson.kind === "reading"
        ? lesson.readings.map((r, i) =>
            tab === `r${i}` ? (
              <div key={r.id} className="space-y-4">
                <ReadingPanel
                  r={r}
                  audioUrl={url(r.audio)}
                  a={answers.readings![i]}
                  set={(fn) =>
                    setAnswers((prev) => {
                      const list = [...(prev.readings ?? [])];
                      list[i] = fn(list[i]);
                      return { ...prev, readings: list };
                    })
                  }
                />
                <NextButton tab={nextTab(`r${i}`)} go={goTab} />
              </div>
            ) : null,
          )
        : tab === "review" ? (
            <div className="space-y-4">
              <ReviewPanel lesson={lesson} a={answers.review!} set={(fn) => setAnswers((prev) => ({ ...prev, review: fn(prev.review!) }))} />
              <NextButton tab={nextTab("review")} go={goTab} />
            </div>
          ) : null}

      {tab === "listening" && lesson.listening && answers.listening ? (
        <div className="space-y-4">
          <ListeningPanel
            l={lesson.listening}
            audioUrl={url(lesson.listening.audio)}
            a={answers.listening}
            set={(fn) => setAnswers((prev) => ({ ...prev, listening: fn(prev.listening!) }))}
          />
          <NextButton tab={nextTab("listening")} go={goTab} />
        </div>
      ) : null}

      {tab === "speaking" && lesson.speaking && answers.speaking ? (
        <div className="space-y-4">
          <SpeakingPanel
            s={lesson.speaking}
            sampleUrl={url(lesson.speaking.sampleAudio)}
            a={answers.speaking}
            set={(fn) => setAnswers((prev) => ({ ...prev, speaking: fn(prev.speaking!) }))}
            userId={userId}
            assignmentId={assignmentId}
            preview={preview}
          />
          <NextButton tab={nextTab("speaking")} go={goTab} />
        </div>
      ) : null}

      {tab === "submit" ? (
        <Section title="Submit the lesson" hint="Tests are checked at once; writing and recordings are marked by AI.">
          <ul className="space-y-1.5 rounded-xl border border-neutral-200 p-3 text-sm">
            <li className="flex justify-between"><span>{lesson.kind === "reading" ? "Reading" : "Review"} — test</span><b className="tabular-nums">{w.auto}</b></li>
            <li className="flex justify-between"><span>Writing (translation, sentences) — AI</span><b className="tabular-nums">{w.written}</b></li>
            {lesson.listening ? <li className="flex justify-between"><span>Listening — test</span><b className="tabular-nums">{w.listening}</b></li> : null}
            {lesson.speaking ? (
              <>
                <li className="flex justify-between">
                  <span>Speaking — {answers.speaking?.recordings.length ?? 0}/{lesson.speaking.required} recordings</span>
                  <b className="tabular-nums">{w.speakingDone}</b>
                </li>
                <li className="flex justify-between"><span>Speaking — AI listens to 2 recordings</span><b className="tabular-nums">{w.speakingAi}</b></li>
              </>
            ) : null}
            <li className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold"><span>Total</span><span className="tabular-nums">100</span></li>
          </ul>
          {lesson.speaking && (answers.speaking?.recordings.length ?? 0) < lesson.speaking.required ? (
            <Notice tone="info">
              Speaking: {lesson.speaking.required - (answers.speaking?.recordings.length ?? 0)} recording(s) missing. You lose points for each missing recording.
            </Notice>
          ) : null}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-2xl font-semibold tabular-nums">{done}</p>
              <p className="text-xs text-neutral-500">answered</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className={`text-2xl font-semibold tabular-nums ${total - done > 0 ? "text-amber-700" : "text-emerald-700"}`}>{total - done}</p>
              <p className="text-xs text-neutral-500">not answered</p>
            </div>
          </div>
          {isLateWindow ? (
            <Notice tone="info">
              The deadline has passed. If you submit now, {penalty}% will be taken off your score.
            </Notice>
          ) : null}
          <p className="text-sm text-neutral-600">
            You can submit the lesson only <b>once</b>. Your answers are saved on this phone — take your time.
          </p>
          {error ? <Notice tone="error">{error}</Notice> : null}
          {preview ? (
            <Notice tone="info">Preview mode: the teacher can’t submit from here.</Notice>
          ) : (
            <button type="button" onClick={submit} disabled={!canSubmit || pending} className={`${btn.primary} h-12 w-full text-base`}>
              {pending ? "Submitting…" : "Submit the lesson"}
            </button>
          )}
        </Section>
      ) : null}
      </div>
    </div>
  );
}
