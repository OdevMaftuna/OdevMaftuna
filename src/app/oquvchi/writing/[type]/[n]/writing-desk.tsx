"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { checkWriting, saveWritingDraft } from "@/app/actions/writing";
import { FeedbackView } from "@/components/feedback-view";
import type { StoredFeedback } from "@/lib/ai/feedback";
import { CHECKLIST, countWords, type Tone } from "@/lib/writing/data";
import { PhraseChip, SampleLetter } from "../../writing-parts";

type TypeInfo = {
  id: string;
  title: string;
  icon: string;
  color: string;
  tone: Tone;
  structure: { label: string; hint: string }[];
  phrases: { group: string; list: string[] }[];
  sample: string;
};

/** Ball rangi va baho — maksimal ballga nisbatan (10 yoki 20). */
const scoreColor = (s: number | null, max = 10) => (s == null ? "#6f7d78" : s / max >= 0.8 ? "#3ddc97" : s / max >= 0.6 ? "#F5C76A" : s / max >= 0.4 ? "#ffb347" : "#ff6a8a");
const verdict = (s: number, max: number) => (s / max >= 0.9 ? "Ajoyib! Imtihonga tayyor 🏆" : s / max >= 0.7 ? "Juda yaxshi! 💪" : s / max >= 0.5 ? "Yaxshi boshlanish — biroz tuzating 🔧" : "Qayta yozib ko‘ring — siz uddalaysiz 🌱");
const ML_LEVEL = (s: number) => (s >= 17 ? "≈ C1" : s >= 13 ? "≈ B2" : s >= 9 ? "≈ B1" : "B1 dan past");

export type DeskTask = {
  /** Yuqoridagi kichik sarlavha (masalan "COMPLAINT LETTER · CUE CARD 1 · FORMAL"). */
  kicker: string;
  text: string;
  /** Vaziyat / kelgan xat (Multilevel). */
  context?: { intro: string; letter: string };
  pointsTitle: string;
  points: string[];
  words: { min: number; ideal: number; max: number };
  maxScore: number;
  /** Multilevel: 20 ballik bahoga taxminiy daraja ko'rsatiladi. */
  multilevel?: boolean;
  checklist?: string[];
  placeholder?: string;
};

