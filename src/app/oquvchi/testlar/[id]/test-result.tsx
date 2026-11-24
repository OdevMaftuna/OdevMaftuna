import { ScoreSticker } from "@/components/score-sticker";
import type { TestAnswer, TestContent, TestResult } from "@/lib/paid-tests";
import { freshSeed, moodForPercent, pickText } from "@/lib/stickers";

function shown(a: TestAnswer, options?: string[]): string {
  if (a === null || a === "") return "—";
  if (typeof a === "boolean") return a ? "True" : "False";
  if (typeof a === "number") return options?.[a] ?? "—";
  return a;
}

/** Topshirilgan test: ball, stiker va har bir savol bo'yicha ✓/✗ + to'g'ri javob. */
export function TestResultView({ content, answers, result }: { content: TestContent; answers: TestAnswer[]; result: TestResult }) {
  const score = Math.round((result.correct / Math.max(1, result.total)) * 100);
  const seed = freshSeed();
  const band = pickText(moodForPercent(score), seed);
  const offsets = content.sections.map((_, i) => content.sections.slice(0, i).reduce((t, s) => t + s.items.length, 0));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-sun-400/30 bg-gradient-to-br from-[#123a2d] to-[#0d2a21] p-5">
        <ScoreSticker percent={score} size={96} showText={false} seed={seed} />
        <div>
          <p className="text-xs text-neutral-500">Your score</p>
          <p className="text-4xl font-bold tabular-nums">
            {score}
            <span className="text-lg font-normal text-neutral-500"> / 100</span>
          </p>
          <p className="text-sm font-semibold" style={{ color: "#F5C76A" }}>{band.title}</p>
          <p className="text-xs text-neutral-500">
            {result.correct} of {result.total} correct
          </p>
        </div>
      </div>

      {content.sections.map((s, si) => {
        const start = offsets[si];
        const ok = result.items.slice(start, start + s.items.length).filter((x) => x.ok).length;
        return (
          <section key={si} className="rounded-2xl border border-neutral-200 bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{s.title}</h2>
              <span className="text-sm tabular-nums text-neutral-500">{ok}/{s.items.length}</span>
            </div>
            {s.audioUrl ? <audio controls preload="none" src={s.audioUrl} className="mt-2 w-full" /> : null}
            <ul className="mt-3 space-y-2.5">
              {s.items.map((it, ii) => {
                const i = start + ii;
                const r = result.items[i];
                return (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        r?.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {r?.ok ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <p lang="en">
                        <span className="text-neutral-500">{ii + 1}.</span> {it.q || ""}
                      </p>
                      <p className="mt-0.5 text-xs">
                        <span className={r?.ok ? "text-emerald-700" : "text-red-700"}>Your answer: {shown(answers[i] ?? null, it.t === "mc" ? it.o : undefined)}</span>
                        {r && !r.ok ? (
                          <span className="text-neutral-500">
                            {" "}· Correct: <b className="text-neutral-800">{r.correct}</b>
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
