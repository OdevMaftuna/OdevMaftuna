import type { Streak } from "@/lib/streak";
import { card } from "@/components/ui";

/** Kunlik seriya kartasi: olov, son va oxirgi 7 kun. */
export function StreakCard({ streak }: { streak: Streak }) {
  const { count, today, week } = streak;
  const lit = count > 0;
  return (
    <section className={`${card} flex flex-wrap items-center gap-4 p-4`}>
      <svg
        viewBox="0 0 64 80"
        width="44"
        height="55"
        aria-hidden
        className={lit ? "flame" : ""}
        style={lit ? undefined : { opacity: 0.35, filter: "grayscale(1)" }}
      >
        <defs>
          <linearGradient id="streak-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#F1A93B" />
            <stop offset="1" stopColor="#FFE2A6" />
          </linearGradient>
        </defs>
        <path d="M32 2C36 18 54 26 54 48a22 22 0 0 1-44 0c0-10 6-16 10-20 0 8 4 12 8 12C24 28 26 14 32 2z" fill="url(#streak-flame)" />
        <path d="M32 40c3 6 10 9 10 17a10 10 0 0 1-20 0c0-6 5-9 10-17z" fill="#FFF4DC" opacity="0.85" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold">
          {lit ? (
            <>
              <span className="tabular-nums" style={{ color: "#F5C76A" }}>{count}</span>-day streak
            </>
          ) : (
            "Start your streak"
          )}
        </p>
        <p className="text-xs text-neutral-500">
          {today
            ? "Today’s work is done. Come back tomorrow!"
            : lit
              ? "Do one task or exercise today — don’t break your streak."
              : "Do one task or exercise every day and the flame grows."}
        </p>
      </div>
      <ol className="flex gap-1.5" aria-label="Last 7 days">
        {week.map((d) => (
          <li
            key={d.key}
            title={d.key}
            className={`grid size-8 place-items-center rounded-lg border text-[11px] font-semibold ${
              d.active ? "border-sun-400 bg-sun-50 text-sun-700" : "border-neutral-200 text-neutral-500"
            } ${d.isToday ? "ring-2 ring-sun-400/40" : ""}`}
          >
            {d.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
