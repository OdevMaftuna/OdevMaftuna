import Link from "next/link";
import type { Mission } from "@/lib/mission";

/** Missiya vazifalari ro'yxati va pastdagi izoh (to'liq va ixcham kartada bir xil). */
function MissionTasks({ mission }: { mission: Mission }) {
  const { tasks } = mission;
  const left = tasks.filter((t) => !t.done);
  const complete = left.length === 0;
  return (
    <>
        <ul className="relative mt-4 space-y-2">
          {tasks.map((t) => (
            <li key={t.key}>
              <Link
                href={t.href}
                className={`group flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${
                  t.done ? "border-emerald-500/25 bg-emerald-50/60" : "border-white/10 bg-black/15 hover:border-sun-400/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg ${t.done ? "bg-emerald-500/20" : "bg-sun-400/15"}`}
                >
                  {t.done ? "✅" : t.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${t.done ? "text-emerald-700" : ""}`}>{t.title}</span>
                  <span className="block truncate text-xs text-neutral-500">{t.detail}</span>
                </span>
                {t.done ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700">✓ Done</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-sun-400 px-3 py-1 text-xs font-bold text-[#1d1608] transition group-hover:translate-x-0.5">
                    Start →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
  
        <p className={`relative mt-3 rounded-xl px-3 py-2 text-sm ${complete ? "bg-emerald-50 text-emerald-700" : "bg-black/20 text-neutral-600"}`}>
          {complete ? (
            <>🎉 <b>Barakalla!</b> Bugungi missiya to‘liq bajarildi. Ertaga yangi missiya!</>
          ) : (
            <>
              Left · Qolgan: <b className="text-neutral-800">{left.map((t) => (t.key === "lesson" ? "lesson" : t.key === "vocab" ? "vocabulary" : "grammar")).join(", ")}</b>
            </>
          )}
        </p>
    </>
  );
}

/** Kichik halqa (foiz). */
function Ring({ percent, complete, size }: { percent: number; complete: boolean; size: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={R} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="9" />
        <circle
          cx="38"
          cy="38"
          r={R}
          fill="none"
          stroke={complete ? "#34d399" : "#F1A93B"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">{percent}%</span>
    </div>
  );
}

/**
 * Ixcham missiya kartasi (bosh sahifa): bitta qator — halqa, "1/3 done" va keyingi vazifa.
 * Bosilganda barcha vazifalar ochiladi (yana bosilsa yopiladi).
 */
export function MissionCompact({ mission }: { mission: Mission }) {
  const { tasks, done, total, percent } = mission;
  const next = tasks.find((t) => !t.done);
  const complete = !next;
  return (
    <details
      className={`group relative overflow-hidden rounded-[22px] border ${complete ? "border-emerald-500/40" : "border-sun-400/35"}`}
      style={{ background: "linear-gradient(120deg, #241c09 0%, #13281f 55%, #0d2a21 100%)" }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <Ring percent={percent} complete={complete} size={46} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-sun-400">
            🎯 Today’s mission
            <span className="rounded-full bg-white/10 px-1.5 text-[10px] tabular-nums text-white/80">
              {done}/{total}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold">
            {complete ? "🎉 All done for today!" : <>Next: {next.title}</>}
          </span>
        </span>
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.07] text-neutral-300 transition duration-300 group-open:rotate-180">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="px-3 pb-3">
        <MissionTasks mission={mission} />
      </div>
    </details>
  );
}

/** Bosh sahifadagi "Bugungi missiya" kartasi: bugungi ishlar, bajarilgan foiz, qolganlari. */
export function MissionCard({ mission }: { mission: Mission }) {
  const { tasks, done, total, percent } = mission;
  const left = tasks.filter((t) => !t.done);
  const complete = left.length === 0;
  const R = 30;
  const C = 2 * Math.PI * R;

  return (
    <section
      aria-label="Today’s mission"
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 ${
        complete ? "border-emerald-500/50" : "border-sun-400/45"
      } shadow-[0_10px_34px_-16px_rgb(241_169_59/0.45)]`}
      style={{ background: "radial-gradient(120% 140% at 0% 0%, #2a2008 0%, #13281f 45%, #0d2a21 100%)" }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-sun-400/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div className="relative size-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
            <defs>
              <linearGradient id="mission-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5C76A" />
                <stop offset="100%" stopColor={complete ? "#34d399" : "#f1a93b"} />
              </linearGradient>
            </defs>
            <circle cx="38" cy="38" r={R} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="8" />
            <circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              stroke="url(#mission-ring)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - percent / 100)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-lg font-bold tabular-nums">{percent}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">
            <span aria-hidden>🎯</span> Today’s mission
          </p>
          <p className="mt-0.5 text-lg font-bold leading-tight">Bugungi missiya</p>
          <p className="mt-0.5 text-sm text-neutral-600">
            <b className="tabular-nums text-neutral-900">{done}</b> / {total} done · bajarildi
          </p>
        </div>
      </div>

      <MissionTasks mission={mission} />
    </section>
  );
}
