"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AREA_LABEL, formatUpdateDate, updatesFor, updatesVersion, type UpdateScene } from "@/lib/updates";
import { Zumi } from "@/components/mascot";

/**
 * Story-qo'llanma (ilovalardagi kabi, lekin NSP uslubida):
 *  - to'q, jonli fonlar: harakatlanuvchi nurli dog'lar, suzuvchi bezaklar, mayda "don" teksturasi;
 *  - katta sarlavha — so'zlar birma-bir chiqadi, kalit so'z oltin marker bilan;
 *  - 3D qiyshaygan telefon maketi + atrofida "pop" bo'ladigan stikerlar;
 *  - maskot (👾 Zumi — kosmik do'stimiz), jonli "Sinab ko'ring!" savoli — to'g'ri javobda konfetti;
 *  - har bir story oxirida harakat tugmasi (masalan "Uy vazifaga o'tish →").
 * Birinchi kirishda va har login qilinganda "Boshlash" pop-up bo'lib ochiladi.
 */

/* ---------------- Saqlash (localStorage + obuna) ---------------- */
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {}
  listeners.forEach((fn) => fn());
};
const SEEN_KEY = "nsp-stories-seen";
const INTRO_KEY = "nsp-stories-intro";
const useStored = (k: string, server: string) => useSyncExternalStore(subscribe, () => read(k) ?? "", () => server);

/* ---------------- Mavzular (fon ranglari) ---------------- */
type Theme = "emerald" | "sunset" | "violet" | "ocean" | "gold" | "berry";
const THEME: Record<Theme, { base: string; a: string; b: string; c: string; accent: string; deco: string[] }> = {
  emerald: { base: "#062a20", a: "#14a67a", b: "#f5c76a", c: "#0b5c45", accent: "#F5C76A", deco: ["✦", "★", "◆"] },
  sunset: { base: "#3b0d16", a: "#ff6a3d", b: "#ffd166", c: "#ff2e63", accent: "#FFD166", deco: ["✺", "✦", "●"] },
  violet: { base: "#1a0b3d", a: "#7c3aed", b: "#f472b6", c: "#4c1d95", accent: "#F9A8D4", deco: ["✧", "♪", "✦"] },
  ocean: { base: "#04203f", a: "#1fa2ff", b: "#6ee7f9", c: "#0b4f9c", accent: "#7DF0FF", deco: ["◌", "✦", "~"] },
  gold: { base: "#2a1a05", a: "#e09b2d", b: "#ffe08a", c: "#8a5a12", accent: "#FFE08A", deco: ["★", "✦", "◆"] },
  berry: { base: "#2b0a2a", a: "#e0457b", b: "#ffb86b", c: "#7a1e6c", accent: "#FFB86B", deco: ["♥", "✦", "●"] },
};

/* ---------------- Sahna bezaklari ---------------- */
function Backdrop({ t }: { t: Theme }) {
  const c = THEME[t];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: c.base }}>
      <span className="st-blob st-blob-1" style={{ background: c.a }} />
      <span className="st-blob st-blob-2" style={{ background: c.b }} />
      <span className="st-blob st-blob-3" style={{ background: c.c }} />
      <span className="st-grain absolute inset-0" />
      {/* Suzuvchi mayda bezaklar */}
      {[
        [8, 22, 18, 0],
        [86, 16, 14, 1],
        [14, 70, 12, 2],
        [90, 62, 20, 0],
        [70, 88, 12, 1],
        [30, 92, 16, 2],
      ].map(([x, y, s, d], i) => (
        <span key={i} className="st-deco absolute font-black" style={{ left: `${x}%`, top: `${y}%`, fontSize: s, color: c.accent, animationDelay: `${i * 0.7}s` }}>
          {c.deco[d]}
        </span>
      ))}
    </div>
  );
}

/** Sarlavha: so'zlar birma-bir chiqadi; *so'z* — oltin marker bilan ajratiladi. */
function Title({ text, accent }: { text: string; accent: string }) {
  let i = 0;
  return (
    <h2 className="text-[34px] font-black leading-[1.05] tracking-[-0.02em] text-white [text-wrap:balance]">
      {text.split(/(\*[^*]+\*)/).map((part, pi) => {
        const hl = part.startsWith("*") && part.endsWith("*");
        const words = (hl ? part.slice(1, -1) : part).split(" ").filter(Boolean);
        return (
          <span key={pi}>
            {words.map((w) => {
              const d = i++ * 70;
              return (
                <span key={`${pi}-${d}`} className="st-word inline-block" style={{ animationDelay: `${d}ms` }}>
                  {hl ? (
                    <span className="st-mark relative inline-block px-1" style={{ "--mk": accent } as CSSProperties}>
                      <span className="relative" style={{ color: "#120d04" }}>
                        {w}
                      </span>
                    </span>
                  ) : (
                    w
                  )}
                  &nbsp;
                </span>
              );
            })}
          </span>
        );
      })}
    </h2>
  );
}

/* ---------------- Telefon maketi va yordamchilar ---------------- */
function Phone({ children, tilt = -8 }: { children: ReactNode; tilt?: number }) {
  return (
    <div className="st-phone-wrap" style={{ "--tilt": `${tilt}deg` } as CSSProperties}>
      <div className="st-phone relative mx-auto h-[318px] w-[178px] rounded-[30px] p-[6px]">
        <div className="relative h-full w-full overflow-hidden rounded-[25px] bg-[#0d1512] text-white">
          <div className="absolute left-1/2 top-1.5 z-10 h-[14px] w-16 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full px-2.5 pb-2 pt-6">{children}</div>
          <span className="st-glare absolute inset-0" />
        </div>
      </div>
    </div>
  );
}

function Tap({ x, y, delay = 0 }: { x: string; y: string; delay?: number }) {
  return (
    <span aria-hidden className="story-tap pointer-events-none absolute z-20" style={{ left: x, top: y, animationDelay: `${delay}ms` }}>
      <span className="story-ripple" />
      <span className="relative text-3xl drop-shadow-[0_4px_6px_rgba(0,0,0,.45)]">👆</span>
    </span>
  );
}

const Line = ({ w = "100%", c = "rgba(255,255,255,.14)", h = 6 }: { w?: string; c?: string; h?: number }) => (
  <span className="block rounded-full" style={{ width: w, height: h, background: c }} />
);
const MiniCard = ({ children, gold }: { children: ReactNode; gold?: boolean }) => (
  <div className={`rounded-xl border p-2 ${gold ? "border-[#f1a93b]/50 bg-[#2a2213]" : "border-white/10 bg-white/[0.05]"}`}>{children}</div>
);
const Glass = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <div className={`rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md ${className}`} style={style}>
    {children}
  </div>
);

function MiniNav({ active }: { active: number }) {
  const icons = ["🏠", "📋", "🏆", "📚", "👤"];
  return (
    <div className="absolute inset-x-2 bottom-2 flex items-center justify-around rounded-2xl border border-white/10 bg-[#13201b] py-1.5">
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`grid size-7 place-items-center rounded-lg text-sm ${i === 2 ? "-mt-4 size-9 bg-gradient-to-b from-[#f5c76a] to-[#e0962e]" : ""} ${i === active ? "story-glow bg-[#14a67a]/40" : ""}`}
        >
          {ic}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Stikerlar ---------------- */
type Sticker = { t: string; x: number; y: number; r?: number; tone?: "gold" | "green" | "white" | "red" | "dark" };
const STK: Record<NonNullable<Sticker["tone"]>, string> = {
  gold: "bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] text-[#1d1608]",
  green: "bg-gradient-to-b from-[#3ddc97] to-[#0f8a63] text-white",
  white: "bg-white text-neutral-900",
  red: "bg-gradient-to-b from-[#ff7a7a] to-[#e0344b] text-white",
  dark: "bg-[#120d04] text-[#F5C76A]",
};
function Stickers({ list }: { list: Sticker[] }) {
  return (
    <>
      {list.map((s, i) => (
        <span
          key={i}
          className={`st-sticker absolute z-30 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-extrabold shadow-[0_10px_25px_-8px_rgba(0,0,0,.6)] ${STK[s.tone ?? "white"]}`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, "--r": `${s.r ?? 0}deg`, animationDelay: `${500 + i * 280}ms` } as CSSProperties}
        >
          {s.t}
        </span>
      ))}
    </>
  );
}