/** Yozish stoli: cue card, xat qog'ozi, so'z hisoblagich, iboralar, checklist va AI natijasi. */
export function WritingDesk({
  cardId,
  type: t,
  task,
  initial,
}: {
  cardId: string;
  type: TypeInfo;
  task: DeskTask;
  initial: { text: string; score: number | null; feedback: StoredFeedback | null; history: { at: string; score: number; words: number }[]; failed: boolean };
}) {
  const [text, setText] = useState(initial.text);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [score, setScore] = useState(initial.score);
  const [feedback, setFeedback] = useState(initial.feedback);
  const [history, setHistory] = useState(initial.history);
  const [error, setError] = useState<string | null>(initial.failed ? "⏳ AI band edi — xatingiz navbatda, bir necha daqiqada avtomatik tekshiriladi. Kutmasangiz, “Tekshirish”ni qayta bosing." : null);
  const [ticks, setTicks] = useState<boolean[]>(() => task.points.map(() => false));
  const list = task.checklist ?? CHECKLIST;
  const W = task.words;
  const max = task.maxScore;
  const [checks, setChecks] = useState<boolean[]>(() => list.map(() => false));
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(initial.text);
  const words = countWords(text);

  // Avtomatik saqlash (1.2 soniya yozmay tursa) — faqat matn haqiqatan o'zgarganda.
  useEffect(() => {
    if (text === lastSaved.current) return;
    const id = window.setTimeout(async () => {
      setSaved("saving");
      const r = await saveWritingDraft(cardId, text);
      if (r.ok) lastSaved.current = text;
      setSaved(r.ok ? "saved" : "idle");
    }, 1200);
    return () => window.clearTimeout(id);
  }, [text, cardId]);

  const insert = (phrase: string) => {
    const el = area.current;
    if (!el) return setText((v) => `${v}${v && !v.endsWith(" ") && !v.endsWith("\n") ? " " : ""}${phrase}`);
    const s = el.selectionStart ?? text.length;
    const e = el.selectionEnd ?? text.length;
    const before = text.slice(0, s);
    const pad = before && !/[\s]$/.test(before) ? " " : "";
    const next = `${before}${pad}${phrase}${text.slice(e)}`;
    setText(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const pos = (before + pad + phrase).length;
      el.setSelectionRange(pos, pos);
    });
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await checkWriting(cardId, text);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setScore(r.score);
      setFeedback(r.feedback);
      setHistory((h) => [...h, { at: new Date().toISOString(), score: r.score, words }]);
      window.requestAnimationFrame(() => result.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });

  const meter = Math.min(100, (words / W.max) * 100);
  const wordTone = words < W.min ? "#ffb347" : words <= W.max ? "#3ddc97" : "#ff6a8a";
  const R = 46;
  const L = 2 * Math.PI * R;

  return (
    <div className="space-y-4">
      {/* CUE CARD */}
      <div className="relative overflow-clip rounded-[26px] border p-5" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${t.color}2e 0%, #121a17 55%, #0b110f 100%)`, borderColor: `${t.color}44` }}>
        <span aria-hidden className="wr-env absolute -right-1 -top-1 text-[70px] opacity-25">
          {t.icon}
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em]" style={{ color: t.color }}>
          {task.kicker}
        </p>
        {task.context ? (
          <div className="relative mt-3 space-y-2">
            <p lang="en" className="text-[13px] text-[#cfd6d2]">
              {task.context.intro}
            </p>
            <div lang="en" className="whitespace-pre-line rounded-2xl border-l-4 bg-black/25 px-4 py-3 font-serif text-[14px] leading-relaxed text-[#e9ecea]" style={{ borderColor: t.color }}>
              {task.context.letter}
            </div>
          </div>
        ) : null}
        <p lang="en" className="relative mt-3 text-[18px] font-black leading-snug text-white">
          {task.text}
        </p>
        <p className="relative mt-3 text-[11px] font-bold text-[#a3ada8]">{task.pointsTitle}</p>
        <ul className="relative mt-1.5 space-y-1.5">
          {task.points.map((p, i) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => setTicks((v) => v.map((x, k) => (k === i ? !x : x)))}
                className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-[14px] transition ${ticks[i] ? "border-[#3ddc97]/50 bg-[#3ddc97]/10 text-white" : "border-white/10 bg-black/20 text-[#cfd6d2]"}`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-xs font-black ${ticks[i] ? "bg-[#3ddc97] text-[#062a20]" : "border border-white/25"}`}>{ticks[i] ? "✓" : ""}</span>
                <span lang="en">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* XAT QOG'OZI */}
        <div>
          <div className="wr-paper relative rounded-[24px] p-1.5 shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)]">
            <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[11px] font-extrabold tracking-[0.16em] text-[#6b5a35]">
              <span>✉️ YOUR {t.id === "reply" ? "REPLY" : "LETTER"}</span>
              <span>{saved === "saving" ? "saqlanmoqda…" : saved === "saved" ? "✓ saqlandi" : ""}</span>
            </div>
            <textarea
              ref={area}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 6000))}
              lang="en"
              spellCheck={false}
              placeholder={task.placeholder ?? `${t.tone === "formal" ? "Dear Sir/Madam," : t.tone === "semi" ? "Dear Mr Brown," : "Dear Ali,"}\n\nI am writing to ...`}
              className="wr-lines block min-h-[380px] w-full resize-y rounded-[18px] bg-transparent px-4 py-2 font-serif text-[16px] leading-[32px] text-[#2a2214] placeholder:text-[#a08a5e] focus:outline-none"
            />
          </div>

          {/* So'z hisoblagich */}
          <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#121a17] p-3">
            <div className="flex items-center justify-between text-sm">
              <b className="tabular-nums" style={{ color: wordTone }}>
                {words} so‘z
              </b>
              <span className="text-xs text-[#808a85]">
                {words < W.min ? `yana ~${W.min - words} so‘z yozing` : words <= W.max ? "hajm a’lo ✓" : "biroz qisqartiring"}
              </span>
            </div>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
              <span className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${meter}%`, background: wordTone }} />
              <span className="absolute inset-y-0 w-[2px] bg-white/40" style={{ left: `${(W.min / W.max) * 100}%` }} />
              <span className="absolute inset-y-0 w-[2px] bg-white/60" style={{ left: `${(W.ideal / W.max) * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#808a85]">
              <span>0</span>
              <span>min {W.min}</span>
              <span>ideal {W.ideal}</span>
              <span>{W.max}</span>
            </div>
          </div>

          {error ? <p className="mt-3 rounded-2xl border border-[#ff6a8a]/40 bg-[#ff6a8a]/10 px-3 py-2 text-sm text-[#ff9cb0]">{error}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={pending || words < Math.min(20, Math.round(W.min * 0.4))}
            className="st-cta mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-black text-[#1d1608] transition disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, #fff3c4, ${t.color} 50%, #f1a93b)` }}
          >
            {pending ? (
              <>
                <span className="wr-pen inline-block">✍️</span> AI xatingizni o‘qiyapti…
              </>
            ) : score !== null ? (
              "🤖 Qayta tekshirish"
            ) : (
              "🤖 Tekshirish va baho olish"
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-[#808a85]">Muddat yo‘q · istalgancha qayta yozib, qayta tekshirtirish mumkin</p>
        </div>

        {/* YON PANEL */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#a3ada8]">🔑 IBORALAR — bosing, qo‘shiladi</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.phrases.flatMap((g) => g.list).map((p) => (
                <PhraseChip key={p} text={p} color={t.color} onPick={insert} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#a3ada8]">🧱 TUZILMA</p>
            <ol className="mt-2 space-y-1.5">
              {t.structure.map((s, i) => (
                <li key={s.label} className="flex gap-2 text-[12px]">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-black text-[#0d1512]" style={{ background: t.color }}>
                    {i + 1}
                  </span>
                  <span>
                    <b className="text-white">{s.label}</b> <span className="text-[#a3ada8]">— {s.hint}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-[#3ddc97]/25 bg-[#3ddc97]/[0.05] p-3.5">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#3ddc97]">✅ CHECKLIST · {checks.filter(Boolean).length}/{list.length}</p>
            <ul className="mt-2 space-y-1">
              {list.map((c, i) => (
                <li key={c}>
                  <button type="button" onClick={() => setChecks((v) => v.map((x, k) => (k === i ? !x : x)))} className={`flex w-full gap-2 text-left text-[12px] ${checks[i] ? "text-white" : "text-[#a3ada8]"}`}>
                    <span className={checks[i] ? "text-[#3ddc97]" : ""}>{checks[i] ? "☑" : "☐"}</span>
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* NATIJA */}
      {feedback && score !== null ? (
        <div ref={result} className="sp-rise scroll-mt-20 space-y-4 rounded-[26px] border border-white/[0.08] bg-[#101714] p-5">
          <div className="flex items-center gap-4">
            <div className="relative size-[110px] shrink-0">
              <svg viewBox="0 0 110 110" className="absolute inset-0 -rotate-90">
                <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
                <circle cx="55" cy="55" r={R} fill="none" stroke={scoreColor(score, max)} strokeWidth="10" strokeLinecap="round" strokeDasharray={L} className="sc-arc" style={{ "--len": `${L}`, "--off": `${L * (1 - score / max)}`, filter: `drop-shadow(0 0 8px ${scoreColor(score, max)})` } as CSSProperties} />
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                <b className="text-[34px] font-black leading-none text-white">
                  {score}
                  <span className="text-base text-[#808a85]">/{max}</span>
                </b>
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#F5C76A]">🤖 AI NATIJASI</p>
              <p className="text-xl font-black text-white">{verdict(score, max)}</p>
              {task.multilevel ? <p className="text-sm font-bold text-[#c9a7ff]">Multilevel darajasi: {ML_LEVEL(score)} (taxminiy)</p> : null}
              {history.length > 1 ? (
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a3ada8]">
                  Urinishlar:
                  {history.slice(-6).map((h, i) => (
                    <span key={i} className="rounded-full px-1.5 py-0.5 font-bold tabular-nums" style={{ background: `${scoreColor(h.score, max)}22`, color: scoreColor(h.score, max) }}>
                      {h.score}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
          <div className="wr-feedback rounded-2xl bg-white/[0.03] p-4">
            <FeedbackView feedback={feedback} />
          </div>
          <SampleLetter text={t.sample} color={t.color} />
        </div>
      ) : null}
    </div>
  );
}
