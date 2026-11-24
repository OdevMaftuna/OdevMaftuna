"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { checkPractice, resetPractice, savePracticeDraft } from "@/app/actions/practice";
import { SpeakButton, Tabs, VocabList } from "@/app/oquvchi/vazifa/[id]/lesson/lesson-ui";
import { CountUp, ScoreRing, fireConfetti } from "@/components/motion";
import { StickerPopup } from "@/components/score-sticker";
import { Notice, btn } from "@/components/ui";

/** Natijaga qarab qisqa dalda so'zi. */
function praise(score: number, total: number): string {
  const r = total ? score / total : 0;
  if (r === 1) return "Perfect! Everything is correct.";
  if (r >= 0.8) return "Great result! Well done.";
  if (r >= 0.5) return "Good! Look at your mistakes and try again.";
  return "Read the rule once more and try again — you can do it.";
}
import {
  isGrammar,
  isReading,
  type Attempt,
  type IntroContent,
  type PracticeContent,
  type PracticeResult,
  type Section,
  type TestItem,
} from "@/lib/practice/types";

const inputClass =
  "block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15 disabled:opacity-80";

// ---------------------------------------------------------------------------
// Qoida (tushuntirish)
// ---------------------------------------------------------------------------
function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-surface p-4">
      <h3 className="font-semibold text-sun-400">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Example({ en, uz }: { en: string; uz: string }) {
  return (
    <p className="flex items-start gap-2">
      <SpeakButton text={en} small />
      <span>
        <span lang="en" className="font-medium text-brand-800">{en}</span>
        <span className="block text-xs text-neutral-500">{uz}</span>
      </span>
    </p>
  );
}

const STRUCT_BADGE: Record<string, { label: string; cls: string }> = {
  "+": { label: "+", cls: "bg-emerald-600 text-white" },
  "-": { label: "−", cls: "bg-red-600 text-white" },
  "?": { label: "?", cls: "bg-[#3987E5] text-white" },
  short: { label: "Qisqa", cls: "bg-neutral-600 text-white" },
};