/* ---------------- Konfetti ---------------- */
function Confetti() {
  const colors = ["#F5C76A", "#3ddc97", "#ff6a8a", "#7DF0FF", "#ffffff", "#f1a93b"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 37) % 100;
        const dx = ((i * 53) % 60) - 30;
        const rot = (i * 97) % 360;
        return (
          <span
            key={i}
            className="st-confetti absolute top-[-12px] block h-3 w-2 rounded-[2px]"
            style={{ left: `${x}%`, background: colors[i % colors.length], "--dx": `${dx}vw`, "--rot": `${rot + 540}deg`, animationDelay: `${(i % 9) * 60}ms` } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

/* ---------------- Maketlar ---------------- */
type Mock =
  | "mascot" | "nav" | "homework" | "xp" | "steps" | "quiz" | "listen" | "speak" | "submit" | "marks" | "explain" | "retry"
  | "vocab" | "grammar" | "phrases" | "covers" | "pay" | "score" | "profile" | "menu" | "lock" | "tryit" | "finish" | "news"
  | "newsCover" | UpdateScene;

function MockView({ m, onSolved, art }: { m: Mock; onSolved: () => void; art?: string }) {
  switch (m) {
    case "news":
      return (
        <div className="relative mx-auto grid h-[260px] w-[260px] place-items-center">
          <span className="st-halo absolute size-56 rounded-full" />
          <Glass className="st-pop-big relative grid size-40 place-items-center rounded-[36px] shadow-[0_25px_50px_-12px_rgba(0,0,0,.6)]">
            <span className="st-bob text-[84px] leading-none">{art ?? "✨"}</span>
          </Glass>
        </div>
      );
    case "newsCover":
    case "zumi":
      return (
        <div className="relative mx-auto grid h-[290px] w-[280px] place-items-center">
          <span className="st-halo absolute size-60 rounded-full" />
          <span className="st-orbit-a absolute text-2xl">🚗</span>
          <span className="st-orbit-b absolute text-2xl">⏰</span>
          <span className="st-orbit-c absolute text-2xl">💬</span>
          <span className="st-bob relative drop-shadow-[0_25px_30px_rgba(0,0,0,.5)]">
            <Zumi size={m === "zumi" ? 170 : 150} />
          </span>
          {m === "newsCover" ? (
            <span className="up-badge absolute right-2 top-4 rounded-2xl bg-gradient-to-b from-[#ff7a7a] to-[#e0344b] px-3 py-1.5 text-sm font-black text-white shadow-xl">NEW!</span>
          ) : (
            <span className="up-badge absolute left-0 top-6 rounded-2xl bg-white px-3 py-1.5 text-sm font-black text-neutral-900 shadow-xl">Sova → Zumi ✨</span>
          )}
        </div>
      );
    case "stats":
      return (
        <div className="relative mx-auto w-[290px] rounded-[26px] border border-white/15 bg-[#0d1512]/85 p-4 shadow-[0_25px_50px_-15px_rgba(0,0,0,.7)] backdrop-blur">
          <div className="flex items-center justify-between">
            <b className="text-[15px] text-white">Natijalarim</b>
            <span className="flex gap-1 rounded-full bg-white/10 p-0.5 text-[10px] font-bold">
              <span className="rounded-full bg-[#F5C76A] px-2 py-0.5 text-[#1d1608]">Hafta</span>
              <span className="px-1.5 py-0.5 text-white/60">Oy</span>
            </span>
          </div>
          <p className="mt-1 text-3xl font-black text-white">
            77<span className="text-lg text-white/50">%</span>
            <span className="ml-2 rounded-full bg-[#3ddc97]/20 px-1.5 py-0.5 align-middle text-[10px] text-[#3ddc97]">▲ 9%</span>
          </p>
          <svg viewBox="0 0 260 80" className="mt-1 w-full overflow-visible">
            <path className="up-route" d="M5 52 C30 40 50 30 75 36 S120 60 150 50 S190 22 215 28 S245 12 255 8" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(245,199,106,.8))" }} />
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d, i) => (
              <text key={d} x={5 + i * 41.6} y={78} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.45)" fontWeight="700">
                {d}
              </text>
            ))}
          </svg>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {(
              [
                ["📋", 84, "#F5C76A"],
                ["🧩", 76, "#3ddc97"],
                ["🔤", 91, "#5ab0ff"],
                ["💬", 63, "#ff7ab6"],
              ] as const
            ).map(([ic, v, c], i) => (
              <span key={ic} className="story-pop flex flex-col items-center gap-0.5" style={{ animationDelay: `${700 + i * 150}ms` }}>
                <span className="grid size-11 place-items-center rounded-full text-base" style={{ background: `conic-gradient(${c} ${v * 3.6}deg, rgba(255,255,255,.1) 0)` }}>
                  <span className="grid size-8 place-items-center rounded-full bg-[#0d1512]">{ic}</span>
                </span>
                <b className="text-[11px] text-white">{v}%</b>
              </span>
            ))}
          </div>
        </div>
      );
    case "wander":
      return (
        <div className="relative mx-auto h-[250px] w-[290px] overflow-hidden rounded-[28px] border border-white/15 shadow-[0_25px_50px_-15px_rgba(0,0,0,.7)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff9a5a] via-[#ffc27a] to-[#ffe2a8]" />
          <span className="absolute right-8 top-6 size-12 rounded-full bg-[#fff3c4] shadow-[0_0_40px_#fff3c4]" />
          <div className="up-hills absolute bottom-[62px] left-0 flex w-[200%]">
            {[0, 1].map((k) => (
              <svg key={k} viewBox="0 0 290 80" className="h-20 w-1/2" preserveAspectRatio="none">
                <path d="M0 80 L0 50 L30 30 L55 48 L80 18 L110 46 L140 26 L170 50 L200 22 L235 44 L260 30 L290 50 L290 80 Z" fill="#c0573a" opacity=".85" />
                <path d="M0 80 L0 62 L40 50 L90 64 L130 52 L180 66 L230 54 L290 64 L290 80 Z" fill="#8a3a2a" />
              </svg>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[64px] bg-[#2b2b33]">
            <div className="up-road absolute left-0 right-0 top-[29px] h-[5px]" style={{ background: "repeating-linear-gradient(90deg,#ffd166 0 24px,transparent 24px 48px)" }} />
          </div>
          <span className="up-car absolute bottom-[26px] left-[38%] inline-block text-[54px] leading-none drop-shadow-[0_8px_6px_rgba(0,0,0,.4)]">
            <span className="inline-block" style={{ transform: "scaleX(-1)" }}>🚙</span>
          </span>
          <span className="story-pop absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-black text-white backdrop-blur" style={{ animationDelay: "600ms" }}>
            🛣 ROUTE 66 · 12-kun
          </span>
          <span className="story-pop absolute bottom-[78px] right-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-neutral-900 shadow" style={{ animationDelay: "1100ms" }}>
            📍 Amarillo, TX
          </span>
        </div>
      );
    case "route":
      return (
        <div className="relative mx-auto w-[290px]">
          <svg viewBox="0 0 290 200" className="w-full drop-shadow-[0_20px_30px_rgba(0,0,0,.5)]">
            <path d="M18 40 Q60 14 120 22 T230 20 Q272 30 276 70 Q282 120 250 150 Q200 186 140 172 Q70 160 30 178" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeDasharray="4 6" />
            <path className="up-route" d="M250 60 C210 80 180 70 150 96 S90 120 60 112 S30 140 26 160" fill="none" stroke="#F5C76A" strokeWidth="6" strokeLinecap="round" />
            <path className="up-route" style={{ animationDelay: "1.2s" }} d="M26 160 C40 120 30 90 40 60" fill="none" stroke="#7DF0FF" strokeWidth="6" strokeLinecap="round" />
            <path className="up-route" style={{ animationDelay: "2.1s" }} d="M40 60 C100 40 170 50 262 40" fill="none" stroke="#ff7ab6" strokeWidth="6" strokeLinecap="round" />
            {(
              [
                [250, 60, "Chicago"],
                [150, 96, "Tulsa"],
                [26, 160, "LA"],
                [40, 60, "Seattle"],
                [262, 40, "New York"],
              ] as const
            ).map(([x, y, n], i) => (
              <g key={n} className="story-pop" style={{ animationDelay: `${400 + i * 500}ms`, transformOrigin: `${x}px ${y}px` }}>
                <circle cx={x} cy={y} r="7" fill="#fff" stroke="#120d04" strokeWidth="2.5" />
                <text x={Math.max(x, 24)} y={y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
                  {n}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 flex justify-center gap-1.5 text-[11px] font-black">
            <span className="rounded-full bg-[#F5C76A] px-2.5 py-1 text-[#1d1608]">Route 66</span>
            <span className="rounded-full bg-[#7DF0FF] px-2.5 py-1 text-[#04203f]">Pacific</span>
            <span className="rounded-full bg-[#ff7ab6] px-2.5 py-1 text-white">Lincoln</span>
          </div>
        </div>
      );
    case "weather":
      return (
        <div className="relative mx-auto h-[240px] w-[280px] overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-[#0b1d4a] via-[#3a4fa8] to-[#ff9a6a]">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="st-deco absolute text-[10px] text-white" style={{ left: `${(i * 37) % 95}%`, top: `${(i * 23) % 45}%`, animationDelay: `${i * 0.3}s` }}>
              ✦
            </span>
          ))}
          <span className="up-sun absolute bottom-16 left-1/2 -ml-6 text-5xl">☀️</span>
          <div className="absolute inset-x-3 bottom-3 grid grid-cols-4 gap-1.5">
            {["🌧", "❄️", "🌫", "⛅"].map((w, i) => (
              <span key={w} className="story-pop grid place-items-center rounded-xl bg-black/40 py-1.5 text-2xl backdrop-blur" style={{ animationDelay: `${500 + i * 200}ms` }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      );
    case "crew":
      return (
        <div className="mx-auto w-[280px] space-y-2">
          {(
            [
              ["🥇", "Aziza", 24, "#F5C76A"],
              ["🥈", "Siz", 19, "#3ddc97"],
              ["🥉", "Jasur", 15, "#7DF0FF"],
              ["4", "Malika", 9, "#ff7ab6"],
            ] as const
          ).map(([medal, n, d, c], i) => (
            <Glass key={n} className={`story-slide-in flex items-center gap-3 p-2.5 ${n === "Siz" ? "ring-2 ring-[#3ddc97]" : ""}`} style={{ animationDelay: `${300 + i * 200}ms` }}>
              <span className="grid size-8 place-items-center text-lg font-black text-white">{medal}</span>
              <b className="flex-1 text-[15px] text-white">{n}</b>
              <span className="h-2 w-20 overflow-hidden rounded-full bg-white/15">
                <span className="block h-full rounded-full" style={{ width: `${(d / 24) * 100}%`, background: c }} />
              </span>
              <span className="w-12 text-right text-xs font-black text-white/80">🔥 {d}</span>
            </Glass>
          ))}
        </div>
      );
    case "crash":
      return (
        <div className="relative mx-auto grid h-[250px] w-[280px] place-items-center">
          <span className="absolute bottom-10 h-3 w-60 rounded-full bg-black/40 blur-sm" />
          <span className="up-crash relative inline-block text-[90px] leading-none">
            <span className="inline-block" style={{ transform: "scaleX(-1)" }}>🚗</span>
          </span>
          <span className="up-boom absolute right-6 top-8 text-[70px]">💥</span>
          <span className="story-pop absolute bottom-0 rounded-full bg-white px-4 py-1.5 text-sm font-black text-neutral-900 shadow-xl" style={{ animationDelay: "1.9s" }}>
            Seriya: 18 → 0 😱
          </span>
        </div>
      );
    case "nudge":
      return (
        <Phone>
          <p className="text-[10px] text-white/60">My course · Grammar</p>
          <div className="mt-2 space-y-2 opacity-60">
            <MiniCard>
              <Line w="70%" />
            </MiniCard>
            <MiniCard>
              <Line w="55%" />
            </MiniCard>
            <MiniCard>
              <Line w="80%" />
            </MiniCard>
          </div>
          <div className="up-nudge absolute inset-x-2 bottom-3 rounded-2xl border border-[#F5C76A]/40 bg-[#141d19] p-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😤</span>
              <span className="min-w-0">
                <b className="block text-[11px]">Vazifani qildingmi?</b>
                <span className="block text-[9px] text-orange-300">3 soat 12 daqiqa qoldi</span>
              </span>
            </div>
            <span className="mt-1.5 block rounded-full bg-gradient-to-r from-[#f5c76a] to-[#f1a93b] py-1 text-center text-[10px] font-black text-[#1d1608]">Hozir bajarish →</span>
          </div>
        </Phone>
      );
    case "chat":
      return (
        <div className="mx-auto w-[280px] space-y-2.5">
          <p className="story-slide-in ml-auto w-fit max-w-[220px] rounded-3xl rounded-br-md bg-gradient-to-b from-[#3ddc97] to-[#0f8a63] px-4 py-2.5 text-[14px] font-bold text-white shadow-lg" style={{ animationDelay: "200ms" }}>
            Ustoz, 3-savolni tushunmadim 🙏
          </p>
          <p className="story-slide-in w-fit max-w-[230px] rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[14px] font-bold text-neutral-900 shadow-lg" style={{ animationDelay: "900ms" }}>
            👩‍🏫 “He” bilan doim “is” ishlatamiz 😊
          </p>
          <p className="story-pop ml-auto w-fit text-5xl" style={{ animationDelay: "1600ms" }}>
            🥰
          </p>
        </div>
      );
    case "reason":
      return (
        <div className="mx-auto w-[280px] space-y-3">
          <div className="st-pop-big mx-auto w-fit text-[80px] leading-none">😡</div>
          <Glass className="story-slide-in p-3" style={{ animationDelay: "500ms" }}>
            <p className="text-[11px] font-black tracking-[0.16em] text-[#FFB86B]">NEGA BAJARMADINGIZ?</p>
            <p className="mt-1.5 rounded-xl bg-white/90 px-3 py-2 text-[13px] font-semibold text-neutral-800">Kecha kasal bo‘lib qoldim…</p>
          </Glass>
          <p className="story-pop text-center text-xs font-bold text-white/80" style={{ animationDelay: "1200ms" }}>
            → ustozlar chatiga yuboriladi 💬
          </p>
        </div>
      );
    case "mascot":
      return (
        <div className="relative mx-auto grid h-[300px] w-[280px] place-items-center">
          <span className="st-halo absolute size-56 rounded-full" />
          <span className="st-bob relative drop-shadow-[0_25px_30px_rgba(0,0,0,.45)]">
            <Zumi size={170} />
          </span>
          <Glass className="st-bubble absolute -top-1 right-0 max-w-[170px] px-3 py-2 text-left text-[13px] font-bold text-white">
            Salom! Men <span className="text-[#F5C76A]">Zumi</span> — kosmosdan kelgan yo‘lboshchingizman 🛸
          </Glass>
        </div>
      );
    case "finish":
      return (
        <div className="relative mx-auto grid h-[280px] w-[280px] place-items-center">
          <span className="st-halo absolute size-56 rounded-full" />
          <span className="st-bob relative text-[110px] leading-none">🚀</span>
          <span className="st-orbit-a absolute text-3xl">⭐</span>
          <span className="st-orbit-b absolute text-2xl">🔥</span>
          <span className="st-orbit-c absolute text-2xl">🏆</span>
        </div>
      );
    case "nav":
      return (
        <Phone>
          <div className="space-y-2">
            <Line w="60%" />
            <MiniCard gold>
              <Line w="70%" c="rgba(245,199,106,.6)" />
            </MiniCard>
            <MiniCard>
              <Line w="80%" />
            </MiniCard>
            <MiniCard>
              <Line w="50%" />
            </MiniCard>
          </div>
          <MiniNav active={1} />
          <Tap x="30%" y="80%" />
        </Phone>
      );
    case "homework":
      return (
        <Phone tilt={8}>
          <p className="text-[10px] text-white/60">Homework</p>
          <div className="mt-2 rounded-xl border border-[#f1a93b]/50 bg-[#2a2213] p-2.5">
            <p className="text-[11px] font-bold">12-kun · Unit 4</p>
            <p className="mt-1 text-[9px] text-white/60">Reading · Listening · Speaking</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="story-pulse rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">⏰ 05:42:10</span>
              <span className="rounded-md bg-[#14a67a] px-2 py-0.5 text-[10px] font-bold">Start →</span>
            </div>
          </div>
          <div className="mt-2 space-y-2 opacity-60">
            <MiniCard>
              <Line w="70%" />
            </MiniCard>
            <MiniCard>
              <Line w="55%" />
            </MiniCard>
          </div>
          <Tap x="62%" y="33%" delay={300} />
        </Phone>
      );
    case "xp":
      return (
        <div className="mx-auto w-[270px] space-y-4">
          <div className="st-pop-big relative mx-auto flex w-fit items-center gap-2 rounded-[22px] bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] px-6 py-4 text-4xl font-black text-[#1d1608] shadow-[0_20px_40px_-12px_rgba(241,169,59,.8)]">
            <span className="star-spin">⭐</span>
            <span className="st-count tabular-nums">1 250</span>
            <span className="text-xl">XP</span>
          </div>
          <Glass className="flex justify-between p-3">
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d, i) => (
              <span key={d} className="flex flex-col items-center gap-1 text-[10px] font-bold text-white/80">
                <span
                  className={`grid size-8 place-items-center rounded-full text-sm ${i < 5 ? "story-pop bg-gradient-to-b from-[#ffb347] to-[#ff5e3a] shadow-[0_0_14px_rgba(255,120,60,.7)]" : "border border-white/20"}`}
                  style={{ animationDelay: `${300 + i * 140}ms` }}
                >
                  {i < 5 ? "🔥" : ""}
                </span>
                {d}
              </span>
            ))}
          </Glass>
        </div>
      );
    case "steps":
      return (
        <div className="relative mx-auto w-[270px] space-y-2.5">
          <span className="absolute bottom-6 left-[27px] top-6 w-[3px] rounded-full bg-gradient-to-b from-[#F5C76A] to-[#14a67a]" />
          {[
            ["📖", "Reading", "o‘qing + savollar"],
            ["🎧", "Listening", "tinglang + savollar"],
            ["🎙", "Speaking", "o‘zingiz gapiring"],
            ["🚀", "Submit", "topshiring — natija darhol"],
          ].map(([ic, t, s], i) => (
            <Glass key={t} className="story-slide-in relative flex items-center gap-3 p-2.5" style={{ animationDelay: `${300 + i * 200}ms` }}>
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] text-xl shadow-lg">{ic}</span>
              <span>
                <b className="block text-[15px] text-white">
                  {i + 1}. {t}
                </b>
                <span className="text-xs text-white/70">{s}</span>
              </span>
            </Glass>
          ))}
        </div>
      );
    case "quiz":
      return (
        <Phone>
          <p className="text-[10px] font-bold text-[#F5C76A]">READING</p>
          <div className="mt-1 space-y-1">
            <Line />
            <Line w="90%" />
            <Line w="75%" />
          </div>
          <p className="mt-3 text-[10px] font-semibold">1. Where is the book?</p>
          <div className="mt-1.5 space-y-1.5">
            {["A) in the bag", "B) on the table", "C) at home"].map((o, i) => (
              <div key={o} className={`rounded-lg border px-2 py-1 text-[10px] ${i === 0 ? "story-choose border-[#14a67a]" : "border-white/10"}`}>
                {o}
              </div>
            ))}
          </div>
          <Tap x="40%" y="58%" delay={200} />
        </Phone>
      );
    case "listen":
      return (
        <Phone tilt={8}>
          <p className="text-[10px] font-bold text-[#F5C76A]">LISTENING</p>
          <div className="mt-3 rounded-xl bg-white/[0.06] p-3">
            <div className="flex items-center gap-2">
              <span className="story-pulse grid size-9 place-items-center rounded-full bg-[#14a67a] text-sm">▶</span>
              <div className="flex h-8 flex-1 items-end gap-[3px]">
                {Array.from({ length: 14 }, (_, i) => (
                  <span key={i} className="story-eq w-1 rounded-full bg-[#F5C76A]" style={{ animationDelay: `${(i * 97) % 600}ms` }} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[10px]">True or False?</p>
          <div className="mt-1.5 flex gap-1.5">
            <span className="flex-1 rounded-lg border border-[#14a67a] bg-[#14a67a]/25 py-1 text-center text-[10px]">True</span>
            <span className="flex-1 rounded-lg border border-white/10 py-1 text-center text-[10px]">False</span>
          </div>
          <Tap x="16%" y="22%" />
        </Phone>
      );
    case "speak":
      return (
        <div className="relative mx-auto grid h-[270px] w-[270px] place-items-center">
          <span className="story-ring absolute size-40 rounded-full border-4 border-[#ff7a9a]/70" />
          <span className="story-ring absolute size-40 rounded-full border-4 border-[#ff7a9a]/70" style={{ animationDelay: "700ms" }} />
          <span className="relative grid size-32 place-items-center rounded-full bg-gradient-to-b from-[#ff6a8a] to-[#d61f4b] text-6xl shadow-[0_25px_50px_-12px_rgba(214,31,75,.8)]">🎙</span>
          <span className="absolute bottom-3 flex items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-bold tabular-nums text-white backdrop-blur">
            <span className="size-2 animate-pulse rounded-full bg-red-500" /> 01:05
          </span>
        </div>
      );
    case "submit":
      return (
        <Phone>
          <div className="space-y-2 opacity-70">
            <MiniCard>
              <Line w="80%" />
            </MiniCard>
            <MiniCard>
              <Line w="60%" />
            </MiniCard>
          </div>
          <div className="story-pulse mt-6 rounded-xl bg-gradient-to-r from-[#f5c76a] to-[#f1a93b] py-2.5 text-center text-xs font-black text-[#1d1608]">Submit 🚀</div>
          <div className="story-pop mt-4 rounded-xl border border-[#14a67a]/50 bg-[#14a67a]/15 p-2 text-center text-[13px] font-black text-emerald-300" style={{ animationDelay: "900ms" }}>
            ✓ 86 / 100
          </div>
          <Tap x="45%" y="42%" />
        </Phone>
      );
    case "marks":
      return (
        <div className="mx-auto w-[275px] space-y-2.5">
          {[
            ["My bag is on the table", true],
            ["He are a student", false],
            ["I live in Tashkent", true],
          ].map(([t, ok], i) => (
            <div key={String(t)} className="story-slide-in flex items-center gap-2" style={{ animationDelay: `${300 + i * 260}ms` }}>
              <span className={`flex-1 rounded-2xl border-2 px-3 py-2.5 text-[15px] font-bold ${ok ? "border-[#3ddc97] bg-[#3ddc97]/15 text-white" : "border-[#ff6a8a] bg-[#ff6a8a]/15 text-white"}`}>
                {String(t)}
              </span>
              <span className={`grid size-10 place-items-center rounded-full text-xl font-black ${ok ? "bg-[#3ddc97] text-[#062a20]" : "bg-[#ff6a8a] text-white"}`}>{ok ? "✓" : "✗"}</span>
            </div>
          ))}
        </div>
      );
    case "explain":
      return (
        <div className="mx-auto w-[280px] space-y-2.5">
          <span className="block rounded-2xl border-2 border-[#ff6a8a] bg-[#ff6a8a]/15 px-3 py-2.5 text-[15px] font-bold text-white">He are a student ✗</span>
          <div className="story-slide-in rounded-2xl border-l-[6px] border-[#3ddc97] bg-white p-3.5 shadow-2xl" style={{ animationDelay: "500ms" }}>
            <p className="text-[15px] font-black text-emerald-700">To‘g‘ri javob: He is a student</p>
            <p className="mt-1 text-[13px] text-neutral-700">💡 “He” bilan doim “is”: he / she / it → is.</p>
          </div>
        </div>
      );
    case "retry":
      return (
        <div className="mx-auto w-[275px] space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold text-white/70 line-through decoration-white/40">1-urinish · 7/10</span>
            <span className="story-pop rounded-full bg-gradient-to-b from-[#3ddc97] to-[#0f8a63] px-3 py-1.5 text-xs font-black text-white shadow-lg" style={{ animationDelay: "700ms" }}>
              2-urinish · 10/10 ✓
            </span>
          </div>
          <div className="story-pulse mx-auto w-fit rounded-2xl bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] px-6 py-3.5 text-base font-black text-[#1d1608] shadow-[0_20px_40px_-12px_rgba(241,169,59,.8)]">
            ↻ Qayta ishlash
          </div>
        </div>
      );
    case "vocab":
      return (
        <div className="relative mx-auto h-[250px] w-[250px]">
          {[
            ["apple", "olma", -8, "🍎"],
            ["beautiful", "chiroyli", 5, "🌸"],
            ["weather", "ob-havo", -3, "⛅"],
          ].map(([en, uz, r, e], i) => (
            <div
              key={String(en)}
              className="st-card-in absolute inset-x-3 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_18px_35px_-12px_rgba(0,0,0,.6)]"
              style={{ top: `${i * 70}px`, "--r": `${r}deg`, animationDelay: `${300 + i * 220}ms` } as CSSProperties}
            >
              <span className="text-3xl">{e}</span>
              <span className="text-left">
                <b className="block text-xl leading-tight text-neutral-900">{en}</b>
                <span className="text-sm text-neutral-500">{uz}</span>
              </span>
            </div>
          ))}
        </div>
      );
    case "grammar":
      return (
        <div className="mx-auto w-[275px] space-y-2.5">
          {[
            ["📘", "RULE", "I am · You are · He is"],
            ["✍️", "TRANSLATE", "Men talabaman → I am a student"],
            ["✅", "TEST", "30 ta savol · har xato tushuntiriladi"],
          ].map(([ic, k, t], i) => (
            <Glass key={k} className="story-slide-in flex items-center gap-3 p-3" style={{ animationDelay: `${300 + i * 220}ms` }}>
              <span className="text-2xl">{ic}</span>
              <span className="text-left">
                <b className="block text-[11px] tracking-[0.18em] text-[#7DF0FF]">{k}</b>
                <span className="text-sm font-semibold text-white">{t}</span>
              </span>
            </Glass>
          ))}
        </div>
      );
    case "phrases":
      return (
        <div className="mx-auto w-[275px] space-y-2.5">
          <p className="story-slide-in w-fit rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] font-bold text-neutral-900 shadow-lg" style={{ animationDelay: "200ms" }}>
            Why don’t we go to the park? 🌳
          </p>
          <p className="story-slide-in ml-auto w-fit rounded-3xl rounded-br-md bg-gradient-to-b from-[#3ddc97] to-[#0f8a63] px-4 py-2.5 text-[15px] font-bold text-white shadow-lg" style={{ animationDelay: "800ms" }}>
            Sounds great! 😊
          </p>
          <p className="story-slide-in w-fit rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] font-bold text-neutral-900 shadow-lg" style={{ animationDelay: "1400ms" }}>
            I can’t stand the rain… ☔
          </p>
        </div>
      );
    case "covers":
      return (
        <div className="relative mx-auto flex h-[250px] w-[280px] items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="st-fan absolute grid h-48 w-[132px] place-items-center rounded-2xl border-2 border-[#f5c76a] bg-gradient-to-b from-[#0f6b50] to-[#06281d] text-white shadow-[0_25px_45px_-15px_rgba(0,0,0,.7)]"
              style={{ "--x": `${(i - 1) * 74}px`, "--r": `${(i - 1) * 9}deg`, zIndex: i === 1 ? 2 : 1, animationDelay: `${200 + i * 180}ms` } as CSSProperties}
            >
              <span className="text-center">
                <span className="block text-[11px] font-bold tracking-[0.25em] text-white/70">NSP</span>
                <span className="block text-5xl font-black text-[#F5C76A]">{i + 3}</span>
                <span className="text-[10px] font-bold tracking-widest">UNIT TEST</span>
              </span>
            </div>
          ))}
        </div>
      );
    case "pay":
      return (
        <div className="relative mx-auto w-[275px] space-y-2.5">
          {[
            ["💳", "Kartaga o‘tkazing"],
            ["📸", "Chek rasmini yuklang"],
            ["👩‍🏫", "O‘qituvchi tasdiqlaydi"],
            ["🔓", "Test ochiladi!"],
          ].map(([ic, t], i) => (
            <Glass key={t} className="story-slide-in flex items-center gap-3 p-2.5" style={{ animationDelay: `${300 + i * 220}ms` }}>
              <span className="grid size-10 place-items-center rounded-xl bg-[#120d04] text-xl">{ic}</span>
              <b className="text-[15px] text-white">{t}</b>
              <span className="ml-auto mr-1 text-xs font-black text-[#FFE08A]">{i + 1}</span>
            </Glass>
          ))}
        </div>
      );
    case "score":
      return (
        <div className="relative mx-auto grid size-56 place-items-center">
          <span className="st-halo absolute size-56 rounded-full" />
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="12" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="url(#stg)" strokeWidth="12" strokeLinecap="round" strokeDasharray="314" className="story-score" />
            <defs>
              <linearGradient id="stg" x1="0" x2="1">
                <stop offset="0" stopColor="#3ddc97" />
                <stop offset="1" stopColor="#F5C76A" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-center">
            <b className="block text-6xl font-black text-white">87</b>
            <span className="text-sm font-bold text-white/70">/ 100</span>
          </span>
        </div>
      );
    case "profile":
      return (
        <Phone tilt={8}>
          <div className="mt-2 flex flex-col items-center">
            <span className="grid size-14 place-items-center rounded-full text-2xl font-black text-[#F5C76A] shadow-[0_0_0_2px_#b8862f,0_0_18px_rgba(245,199,106,.5)]">A</span>
            <p className="mt-1.5 text-[11px] font-bold">Aziza Karimova ✏️</p>
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.05] p-2">
            <p className="text-[8px] text-white/60">Your current course</p>
            <p className="text-[12px] font-black text-[#F5C76A]">PRE-INTERMEDIATE</p>
            <span className="mt-1 block h-1.5 rounded-full bg-gradient-to-r from-[#f1a93b] to-[#f5c76a]" style={{ width: "62%" }} />
          </div>
          <MiniNav active={4} />
          <Tap x="78%" y="80%" />
        </Phone>
      );
    case "menu":
      return (
        <div className="mx-auto w-[275px] space-y-2">
          {["📚  My course", "🏆  My exam tests", "📈  Results history", "🔑  Change password"].map((t, i) => (
            <Glass key={t} className="story-slide-in flex items-center justify-between px-4 py-3 text-[15px] font-bold text-white" style={{ animationDelay: `${300 + i * 170}ms` }}>
              {t} <span className="text-white/40">›</span>
            </Glass>
          ))}
        </div>
      );
    case "lock":
      return (
        <div className="mx-auto grid w-[275px] gap-2.5">
          <Glass className="story-slide-in flex items-center gap-3 p-3" style={{ animationDelay: "200ms" }}>
            <span className="text-3xl">👀</span>
            <b className="text-[15px] text-white">Ko‘rish — bepul</b>
          </Glass>
          <div className="story-pop flex items-center gap-3 rounded-2xl bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] p-3 text-[#1d1608] shadow-[0_18px_35px_-12px_rgba(241,169,59,.8)]" style={{ animationDelay: "700ms" }}>
            <span className="text-3xl">🔓</span>
            <b className="text-[15px]">Ochish — 40 000 so‘m</b>
          </div>
          <Glass className="story-slide-in flex items-center gap-3 p-3" style={{ animationDelay: "1100ms" }}>
            <span className="text-3xl">👩‍🏫</span>
            <b className="text-[15px] text-white">yoki o‘qituvchi bepul ochadi</b>
          </Glass>
        </div>
      );
    case "tryit":
      return <TryIt onSolved={onSolved} />;
  }
}

/** Jonli mini-savol: to'g'ri javobda konfetti va "+10 XP". */
function TryIt({ onSolved }: { onSolved: () => void }) {
  const [pick, setPick] = useState<string | null>(null);
  const ok = pick === "is";
  return (
    <div className="relative mx-auto w-[285px]">
      <Glass className="p-4 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-[#FFE08A]">SINAB KO‘RING</p>
        <p className="mt-2 text-[26px] font-black text-white">
          She <span className="inline-block min-w-[64px] rounded-lg border-b-4 border-dashed border-[#FFE08A] px-1">{pick ?? "___"}</span> a teacher.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {["are", "is"].map((o) => {
            const chosen = pick === o;
            return (
              <button
                key={o}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => {
                  if (ok) return;
                  setPick(o);
                  if (o === "is") onSolved();
                }}
                className={`rounded-2xl py-3 text-xl font-black transition active:scale-95 ${
                  chosen ? (o === "is" ? "bg-[#3ddc97] text-[#062a20]" : "st-shake bg-[#ff6a8a] text-white") : "bg-white !text-[#120d04]"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        <p className="mt-3 h-5 text-sm font-bold text-white">{ok ? "Zo‘r! She → is 🎉" : pick ? "Yana urinib ko‘ring 😉" : "Javobni bosing 👇"}</p>
      </Glass>
      {ok ? (
        <span className="st-sticker absolute -right-2 -top-4 z-30 rounded-full bg-gradient-to-b from-[#ffe08a] to-[#f1a93b] px-3 py-1.5 text-sm font-black text-[#1d1608] shadow-xl" style={{ "--r": "8deg" } as CSSProperties}>
          +10 XP ⭐
        </span>
      ) : null}
    </div>
  );
}

/* ---------------- Story mazmuni ---------------- */
type Slide = {
  theme: Theme;
  kicker: string;
  title: string;
  text?: string;
  mock: Mock;
  stickers?: Sticker[];
  /** Avtomatik o'tmaydi — foydalanuvchi bajarguncha kutadi. */
  interactive?: boolean;
  cta?: { label: string; href: string };
  /** "news" maketidagi katta belgi. */
  art?: string;
};
export type StoryId = "start" | "homework" | "results" | "practice" | "exams" | "profile" | "news";
type Story = {
  id: StoryId;
  label: string;
  icon: ReactNode;
  cover: Theme;
  tagline: string;
  slides: Slide[];
  /** Ko'rilganlik kaliti (berilmasa — id). */
  seenKey?: string;
};

/**
 * "Yangi" story: saytdagi so'nggi yangiliklar (src/lib/updates.ts). Yangi yozuv qo'shilsa,
 * seenKey o'zgaradi va story halqasi yana rangli bo'lib yonadi.
 */
const NEWS_THEMES: Theme[] = ["violet", "ocean", "sunset", "emerald", "gold", "berry"];
function newsStory(who: "teacher" | "student"): Story {
  const list = updatesFor(who);
  const latest = list.slice(0, 8);
  return {
    id: "news",
    seenKey: `news-${who}-${updatesVersion(list)}`,
    label: "Yangiliklar",
    icon: "🆕",
    cover: "violet",
    tagline: "So‘nggi yangiliklar",
    slides: [
      { theme: "violet", kicker: "🆕 YANGILIKLAR", title: "Saytda *nima yangi?*", text: `${latest.length} ta yangi funksiya — Zumi hammasini ko‘rsatadi!`, mock: "newsCover" },
      ...latest.map((u, i): Slide => {
        const href = who === "teacher" ? u.href?.teacher : u.href?.student;
        return {
          theme: NEWS_THEMES[(i + 1) % NEWS_THEMES.length],
          kicker: `${AREA_LABEL[u.area].toUpperCase()} · ${formatUpdateDate(u.date)}`,
          title: u.title,
          text: u.text,
          mock: u.scene ?? "news",
          art: u.icon,
          stickers: i === 0 ? [{ t: "🔥 YANGI", x: 66, y: 2, r: 10, tone: "red" }] : undefined,
          cta: href ? { label: "Ko‘rish →", href } : undefined,
        };
      }),
      ...(who === "teacher"
        ? [{ theme: "emerald" as Theme, kicker: "🗂 HAMMASI", title: "Barcha yangiliklar *bir joyda*", mock: "finish" as Mock, cta: { label: "Yangiliklar sahifasi →", href: "/oqituvchi/yangiliklar" } }]
        : []),
    ],
  };
}

export const STORIES: Story[] = [
  {
    id: "start",
    label: "Boshlash",
    icon: <Zumi size={40} wave={false} />,
    cover: "emerald",
    tagline: "1 daqiqada hammasi",
    slides: [
      { theme: "emerald", kicker: "👋 XUSH KELIBSIZ", title: "Ingliz tilini *har kuni* ozgina — lekin har kuni", text: "1 daqiqada hammasini ko‘rsatamiz. Tayyormisiz?", mock: "mascot" },
      {
        theme: "ocean",
        kicker: "🧭 YO‘L XARITASI",
        title: "Hammasi *pastdagi* menyuda",
        text: "Uy vazifa, imtihonlar, mashqlar va kabinet — bir bosishda.",
        mock: "nav",
        stickers: [
          { t: "📋 Uy vazifa", x: 2, y: 40, r: -8, tone: "white" },
          { t: "🏆 Imtihon", x: 64, y: 30, r: 6, tone: "gold" },
        ],
      },
      {
        theme: "sunset",
        kicker: "⏰ HAR KUNI",
        title: "Kuniga *1 ta* uy vazifa",
        text: "Muddati bor — vaqt tugashidan oldin topshiring.",
        mock: "homework",
        stickers: [
          { t: "Kechikmang! ⏰", x: 58, y: 18, r: 8, tone: "red" },
          { t: "Bugungi dars ✨", x: 0, y: 70, r: -6, tone: "white" },
        ],
      },
      {
        theme: "gold",
        kicker: "⭐ MUKOFOT",
        title: "To‘g‘ri javob = *XP*",
        text: "Har kuni ishlasangiz 🔥 seriyangiz o‘sadi. Zanjirni uzmang!",
        mock: "xp",
        stickers: [{ t: "🔥 5 kun ketma-ket!", x: 44, y: -22, r: 7, tone: "dark" }],
      },
      { theme: "violet", kicker: "🎯 SINOV", title: "Keling, *sinab* ko‘ramiz!", text: "To‘g‘ri so‘zni tanlang.", mock: "tryit", interactive: true },
      {
        theme: "emerald",
        kicker: "🚀 TAYYOR",
        title: "Siz *tayyorsiz!*",
        text: "Birinchi vazifangiz sizni kutyapti.",
        mock: "finish",
        cta: { label: "Uy vazifaga o‘tish →", href: "/oquvchi/vazifalar" },
      },
    ],
  },
  {
    id: "homework",
    label: "Uy vazifa",
    icon: "📋",
    cover: "sunset",
    tagline: "4 qadam",
    slides: [
      { theme: "sunset", kicker: "📋 UY VAZIFA", title: "*4 qadam* — va tamom", text: "Javoblaringiz avtomatik saqlanadi, shoshmang.", mock: "steps" },
      {
        theme: "ocean",
        kicker: "📖 1-QADAM",
        title: "*O‘qing* va javob bering",
        text: "Matnni o‘qib, variantni bosing yoki so‘zni yozing.",
        mock: "quiz",
        stickers: [{ t: "✓ To‘g‘ri!", x: 62, y: 36, r: 8, tone: "green" }],
      },
      {
        theme: "violet",
        kicker: "🎧 2-QADAM",
        title: "Diqqat bilan *tinglang*",
        text: "Audioni istagancha qayta tinglashingiz mumkin.",
        mock: "listen",
        stickers: [{ t: "🔁 Yana tinglash", x: 0, y: 66, r: -7, tone: "white" }],
      },
      {
        theme: "berry",
        kicker: "🎙 3-QADAM",
        title: "O‘zingiz *gapiring*",
        text: "Har bir yozuv kamida 1 daqiqa. AI tinglab, maslahat beradi.",
        mock: "speak",
        stickers: [
          { t: "🤖 AI tinglayapti…", x: 52, y: 6, r: 6, tone: "white" },
          { t: "Talaffuz 👍", x: 2, y: 78, r: -6, tone: "green" },
        ],
      },
      {
        theme: "gold",
        kicker: "🚀 4-QADAM",
        title: "Topshiring — natija *darhol*",
        mock: "submit",
        stickers: [{ t: "+20 XP ⭐", x: 62, y: 52, r: 9, tone: "dark" }],
        cta: { label: "Bugungi vazifani ochish →", href: "/oquvchi/vazifalar" },
      },
    ],
  },
  {
    id: "results",
    label: "Natija",
    icon: "✅",
    cover: "ocean",
    tagline: "✓ va ✗ izohi bilan",
    slides: [
      { theme: "ocean", kicker: "✅ NATIJA", title: "Har bir javob: *✓ yoki ✗*", text: "Testlar ham, yozgan gaplaringiz ham alohida belgilanadi.", mock: "marks" },
      {
        theme: "emerald",
        kicker: "💡 TUSHUNTIRISH",
        title: "Xato bo‘lsa — *nega* ekanini aytamiz",
        text: "To‘g‘ri javob va o‘zbekcha izoh.",
        mock: "explain",
        stickers: [{ t: "Endi tushundim! 🙌", x: 46, y: 80, r: -5, tone: "gold" }],
      },
      {
        theme: "violet",
        kicker: "↻ IKKINCHI IMKONIYAT",
        title: "Yana bir *urinish*",
        text: "Oxirgi urinish hisoblanadi, birinchisi ham ko‘rinib turadi.",
        mock: "retry",
        cta: { label: "Natijalarimni ko‘rish →", href: "/oquvchi/tarix" },
      },
    ],
  },
  {
    id: "practice",
    label: "Mashq",
    icon: "📚",
    cover: "violet",
    tagline: "Lug‘at · Grammatika",
    slides: [
      {
        theme: "violet",
        kicker: "🔤 LUG‘AT",
        title: "So‘zlarni *yod oling*",
        text: "Avval so‘zlar, keyin 100 ta mashq. Muddat yo‘q.",
        mock: "vocab",
        stickers: [{ t: "🔊 Talaffuz", x: 64, y: 2, r: 8, tone: "white" }],
      },
      { theme: "ocean", kicker: "🧩 GRAMMATIKA", title: "Qoida → tarjima → *test*", text: "Har bir xatoyingiz tushuntiriladi.", mock: "grammar" },
      {
        theme: "berry",
        kicker: "💬 IBORALAR",
        title: "*Jonli* ingliz tili",
        text: "Kundalik gaplar — ma’nosini o‘rganing, mashq qiling.",
        mock: "phrases",
        cta: { label: "Mashqni boshlash →", href: "/oquvchi" },
      },
    ],
  },
  {
    id: "exams",
    label: "Imtihon",
    icon: "🏆",
    cover: "gold",
    tagline: "Darajangizni isbotlang",
    slides: [
      {
        theme: "gold",
        kicker: "🏆 IMTIHON",
        title: "Har unitdan keyin — *imtihon*",
        text: "Haqiqiy imtihon formatida o‘z darajangizni sinang.",
        mock: "covers",
        stickers: [{ t: "🔥 YANGI", x: 70, y: 0, r: 10, tone: "red" }],
      },
      { theme: "emerald", kicker: "🔓 QANDAY OCHILADI", title: "*4 qadam* — bir necha soatda", mock: "pay" },
      {
        theme: "ocean",
        kicker: "📊 NATIJA",
        title: "100 ballik *aniq* natija",
        text: "Har bir xato ko‘rsatiladi. Natija o‘qituvchingizga ham boradi.",
        mock: "score",
        stickers: [{ t: "A’lo! 🎉", x: 64, y: 4, r: 10, tone: "gold" }],
        cta: { label: "Imtihonlarni ko‘rish →", href: "/oquvchi/testlar" },
      },
    ],
  },
  {
    id: "profile",
    label: "Kabinet",
    icon: "👤",
    cover: "berry",
    tagline: "Sizning sahifangiz",
    slides: [
      { theme: "berry", kicker: "👤 KABINET", title: "Bu — *sizning* kabinetingiz", text: "Pastdagi Profile tugmasini bosing.", mock: "profile" },
      { theme: "violet", kicker: "🗂 HAMMASI BIR JOYDA", title: "Kurs, XP, *natijalar*", text: "Imtihonlar, tarix va parol — shu yerda.", mock: "menu" },
      {
        theme: "gold",
        kicker: "🔓 BOSHQA KURSLAR",
        title: "Boshqa kurslar *ham* bor",
        text: "Kursingizni faqat o‘qituvchi almashtiradi.",
        mock: "lock",
        cta: { label: "Kabinetni ochish →", href: "/oquvchi/kabinet" },
      },
    ],
  },
];

const SLIDE_MS = 7000;

/* ---------------- To'liq ekranli ko'ruvchi ---------------- */
function Viewer({ start, onClose, stories: STORIES }: { start: number; onClose: () => void; stories: Story[] }) {
  const [si, setSi] = useState(start);
  const [k, setK] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [solved, setSolved] = useState(false);
  const story = STORIES[si];
  const slide = story.slides[k];
  const th = THEME[slide.theme];
  const waiting = slide.interactive && !solved;
  const downAt = useRef(0);

  const markSeen = useCallback((id: string) => {
    const seen = new Set((read(SEEN_KEY) ?? "").split(",").filter(Boolean));
    if (!seen.has(id)) {
      seen.add(id);
      write(SEEN_KEY, [...seen].join(","));
    }
  }, []);

  const next = useCallback(() => {
    setProgress(0);
    setSolved(false);
    if (k < story.slides.length - 1) return setK(k + 1);
    markSeen(story.seenKey ?? story.id);
    if (si < STORIES.length - 1) {
      setSi(si + 1);
      setK(0);
    } else onClose();
  }, [k, si, story, markSeen, onClose, STORIES.length]);

  const prev = () => {
    setProgress(0);
    setSolved(false);
    if (k > 0) return setK(k - 1);
    if (si > 0) {
      setSi(si - 1);
      setK(STORIES[si - 1].slides.length - 1);
    }
  };

  // Avtomatik o'tish (ushlab turilsa yoki interaktiv slaydda — kutadi).
  useEffect(() => {
    if (paused || waiting) return;
    const t0 = performance.now() - progress * SLIDE_MS;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / SLIDE_MS);
      setProgress(p);
      if (p >= 1) next();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, waiting, si, k]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  });

  const stop = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onPointerUp: (e: React.PointerEvent) => e.stopPropagation() };
  const last = si === STORIES.length - 1 && k === story.slides.length - 1;

  // Portal: sahifa animatsiyasi (transform) ichida "fixed" buzilmasligi uchun to'g'ridan-to'g'ri body'ga.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${story.label} — qo‘llanma`} className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/85 backdrop-blur-md">
      <div
        className="st-stage relative flex h-full w-full max-w-[460px] select-none flex-col overflow-hidden text-white sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-[34px]"
        onPointerDown={() => {
          downAt.current = Date.now();
          setPaused(true);
        }}
        onPointerUp={(e) => {
          setPaused(false);
          const held = Date.now() - downAt.current;
          downAt.current = 0;
          if (held > 350 || held < 0) return; // uzoq bosish = pauza
          if (waiting) return; // interaktiv slayd — avval javob
          const r = e.currentTarget.getBoundingClientRect();
          if (e.clientX - r.left < r.width * 0.3) prev();
          else next();
        }}
        onPointerCancel={() => setPaused(false)}
      >
        <Backdrop key={`bg-${si}-${k}`} t={slide.theme} />

        {/* Progress chiziqlari */}
        <div className="relative z-10 flex gap-1 px-3 pt-3">
          {story.slides.map((_, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className={`block h-full rounded-full ${i === k && waiting ? "animate-pulse" : ""}`}
                style={{ background: th.accent, width: `${i < k ? 100 : i === k ? (waiting ? 100 : progress * 100) : 0}%`, opacity: i === k && waiting ? 0.5 : 1 }}
              />
            </span>
          ))}
        </div>
        <div className="relative z-10 flex items-center gap-2.5 px-4 pt-3">
          <span className="grid size-9 place-items-center rounded-full bg-white/15 text-lg backdrop-blur">{story.icon}</span>
          <span className="leading-tight">
            <b className="block text-sm">{story.label}</b>
            <span className="text-[11px] text-white/60">
              NSP · {k + 1}/{story.slides.length}
            </span>
          </span>
          <button type="button" aria-label="Yopish" {...stop} onClick={onClose} className="ml-auto grid size-9 place-items-center rounded-full bg-white/15 text-lg font-bold backdrop-blur transition hover:bg-white/25">
            ✕
          </button>
        </div>

        <div key={`${si}-${k}`} className="relative z-10 flex flex-1 flex-col px-6 pb-7 pt-5">
          <span className="st-kicker w-fit rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.16em]" style={{ background: `${th.accent}22`, color: th.accent, border: `1px solid ${th.accent}55` }}>
            {slide.kicker}
          </span>
          <div className="mt-3">
            <Title text={slide.title} accent={th.accent} />
          </div>
          {slide.text ? <p className="st-sub mt-2.5 text-[15px] font-medium leading-snug text-white/75">{slide.text}</p> : null}

          <div className="relative flex flex-1 items-center justify-center py-3">
            <div className="relative">
              <MockView m={slide.mock} art={slide.art} onSolved={() => setSolved(true)} />
              {slide.stickers ? <Stickers list={slide.stickers} /> : null}
            </div>
          </div>

          {slide.cta ? (
            <Link
              href={slide.cta.href}
              {...stop}
              onClick={() => {
                markSeen(story.seenKey ?? story.id);
                onClose();
              }}
              className="st-cta mx-auto flex h-14 w-full max-w-[340px] items-center justify-center rounded-2xl text-base font-black text-[#1d1608]"
              style={{ background: `linear-gradient(135deg, #fff3c4, ${th.accent} 45%, #f1a93b)` }}
            >
              {slide.cta.label}
            </Link>
          ) : (
            <p className="text-center text-xs font-semibold text-white/60">
              {waiting ? "Javobni tanlang 👆" : last ? "Bosing — boshlaymiz 🚀" : "Keyingisi uchun bosing →"}
            </p>
          )}
        </div>
        {slide.interactive && solved ? <Confetti key={`cf-${si}-${k}`} /> : null}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Bosh sahifadagi story kartochkalari ---------------- */
export function StoryRail({ welcome = false, audience = "student" }: { welcome?: boolean; audience?: "student" | "teacher" }) {
  const seenRaw = useStored(SEEN_KEY, "all");
  const intro = useStored(INTRO_KEY, "1");
  const [open, setOpen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // "Yangi" story — doim birinchi; keyin qo'llanma story'lari.
  const list = [newsStory(audience), ...STORIES];
  const startIdx = list.findIndex((s) => s.id === "start");
  const seen = new Set(seenRaw === "all" ? list.map((s) => s.seenKey ?? s.id) : seenRaw.split(","));
  // Yangi yangilik qo'shilgan-u, o'quvchi hali ko'rmagan bo'lsa — "Yangiliklar" story o'zi bir marta ochiladi.
  const newsUnseen = seenRaw !== "all" && !seen.has(list[0].seenKey ?? list[0].id);
  // Pop-up (faqat o'quvchi): birinchi kirishda va har safar login qilinganda (welcome) "Boshlash" o'zi ochiladi.
  const shown =
    open ??
    (audience === "student" && !dismissed ? (welcome || intro === "" ? startIdx : newsUnseen ? 0 : null) : null);

  const close = () => {
    write(INTRO_KEY, "1");
    // Avtomatik ochilgan "Yangiliklar" — yopilsa ham ko'rilgan hisoblanadi (qayta-qayta ochilmasin).
    if (shown === 0) {
      const ids = new Set((read(SEEN_KEY) ?? "").split(",").filter(Boolean));
      ids.add(list[0].seenKey ?? list[0].id);
      write(SEEN_KEY, [...ids].join(","));
    }
    setOpen(null);
    setDismissed(true);
    // Manzildan ?welcome=1 olib tashlanadi — yangilanganda qayta ochilmasin.
    if (welcome) window.history.replaceState(window.history.state, "", window.location.pathname);
  };

  return (
    <>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((s, i) => {
          const fresh = !seen.has(s.seenKey ?? s.id);
          const th = THEME[s.cover];
          return (
            <button key={s.id} type="button" onClick={() => setOpen(i)} className="group flex w-[74px] shrink-0 flex-col items-center gap-1.5 transition active:scale-95">
              {/* Dumaloq story: ko'rilmagan — aylanuvchi kamalak halqa, ko'rilgan — kulrang */}
              <span className={`st-cover relative block size-[74px] overflow-hidden rounded-full p-[3px] ${fresh ? "st-cover-fresh" : "bg-white/15"}`}>
                <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-[#0d1512]" style={{ background: th.base }}>
                  <span aria-hidden className="absolute -right-4 -top-4 size-14 rounded-full opacity-80 blur-lg" style={{ background: th.a }} />
                  <span aria-hidden className="absolute -bottom-5 -left-4 size-14 rounded-full opacity-70 blur-lg" style={{ background: th.b }} />
                  <span className="relative text-[30px] leading-none drop-shadow-[0_6px_8px_rgba(0,0,0,.45)] transition group-hover:scale-110">{s.icon}</span>
                </span>
              </span>
              <span className={`max-w-full truncate text-[11px] font-semibold ${fresh ? "text-white" : "text-neutral-500"}`}>{s.label}</span>
            </button>
          );
        })}
      </div>
      {shown !== null ? <Viewer start={shown} onClose={close} stories={list} /> : null}
    </>
  );
}

/**
 * "YANGILIKLAR" banneri (bosh sahifada doim turadi): saytdagi yangi funksiyalarni istalgan payt qayta ko'rish.
 * Ko'rilmagan yangilik bo'lsa — "NEW" belgisi miltillaydi.
 */
export function UpdatesBanner({ audience = "student" }: { audience?: "student" | "teacher" }) {
  const seenRaw = useStored(SEEN_KEY, "all");
  const [open, setOpen] = useState(false);
  const story = newsStory(audience);
  const fresh = seenRaw !== "all" && !seenRaw.split(",").includes(story.seenKey ?? story.id);
  const count = story.slides.length - 1;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] p-3 pr-4 text-left transition active:scale-[.99]"
        style={{ background: "linear-gradient(120deg,#1a0b3d 0%,#3b1a7a 45%,#0b4f6c 100%)" }}
      >
        <span aria-hidden className="st-blob st-blob-1" style={{ background: "#7c3aed", width: "45%" }} />
        <span aria-hidden className="st-blob st-blob-2" style={{ background: "#25c9a0", width: "40%" }} />
        <span className="relative -my-2 shrink-0 st-bob">
          <Zumi size={62} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <b className="text-[16px] text-white">Yangiliklar</b>
            {fresh ? <span className="up-badge rounded-full bg-[#ff3d6e] px-2 py-0.5 text-[10px] font-black text-white">NEW</span> : null}
          </span>
          <span className="block truncate text-xs text-white/75">
            Wanderland, yo‘lingiz, eslatmalar · {count} ta yangilik
          </span>
        </span>
        <span className="relative grid size-10 place-items-center rounded-full bg-[#F5C76A] text-sm font-black text-[#1d1608] shadow-lg transition group-hover:scale-110">▶</span>
      </button>
      {open ? <Viewer start={0} onClose={() => setOpen(false)} stories={[story]} /> : null}
    </>
  );
}

/** Bo'lim ichidagi kichik tugma: shu bo'limning story'sini ochadi (eski uzun qo'llanma o'rniga). */
export function StoryButton({ id, label = "Qanday ishlaydi?" }: { id: StoryId; label?: string }) {
  const [open, setOpen] = useState(false);
  const idx = Math.max(0, STORIES.findIndex((s) => s.id === id));
  const s = STORIES[idx];
  const th = THEME[s.cover];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 pr-4 text-left transition active:scale-[.99]"
        style={{ background: th.base }}
      >
        <span aria-hidden className="absolute -right-8 -top-10 size-32 rounded-full opacity-60 blur-2xl" style={{ background: th.a }} />
        <span aria-hidden className="absolute -bottom-12 left-10 size-28 rounded-full opacity-40 blur-2xl" style={{ background: th.b }} />
        <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">{s.icon}</span>
        <span className="relative min-w-0 flex-1">
          <b className="block text-[15px] text-white">▶ {label}</b>
          <span className="text-xs text-white/70">
            {s.label} · {s.slides.length} ta jonli slayd
          </span>
        </span>
        <span className="relative grid size-9 place-items-center rounded-full text-sm font-black text-[#1d1608] transition group-hover:scale-110" style={{ background: th.accent }}>
          ▶
        </span>
      </button>
      {open ? <Viewer start={idx} onClose={() => setOpen(false)} stories={STORIES} /> : null}
    </>
  );
}
