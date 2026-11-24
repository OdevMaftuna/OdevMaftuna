"use client";

import { useRef, useState, type ReactNode } from "react";
import { btn } from "@/components/ui";
import type { VocabItem } from "@/lib/lesson/types";

// ---------------------------------------------------------------------------
// Ovozli o'qish (brauzerning o'z nutq sintezi, inglizcha ovoz)
// ---------------------------------------------------------------------------

/**
 * Lug'at yozuvini ovozga moslash: "sth" → "something", "man/woman" → "man or woman",
 * qavslar va "…" olib tashlanadi — aks holda ovoz ularni harfma-harf o'qiydi ("es-ti-eych", "slash").
 */
export function speechText(text: string): string {
  return text
    .replace(/\b(sth|smth)\b\.?/gi, "something")
    .replace(/\b(sb|smb|smbd)\b\.?/gi, "somebody")
    .replace(/\bsb's\b/gi, "somebody's")
    .replace(/\(\s*(adj|adv|n|v|phr v|pl|prep)\.?\s*\)/gi, "")
    .replace(/\b(adj|adv|n|v|phr v|pl)\.(?=\s|$)/gi, "")
    .replace(/\s*→\s*/g, ", ")
    .replace(/(\w)\s*\/\s*(?=\w)/g, "$1 or ")
    .replace(/\.{3}|…/g, " ")
    .replace(/[()[\]{}]/g, "")
    .replace(/\s*=\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Eng sifatli inglizcha ovoz: tabiiy (neural) ovozlar birinchi, past sifatli (eSpeak, compact) oxirida. */
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const en = voices.filter((v) => /^en[-_](US|GB)/i.test(v.lang));
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (/natural|neural|online/i.test(v.name)) s += 50; // Edge/Windows: "Aria Online (Natural)"
    if (/Google/i.test(v.name)) s += 40; // Chrome/Android
    if (/Samantha|Ava|Allison|Susan|Daniel|Karen|Aria|Jenny|Guy|Libby|Sonia/i.test(v.name)) s += 25; // iPhone/Mac, Windows
    if (/^en[-_]US/i.test(v.lang)) s += 5;
    if (v.localService === false) s += 3;
    if (/eSpeak|compact|novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|jester|organ|superstar|wobble/i.test(v.name)) s -= 100;
    return s;
  };
  return en.sort((a, b) => score(b) - score(a))[0];
}

let cachedVoice: SpeechSynthesisVoice | undefined;
/** Ovozlar ro'yxati ba'zi brauzerlarda kechikib yuklanadi — kutib olamiz (ko'pi bilan ~1 s). */
function loadVoice(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice | undefined> {
  if (cachedVoice) return Promise.resolve(cachedVoice);
  const now = synth.getVoices();
  if (now.length) return Promise.resolve((cachedVoice = pickVoice(now)));
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      resolve((cachedVoice = pickVoice(synth.getVoices())));
    };
    synth.addEventListener("voiceschanged", done);
    setTimeout(done, 1000);
  });
}

export function speak(text: string, onEnd?: () => void) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) return;
  synth.cancel();
  const clean = speechText(text);
  if (!clean) return onEnd?.();
  const say = (voice: SpeechSynthesisVoice | undefined) => {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = voice?.lang ?? "en-US";
    if (voice) u.voice = voice;
    // Bitta so'z yoki ibora — sekinroq va aniqroq; uzun matn — biroz tezroq.
    u.rate = clean.split(" ").length <= 4 ? 0.8 : 0.92;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    synth.resume(); // Chrome: ba'zan "pauza"da qolib ketadi
    synth.speak(u);
  };
  // iPhone ovozni faqat bosish paytida (kutmasdan) o'qiydi — ovozlar tayyor bo'lsa, darhol.
  if (cachedVoice || synth.getVoices().length) say(cachedVoice ?? (cachedVoice = pickVoice(synth.getVoices())));
  else void loadVoice(synth).then(say);
}

// Ovozlar ro'yxatini oldindan yuklab qo'yish (birinchi bosishda kechikmasligi uchun).
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = pickVoice(window.speechSynthesis.getVoices());
  });
}

