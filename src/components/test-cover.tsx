/**
 * Pullik test — "imtihon bileti" ko'rinishida: yuqorida rangli qism (belgi va unit raqami),
 * o'rtada teshikchali chiziq va yon o'yiqlar, pastda mavzu. Rang va belgi unitga qarab.
 * Level test — oltin "premium" bilet.
 */

const PALETTES = [
  ["#1e8a5a", "#0f5c46"],
  ["#3f6fd8", "#1f3c88"],
  ["#a54cc0", "#6b2a7a"],
  ["#e08a3a", "#8a3b12"],
  ["#1aa0b3", "#0e5966"],
  ["#d14f7a", "#7a1f3d"],
  ["#8aa327", "#4a5a12"],
] as const;

const ICONS = ["👋", "🌍", "💼", "👨‍👩‍👧", "🍽️", "⏰", "🛍️", "🏠", "📅", "🧳", "💪", "☕", "👕", "🚀"];
/** Pre-Intermediate unit mavzulari: Feelings, Adventure, On screen, Our planet, Ambition, Tourism, Shopping, Crime, Science. */
const ICONS_PREINT = ["😊", "🧗", "🎬", "🌦️", "🎯", "🗺️", "💳", "🕵️", "🔬"];

/** Umumiy test yorlig'i: PC15 → "1–5", PC69 → "6–9", PC19 → "FINAL", boshqalar → "LEVEL". */
function levelBadge(code?: string): string {
  const m = /^PC([0-9])([0-9])$/.exec(code ?? "");
  if (!m) return "LEVEL";
  return m[1] === "1" && m[2] === "9" ? "FINAL" : `${m[1]}–${m[2]}`;
}

/** Yon o'yiqlar (bilet kesigi) — fon rangidan qat'i nazar ishlaydi. */
const NOTCH_MASK =
  "radial-gradient(circle at 0 64%, transparent 0.42em, #000 0.45em) left / 51% 100% no-repeat, radial-gradient(circle at 100% 64%, transparent 0.42em, #000 0.45em) right / 51% 100% no-repeat";

export function TestCover({
  unit,
  title,
  subtitle,
  level = false,
  locked = false,
  className = "",
  size = 14,
  course = "Beginner",
  code,
}: {
  unit: number | null;
  title: string;
  subtitle?: string;
  level?: boolean;
  locked?: boolean;
  className?: string;
  /** Asosiy shrift o‘lchami (px) — bilet ichidagi hamma narsa shunga nisbatan. */
  size?: number;
  /** Daraja: Beginner, Pre-Intermediate … */
  course?: string;
  /** Test kodi: umumiy testlarda "LEVEL" o'rniga unitlar oralig'i ko'rsatiladi (PC15 → 1–5). */
  code?: string;
}) {
  const [from, to] = PALETTES[((unit ?? 1) - 1) % PALETTES.length];
  const top = level ? "linear-gradient(140deg, #F5C76A 0%, #c9922e 60%, #7a5410 100%)" : `linear-gradient(140deg, ${from} 0%, ${to} 100%)`;
  const icons = course === "Pre-Intermediate" ? ICONS_PREINT : ICONS;
  const icon = level ? "🏆" : icons[((unit ?? 1) - 1) % icons.length];

  return (
    <div
      className={`relative aspect-[3/4] drop-shadow-[0_8px_14px_rgb(0_0_0/0.45)] ${className}`}
      style={{ fontSize: size }}
      aria-label={title}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[0.9em]" style={{ mask: NOTCH_MASK, WebkitMask: NOTCH_MASK }}>
        {/* yuqori — rangli qism */}
        <div className="relative flex basis-[64%] flex-col justify-between overflow-hidden p-[0.7em]" style={{ background: top }}>
          <span aria-hidden className="absolute -right-[0.8em] -top-[0.8em] size-[4.2em] rounded-full bg-white/15" />
          <span aria-hidden className="absolute -bottom-[1.2em] -left-[0.6em] size-[3.4em] rounded-full bg-black/10" />
          <div className="relative flex items-start justify-between">
            <span className={`text-[0.5em] font-bold uppercase tracking-[0.18em] ${level ? "text-[#1d1608]/80" : "text-white/85"}`}>
              {level ? "Final exam" : "Exam"}
            </span>
            {locked ? <span className="text-[0.75em] leading-none">🔒</span> : null}
          </div>
          <div className="relative flex items-end justify-between gap-1">
            <div>
              <p className={`font-black leading-none ${level ? "text-[#1d1608]" : "text-white"}`} style={{ fontSize: level ? "1.6em" : "2.6em" }}>
                {level ? levelBadge(code) : unit}
              </p>
              <p className={`mt-[0.15em] text-[0.62em] font-semibold ${level ? "text-[#1d1608]/80" : "text-white/85"}`}>
                {level ? course : `Unit ${unit}`}
              </p>
            </div>
            <span aria-hidden className="text-[1.7em] leading-none">{icon}</span>
          </div>
        </div>

        {/* teshikchali chiziq */}
        <div className="bg-[#16231e]">
          <div className="mx-[0.7em] border-t-2 border-dashed border-white/15" />
        </div>

        {/* pastki — mavzu */}
        <div className="flex flex-1 flex-col justify-center bg-[#16231e] px-[0.7em]">
          <p className="line-clamp-2 text-[0.56em] leading-snug text-white/70">{subtitle || (level ? "All units" : "Exam test")}</p>
          <p className="mt-[0.2em] text-[0.45em] font-bold tracking-[0.16em] text-white/35">NSP · {course.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
