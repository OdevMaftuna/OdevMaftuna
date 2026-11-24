"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TestCover } from "@/components/test-cover";
import type { PromoOffer } from "@/lib/paid-tests";

/** "20000" → "20 000 so‘m" (paid-tests.ts server uchun, bu yerda alohida). */
const som = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} so‘m`;

type Slide = { key: string; label: string; href: string; bg: string; body: ReactNode; art: ReactNode; ribbon?: string };

/** Unit testlar slaydi uchun ranglar (daraja bo'yicha). */
const UNIT_BG: Record<string, string> = {
  Beginner: "radial-gradient(120% 140% at 100% 0%, #3f6fd8 0%, #1f3c88 40%, #0d2a21 100%)",
  "Pre-Intermediate": "radial-gradient(120% 140% at 100% 0%, #a54cc0 0%, #5a2a7a 42%, #0d2a21 100%)",
};
/** Yorliqlar uchun qisqa nom (telefonda bir qatorga sig'ishi uchun). */
const SHORT: Record<string, string> = { "Pre-Intermediate": "PRE-INT" };
const short = (c: string) => SHORT[c] ?? c.toUpperCase();

function Tag({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return (
    <span
      className={`w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${gold ? "text-[#1d1608]" : "bg-white/15 text-white backdrop-blur"}`}
      style={gold ? { backgroundColor: "#F5C76A" } : undefined}
    >
      {children}
    </span>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <p lang="en" className="text-[11px] italic text-white/75 sm:text-xs">
      “{children}”
    </p>
  );
}

function Title({ top, accent, color = "#F5C76A" }: { top: string; accent: string; color?: string }) {
  return (
    <p lang="en" className="text-lg font-extrabold leading-tight text-white drop-shadow sm:text-[1.65rem]">
      {top}
      <br />
      <span style={{ color }}>{accent}</span>
    </p>
  );
}

/** Oltin "sotib olish" tugmasi — yaltirab turadi. */
function Cta({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={`promo-cta relative mt-1 w-fit overflow-hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-[0_8px_20px_-8px_rgb(241_169_59/0.9)] ${
        light ? "bg-white text-[#17120a]" : "text-[#1d1608]"
      }`}
      style={light ? undefined : { background: "linear-gradient(135deg, #f5c76a, #f1a93b)" }}
    >
      {children} →
    </span>
  );
}

/** Yulduzchalar (bezak). */
function Sparkles() {
  const pos: CSSProperties[] = [
    { left: "52%", top: "14%" },
    { left: "88%", top: "10%", animationDelay: "0.8s" },
    { left: "64%", top: "78%", animationDelay: "1.6s" },
    { left: "40%", top: "86%", animationDelay: "2.2s" },
  ];
  return (
    <>
      {pos.map((p, i) => (
        <span key={i} aria-hidden className="promo-sparkle pointer-events-none absolute text-[10px] text-white/70" style={p}>
          ✦
        </span>
      ))}
    </>
  );
}

function buildSlides(offers: PromoOffer[], testsHref: string): Slide[] {
  const totalUnits = offers.reduce((t, o) => t + o.units, 0);
  const minPrice = Math.min(...offers.map((o) => o.unitPrice), 20000);
  const preint = offers.find((o) => o.course === "Pre-Intermediate");
  const product: Slide[] = [];

  // 0) YANGI: Pre-Intermediate testlari — e'lon
  if (preint?.units) {
    const fan = [1, 3, 5, 7, 9].filter((u) => u <= preint.units);
    product.push({
      key: "new-preint",
      label: "New: Pre-Intermediate exam tests",
      href: preint.unitsHref,
      ribbon: "NEW",
      bg: "radial-gradient(120% 160% at 85% 10%, #c46be0 0%, #6b2a8a 35%, #241238 70%, #0d1a15 100%)",
      body: (
        <>
          <Tag gold>🔥 JUST ARRIVED · PRE-INT</Tag>
          <Title top={`${preint.units} new exam tests`} accent="for Pre-Intermediate!" />
          <Quote>Ready for the next level? Prove it unit by unit.</Quote>
          <Cta>from {som(preint.unitPrice)}</Cta>
        </>
      ),
      art: (
        <div className="relative mb-1 mr-2 h-36 w-44 sm:h-44 sm:w-64">
          {/* Biletlar yelpig'ich bo'lib ochiladi. */}
          {fan.map((u, i) => {
            const k = i - (fan.length - 1) / 2;
            return (
              <div
                key={u}
                className="absolute bottom-0 left-1/2 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${k * 14}deg) translateY(${Math.abs(k) * 6}px)` }}
              >
                <TestCover unit={u} course="Pre-Intermediate" title="" size={9} className="w-[58px] sm:w-[78px]" />
              </div>
            );
          })}
        </div>
      ),
    });
  }

  // 1) Level testlar (yakuniy imtihon)
  for (const o of offers) {
    if (!o.level) continue;
    product.push({
      key: `level-${o.course}`,
      label: `${o.course} Level Test`,
      href: o.level.href,
      bg: "radial-gradient(120% 140% at 0% 0%, #4a3408 0%, #1d160a 45%, #0d2a21 100%)",
      body: (
        <>
          <Tag gold>🏆 FINAL EXAM · {short(o.course)}</Tag>
          <Title top={`Finished ${o.course}?`} accent="Prove it!" />
          <Quote>{o.levels > 1 ? `${o.levels} cumulative tests — the final one covers everything.` : "Your level is what you can show, not what you think."}</Quote>
          <Cta>{som(o.level.price)}</Cta>
        </>
      ),
      art: (
        <>
          <TestCover unit={o.units} course={o.course} title="" size={10} className="hidden w-20 -rotate-6 translate-x-6 opacity-90 sm:block" />
          <TestCover unit={Math.max(1, Math.ceil(o.units / 2))} course={o.course} title="" size={10} className="w-[60px] rotate-3 translate-x-3 sm:w-[88px]" />
          <TestCover unit={null} level course={o.course} code={o.level.code} title="" size={12} className="promo-glow w-[84px] -rotate-2 sm:w-[110px]" />
        </>
      ),
    });
  }

  // 2) Unit testlar (Pre-Int uchun e'lon slaydi bor — bu yerda Beginner va boshqalar)
  for (const o of offers) {
    if (!o.units || o === preint) continue;
    product.push({
      key: `units-${o.course}`,
      label: `${o.course} unit tests`,
      href: o.unitsHref,
      bg: UNIT_BG[o.course] ?? UNIT_BG.Beginner,
      body: (
        <>
          <Tag>{o.units} UNIT TESTS · {short(o.course)}</Tag>
          <Title top="After every unit —" accent="a real exam!" />
          <Quote>Test yourself before the test tests you.</Quote>
          <Cta light>from {som(o.unitPrice)}</Cta>
        </>
      ),
      art: (
        <>
          <TestCover unit={1} course={o.course} title="" size={10} className="hidden w-[86px] -rotate-6 translate-x-7 sm:block" />
          <TestCover unit={2} course={o.course} title="" size={10} className="w-[64px] translate-x-3 sm:w-[92px]" />
          <TestCover unit={3} course={o.course} title="" size={11} className="w-[80px] rotate-6 sm:w-[104px]" />
        </>
      ),
    });
  }

  // 3) Motivatsiya + sotuv slaydlari
  const motivation: Slide[] = [
    {
      key: "m-mistakes",
      label: "Find your mistakes before the exam",
      href: testsHref,
      bg: "radial-gradient(120% 140% at 0% 100%, #1fae74 0%, #0f5c46 40%, #0b2119 100%)",
      body: (
        <>
          <Tag>⚡ INSTANT RESULT</Tag>
          <Title top="Mistakes are proof" accent="that you are trying." color="#9ee0c4" />
          <Quote>Find them here — not in the real exam.</Quote>
          <Cta>Get your score · from {som(minPrice)}</Cta>
        </>
      ),
      art: (
        <div className="promo-float mb-2 mr-3 w-[150px] rounded-2xl border border-white/15 bg-[#0b1d17]/85 p-3 shadow-2xl backdrop-blur sm:w-[210px]">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-12 shrink-0 place-items-center rounded-full border-[5px] border-[#F5C76A] sm:size-16">
              <span className="text-base font-black text-white sm:text-xl">92</span>
              <span className="absolute -right-2 -top-2 text-base">⭐</span>
            </div>
            <div className="min-w-0 text-[10px] leading-tight text-white/70 sm:text-xs">
              <p className="font-bold text-white">Unit 4 Test</p>
              <p>Score 92 / 100</p>
            </div>
          </div>
          <ul className="mt-2 space-y-1 text-[10px] sm:text-[11px]">
            <li className="flex justify-between text-white/80"><span>✓ Grammar</span><b>19/20</b></li>
            <li className="flex justify-between text-white/80"><span>✓ Vocabulary</span><b>18/20</b></li>
            <li className="flex justify-between text-[#ff9aa2]"><span>✗ 3 mistakes</span><b>explained</b></li>
          </ul>
        </div>
      ),
    },
    {
      key: "m-steps",
      label: "Small steps every day",
      href: preint?.unitsHref ?? testsHref,
      bg: "radial-gradient(120% 140% at 100% 100%, #f08a2e 0%, #9a3d10 40%, #1a120b 100%)",
      body: (
        <>
          <Tag>🚀 {totalUnits} TESTS · {offers.length} LEVELS</Tag>
          <Title top="Small steps every day" accent="= big results." />
          <Quote>Every test you pass is one step up.</Quote>
          <Cta>Start with Unit 1</Cta>
        </>
      ),
      art: (
        <div className="relative mb-1 mr-2 flex items-end gap-1 sm:gap-1.5">
          {[1, 2, 3, 4].map((u, i) => (
            <div key={u} style={{ marginBottom: i * 14 }}>
              <TestCover unit={u} course={preint ? "Pre-Intermediate" : "Beginner"} title="" size={7} className="w-[38px] sm:w-[54px]" />
            </div>
          ))}
          <div className="relative" style={{ marginBottom: 56 }}>
            <TestCover unit={null} level title="" size={8} className="promo-glow w-[44px] sm:w-[62px]" />
            <span className="promo-float absolute -left-4 -top-8 text-2xl">🚀</span>
          </div>
        </div>
      ),
    },
    {
      key: "m-expert",
      label: "Every expert was once a beginner",
      href: testsHref,
      bg: "radial-gradient(120% 140% at 0% 0%, #22b8cc 0%, #0e5966 40%, #0b1f1c 100%)",
      body: (
        <>
          <Tag>🎯 LEVEL UP</Tag>
          <Title top="Every expert" accent="was once a beginner." color="#9ee0c4" />
          <Quote>Beginner ✓ → Pre-Intermediate → you are next!</Quote>
          <Cta>Choose your level</Cta>
        </>
      ),
      art: (
        <div className="relative mb-1 mr-2 flex items-end gap-2 sm:gap-3">
          <svg aria-hidden viewBox="0 0 200 80" className="absolute -top-2 left-2 w-[90%]" fill="none">
            <path d="M10 70 C 60 70, 70 30, 110 34 S 170 10, 192 6" stroke="#F5C76A" strokeWidth="2.5" strokeDasharray="6 6" className="promo-dash" />
          </svg>
          <div className="relative">
            <TestCover unit={null} level title="" size={8} className="w-[50px] sm:w-[64px]" />
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#1fae74] text-[11px] font-bold text-white">✓</span>
          </div>
          <div className="relative mb-4">
            <TestCover unit={1} course="Pre-Intermediate" title="" size={8} className="promo-glow w-[54px] sm:w-[70px]" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-[#0e5966]">YOU</span>
          </div>
          <div className="mb-9 grid aspect-[3/4] w-[50px] place-items-center rounded-[0.6em] border-2 border-dashed border-white/40 bg-white/5 text-center text-[9px] font-bold leading-tight text-white/70 sm:w-[64px]">
            🔒
            <br />
            Inter-
            <br />
            mediate
          </div>
        </div>
      ),
    },
  ];

  // Mahsulot va motivatsiya slaydlarini almashtirib qo'yamiz.
  const out: Slide[] = [];
  let m = 0;
  product.forEach((s, i) => {
    out.push(s);
    if (i % 2 === 1 && m < motivation.length) out.push(motivation[m++]);
  });
  return [...out, ...motivation.slice(m)];
}

/**
 * Bosh sahifa va testlar sahifasi tepasidagi aylanuvchi reklama banneri: barcha darajalarning
 * pullik testlari + ingliz tilidagi motivatsion sotuv slaydlari. Har 5 soniyada keyingisi, barmoq bilan suriladi.
 */
export function PromoCarousel({ offers, testsHref }: { offers: PromoOffer[]; testsHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const slides = buildSlides(offers, testsHref);
  const count = slides.length;

  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const t = setInterval(() => {
      if (paused.current || document.hidden) return;
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [count]);

  return (
    <div
      className="relative"
      onPointerDown={() => (paused.current = true)}
      onPointerUp={() => setTimeout(() => (paused.current = false), 4000)}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
      >
        {slides.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className="promo-slide group relative flex h-52 w-full shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 sm:h-60"
            style={{ background: s.bg }}
            aria-label={s.label}
          >
            <span aria-hidden className="promo-shine" />
            <Sparkles />
            <div className="relative z-[1] flex w-[60%] flex-col justify-center gap-1.5 p-5 sm:p-6">{s.body}</div>
            <div aria-hidden className="absolute -right-1 bottom-4 z-[1] flex items-end transition duration-500 group-hover:-translate-y-1">
              {s.art}
            </div>
            {s.ribbon ? (
              <span aria-hidden className="promo-ribbon absolute right-[-34px] top-[14px] z-[2] rotate-45 px-10 py-0.5 text-[10px] font-black tracking-[0.2em] text-[#1d1608]">
                {s.ribbon}
              </span>
            ) : null}
            <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
          </Link>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${index === i ? "w-5 bg-sun-400" : "w-1.5 bg-neutral-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