export function SpeakButton({ text, label, small }: { text: string; label?: string; small?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (playing) {
          window.speechSynthesis?.cancel();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        speak(text, () => setPlaying(false));
      }}
      aria-label={playing ? "Stop" : `Listen: ${label ?? text.slice(0, 30)}`}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 font-medium text-brand-800 transition hover:bg-brand-100 ${
        small ? "size-8" : "h-9 px-3.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 24 24" width={small ? 15 : 16} height={small ? 15 : 16} fill="currentColor" aria-hidden>
        {playing ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />}
      </svg>
      {small ? null : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Kichik qurilish bloklari
// ---------------------------------------------------------------------------
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  size = "md",
}: {
  items: { id: T; label: string; badge?: string }[];
  value: T;
  onChange: (id: T) => void;
  size?: "md" | "sm";
}) {
  return (
    <div role="tablist" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border font-medium transition ${
              size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
            } ${
              active
                ? "border-brand-600 bg-brand-700 text-white"
                : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300"
            }`}
          >
            {it.label}
            {it.badge ? (
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? "bg-white/20" : "bg-neutral-100 text-neutral-500"}`}>
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-surface p-4">
      <h3 className="font-semibold">{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-10 rounded-xl border px-3 py-2 text-left text-sm transition ${
        selected
          ? "border-sun-400 bg-sun-50 font-semibold text-sun-700"
          : "border-neutral-300 bg-surface text-neutral-800 hover:border-brand-300"
      }`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15";

// ---------------------------------------------------------------------------
// Lug'at va fleshkartalar
// ---------------------------------------------------------------------------
export function VocabList({ vocab }: { vocab: VocabItem[] }) {
  const [mode, setMode] = useState<"list" | "cards">("list");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = vocab[index];

  return (
    <div className="space-y-3">
      <Tabs
        size="sm"
        items={[
          { id: "list", label: "List" },
          { id: "cards", label: "Flashcards" },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setFlipped(false);
        }}
      />
      {mode === "list" ? (
        <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-surface">
          {vocab.map((v) => (
            <li key={v.en} className="flex items-center gap-3 px-3.5 py-2.5">
              <SpeakButton text={v.en} label={v.en} small />
              <div className="min-w-0">
                <p lang="en" className="font-semibold text-brand-800">{v.en}</p>
                <p className="text-sm text-neutral-600">{v.uz}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : card ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-surface p-6 text-center transition active:scale-[0.99]"
          >
            <span className="text-xs uppercase tracking-[0.14em] text-neutral-500">
              {flipped ? "Uzbek" : "English"} · {index + 1} / {vocab.length}
            </span>
            <span lang={flipped ? "uz" : "en"} className="mt-3 text-2xl font-semibold">
              {flipped ? card.uz : card.en}
            </span>
            <span className="mt-3 text-xs text-neutral-500">Tap to flip</span>
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className={btn.small}
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1);
                setFlipped(false);
              }}
            >
              ← Previous
            </button>
            <SpeakButton text={card.en} label="Listen" />
            <button
              type="button"
              className={btn.small}
              disabled={index === vocab.length - 1}
              onClick={() => {
                setIndex((i) => i + 1);
                setFlipped(false);
              }}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Savol turlari
// ---------------------------------------------------------------------------
export function QuizOptions({
  q,
  options,
  value,
  onChange,
  n,
  letters,
}: {
  q: string;
  options: string[];
  value: number | null;
  onChange: (v: number) => void;
  n: number;
  letters?: boolean;
}) {
  return (
    <div>
      <p lang="en" className="text-sm font-medium">
        <span className="text-neutral-500">{n}.</span> {q}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <Choice key={i} selected={value === i} onClick={() => onChange(i)}>
            {letters ? <span className="mr-1.5 font-semibold">{"ABCD"[i]})</span> : null}
            {o}
          </Choice>
        ))}
      </div>
    </div>
  );
}

export function FillItem({
  q,
  box,
  value,
  onChange,
  n,
}: {
  q: string;
  box: string[];
  value: string | null;
  onChange: (v: string) => void;
  n: number;
}) {
  const [before, after] = q.split(/_{3,}/);
  return (
    <div>
      <p lang="en" className="text-sm leading-relaxed">
        <span className="text-neutral-500">{n}.</span> {before}
        <span className={`mx-1 inline-block min-w-16 rounded-md border-b-2 px-1.5 text-center font-semibold ${value ? "border-sun-400 text-sun-700" : "border-neutral-400 text-neutral-400"}`}>
          {value ?? "……"}
        </span>
        {after ?? ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {box.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`h-8 rounded-full border px-3 text-sm transition ${
              value === w ? "border-sun-400 bg-sun-50 font-semibold text-sun-700" : "border-neutral-300 text-neutral-700 hover:border-brand-300"
            }`}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Audio pleyer (kurs audiolari: listening, reading, namuna) — tezlikni sekinlatish mumkin
// ---------------------------------------------------------------------------
export function AudioPlayer({
  src,
  label,
  segments,
  segmentLabel = "Listen line by line",
}: {
  src: string;
  label?: string;
  /** Qatorlar vaqti: berilsa, har bir qatorni alohida eshitish tugmalari chiqadi. */
  segments?: [number, number][] | null;
  segmentLabel?: string;
}) {
  const [rate, setRate] = useState(1);
  const [current, setCurrent] = useState<number | null>(null);
  const [heard, setHeard] = useState<number[]>([]);
  const ref = useRef<HTMLAudioElement>(null);
  /** Shu vaqtga yetganda to'xtaydi (bitta qatorni o'ynatganda). */
  const stopAt = useRef<number | null>(null);

  const playSegment = (i: number) => {
    const audio = ref.current;
    const seg = segments?.[i];
    if (!audio || !seg) return;
    audio.currentTime = Math.max(0, seg[0] - 0.05);
    stopAt.current = seg[1] + 0.15;
    audio.playbackRate = rate;
    setCurrent(i);
    setHeard((h) => (h.includes(i) ? h : [...h, i]));
    void audio.play();
  };

  return (
    <div className="space-y-2 rounded-2xl border border-brand-200 bg-brand-50 p-3">
      {label ? <p className="text-xs font-medium text-brand-800">{label}</p> : null}
      <audio
        ref={ref}
        controls
        preload="metadata"
        src={src}
        className="w-full"
        onPlay={(e) => {
          e.currentTarget.playbackRate = rate;
        }}
        onSeeking={() => {
          // Foydalanuvchi o'zi surgan bo'lsa — butun audio davom etadi.
          if (stopAt.current !== null && ref.current && Math.abs(ref.current.currentTime - (segments?.[current ?? 0]?.[0] ?? 0)) > 0.3) {
            stopAt.current = null;
          }
        }}
        onTimeUpdate={(e) => {
          if (stopAt.current !== null && e.currentTarget.currentTime >= stopAt.current) {
            e.currentTarget.pause();
            stopAt.current = null;
          }
        }}
      />
      {segments?.length ? (
        <div className="space-y-2 border-t border-brand-200 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-600">
              {segmentLabel}
              {current !== null ? <b className="ml-1 tabular-nums text-brand-800">· {current + 1}/{segments.length}</b> : null}
            </p>
            <div className="flex gap-1">
              <button type="button" aria-label="Previous" disabled={!current} onClick={() => playSegment((current ?? 1) - 1)} className="size-9 rounded-full border border-neutral-300 text-sm disabled:opacity-40">‹</button>
              <button type="button" aria-label="Play again" onClick={() => playSegment(current ?? 0)} className="size-9 rounded-full border border-sun-400 bg-sun-50 text-sm font-semibold text-sun-700">↻</button>
              <button type="button" aria-label="Next" disabled={current === segments.length - 1} onClick={() => playSegment(current === null ? 0 : current + 1)} className="size-9 rounded-full border border-neutral-300 text-sm disabled:opacity-40">›</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {segments.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => playSegment(i)}
                className={`size-8 rounded-lg border text-xs tabular-nums transition ${
                  current === i
                    ? "border-brand-600 bg-brand-700 text-white"
                    : heard.includes(i)
                      ? "border-brand-300 text-brand-800"
                      : "border-neutral-300 text-neutral-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5 text-xs text-neutral-600">
        <span>Speed:</span>
        {[0.75, 0.9, 1].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRate(r);
              if (ref.current) ref.current.playbackRate = r;
            }}
            className={`h-7 rounded-full border px-2.5 tabular-nums ${rate === r ? "border-sun-400 bg-sun-50 font-semibold text-sun-700" : "border-neutral-300"}`}
          >
            {r}×
          </button>
        ))}
      </div>
    </div>
  );
}

/** Audio hali tayyor bo'lmasa: dialogni brauzer ovozida navbatma-navbat o'qish (ikki xil ovoz balandligi). */
export function DialogueSpeaker({ lines, speakers }: { lines: { speaker: string; text: string }[]; speakers: string[] }) {
  const [playing, setPlaying] = useState(false);
  const play = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    if (playing) {
      setPlaying(false);
      return;
    }
    const voices = synth.getVoices().filter((v) => /^en-US/i.test(v.lang));
    setPlaying(true);
    lines.forEach((l, i) => {
      const u = new SpeechSynthesisUtterance(speechText(l.text));
      u.lang = "en-US";
      u.rate = 0.85;
      const second = speakers.indexOf(l.speaker) === 1;
      if (voices.length) u.voice = voices[second && voices.length > 1 ? 1 : 0];
      u.pitch = second ? 0.8 : 1;
      if (i === lines.length - 1) u.onend = () => setPlaying(false);
      synth.speak(u);
    });
  };
  return (
    <button type="button" onClick={play} className="inline-flex h-11 items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-800">
      {playing ? "■ Stop" : "▶ Listen to the dialogue"}
    </button>
  );
}