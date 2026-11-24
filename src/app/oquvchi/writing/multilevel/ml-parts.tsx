"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition, type ReactNode } from "react";
import { saveMlQuiz } from "@/app/actions/writing";
import { ML_MARKS, type MlQuestion, type MlTask } from "@/lib/writing/multilevel";

/** "[v:loyalty card]" belgilarini rangli span'larga aylantiradi. */
export function Marked({ text }: { text: string }) {
  const parts = text.split(/(\[[a-z]:[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^\[([a-z]):([^\]]+)\]$/.exec(p);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        return (
          <span key={i} className={ML_MARKS[m[1]]?.cls ?? ""}>
            {m[2]}
          </span>
        );
      })}
    </>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead>
          <tr className="bg-[#1b2a44] text-[11px] font-extrabold uppercase tracking-wider text-[#bfe0ff]">
            {head.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.06] odd:bg-white/[0.02]">
              {r.map((c, k) => (
                <td key={k} className={`px-3 py-2 align-top ${k === 0 ? "font-bold text-white" : "text-[#cfd6d2]"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SECTIONS = [
  { id: "model", label: "✍️ Model javob" },
  { id: "words", label: "🔗 Collocations" },
  { id: "phrases", label: "💬 Useful phrases" },
  { id: "grammar", label: "🧩 Grammar" },
  { id: "upgrade", label: "🚀 B1 → B2" },
  { id: "errors", label: "⚠️ Tipik xatolar" },
] as const;

/** Bitta task bo'yicha o'rganish materiallari (tablar). */
export function TaskStudy({ task, color, writeHref }: { task: MlTask; color: string; writeHref: string | null }) {
  const [sec, setSec] = useState<(typeof SECTIONS)[number]["id"]>("model");
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-[#F5C76A]/40 bg-[#F5C76A]/[0.06] p-3.5">
        <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#F5C76A]">📋 REJA · PARAGRAPH PLAN</p>
        <ol className="mt-1.5 space-y-0.5 text-[13px] text-[#e9ecea]">
          {task.plan.map((p, i) => (
            <li key={p}>
              {i + 1}. {p}
            </li>
          ))}
        </ol>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSec(s.id)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${sec === s.id ? "border-transparent text-[#0d1512]" : "border-white/10 text-[#a3ada8] hover:text-white"}`}
            style={sec === s.id ? { background: color } : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sec === "model" ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {Object.values(ML_MARKS).map((m) => (
              <span key={m.label} className={`rounded-md border border-white/10 px-2 py-0.5 ${m.cls}`}>
                {m.label}
              </span>
            ))}
          </div>
          {task.model.map((p, i) => (
            <div key={p.title} className="sp-rise rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black text-[#0d1512]" style={{ background: color }}>
                {i + 1} · {p.title}
              </span>
              <p lang="en" className="mt-2 whitespace-pre-line text-[15px] leading-[1.9] text-[#e9ecea]">
                <Marked text={p.text} />
              </p>
            </div>
          ))}
        </div>
      ) : sec === "words" ? (
        <Table head={["English", "O‘zbekcha", "Misol"]} rows={task.collocations.map((r) => [r.en, r.uz, <i key="e">{r.ex}</i>])} />
      ) : sec === "phrases" ? (
        <Table head={["English", "O‘zbekcha", "Misol"]} rows={task.phrases.map((r) => [r.en, r.uz, <i key="e">{r.ex}</i>])} />
      ) : sec === "grammar" ? (
        <Table head={["Struktura", "Javobdagi misol"]} rows={task.grammar.map((g) => [g.name, g.ex])} />
      ) : sec === "upgrade" ? (
        <Table head={["B1", "B2 / C1"]} rows={task.upgrade.map((u) => [<span key="b" className="font-normal text-[#a3ada8]">{u.b1}</span>, <b key="c" className="text-[#5fe0a8]">{u.b2}</b>])} />
      ) : (
        <Table
          head={["✗ Noto‘g‘ri", "✓ To‘g‘ri"]}
          rows={task.mistakes.map((m) => [<span key="w" className="font-normal text-[#ff8a8a] line-through">{m.wrong}</span>, <b key="r" className="text-[#5fe0a8]">{m.right}</b>])}
        />
      )}

      {writeHref ? (
        <Link href={writeHref} className="st-cta flex h-12 items-center justify-center rounded-2xl text-sm font-black text-[#1d1608]" style={{ background: `linear-gradient(135deg, #fff3c4, ${color} 55%, #f1a93b)` }}>
          ✍️ Endi o‘zingiz yozing — {task.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Task 1.1 / 1.2 almashtirgich. */
export function TaskTabs({ tasks, color, writeBase, open }: { tasks: MlTask[]; color: string; writeBase: string; open: boolean }) {
  const [k, setK] = useState(0);
  const t = tasks[k];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {tasks.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setK(i)}
            className={`rounded-2xl border p-3 text-left transition ${k === i ? "border-transparent" : "border-white/10 bg-[#121a17] hover:border-white/25"}`}
            style={k === i ? { background: `${color}26`, boxShadow: `inset 0 0 0 2px ${color}` } : undefined}
          >
            <b className="block text-white">{x.label}</b>
            <span className="text-xs text-[#a3ada8]">
              {x.kind} · {x.words[0]}–{x.words[1]} so‘z
            </span>
          </button>
        ))}
      </div>
      <p lang="en" className="rounded-2xl border border-white/[0.08] bg-[#121a17] px-4 py-3 text-[15px] font-semibold text-white">
        {t.prompt}
      </p>
      <TaskStudy key={t.key} task={t} color={color} writeHref={open ? `${writeBase}/${t.key}` : null} />
    </div>
  );
}

/* ---------------- 20 savollik phrase mashqi ---------------- */

const shuffle = (arr: string[], seed: number) => {
  const a = [...arr];
  let x = seed + 7;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Tasodifan to'g'ri tartibda chiqsa — bitta almashtirish.
  if (a.join(" ") === arr.join(" ") && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
};

function OrderQ({ q, idx, onDone, done }: { q: Extract<MlQuestion, { type: "order" }>; idx: number; onDone: (ok: boolean) => void; done: boolean | null }) {
  const pool = useMemo(() => shuffle(q.words, idx * 31), [q.words, idx]);
  const [picked, setPicked] = useState<number[]>([]);
  const built = picked.map((i) => pool[i]);
  const complete = picked.length === pool.length;
  return (
    <div>
      <div className="min-h-[52px] rounded-2xl border-2 border-dashed border-white/15 bg-black/20 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {built.length === 0 ? <span className="text-sm text-[#808a85]">So‘zlarni bosing 👇</span> : null}
          {picked.map((pi, k) => (
            <button
              key={`${pi}-${k}`}
              type="button"
              disabled={done !== null}
              onClick={() => setPicked((v) => v.filter((_, j) => j !== k))}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold ${done === null ? "bg-white text-[#120d04]" : done ? "bg-[#3ddc97] text-[#062a20]" : "bg-[#ff6a8a] text-white"}`}
            >
              {pool[pi]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {pool.map((w, i) =>
          picked.includes(i) ? (
            <span key={i} className="rounded-xl border border-white/5 px-3 py-1.5 text-sm text-transparent">
              {w}
            </span>
          ) : (
            <button key={i} type="button" disabled={done !== null} onClick={() => setPicked((v) => [...v, i])} className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/15 active:scale-95">
              {w}
            </button>
          ),
        )}
      </div>
      {done === null ? (
        <button type="button" disabled={!complete} onClick={() => onDone(built.join(" ") === q.words.join(" "))} className="mt-3 rounded-full bg-[#F5C76A] px-4 py-2 text-sm font-black text-[#1d1608] disabled:opacity-40">
          Tekshirish
        </button>
      ) : !done ? (
        <p lang="en" className="mt-2 text-sm text-[#5fe0a8]">
          ✓ {q.words.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export function MlQuiz({ mockId, questions, color, backHref, initialBest }: { mockId: string; questions: MlQuestion[]; color: string; backHref: string; initialBest: number | null }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => questions.map(() => null));
  const [choice, setChoice] = useState<number | null>(null);
  const [best, setBest] = useState(initialBest);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);
  const [, start] = useTransition();
  const q = questions[i];
  const done = answers[i];
  const correct = answers.filter(Boolean).length;

  const answer = (ok: boolean) => setAnswers((v) => v.map((x, k) => (k === i ? ok : x)));
  const next = () => {
    setChoice(null);
    if (i < questions.length - 1) setI(i + 1);
    else {
      setFinished(true);
      start(async () => {
        const r = await saveMlQuiz(mockId, answers.filter(Boolean).length);
        if (r.ok) setBest(r.best);
      });
    }
  };
  const restart = () => {
    setI(0);
    setAnswers(questions.map(() => null));
    setChoice(null);
    setFinished(false);
    setRound((r) => r + 1);
  };

  if (finished) {
    const pct = correct / questions.length;
    return (
      <div className="sp-rise rounded-[26px] border border-white/[0.08] bg-[#101714] p-6 text-center">
        <p className="text-6xl">{pct >= 0.9 ? "🏆" : pct >= 0.7 ? "🎉" : pct >= 0.5 ? "💪" : "🌱"}</p>
        <p className="mt-3 text-4xl font-black text-white">
          {correct}
          <span className="text-xl text-[#808a85]">/{questions.length}</span>
        </p>
        <p className="mt-1 text-sm text-[#a3ada8]">{pct >= 0.9 ? "Zo‘r! Iboralarni a’lo bilasiz." : pct >= 0.7 ? "Juda yaxshi! Yana bir marta — va mukammal bo‘ladi." : "Model javob va jadvallarni qayta ko‘rib, yana urinib ko‘ring."}</p>
        {best !== null ? <p className="mt-1 text-xs font-bold text-[#F5C76A]">Eng yaxshi natijangiz: {best}/{questions.length}</p> : null}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={restart} className="rounded-2xl px-5 py-3 text-sm font-black text-[#1d1608]" style={{ background: color }}>
            ↻ Qayta ishlash
          </button>
          <Link href={backHref} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white">
            ← Mockga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {questions.map((_, k) => (
          <span key={k} className="h-2 flex-1 rounded-full" style={{ background: answers[k] === null ? (k === i ? color : "rgba(255,255,255,.1)") : answers[k] ? "#3ddc97" : "#ff6a8a" }} />
        ))}
      </div>
      <div key={`${round}-${i}`} className="sp-rise rounded-[24px] border border-white/[0.08] bg-[#121a17] p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black text-[#0d1512]" style={{ background: color }}>
            {i + 1}/{questions.length} · {q.tag}
          </span>
          <span className="text-xs font-bold text-[#a3ada8]">✓ {correct}</span>
        </div>
        <p lang="en" className="mt-3 text-[18px] font-black leading-snug text-white">
          {q.q}
        </p>
        <div className="mt-4">
          {q.type === "choice" ? (
            <div className="grid gap-2">
              {q.options.map((o, k) => {
                const isAns = k === q.answer;
                const chosen = choice === k;
                const cls =
                  done === null
                    ? "border-white/15 bg-white/[0.04] text-white hover:border-white/40"
                    : isAns
                      ? "border-[#3ddc97] bg-[#3ddc97]/15 text-white"
                      : chosen
                        ? "st-shake border-[#ff6a8a] bg-[#ff6a8a]/15 text-white"
                        : "border-white/5 text-[#808a85]";
                return (
                  <button
                    key={o}
                    type="button"
                    lang="en"
                    disabled={done !== null}
                    onClick={() => {
                      setChoice(k);
                      answer(k === q.answer);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition ${cls}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          ) : (
            <OrderQ key={`${round}-${i}`} q={q} idx={i} done={done} onDone={answer} />
          )}
        </div>
        {done !== null ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${done ? "bg-[#3ddc97]/10 text-[#bff5dc]" : "bg-[#ff6a8a]/10 text-[#ffc2cf]"}`}>
            <b>{done ? "✓ To‘g‘ri!" : "✗ Unchalik emas."}</b> {q.explain}
          </div>
        ) : null}
        {done !== null ? (
          <button type="button" onClick={next} className="mt-4 w-full rounded-2xl py-3 text-sm font-black text-[#1d1608]" style={{ background: color }}>
            {i < questions.length - 1 ? "Keyingisi →" : "Natijani ko‘rish 🏁"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
