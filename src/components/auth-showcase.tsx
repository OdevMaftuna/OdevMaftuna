import type { CSSProperties } from "react";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Natija halqasi: 92/100 oltin aylana. */
function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} stroke="rgb(255 255 255 / 0.10)" strokeWidth="6" fill="none" />
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke="url(#score-gold)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        className="score-draw"
        style={{ "--len": `${c}` } as CSSProperties}
      />
      <defs>
        <linearGradient id="score-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c76a" />
          <stop offset="100%" stopColor="#f1a93b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Kirish sahifasidagi chap panel uchun "jonli ko'rinish": sayt nima qilishini ko'rsatadigan
 * ikkita shishasimon kartochka (AI tuzatishi va natija), sekin suzib turadi. Faqat bezak.
 */
export function AuthShowcase() {
  return (
    // Telefonda kartochkalar (kengligi ~430px) ekranga sig'ishi uchun 0.78 marta kichraytiriladi.
    <div aria-hidden className="relative mt-8 h-[178px] max-w-md select-none sm:h-[220px] lg:mt-12">
      <div className="absolute inset-0 origin-top-left scale-[0.78] sm:scale-100">
      {/* 1. AI tuzatish kartochkasi */}
      <div className="anim-rise absolute left-0 top-0 w-[300px]" style={delay(650)}>
        <div className="float-y glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <span className="pulse-dot size-1.5 rounded-full bg-sun-400" />
              AI feedback
            </span>
            <span className="rounded-full bg-sun-400/15 px-2 py-0.5 text-[11px] font-medium text-sun-300">
              Grammar
            </span>
          </div>
          <p className="mt-3 text-sm text-[#ff9aa2]/80 line-through decoration-[#ff9aa2]/60">
            She go to school every day.
          </p>
          <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-[#8fe3bc]">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 10.5 4 4 8-9" />
            </svg>
            She goes to school every day.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            With he / she / it, add <span className="font-semibold text-white/80">-s</span> or{" "}
            <span className="font-semibold text-white/80">-es</span> to the verb.
          </p>
        </div>
      </div>

      {/* 2. Natija kartochkasi */}
      <div className="anim-rise absolute left-[236px] top-[118px] w-[196px]" style={delay(850)}>
        <div className="float-y-slow glass-card flex items-center gap-3 rounded-2xl p-3.5">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <ScoreRing value={92} />
            <span className="absolute text-base font-bold tabular-nums text-white">92</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Great job!</p>
            <p className="text-xs text-white/55">Score · 92 / 100</p>
            <div className="mt-1.5 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-1 w-4 rounded-full bg-sun-400/80" />
              ))}
              <span className="h-1 w-4 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kichik "gap pufakchasi" */}
      <div className="anim-rise absolute left-[312px] top-[-14px]" style={delay(1050)}>
        <div className="float-y-fast whitespace-nowrap rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md">
          Hello, teacher! 👋
        </div>
      </div>
      </div>
    </div>
  );
}
