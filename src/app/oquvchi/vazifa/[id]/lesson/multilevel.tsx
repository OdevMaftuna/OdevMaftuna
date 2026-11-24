"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { retryLesson, submitLesson } from "@/app/actions/lessons";
import { Notice, btn } from "@/components/ui";
import { MAX_ML_ATTEMPTS, type CheckedItem, type LessonAnswers, type LessonResult, type MlBlock, type MlInfo, type MultilevelLesson } from "@/lib/lesson/types";
import { AudioPlayer, Section, Tabs, inputClass } from "./lesson-ui";

/**
 * MULTILEVEL darsi (Multilevel Master Reading / Listening): har bir blok — kitobdagi bitta mashq.
 * Savollar kitob kaliti bilan avtomatik tekshiriladi (AI yo'q).
 */

const PART_INFO: Record<string, string> = {
  "reading-1": "Read the text and fill each gap with ONE word.",
  "reading-2": "Match the people with the texts.",
  "reading-3": "Choose the correct heading for each paragraph.",
  "reading-4": "Choose the correct answer / True, False or Not Given.",
  "reading-5": "Complete the summary and answer the questions.",
  "listening-2": "Listen and fill in the missing information.",
  "listening-3": "Listen to the speakers and match them with the statements.",
  "listening-4": "Listen and label the places on the map.",
  "listening-5": "Listen to the extracts and choose the correct answer.",
  "listening-6": "Listen to the talk and fill in the gaps.",
};

/** Matnni ko'rsatish: "### sarlavha", "**qalin**", "(3) ____" bo'shliqlari ajratib ko'rsatiladi. */
function Rich({ text }: { text: string }) {
  const inline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\(\d{1,2}\)\s*_{2,}|_{3,})/g);
    return (
      <Fragment key={key}>
        {parts.map((p, i) => {
          if (/^\*\*[^*]+\*\*$/.test(p)) return <b key={i}>{p.slice(2, -2)}</b>;
          const gap = p.match(/^\((\d{1,2})\)/);
          if (gap)
            return (
              <span key={i} className="mx-0.5 inline-flex items-center rounded-md border border-dashed border-sun-400/70 bg-sun-50 px-1.5 text-[13px] font-bold text-sun-700">
                ({gap[1]}) ______
              </span>
            );
          if (/^_{3,}$/.test(p)) return <span key={i} className="mx-0.5 inline-block w-16 border-b-2 border-dashed border-neutral-400 align-middle" />;
          return <Fragment key={i}>{p}</Fragment>;
        })}
      </Fragment>
    );
  };
  return (
    <div lang="en" className="space-y-2.5 text-[15px] leading-7">
      {text
        .split(/\n{2,}|\n(?=###)/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) =>
          para.startsWith("### ") ? (
            <h4 key={i} className="pt-1 text-center text-base font-bold">
              {para.slice(4)}
            </h4>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {inline(para, i)}
            </p>
          ),
        )}
    </div>
  );
}

function BlockHeader({ b }: { b: MlBlock }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1d1608]" style={{ backgroundColor: b.book === "reading" ? "#F5C76A" : "#9ee0c4" }}>
        {b.book} · Part {b.part}
      </span>
      <span className="text-xs text-neutral-500">Exercise {b.exercise}</span>
    </div>
  );
}

