"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { submitPaidTest } from "@/app/actions/paid-tests";
import { Notice, btn } from "@/components/ui";
import type { TestAnswer, TestContent } from "@/lib/paid-tests";

export const inputCls =
  "block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15";

export function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-10 rounded-xl border px-3 py-2 text-left text-sm transition ${
        selected ? "border-sun-400 bg-sun-50 font-semibold text-sun-700" : "border-neutral-300 bg-surface text-neutral-800 hover:border-brand-300"
      }`}
    >
      {children}
    </button>
  );
}

/** Pullik testni ishlash: javoblar telefonda saqlanadi, bir marta topshiriladi. */
export function TestRunner({ testId, content }: { testId: string; content: TestContent }) {
  const router = useRouter();
  const total = useMemo(() => content.sections.reduce((n, s) => n + s.items.length, 0), [content]);
  const offsets = useMemo(
    () => content.sections.map((_, i) => content.sections.slice(0, i).reduce((t, s) => t + s.items.length, 0)),
    [content],
  );
  const key = `paid-test:${testId}`;
  const [answers, setAnswers] = useState<TestAnswer[]>(() => Array.from({ length: total }, () => null));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bir martalik tiklash
      if (Array.isArray(saved) && saved.length === total) setAnswers(saved);
    } catch {}
    setReady(true);
  }, [key, total]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(answers));
    } catch {}
  }, [answers, key, ready]);

  const set = (i: number, v: TestAnswer) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
  const done = answers.filter((a) => a !== null && a !== "").length;
  const percent = Math.round((done / total) * 100);

  const submit = () => {
    setError(null);
    const missing = total - done;
    if (!window.confirm(`${missing ? `${missing} question(s) not answered. ` : ""}Finish the test? You can take it only once.`)) return;
    start(async () => {
      const r = await submitPaidTest(testId, answers);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      try {
        localStorage.removeItem(key);
      } catch {}
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-[5] -mx-4 border-b border-neutral-200 bg-background/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Answered: {done} / {total}</span>
          <span className="font-semibold tabular-nums text-sun-400">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sun-400 transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Notice tone="info">One try only. Your answers are saved on this phone — you can close the page and continue later.</Notice>

      {content.sections.map((s, si) => (
        <section key={si} className="space-y-3 rounded-2xl border border-neutral-200 bg-surface p-4">
          <h2 className="font-semibold">{s.title}</h2>
          {s.box ? (
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-sun-400/50 p-2.5">
              {s.box.map((w) => (
                <span key={w} lang="en" className="rounded-full bg-sun-50 px-2.5 py-0.5 text-sm text-sun-700">{w}</span>
              ))}
            </div>
          ) : null}
          {s.passage ? <p lang="en" className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-[15px] leading-7">{s.passage}</p> : null}
          {s.audioUrl ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
              <p className="text-sm font-semibold">🎧 Listen to the recording, then answer the questions.</p>
              <audio controls preload="none" src={s.audioUrl} className="mt-2 w-full" />
            </div>
          ) : null}
          <ol className="space-y-4">
            {s.items.map((it, ii) => {
              const i = offsets[si] + ii;
              return (
                <li key={i} className="space-y-2">
                  {it.q ? (
                    <p lang="en" className="text-sm font-medium">
                      <span className="text-neutral-500">{ii + 1}.</span> {it.q}
                      {it.hint ? <span className="ml-1 text-xs text-neutral-500">({it.hint})</span> : null}
                    </p>
                  ) : null}
                  {it.t === "mc" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {it.o.map((o, oi) => (
                        <Choice key={oi} selected={answers[i] === oi} onClick={() => set(i, oi)}>
                          <span className="mr-1.5 font-semibold">{"abcdef"[oi]})</span>
                          {o}
                        </Choice>
                      ))}
                    </div>
                  ) : it.t === "tf" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Choice selected={answers[i] === true} onClick={() => set(i, true)}>True</Choice>
                      <Choice selected={answers[i] === false} onClick={() => set(i, false)}>False</Choice>
                    </div>
                  ) : (
                    <input
                      lang="en"
                      autoCapitalize="none"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={300}
                      value={(answers[i] as string | null) ?? ""}
                      onChange={(e) => set(i, e.target.value)}
                      className={inputCls}
                      placeholder="Your answer…"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {error ? <Notice tone="error">{error}</Notice> : null}
      <button type="button" onClick={submit} disabled={pending} className={`${btn.primary} h-12 w-full text-base`}>
        {pending ? "Checking…" : `Finish the test (${done}/${total})`}
      </button>
    </div>
  );
}