/** Mavzu qo'llanmasi: qo'llanilishi, tuzilishi (+ / − / ?), signal so'zlar, eslatma. */
function GuideView({
  topics,
  mistakes,
  phrases = false,
}: {
  topics: NonNullable<IntroContent["topics"]>;
  mistakes: IntroContent["mistakes"];
  phrases?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sun-400/40 bg-gradient-to-br from-sun-50 to-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">{phrases ? "📖 Phrase guide · Iboralar qo‘llanmasi" : "📖 Grammar guide · Qo‘llanma"}</p>
        <p className="mt-1 text-sm text-neutral-700">
          {phrases
            ? "Mashqlardan oldin har bir iborani o‘rganing: ma’nosi, qachon aytiladi, gapda qanday tuziladi va misollar."
            : "Mashqlardan oldin har bir mavzuni o‘qib chiqing: qachon ishlatiladi, qanday tuziladi va qaysi so‘zlar unga ishora qiladi."}
        </p>
        {topics.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((t, i) => (
              <a key={i} href={`#topic-${i}`} className="rounded-full border border-sun-400/50 bg-surface px-3 py-1 text-xs font-semibold text-sun-700 hover:bg-sun-50">
                {i + 1}. {t.name}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      {topics.map((t, i) => (
        <section key={i} id={`topic-${i}`} className="scroll-mt-28 overflow-hidden rounded-2xl border border-neutral-200 bg-surface">
          <div className="border-b border-neutral-200 bg-gradient-to-r from-brand-50 to-transparent p-4">
            <p className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">{i + 1}</span>
              <span lang="en" className="text-lg font-bold">{t.name}</span>
            </p>
            <p className="mt-0.5 text-sm font-medium text-sun-400">{t.name_uz}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{t.summary}</p>
          </div>

          <div className="space-y-5 p-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-semibold text-sun-400">🎯 Qo‘llanilishi <span className="font-normal text-neutral-500">· Usage</span></h3>
              <ol className="mt-2 space-y-3">
                {t.usage.map((u, j) => (
                  <li key={j} className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-neutral-800"><b className="text-brand-800">{j + 1}.</b> {u.text}</p>
                    <div className="mt-1.5"><Example en={u.example.en} uz={u.example.uz} /></div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-sun-400">🧩 Tuzilishi <span className="font-normal text-neutral-500">· Structure</span></h3>
              <div className="mt-2 divide-y divide-neutral-200 rounded-xl border border-brand-200 bg-brand-50">
                {t.structure.map((st, j) => {
                  const b = STRUCT_BADGE[st.type] ?? STRUCT_BADGE.short;
                  return (
                    <div key={j} className="space-y-1.5 p-3">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold ${b.cls}`}>{b.label}</span>
                        <span lang="en" className="font-mono text-[13px] font-semibold">{st.formula}</span>
                      </p>
                      <Example en={st.example.en} uz={st.example.uz} />
                    </div>
                  );
                })}
              </div>
            </div>

            {t.signals.length ? (
              <div>
                <h3 className="font-semibold text-sun-400">🔔 Signal so‘zlar <span className="font-normal text-neutral-500">· Signal words</span></h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {t.signals.map((w, j) => (
                    <li key={j} className="rounded-full border border-brand-200 bg-surface px-3 py-1">
                      <b lang="en" className="text-brand-800">{w.en}</b> <span className="text-neutral-500">— {w.uz}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {t.tip ? (
              <p className="rounded-xl border border-sun-400/40 bg-sun-50 p-3 text-sun-700">💡 <b>Eslatma:</b> {t.tip}</p>
            ) : null}
          </div>
        </section>
      ))}

      {mistakes.length ? (
        <Box title="⚠️ Ko‘p uchraydigan xatolar · Common mistakes">
          {mistakes.map((m, i) => (
            <div key={i}>
              <p lang="en">
                <span className="text-red-700 line-through decoration-red-500/60">{m.wrong}</span>
                <span className="mx-2 text-neutral-400">→</span>
                <span className="font-semibold text-emerald-700">{m.right}</span>
              </p>
              <p className="text-xs text-neutral-600">{m.why}</p>
            </div>
          ))}
        </Box>
      ) : null}
    </div>
  );
}

export function IntroView({ intro, phrases = false }: { intro: IntroContent; phrases?: boolean }) {
  if (intro.topics?.length) return <GuideView topics={intro.topics} mistakes={intro.mistakes} phrases={phrases} />;
  return (
    <div className="space-y-4">
      <Box title="What is it?">
        <p>{intro.what}</p>
        {intro.when.length ? (
          <ul className="list-disc space-y-1 pl-5 text-neutral-700">
            {intro.when.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </Box>

      <Box title="Form (formula)">
        <div className="space-y-3">
          {intro.structures.map((s, i) => (
            <div key={i} className="rounded-xl border border-brand-200 bg-brand-50 p-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">{s.label}</span>
                <span lang="en" className="font-mono text-[13px] font-semibold">{s.formula}</span>
              </p>
              <div className="mt-2">
                <Example en={s.example_en} uz={s.example_uz} />
              </div>
            </div>
          ))}
        </div>
      </Box>

      {intro.rules.length ? (
        <Box title="Rules">
          {intro.rules.map((r, i) => (
            <div key={i} className="space-y-1.5">
              <p className="font-semibold">{i + 1}. {r.title}</p>
              <p className="text-neutral-700">{r.text}</p>
              <div className="space-y-1.5 pl-1">
                {r.examples.map((e, j) => (
                  <Example key={j} en={e.en} uz={e.uz} />
                ))}
              </div>
            </div>
          ))}
        </Box>
      ) : null}

      {intro.signal_words.length ? (
        <Box title="Signal words">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {intro.signal_words.map((w, i) => (
              <li key={i}>
                <b lang="en" className="text-brand-800">{w.en}</b> — {w.uz}
              </li>
            ))}
          </ul>
        </Box>
      ) : null}

      {intro.mistakes.length ? (
        <Box title="Common mistakes">
          {intro.mistakes.map((m, i) => (
            <div key={i}>
              <p lang="en">
                <span className="text-red-700 line-through decoration-red-500/60">{m.wrong}</span>
                <span className="mx-2 text-neutral-400">→</span>
                <span className="font-semibold text-emerald-700">{m.right}</span>
              </p>
              <p className="text-xs text-neutral-600">{m.why}</p>
            </div>
          ))}
        </Box>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Savollar
// ---------------------------------------------------------------------------
function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? "answer-pop bg-emerald-50 text-emerald-700" : "answer-shake bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"}
    </span>
  );
}

function Feedback({ item }: { item: PracticeResult["items"][number] }) {
  if (item.ok) return null;
  return (
    <div className="answer-shake mt-2 rounded-lg border border-red-200/60 bg-red-50/40 px-3 py-2 text-sm">
      <p>
        <span className="text-neutral-500">Correct: </span>
        <b lang="en" className="text-emerald-700">{item.correct}</b>
      </p>
      {item.explain ? <p className="mt-0.5 whitespace-pre-line text-neutral-700">💡 {item.explain}</p> : null}
    </div>
  );
}

function TestQuestion({
  n,
  item,
  value,
  onChange,
  checked,
  disabled,
}: {
  n: number;
  item: TestItem;
  value: string | null;
  onChange: (v: string) => void;
  checked?: PracticeResult["items"][number];
  disabled: boolean;
}) {
  const head = (
    <span className="flex items-center gap-2">
      {checked ? <Mark ok={checked.ok} /> : null}
      <span className="text-neutral-500">{n}.</span>
    </span>
  );

  if (item.type === "mc") {
    return (
      <div>
        <p lang="en" className="flex items-start gap-2 text-sm font-medium">
          {head} <span>{item.q.replace(/_{3,}/, "______")}</span>
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {item.options.map((o) => {
            const selected = value === o;
            const tone = checked
              ? o === checked.correct
                ? `border-emerald-400 bg-emerald-50 text-emerald-800 ${selected ? "answer-pop" : ""}`
                : selected
                  ? "answer-shake border-red-300 bg-red-50 text-red-700"
                  : "border-neutral-200 text-neutral-500"
              : selected
                ? "border-sun-400 bg-sun-50 font-semibold text-sun-700"
                : "border-neutral-300 hover:border-brand-300";
            return (
              <button key={o} type="button" disabled={disabled} onClick={() => onChange(o)} className={`min-h-10 rounded-xl border px-3 py-2 text-left text-sm transition ${tone}`}>
                <span lang="en">{o}</span>
              </button>
            );
          })}
        </div>
        {checked && !checked.ok && checked.explain ? <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">💡 {checked.explain}</p> : null}
      </div>
    );
  }

  if (item.type === "write") {
    return (
      <div>
        <label className="flex items-center gap-3">
          <span className="flex w-40 shrink-0 items-center gap-2 text-sm sm:w-56">
            {head} <span>{item.q}</span>
          </span>
          <input lang="en" autoCapitalize="none" autoComplete="off" spellCheck={false} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="English" />
        </label>
        {checked ? <Feedback item={checked} /> : null}
      </div>
    );
  }

  const [before, after] = item.q.split(/_{3,}/);
  return (
    <div>
      <div lang="en" className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm leading-relaxed">
        {head}
        <span>{before}</span>
        <input
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-36 rounded-lg border border-neutral-300 bg-surface px-2.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15 sm:w-44"
          aria-label={`${n}-savol javobi`}
        />
        <span>{after ?? ""}</span>
        {item.hint ? <span className="text-neutral-500">({item.hint})</span> : null}
      </div>
      {checked ? <Feedback item={checked} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bitta bo'lim (tarjima yoki test): avtomatik saqlash, tekshirish, qayta ishlash
// ---------------------------------------------------------------------------
const PAGE = 20;

function SectionRunner({
  topicId,
  section,
  content,
  attempt,
  preview,
}: {
  topicId: string;
  section: Section;
  content: PracticeContent;
  attempt?: Attempt;
  preview: boolean;
}) {
  const length = section === "translate" && isGrammar(content) ? content.translations.length : content.test.length;
  const initial = useMemo(() => {
    const a = attempt?.answers ?? [];
    return Array.from({ length }, (_, i) => (typeof a[i] === "string" ? (a[i] as string) : null));
  }, [attempt, length]);
  const [answers, setAnswers] = useState<(string | null)[]>(initial);
  const [result, setResult] = useState<PracticeResult | null>(attempt?.result ?? null);
  const [best, setBest] = useState<number | null>(attempt?.best_score ?? null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(0);
  const dirty = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Javoblar har o'zgarganda 1,2 soniyadan keyin serverga saqlanadi.
  useEffect(() => {
    if (preview || !dirty.current) return;
    setSaved("saving");
    const t = setTimeout(async () => {
      const r = await savePracticeDraft(topicId, section, answers);
      setSaved(r.ok ? "saved" : "error");
    }, 1200);
    return () => clearTimeout(t);
  }, [answers, preview, section, topicId]);

  const update = (i: number, v: string) => {
    dirty.current = true;
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const filled = answers.filter((a) => (a ?? "").trim()).length;
  const pages = Math.ceil(length / PAGE);
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const check = () => {
    setError(null);
    const missing = length - filled;
    if (missing > 0 && !window.confirm(`${missing} question(s) not answered. Check anyway?`)) return;
    startTransition(async () => {
      const r = await checkPractice(topicId, section, answers);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult(r.result);
      setBest(r.best);
      setPage(0);
      scrollTop();
      setPopup(true);
      if (r.result.total > 0 && r.result.score / r.result.total >= 0.8) setTimeout(fireConfetti, 500);
    });
  };

  const retry = () => {
    if (!window.confirm("Your answers will be cleared so you can start again. Your best result is kept.")) return;
    startTransition(async () => {
      await resetPractice(topicId, section);
      dirty.current = false;
      setAnswers(Array.from({ length }, () => null));
      setResult(null);
      setPage(0);
      scrollTop();
    });
  };

  const [onlyWrong, setOnlyWrong] = useState(false);
  const [popup, setPopup] = useState(false);
  const indexes = Array.from({ length }, (_, i) => i).filter((i) => !onlyWrong || (result && !result.items[i]?.ok));
  const visible = result && onlyWrong ? indexes : indexes.slice(page * PAGE, page * PAGE + PAGE);

  const partTitle = (i: number) => {
    if (section === "test" && content.testParts) {
      const p = content.test[i] && "part" in content.test[i] ? content.test[i].part : undefined;
      const prevItem = i > 0 ? content.test[i - 1] : undefined;
      const prev = prevItem && "part" in prevItem ? prevItem.part : undefined;
      return p !== undefined && p !== prev ? content.testParts[p] ?? null : null;
    }
    if (section !== "translate" || !isGrammar(content)) return null;
    const p = content.translations[i].part;
    const prev = i > 0 ? content.translations[i - 1].part : -1;
    return p !== prev ? content.parts[p] ?? null : null;
  };

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-4">
      {popup && result ? <StickerPopup score={result.score} total={result.total} onClose={() => setPopup(false)} /> : null}
      {result ? (
        <div className="page-in rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <ScoreRing score={result.score} total={result.total} size={84} />
              <div>
                <p className="text-xs text-neutral-500">Result</p>
                <p className="text-3xl font-semibold tabular-nums">
                  <CountUp value={result.score} />
                  <span className="text-lg font-normal text-neutral-500"> / {result.total}</span>
                </p>
                <p className="text-xs text-neutral-500">Best result: {best ?? result.score} / {result.total}</p>
                <p className="mt-0.5 text-sm font-medium text-sun-400">{praise(result.score, result.total)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.small} onClick={() => setOnlyWrong((v) => !v)}>
                {onlyWrong ? "Show all" : `Only mistakes (${result.total - result.score})`}
              </button>
              {preview ? null : (
                <button type="button" className={btn.small} disabled={pending} onClick={retry}>
                  ↻ Try again
                </button>
              )}
            </div>
          </div>
          {result.aiUnavailable ? (
            <p className="mt-2 text-xs text-amber-700">
              The AI was busy — some translations were only compared with the model answer. A correct answer may show ✗; check again later with “Try again”.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span>
            Answered: <b className="tabular-nums text-neutral-800">{filled}</b> / {length}
          </span>
          {preview ? (
            <span>Preview mode</span>
          ) : (
            <span>{saved === "saving" ? "Saving…" : saved === "saved" ? "✓ Saved" : saved === "error" ? "Couldn’t save" : "Answers are saved automatically"}</span>
          )}
        </div>
      )}

      <ol className="space-y-4">
        {visible.map((i) => {
          const checked = result?.items[i];
          const title = !onlyWrong ? partTitle(i) : null;
          return (
            <li key={i} className="space-y-3">
              {title ? <h3 className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">{title}</h3> : null}
              <div className="rounded-2xl border border-neutral-200 bg-surface p-3.5">
                {section === "translate" && isGrammar(content) ? (
                  <div>
                    <p className="flex items-start gap-2 text-sm font-medium">
                      {checked ? <Mark ok={checked.ok} /> : null}
                      <span className="text-neutral-500">{i + 1}.</span>
                      <span>{content.translations[i].uz}</span>
                    </p>
                    <input
                      lang="en"
                      autoComplete="off"
                      disabled={Boolean(result) || preview}
                      value={answers[i] ?? ""}
                      onChange={(e) => update(i, e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="English translation…"
                    />
                    {checked ? <Feedback item={checked} /> : null}
                  </div>
                ) : (
                  <TestQuestion n={i + 1} item={content.test[i]} value={answers[i]} onChange={(v) => update(i, v)} checked={checked} disabled={Boolean(result) || preview} />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!onlyWrong && pages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: pages }, (_, p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPage(p);
                scrollTop();
              }}
              className={`h-9 min-w-9 rounded-lg border px-2 text-sm tabular-nums ${page === p ? "border-brand-600 bg-brand-700 text-white" : "border-neutral-300"}`}
            >
              {p * PAGE + 1}–{Math.min(length, (p + 1) * PAGE)}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {!result && !preview ? (
        <button type="button" onClick={check} disabled={pending} className={`${btn.primary} h-12 w-full text-base`}>
          {pending ? (section === "translate" ? "Checking… (the AI checks too)" : "Checking…") : `Check (${filled}/${length})`}
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asosiy komponent
// ---------------------------------------------------------------------------
export function PracticeView({
  topicId,
  content,
  attempts,
  preview = false,
  introLabel = "Rule",
}: {
  topicId: string;
  content: PracticeContent;
  attempts: Partial<Record<Section, Attempt>>;
  preview?: boolean;
  /** O'rganish qismining nomi (masalan, iboralar uchun "Learn"). */
  introLabel?: string;
}) {
  type Tab = "intro" | "words" | "text" | "translate" | "test";
  const grammar = isGrammar(content);
  const reading = isReading(content);
  // Tarjima qismi bo'lmagan mavzularda (masalan, Pre-Intermediate) faqat Qoida + Mashqlar.
  const hasTranslate = grammar && content.translations.length > 0;
  const tabs: { id: Tab; label: string; badge?: string }[] = grammar
    ? [
        { id: "intro", label: introLabel },
        ...(hasTranslate ? [{ id: "translate" as Tab, label: "Translation", badge: String(content.translations.length) }] : []),
        { id: "test", label: hasTranslate ? "Test" : "Exercises", badge: String(content.test.length) },
      ]
    : reading
      ? [
          { id: "text", label: "Text", badge: String(content.passages.length) },
          { id: "test", label: "Questions", badge: String(content.test.length) },
        ]
      : [
          { id: "words", label: "Words", badge: String(content.words.length) },
          { id: "test", label: "Exercises", badge: String(content.test.length) },
        ];
  const [tab, setTab] = useState<Tab>(tabs[0].id);

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-[5] -mx-4 border-b border-neutral-200 bg-background/90 px-4 py-2.5 backdrop-blur">
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </div>

      <div key={tab} className="page-in space-y-4">
      {tab === "intro" && grammar ? (
        <>
          <IntroView intro={content.intro} phrases={introLabel === "Learn"} />
          <button type="button" className={`${btn.primary} w-full`} onClick={() => setTab(hasTranslate ? "translate" : "test")}>
            {hasTranslate ? "Go to translation →" : "Go to exercises →"}
          </button>
        </>
      ) : null}

      {tab === "text" && reading ? (
        <>
          {content.passages.map((p, i) => (
            <article key={i} className="rounded-2xl border border-neutral-200 bg-surface p-4 sm:p-5">
              <h3 className="text-lg font-black tracking-tight">{p.title}</h3>
              <div lang="en" className="mt-3 space-y-3 font-serif text-[16px] leading-relaxed">
                {p.text.split(/\n\n+/).map((para, k) => (
                  <p key={k}>{para}</p>
                ))}
              </div>
              {p.uz ? <p className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-neutral-500">💡 {p.uz}</p> : null}
            </article>
          ))}
          <button type="button" className={`${btn.primary} w-full`} onClick={() => setTab("test")}>
            Go to questions →
          </button>
        </>
      ) : null}

      {tab === "words" && !grammar && !reading ? (
        <>
          <VocabList vocab={content.words} />
          <button type="button" className={`${btn.primary} w-full`} onClick={() => setTab("test")}>
            Go to exercises →
          </button>
        </>
      ) : null}

      {tab === "translate" && grammar ? (
        <SectionRunner topicId={topicId} section="translate" content={content} attempt={attempts.translate} preview={preview} />
      ) : null}
      {tab === "test" ? <SectionRunner topicId={topicId} section="test" content={content} attempt={attempts.test} preview={preview} /> : null}
      </div>
    </div>
  );
}