/** Bitta blok: ko'rsatma, audio/rasm, matn, umumiy variantlar va savollar. */
export function MlBlockBody({
  b,
  audioUrl,
  imageUrls,
  answers,
  setAnswer,
  checked,
  showKey,
  explain,
}: {
  /** Har bir savol uchun izoh (AI: audio/matndagi dalil + o'zbekcha tushuntirish). */
  explain?: string[];
  b: MlBlock;
  audioUrl: string | null;
  imageUrls: string[];
  answers?: string[];
  setAnswer?: (j: number, v: string) => void;
  /** Natija rejimi: har bir savolning tekshiruvi. */
  checked?: CheckedItem[];
  /** O'qituvchi ko'rinishi: to'g'ri javoblar. */
  showKey?: string[][];
}) {
  const readOnly = !setAnswer;
  return (
    <div className="space-y-4">
      <BlockHeader b={b} />
      <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold">{b.instructions || PART_INFO[`${b.book}-${b.part}`]}</p>

      {b.book === "listening" ? (
        audioUrl ? (
          <AudioPlayer src={audioUrl} label="Listen to the recording" />
        ) : (
          <Notice tone="info">The recording will be added soon.</Notice>
        )
      ) : null}

      {imageUrls.length ? (
        // Kitob sahifasidagi mashq (oq fonda, xuddi kitobdagidek).
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {imageUrls.map((u, k) => (
            // eslint-disable-next-line @next/next/no-img-element -- imzolangan vaqtinchalik havola
            <img key={k} src={u} alt={`Exercise ${b.exercise}${imageUrls.length > 1 ? ` (${k + 1})` : ""}`} className="block w-full" loading="lazy" />
          ))}
        </div>
      ) : null}

      {b.title || b.passage ? (
        <div className="rounded-2xl border border-neutral-200 bg-surface p-4">
          {b.title ? <h4 className="mb-2 text-center text-base font-bold">{b.title}</h4> : null}
          {b.passage ? <Rich text={b.passage} /> : null}
        </div>
      ) : null}

      {b.bank?.length ? (
        <div className="rounded-2xl border border-neutral-200 bg-surface p-4">
          {b.bankTitle ? <p className="mb-2 text-sm font-semibold text-neutral-500">{b.bankTitle}</p> : null}
          <ul lang="en" className="space-y-1.5 text-[15px]">
            {b.bank.map((o) => (
              <li key={o.letter} className="flex gap-2">
                <b className="w-5 shrink-0 text-sun-400">{o.letter}</b>
                <span>{o.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="space-y-3">
        {b.questions.map((q, j) => {
          const v = answers?.[j] ?? "";
          const c = checked?.[j];
          const opts = q.options ?? b.bank ?? [];
          const keyText = showKey?.[j]?.join(" / ");
          return (
            <li
              key={j}
              className={`rounded-2xl border p-3 ${c ? (c.ok ? "border-emerald-500/40 bg-emerald-50/40" : "border-red-400/40 bg-red-50/40") : "border-neutral-200 bg-surface"}`}
            >
              <div className="flex items-start gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold">{q.n}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  {q.q ? <p lang="en" className="text-[15px] leading-snug">{q.q}</p> : null}
                  {q.type === "gap" ? (
                    readOnly ? (
                      <p className="text-sm">
                        <span className="text-neutral-500">Answer: </span>
                        <b>{v || "—"}</b>
                      </p>
                    ) : (
                      <input
                        value={v}
                        onChange={(e) => setAnswer!(j, e.target.value)}
                        className={inputClass}
                        placeholder="One word / a number"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    )
                  ) : q.options?.length ? (
                    <div className="grid gap-1.5">
                      {opts.map((o) => {
                        const sel = v === o.letter;
                        return (
                          <button
                            key={o.letter}
                            type="button"
                            disabled={readOnly}
                            onClick={() => setAnswer?.(j, sel ? "" : o.letter)}
                            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-[15px] transition ${
                              sel ? "border-brand-500 bg-brand-50 font-semibold" : "border-neutral-200 hover:border-brand-300"
                            }`}
                          >
                            <b className="text-sun-400">{o.letter}</b>
                            <span lang="en">{o.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {opts.map((o) => {
                        const sel = v === o.letter;
                        return (
                          <button
                            key={o.letter}
                            type="button"
                            disabled={readOnly}
                            onClick={() => setAnswer?.(j, sel ? "" : o.letter)}
                            className={`grid size-10 place-items-center rounded-xl border text-sm font-bold transition ${
                              sel ? "border-brand-500 bg-brand-700 text-white" : "border-neutral-200 hover:border-brand-300"
                            }`}
                          >
                            {o.letter}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {c ? (
                    <p className="text-sm">
                      {c.ok ? (
                        <span className="font-semibold text-emerald-600">✓ Correct</span>
                      ) : (
                        <>
                          <span className="font-semibold text-red-500">✗ </span>
                          <span className="text-neutral-500">Correct answer: </span>
                          <b className="text-emerald-600">{c.correct}</b>
                        </>
                      )}
                    </p>
                  ) : null}
                  {c && explain?.[j] ? (
                    <p className="whitespace-pre-line rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs leading-relaxed text-neutral-700">💡 {explain[j]}</p>
                  ) : null}
                  {keyText ? (
                    <p className="text-sm">
                      <span className="text-neutral-500">Key: </span>
                      <b className="text-emerald-600">{keyText}</b>
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const blockLabel = (b: MlBlock) => `${b.book === "reading" ? "Reading" : "Listening"}`;

/** O'quvchi uchun: javob berish va topshirish (o'qituvchi uchun `preview`). */
export function MultilevelView({
  assignmentId,
  lesson,
  canSubmit,
  isLateWindow,
  penalty,
  urls,
  preview = false,
  keys,
  retry = false,
}: {
  /** Qayta ishlash (2-urinish): javoblar retryLesson orqali saqlanadi. */
  retry?: boolean;
  assignmentId: string;
  lesson: MultilevelLesson;
  canSubmit: boolean;
  isLateWindow: boolean;
  penalty: number;
  urls: Record<string, string>;
  preview?: boolean;
  /** O'qituvchi ko'rinishi: kalit. */
  keys?: string[][][];
}) {
  const router = useRouter();
  const draftKey = `${preview ? "ml-preview" : retry ? "ml-retry" : "ml-draft"}:${assignmentId}`;
  const empty = () => lesson.blocks.map((b) => b.questions.map(() => ""));
  const [ml, setMl] = useState<string[][]>(empty);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  type Tab = `b${number}` | "submit";
  const tabs: { id: Tab; label: string }[] = [
    ...lesson.blocks.map((b, i) => ({ id: `b${i}` as Tab, label: blockLabel(b) })),
    ...(preview ? [] : [{ id: "submit" as Tab, label: "Submit" }]),
  ];
  const [tab, setTab] = useState<Tab>(tabs[0].id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw) as string[][];
        if (Array.isArray(saved) && saved.length === lesson.blocks.length && saved.every((x, i) => x.length === lesson.blocks[i].questions.length)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- bir martalik tiklash
          setMl(saved);
        }
      }
    } catch {}
    setRestored(true);
  }, [draftKey, lesson]);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(ml));
    } catch {}
  }, [ml, draftKey, restored]);

  const total = ml.reduce((t, b) => t + b.length, 0);
  const done = ml.reduce((t, b) => t + b.filter((v) => v.trim()).length, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const url = (p?: string | null) => (p ? (urls[p] ?? null) : null);
  const go = (t: Tab) => {
    setTab(t);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = () => {
    setError(null);
    const missing = total - done;
    if (!window.confirm((missing > 0 ? `${missing} question(s) not answered. ` : "") + "Submit the lesson? You can’t change your answers after submitting.")) return;
    startTransition(async () => {
      const answers: LessonAnswers = { ml };
      const res = retry ? await retryLesson(assignmentId, answers) : await submitLesson(assignmentId, answers);
      if (!res.ok) return setError(res.error);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.refresh();
    });
  };

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-4">
      <div className="sticky top-16 z-[5] -mx-4 border-b border-neutral-200 bg-background/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span>Done: {done} / {total}</span>
          <span className="font-semibold tabular-nums text-sun-400">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sun-400 transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2.5">
          <Tabs items={tabs} value={tab} onChange={go} />
        </div>
      </div>

      <div key={tab} className="page-in space-y-4">
        {lesson.blocks.map((b, i) =>
          tab === `b${i}` ? (
            <div key={i} className="space-y-4">
              <MlBlockBody
                b={b}
                audioUrl={url(b.audio)}
                imageUrls={(b.images ?? []).map((p) => url(p)).filter((x): x is string => Boolean(x))}
                answers={ml[i]}
                setAnswer={preview && !keys ? undefined : (j, v) => setMl((prev) => prev.map((row, x) => (x === i ? row.map((old, y) => (y === j ? v : old)) : row)))}
                showKey={keys?.[i]}
              />
              {tabs[tabs.findIndex((t) => t.id === tab) + 1] ? (
                <button type="button" className={`${btn.primary} w-full`} onClick={() => go(tabs[tabs.findIndex((t) => t.id === tab) + 1].id)}>
                  {tabs[tabs.findIndex((t) => t.id === tab) + 1].label} →
                </button>
              ) : null}
            </div>
          ) : null,
        )}

        {tab === "submit" ? (
          <Section title="Submit the lesson" hint="All answers are checked at once with the book’s answer key.">
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
            {isLateWindow ? <Notice tone="info">The deadline has passed. If you submit now, {penalty}% will be taken off your score.</Notice> : null}
            <p className="text-sm text-neutral-600">
              You can submit only <b>once</b>. Your answers are saved on this phone — take your time.
            </p>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <button type="button" onClick={submit} disabled={!canSubmit || pending} className={`${btn.primary} h-12 w-full text-base`}>
              {pending ? "Submitting…" : "Submit the lesson"}
            </button>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

/** Natija: har bir mashq bo'yicha to'g'ri / xato va to'g'ri javob. */
/** Natija: urinishlar (1-urinish rasmiy), har bir savol ✓/✗, izoh, audio matni va qayta ishlash. */
export function MultilevelResult({
  lesson,
  answers,
  result,
  urls,
  mlInfo,
  assignmentId,
}: {
  lesson: MultilevelLesson;
  answers: LessonAnswers;
  result: LessonResult | null;
  urls: Record<string, string>;
  /** Kalitdan: audio matnlari va izohlar (faqat topshirilgandan keyin beriladi). */
  mlInfo?: MlInfo[];
  /** Berilsa — o'quvchi qayta ishlay oladi. */
  assignmentId?: string;
}) {
  const url = (p?: string | null) => (p ? (urls[p] ?? null) : null);
  const attempts = [{ answers, result }, ...(result?.retries ?? []).map((r) => ({ answers: r.answers, result: r.result }))];
  const [active, setActive] = useState(attempts.length - 1);
  const [retrying, setRetrying] = useState(false);
  const canRetry = Boolean(assignmentId) && attempts.length < MAX_ML_ATTEMPTS;
  const score = (r: LessonResult | null) => (r ? `${r.auto.correct}/${r.auto.total}` : "—");

  if (retrying && assignmentId) {
    return (
      <div className="space-y-3">
        <Notice tone="info">
          {attempts.length + 1}-urinish: javoblaringiz yangidan tekshiriladi. Ball oxirgi urinish bo‘yicha qo‘yiladi, 1-urinish natijasi ham ko‘rinib turadi.
        </Notice>
        <MultilevelView assignmentId={assignmentId} lesson={lesson} canSubmit isLateWindow={false} penalty={0} urls={urls} retry />
        <button type="button" className={`${btn.secondary} w-full`} onClick={() => setRetrying(false)}>
          ← Natijalarga qaytish
        </button>
      </div>
    );
  }

  const cur = attempts[Math.min(active, attempts.length - 1)];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {attempts.map((a, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              k === active ? "border-brand-500 bg-brand-700 text-white" : "border-neutral-200 hover:border-brand-300"
            }`}
          >
            {k + 1}-urinish · {score(a.result)}
            {attempts.length > 1 && k === attempts.length - 1 ? " ✓ hisobga olinadi" : ""}
          </button>
        ))}
        {canRetry ? (
          <button type="button" onClick={() => setRetrying(true)} className={`${btn.primary} ml-auto`}>
            ↻ Qayta ishlash
          </button>
        ) : null}
      </div>

      {lesson.blocks.map((b, i) => {
        const checked = cur.result?.ml?.[i];
        const ok = checked?.filter((c) => c.ok).length ?? 0;
        const info = mlInfo?.[i];
        return (
          <Section key={i} title={`${blockLabel(b)} — ${checked ? `${ok}/${checked.length}` : ""}`}>
            <MlBlockBody
              b={b}
              audioUrl={url(b.audio)}
              imageUrls={(b.images ?? []).map((p) => url(p)).filter((x): x is string => Boolean(x))}
              answers={cur.answers.ml?.[i]}
              checked={checked}
              explain={info?.explain}
            />
            {info?.script ? (
              <details className="rounded-2xl border border-neutral-200 bg-surface p-3">
                <summary className="cursor-pointer text-sm font-semibold text-sun-700">📄 Audio script — matnni o‘qib, javoblarni tekshiring</summary>
                <p lang="en" className="mt-2 whitespace-pre-line text-[15px] leading-7">{info.script}</p>
              </details>
            ) : b.book === "listening" ? (
              <p className="text-xs text-neutral-500">📄 Audio matni va izohlar tez orada qo‘shiladi.</p>
            ) : null}
          </Section>
        );
      })}
    </div>
  );
}
