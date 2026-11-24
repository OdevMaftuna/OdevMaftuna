"use client";

import { useEffect, useRef, useState } from "react";
import { Notice, btn } from "@/components/ui";
import { SPEAKING_BUCKET } from "@/lib/config";
import { formatClock, toSpeakingMp3 } from "@/lib/lesson/record";
import {
  SPEAKING_BYTES_PER_SECOND,
  SPEAKING_MAX_SECONDS,
  type Recording,
  type SpeakingAnswers,
  type SpeakingContent,
} from "@/lib/lesson/types";
import { createClient } from "@/lib/supabase/client";
import { AudioPlayer, Section, SpeakButton, Tabs, VocabList, inputClass } from "./lesson-ui";

type SubTab = "prepare" | "record" | "sentences";

/** Hodisalar ichida ishlatiladi (render paytida emas). */
const nowMs = () => Date.now();

/** **so'z** → ajratilgan so'z. */
function Sample({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <p lang="en" className="text-[15px] leading-7 text-neutral-800">
      {parts.map((p, i) =>
        i % 2 ? (
          <b key={i} className="rounded bg-sun-50 px-1 text-sun-700">{p}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

/** Speaking: tayyorlanish → 20 ta ovozli javob → mavzu so'zlari bilan gap tuzish. */
export function SpeakingPanel({
  s,
  a,
  set,
  userId,
  assignmentId,
  sampleUrl,
  preview = false,
}: {
  preview?: boolean;
  s: SpeakingContent;
  a: SpeakingAnswers;
  set: (fn: (a: SpeakingAnswers) => SpeakingAnswers) => void;
  userId: string;
  assignmentId: string;
  sampleUrl: string | null;
}) {
  const [tab, setTab] = useState<SubTab>("prepare");
  const done = a.recordings.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Speaking · Topic {s.topic}</p>
        <h2 lang="en" className="mt-1 text-xl font-semibold tracking-tight">{s.title}</h2>
        <p className="mt-0.5 text-sm text-neutral-600">{s.uzTitle}</p>
      </div>

      <Tabs
        items={[
          { id: "prepare", label: "Prepare" },
          { id: "record", label: "Record", badge: `${done}/${s.required}` },
          { id: "sentences", label: "Sentences", badge: `${a.sentences.filter((x) => x.trim()).length}/${s.sentenceWords.length}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "prepare" ? (
        <div className="space-y-4">
          <Section title="Questions" hint="Answer these questions when you record.">
            <ol className="space-y-2">
              {s.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-neutral-500">{i + 1}.</span>
                  <span lang="en" className="flex-1 font-medium">{q}</span>
                  <SpeakButton text={q} small />
                </li>
              ))}
            </ol>
            <p className="text-xs text-neutral-500">Grammar: {s.grammar}</p>
          </Section>

          <Section title="How to speak" hint="Answer each question in 3 steps — then 1 minute is easy to fill.">
            <ol className="space-y-2 text-sm">
              <li><b className="text-brand-800">1. Answer.</b> Answer the question directly: <i lang="en">“My favourite food is plov.”</i></li>
              <li><b className="text-brand-800">2. Reason.</b> Why? Explain with <i lang="en">“because…”</i>: <i lang="en">“because it is very tasty.”</i></li>
              <li><b className="text-brand-800">3. Example.</b> Add a short example or story: <i lang="en">“My mother cooks it every Friday.”</i></li>
            </ol>
            <p className="text-sm text-neutral-600">
              Speak slowly and clearly. Use the topic words and phrases. Don’t be afraid of mistakes — keep going.
              Say something different in each recording: new examples, new words.
            </p>
          </Section>

          <Section title="Topic vocabulary">
            <VocabList vocab={s.vocab} />
          </Section>

          <Section title="Useful phrases">
            <ul className="space-y-2">
              {s.phrases.map((p) => (
                <li key={p.en} className="flex items-start gap-3">
                  <SpeakButton text={p.en} small />
                  <div>
                    <p lang="en" className="text-sm font-semibold text-brand-800">{p.en}</p>
                    <p className="text-xs text-neutral-600">{p.uz}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Sample answer" hint="Listen first, then speak in a similar way (don’t memorise it!).">
            {sampleUrl ? <AudioPlayer src={sampleUrl} /> : <SpeakButton text={s.sample.replace(/\*\*/g, "")} label="Listen to the sample" />}
            <Sample text={s.sample} />
          </Section>

          <button type="button" className={`${btn.primary} w-full`} onClick={() => setTab("record")}>
            Go to recording →
          </button>
        </div>
      ) : null}

      {tab === "record" && preview ? (
        <Section title={`${s.required} voice answers`} hint="Preview mode: the teacher doesn’t record here.">
          <p className="text-sm text-neutral-600">
            The student speaks {s.required} times, at least {s.minSeconds / 60} min each. The audio is turned into MP3 on the
            phone; silent or too short recordings are not accepted. After submitting, the AI listens to 2 random ones,
            then all recordings are deleted.
          </p>
        </Section>
      ) : null}

      {tab === "record" && !preview ? (
        <Recorder s={s} a={a} set={set} userId={userId} assignmentId={assignmentId} onDone={() => setTab("sentences")} />
      ) : null}

      {tab === "sentences" ? (
        <Section title="Make sentences with the topic words" hint="Write your own English sentence with each word.">
          {s.sentenceWords.map((w, i) => (
            <label key={i} className="block">
              <span className="mb-1.5 block text-sm">
                <span className="text-neutral-500">{i + 1}.</span>{" "}
                <span lang="en" className="font-semibold text-brand-800">{w.en}</span>{" "}
                <span className="text-neutral-500">— {w.uz}</span>
              </span>
              <input
                lang="en"
                autoComplete="off"
                value={a.sentences[i]}
                onChange={(e) =>
                  set((prev) => {
                    const sentences = [...prev.sentences];
                    sentences[i] = e.target.value;
                    return { ...prev, sentences };
                  })
                }
                className={inputClass}
                placeholder="Your sentence…"
              />
            </label>
          ))}
        </Section>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ovoz yozish
// ---------------------------------------------------------------------------
type Phase = "idle" | "recording" | "processing" | "uploading";

function Recorder({
  s,
  a,
  set,
  userId,
  assignmentId,
  onDone,
}: {
  s: SpeakingContent;
  a: SpeakingAnswers;
  set: (fn: (a: SpeakingAnswers) => SpeakingAnswers) => void;
  userId: string;
  assignmentId: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const folder = `${userId}/${assignmentId}`;

  const done = new Map(a.recordings.map((r) => [r.n, r]));
  const nextSlot = Array.from({ length: s.required }, (_, i) => i + 1).find((n) => !done.has(n)) ?? null;

  // Serverdagi haqiqiy holat bilan moslash (boshqa telefonda yoki qoralama o'chgan bo'lsa).
  useEffect(() => {
    let cancelled = false;
    void createClient()
      .storage.from(SPEAKING_BUCKET)
      .list(folder, { limit: 200 })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const minBytes = s.minSeconds * SPEAKING_BYTES_PER_SECOND * 0.95;
        const server: Recording[] = data
          .map((f) => ({ n: Number(f.name.match(/^(\d+)\.mp3$/)?.[1]), bytes: Number((f.metadata as { size?: number } | null)?.size ?? 0) }))
          .filter((f) => Number.isInteger(f.n) && f.n >= 1 && f.n <= s.required && f.bytes >= minBytes)
          .map((f) => ({ ...f, seconds: Math.round(f.bytes / SPEAKING_BYTES_PER_SECOND) }))
          .sort((x, y) => x.n - y.n);
        set((prev) => ({ ...prev, recordings: server }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat ochilganda bir marta
  }, [folder]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const stopTracks = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  const start = async (n: number) => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can’t record audio. Please use the latest Chrome or Safari.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      stream.current = media;
      const rec = new MediaRecorder(media);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        stopTracks();
        void finish(n, new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start(1000);
      started.current = nowMs();
      setElapsed(0);
      setActive(n);
      setPhase("recording");
      timer.current = setInterval(() => {
        const sec = (nowMs() - started.current) / 1000;
        setElapsed(sec);
        if (sec >= SPEAKING_MAX_SECONDS && recorder.current?.state === "recording") recorder.current.stop();
      }, 250);
    } catch {
      stopTracks();
      setError("Microphone access was blocked. Allow the microphone in your browser settings and try again.");
    }
  };

  const stop = () => {
    if (recorder.current?.state === "recording") {
      setPhase("processing");
      recorder.current.stop();
    }
  };

  const cancel = () => {
    if (recorder.current) {
      recorder.current.onstop = () => stopTracks();
      if (recorder.current.state === "recording") recorder.current.stop();
    }
    setPhase("idle");
    setActive(null);
  };

  const finish = async (n: number, blob: Blob) => {
    setPhase("processing");
    try {
      const { mp3, seconds, voiced } = await toSpeakingMp3(blob);
      if (seconds < s.minSeconds) {
        throw new Error(`The recording is ${seconds} seconds. Speak for at least ${s.minSeconds} seconds.`);
      }
      if (voiced < 0.25) {
        throw new Error("We could hardly hear you. Hold the phone closer and speak louder.");
      }
      setPhase("uploading");
      const { error: upErr } = await createClient()
        .storage.from(SPEAKING_BUCKET)
        .upload(`${folder}/${n}.mp3`, mp3, { contentType: "audio/mpeg", upsert: true });
      if (upErr) throw new Error("Couldn’t upload the recording. Check your internet and try again.");
      const rec: Recording = { n, seconds, bytes: mp3.size };
      set((prev) => ({ ...prev, recordings: [...prev.recordings.filter((r) => r.n !== n), rec].sort((x, y) => x.n - y.n) }));
      setPreviews((p) => {
        if (p[n]) URL.revokeObjectURL(p[n]);
        return { ...p, [n]: URL.createObjectURL(mp3) };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t save the recording.");
    } finally {
      setPhase("idle");
      setActive(null);
    }
  };

  const busy = phase !== "idle";
  const canStop = elapsed >= s.minSeconds;
  const question = s.questions[((active ?? nextSlot ?? 1) - 1) % s.questions.length];

  return (
    <div className="space-y-4">
      <Section
        title={`${s.required} voice answers`}
        hint={`Each at least ${s.minSeconds / 60} min (max ${SPEAKING_MAX_SECONDS / 60} min). Recordings are deleted after the AI checks them; your score stays.`}
      >
        <div className="flex items-center justify-between text-sm">
          <span>Recorded: <b className="tabular-nums">{a.recordings.length}</b> / {s.required}</span>
          <span className="tabular-nums text-sun-400">{Math.round((a.recordings.length / s.required) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sun-400 transition-[width]" style={{ width: `${(a.recordings.length / s.required) * 100}%` }} />
        </div>

        {phase === "recording" || phase === "processing" || phase === "uploading" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-xs text-neutral-600">Recording {active}</p>
            <p lang="en" className="mt-1 text-sm font-medium">{question}</p>
            <p className="mt-3 flex items-center justify-center gap-2 text-3xl font-semibold tabular-nums">
              {phase === "recording" ? <span className="pulse-dot inline-block size-3 rounded-full bg-red-600" /> : null}
              {formatClock(elapsed)}
            </p>
            {phase === "recording" ? (
              <>
                <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-neutral-200">
                  <div className={`h-full rounded-full ${canStop ? "bg-emerald-600" : "bg-red-500"}`} style={{ width: `${Math.min(100, (elapsed / s.minSeconds) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  {canStop ? "Great! You can stop now (or keep going)." : `Keep talking for ${Math.ceil(s.minSeconds - elapsed)} more seconds…`}
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button type="button" className={btn.secondary} onClick={cancel}>Cancel</button>
                  <button type="button" className={btn.primary} disabled={!canStop} onClick={stop}>■ Stop and save</button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">{phase === "processing" ? "Processing…" : "Uploading…"}</p>
            )}
          </div>
        ) : nextSlot ? (
          <button type="button" onClick={() => start(nextSlot)} className={`${btn.primary} h-14 w-full text-base`}>
            ● Start recording {nextSlot}
          </button>
        ) : (
          <Notice tone="success">All {s.required} recordings are done. Now do the “Sentences” part.</Notice>
        )}

        {error ? <Notice tone="error">{error}</Notice> : null}

        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {Array.from({ length: s.required }, (_, i) => i + 1).map((n) => {
            const r = done.get(n);
            return (
              <li key={n}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!r) return void start(n);
                    if (window.confirm(`Record number ${n} again? The old one will be deleted.`)) void start(n);
                  }}
                  className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border text-xs transition ${
                    r ? "border-emerald-300 bg-emerald-50 text-emerald-700" : active === n ? "border-red-300 bg-red-50 text-red-700" : "border-neutral-200 text-neutral-500"
                  }`}
                >
                  <span className="font-semibold">{n}</span>
                  <span className="tabular-nums">{r ? `✓ ${formatClock(r.seconds)}` : "—"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {Object.keys(previews).length ? (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Listen to what you just recorded:</p>
            {Object.entries(previews).map(([n, url]) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-neutral-500">{n}.</span>
                <audio controls src={url} className="h-9 flex-1" />
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      {!nextSlot ? (
        <button type="button" className={`${btn.primary} w-full`} onClick={onDone}>
          Go to sentences →
        </button>
      ) : null}
    </div>
  );
}
