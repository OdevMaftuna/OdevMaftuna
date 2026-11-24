import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { SpeakButton } from "@/app/oquvchi/vazifa/[id]/lesson/lesson-ui";
import { nextMilestone, type DayTheme } from "@/lib/daily";
import type { Streak } from "@/lib/streak";

/** O'quvchi bosh sahifasi bloklari (mobil ilovalardagi kabi tartib). */

const HEX = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
const panel = "rounded-[26px] border border-white/[0.07] bg-[#141d19]";

/* ---------------- 1. Yuqori qator ---------------- */
export function HomeTopBar({ name, level, xp, greeting, avatar, chatUnread = 0 }: { name: string; level: string | null; xp: number; greeting: { text: string; emoji: string }; avatar?: string | null; chatUnread?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "ST";
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-14 shrink-0 place-items-center">
        <span aria-hidden className="absolute inset-0" style={{ clipPath: HEX, background: "linear-gradient(150deg, #f5c76a, #c9822a)" }} />
        <span aria-hidden className="absolute inset-[3px]" style={{ clipPath: HEX, background: "linear-gradient(150deg, #14a67a, #046b4e)" }} />
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="absolute inset-[3px] size-[calc(100%-6px)] object-cover" style={{ clipPath: HEX }} />
        ) : (
          <span className="relative text-lg font-black text-white">{initials}</span>
        )}
        {level ? (
          <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#0d1512] px-1.5 text-[10px] font-extrabold text-[#1d1608]" style={{ backgroundColor: "#F5C76A" }}>
            {level}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500">
          {greeting.text} {greeting.emoji}
        </p>
        <h1 className="truncate text-xl font-bold tracking-tight">{name.split(" ")[0] || "Student"}!</h1>
      </div>
      <Link href="/oquvchi/chat" aria-label={chatUnread ? `Chat: ${chatUnread} ta yangi xabar` : "Chat"} className="relative grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-xl transition hover:bg-white/[0.08]">
        💬
        {chatUnread ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{chatUnread}</span>
        ) : null}
      </Link>
      <div className="flex items-center gap-1.5 rounded-full border border-sun-400/30 bg-[#2a2213] py-1.5 pl-2 pr-3" title="XP — har bir to‘g‘ri javob va topshirilgan vazifa uchun">
        <span className="star-spin text-lg leading-none">⭐</span>
        <span className="text-base font-extrabold tabular-nums" style={{ color: "#F5C76A" }}>
          {xp.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

/* ---------------- 2. Haftalik seriya ---------------- */
export function WeekStreak({ streak }: { streak: Streak }) {
  const { count, today, week } = streak;
  const { target, left } = nextMilestone(count);
  const pct = Math.round((count / target) * 100);
  return (
    <section className={`${panel} flex items-center gap-4 p-4`}>
      <div className="relative grid size-[72px] shrink-0 place-items-center rounded-[22px]" style={{ background: count ? "linear-gradient(150deg, #f1a93b, #b45309)" : "#1f2925" }}>
        <span className={`text-4xl ${count ? "flame" : "opacity-40 grayscale"}`} aria-hidden>
          🔥
        </span>
        <span className="absolute -bottom-2 rounded-full border-2 border-[#141d19] bg-[#0d1512] px-2 text-sm font-black tabular-nums" style={{ color: "#F5C76A" }}>
          {count}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <ul className="flex justify-between">
          {week.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span
                className={`grid size-8 place-items-center rounded-full text-xs font-bold ${
                  d.active ? "text-white" : d.isToday ? "today-ring" : "bg-white/[0.06] text-white/25"
                }`}
                style={d.active ? { background: "linear-gradient(150deg, #14a67a, #046b4e)" } : d.isToday ? { boxShadow: "inset 0 0 0 2px #F1A93B" } : undefined}
              >
                {d.active ? "✓" : d.isToday ? "" : "·"}
              </span>
              <span className={`text-[10px] font-semibold ${d.isToday ? "text-sun-400" : "text-neutral-500"}`}>{d.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2.5 rounded-full bg-[#0d2f42]/60 px-3 py-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#7cc4ff]">{today ? "Great! Keep it going 💪" : "Do one task today to keep your streak!"}</span>
            <span className="shrink-0 text-[#7cc4ff]">
              {left} day{left === 1 ? "" : "s"} → 🎯 {target}
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7cc4ff, #F5C76A)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 3. Kunlik karta: kun so'zi + iqtibos ---------------- */
export function DailyCard({
  theme,
  dateLabel,
  word,
  quote,
}: {
  theme: DayTheme;
  dateLabel: string;
  word: { en: string; uz: string } | null;
  quote: { en: string; uz: string };
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[26px] border border-white/10 p-5"
      style={{ background: `radial-gradient(130% 120% at 100% 0%, ${theme.from} 0%, ${theme.via} 45%, ${theme.to} 100%)` }}
    >
      <span aria-hidden className="promo-shine" />
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 text-[110px] opacity-15">
        {theme.emoji}
      </span>
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
          {theme.name} {theme.emoji} · {dateLabel}
        </p>
        {word ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Word of the day</p>
            <div className="mt-1 flex items-center gap-3">
              <p lang="en" className="text-3xl font-black tracking-tight text-white">
                {word.en}
              </p>
              <SpeakButton text={word.en} small />
            </div>
            <p className="mt-0.5 text-sm text-white/75">{word.uz}</p>
          </div>
        ) : null}
        <div className="mt-4 border-t border-white/15 pt-3">
          <p lang="en" className="text-[15px] font-semibold italic leading-snug text-white">
            “{quote.en}”
          </p>
          <p className="mt-1 text-xs text-white/60">{quote.uz}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4. Ikkita katta karta ---------------- */
function BigCard({ href, icon, title, sub, glow }: { href: string; icon: ReactNode; title: ReactNode; sub: string; glow: string }) {
  return (
    <Link href={href} className={`${panel} group relative flex min-h-[132px] flex-col justify-between overflow-hidden p-4 transition hover:-translate-y-0.5`}>
      <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full blur-2xl" style={{ background: glow }} />
      <span className="relative text-3xl">{icon}</span>
      <div className="relative flex items-end justify-between gap-2">
        <div>
          <p className="text-lg font-bold leading-tight">{title}</p>
          <p className="mt-0.5 text-[11px] text-neutral-500">{sub}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.07] transition group-hover:translate-x-0.5">›</span>
      </div>
    </Link>
  );
}

export function QuickCards({ courseHref, courseName }: { courseHref: string; courseName: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <BigCard href={courseHref} icon="📘" title={<>My<br />course</>} sub={courseName ?? "Practice"} glow="rgb(124 58 237 / 0.35)" />
      <BigCard href="/oquvchi/testlar" icon="👑" title={<>Exam<br />tests</>} sub="PRO · prove your level" glow="rgb(241 169 59 / 0.35)" />
    </div>
  );
}

/* ---------------- 5. Rangli tugmalar ---------------- */
export type Tile = { href: string; label: string; icon: string; from: string; to: string; badge?: string };

export function HomeTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section className={`${panel} p-3`}>
      <ul className="grid grid-cols-3 gap-2.5">
        {tiles.map((t, i) => (
          <li key={t.label} className="stagger" style={{ "--i": i } as CSSProperties}>
            <Link href={t.href} className="group relative flex flex-col items-center gap-2 rounded-[20px] bg-white/[0.04] px-1 py-4 transition hover:bg-white/[0.07]">
              <span
                className="grid size-14 place-items-center rounded-full text-2xl shadow-[0_10px_24px_-10px_rgb(0_0_0/0.9)] transition group-hover:-translate-y-0.5 group-active:scale-95"
                style={{ background: `linear-gradient(150deg, ${t.from}, ${t.to})` }}
              >
                {t.icon}
              </span>
              <span className="text-center text-[13px] font-semibold leading-tight">{t.label}</span>
              {t.badge ? (
                <span className="absolute right-2 top-2 min-w-5 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-5 text-white">{t.badge}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SectionTitle({ children, href, more = "See all" }: { children: ReactNode; href?: string; more?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h2 className="text-lg font-bold">{children}</h2>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-[#b49cff] hover:underline">
          {more} ›
        </Link>
      ) : null}
    </div>
  );
}
