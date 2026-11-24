"use client";

import type { ListeningAnswers, ListeningContent } from "@/lib/lesson/types";
import { AudioPlayer, Choice, DialogueSpeaker, QuizOptions, Section, inputClass } from "./lesson-ui";

/** Listening: dialogni tinglash va savollar. Matn topshirilgandan keyin ko'rsatiladi. */
export function ListeningPanel({
  l,
  a,
  set,
  audioUrl,
}: {
  l: ListeningContent;
  a: ListeningAnswers;
  set: (fn: (a: ListeningAnswers) => ListeningAnswers) => void;
  audioUrl: string | null;
}) {
  const upd = <K extends keyof ListeningAnswers>(k: K, i: number, v: ListeningAnswers[K][number]) =>
    set((prev) => {
      const arr = [...(prev[k] as unknown[])];
      arr[i] = v;
      return { ...prev, [k]: arr };
    });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Listening</p>
        <h2 lang="en" className="mt-1 text-xl font-semibold tracking-tight">{l.title}</h2>
        <p lang="en" className="mt-1 text-sm text-neutral-600">{l.setting}</p>
      </div>

      <Section
        title="Listen to the dialogue"
        hint="Read the questions first, then listen 2–3 times. If it’s hard, set the speed to 0.75×. The script appears after you submit."
      >
        {audioUrl ? (
          <AudioPlayer src={audioUrl} label={`Conversation: ${l.speakers.join(" and ")}`} segments={l.segments} />
        ) : l.lines ? (
          <DialogueSpeaker lines={l.lines} speakers={l.speakers} />
        ) : (
          <p className="text-sm text-neutral-500">The audio is not ready yet.</p>
        )}
      </Section>

      <Section title="A. True or False?" hint="According to the dialogue, is it true or false?">
        {l.tf.map((q, i) => (
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
        {l.mc.map((q, i) => (
          <QuizOptions key={i} n={i + 1} q={q.q} options={q.options} letters value={a.mc[i]} onChange={(v) => upd("mc", i, v)} />
        ))}
      </Section>

      <Section title="C. Complete the sentences" hint="Write the word you hear in the dialogue (one word).">
        {l.gaps.map((q, i) => {
          const [before, after] = q.q.split(/_{3,}/);
          return (
            <label key={i} className="block">
              <span lang="en" className="mb-1.5 block text-sm">
                <span className="text-neutral-500">{i + 1}.</span> {before}
                <b className="text-sun-400"> ______ </b>
                {after ?? ""}
              </span>
              <input
                lang="en"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                value={a.gaps[i]}
                onChange={(e) => upd("gaps", i, e.target.value)}
                className={inputClass}
                placeholder="one word"
              />
            </label>
          );
        })}
      </Section>
    </div>
  );
}
