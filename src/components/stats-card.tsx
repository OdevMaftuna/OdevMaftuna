"use client";

import { useId, useState, type CSSProperties } from "react";
import type { PeriodStats, StatCat, StatPeriod, StudentStats } from "@/lib/student-stats";

/**
 * "NATIJALARIM" kartasi (o'quvchi kabinetida):
 *  - Hafta / Oy / Umumiy almashtirgich;
 *  - silliq nurli chiziqli grafik (chizilib chiqadi), nuqtani bossa — o'sha kun natijasi;
 *  - bo'limlar bo'yicha rangli halqalar (uy vazifa, grammatika, lug'at, iboralar, imtihon);
 *  - umumiy ko'rsatkichlar: ishlar soni, eng yaxshi natija, faol kunlar.
 */

const PERIODS: { id: StatPeriod; label: string; sub: string }[] = [
  { id: "week", label: "Hafta", sub: "Oxirgi 7 kun" },
  { id: "month", label: "Oy", sub: "Oxirgi 4 hafta" },
  { id: "all", label: "Umumiy", sub: "Oxirgi 6 oy" },
];

const CAT: Record<StatCat, { label: string; icon: string; color: string; glow: string }> = {
  homework: { label: "Uy vazifa", icon: "📋", color: "#F5C76A", glow: "rgba(245,199,106,.55)" },
  grammar: { label: "Grammatika", icon: "🧩", color: "#3ddc97", glow: "rgba(61,220,151,.55)" },
  vocab: { label: "Lug‘at", icon: "🔤", color: "#5ab0ff", glow: "rgba(90,176,255,.55)" },
  phrasal: { label: "Iboralar", icon: "💬", color: "#ff7ab6", glow: "rgba(255,122,182,.55)" },
  exam: { label: "Imtihon", icon: "🏆", color: "#b388ff", glow: "rgba(179,136,255,.55)" },
};

const W = 320;
const H = 150;
const PAD = { l: 10, r: 46, t: 14, b: 26 };

/** Catmull-Rom → Bezier: nuqtalar orqali silliq chiziq. */
function smooth(pts: [number, number][]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    // Chiziq 0–100 oralig'idan chiqib ketmasin.
    const cy = (y: number) => Math.max(PAD.t, Math.min(H - PAD.b, y));
    d += ` C${c1[0].toFixed(1)},${cy(c1[1]).toFixed(1)} ${c2[0].toFixed(1)},${cy(c2[1]).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function Chart({ s, k }: { s: PeriodStats; k: string }) {
  const uid = useId().replace(/:/g, "");
  const [sel, setSel] = useState<number | null>(null);
  const n = s.points.length;
  const x = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * i) / Math.max(1, n - 1);
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / 100);
  const pts = s.points.map((p, i) => (p.value == null ? null : ([x(i), y(p.value)] as [number, number]))).filter((p): p is [number, number] => p !== null);
  const line = smooth(pts);
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1][0]},${H - PAD.b} L${pts[0][0]},${H - PAD.b} Z` : "";
  const active = sel != null ? s.points[sel] : null;

  return (
    <div className="relative">
      <svg key={k} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Natijalar grafigi">
        <defs>
          <linearGradient id={`ln${uid}`} x1="0" x2="1">
            <stop offset="0" stopColor="#3ddc97" />
            <stop offset=".55" stopColor="#ffffff" />
            <stop offset="1" stopColor="#F5C76A" />
          </linearGradient>
          <linearGradient id={`ar${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F5C76A" stopOpacity=".28" />
            <stop offset="1" stopColor="#F5C76A" stopOpacity="0" />
          </linearGradient>
          <filter id={`gl${uid}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Gorizontal chiziqlar va o'ngdagi foizlar */}
        {[100, 50, 0].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r + 6} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.08)" strokeDasharray={v === 0 ? "0" : "3 5"} />
            <text x={W - 4} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,.45)" fontWeight="600">
              {v}%
            </text>
          </g>
        ))}
        {area ? <path d={area} fill={`url(#ar${uid})`} className="sc-area" /> : null}
        {line ? (
          <path d={line} fill="none" stroke={`url(#ln${uid})`} strokeWidth="3.5" strokeLinecap="round" filter={`url(#gl${uid})`} pathLength={1} className="sc-line" />
        ) : (
          <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeDasharray="4 6" />
        )}
        {/* Nuqtalar */}
        {s.points.map((p, i) =>
          p.value == null ? null : (
            <g key={i} className="sc-dot" style={{ animationDelay: `${600 + i * 70}ms` } as CSSProperties}>
              {sel === i ? <circle cx={x(i)} cy={y(p.value)} r="11" fill="rgba(245,199,106,.25)" /> : null}
              <circle cx={x(i)} cy={y(p.value)} r={sel === i ? 6 : 4} fill="#0d1512" stroke={sel === i ? "#F5C76A" : "#fff"} strokeWidth="2.5" />
            </g>
          ),
        )}
        {/* Pastdagi yorliqlar */}
        {s.points.map((p, i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fontWeight={sel === i ? 800 : 600} fill={sel === i ? "#F5C76A" : "rgba(255,255,255,.5)"}>
            {p.label}
          </text>
        ))}
        {/* Bosiladigan ustunlar */}
        {s.points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - PAD.l - PAD.r) / Math.max(1, n - 1) / 2}
            y={0}
            width={(W - PAD.l - PAD.r) / Math.max(1, n - 1)}
            height={H}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => setSel(sel === i ? null : i)}
            onMouseEnter={() => setSel(i)}
          />
        ))}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 rounded-xl border border-white/10 bg-[#1b2420]/95 px-3 py-1.5 text-center text-xs shadow-xl backdrop-blur">
          <b className="text-white">{active.label}</b>
          <span className="ml-1.5 text-neutral-400">{active.value == null ? "ish yo‘q" : `${active.value}% · ${active.count} ta ish`}</span>
        </div>
      ) : null}
    </div>
  );
}

function Ring({ cat, avg, count, i }: { cat: StatCat; avg: number | null; count: number; i: number }) {
  const c = CAT[cat];
  const R = 26;
  const L = 2 * Math.PI * R;
  const v = avg ?? 0;
  return (
    <div className="sc-ring flex flex-col items-center gap-1.5" style={{ animationDelay: `${200 + i * 90}ms` }}>
      <div className="relative size-[64px]">
        <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={c.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={L}
            className="sc-arc"
            style={{ "--off": `${L * (1 - v / 100)}`, "--len": `${L}`, filter: avg != null ? `drop-shadow(0 0 5px ${c.glow})` : undefined, animationDelay: `${300 + i * 90}ms` } as CSSProperties}
          />
        </svg>
        <span className={`absolute inset-[11px] grid place-items-center rounded-full text-[19px] ${avg == null ? "opacity-40 grayscale" : ""}`} style={{ background: `${c.color}1f` }}>
          {c.icon}
        </span>
      </div>
      <b className="text-[15px] tabular-nums text-white">{avg == null ? "—" : `${avg}%`}</b>
      <span className="-mt-1 text-center text-[10px] font-semibold leading-tight text-neutral-400">
        {c.label}
        <span className="block text-neutral-600">{count ? `${count} ta` : "—"}</span>
      </span>
    </div>
  );
}

export function StatsCard({ stats }: { stats: StudentStats }) {
  const [period, setPeriod] = useState<StatPeriod>("week");
  const s = stats[period];
  const meta = PERIODS.find((p) => p.id === period)!;
  const verdict =
    s.avg == null ? "Hali natija yo‘q — birinchi ishni bajaring! 🚀" : s.avg >= 85 ? "A’lo! Siz yulduzsiz ⭐" : s.avg >= 70 ? "Yaxshi ketyapsiz 💪" : s.avg >= 50 ? "Yomon emas — yana ozgina! 🔥" : "Har kuni ozgina — natija o‘sadi 🌱";

  return (
    <div className="sc-card relative overflow-clip rounded-[28px] p-5">
      <span aria-hidden className="sc-glow sc-glow-1" />
      <span aria-hidden className="sc-glow sc-glow-2" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#F5C76A]">📊 STATISTIKA</p>
          <h2 className="mt-1 text-[22px] font-black leading-tight tracking-tight text-white">Natijalarim</h2>
          <p className="text-xs text-neutral-400">{meta.sub}</p>
        </div>
        <div className="flex shrink-0 rounded-full border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Davr">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${period === p.id ? "bg-[#F5C76A] text-[#1d1608] shadow-[0_6px_16px_-6px_rgba(245,199,106,.8)]" : "text-neutral-400 hover:text-white"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Katta raqam */}
      <div key={`big-${period}`} className="sc-rise relative mt-4 flex items-end gap-3">
        <span className="text-[44px] font-black leading-none tracking-tight text-white tabular-nums">
          {s.avg == null ? "—" : s.avg}
          {s.avg != null ? <span className="text-2xl text-neutral-400">%</span> : null}
        </span>
        <div className="pb-1">
          {s.delta != null ? (
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-black ${s.delta >= 0 ? "bg-[#3ddc97]/15 text-[#3ddc97]" : "bg-[#ff6a8a]/15 text-[#ff8aa3]"}`}>
              {s.delta >= 0 ? "▲" : "▼"} {Math.abs(s.delta)}%
            </span>
          ) : null}
          <p className="text-xs font-semibold text-neutral-400">{verdict}</p>
        </div>
      </div>

      <div className="relative mt-3">
        <Chart s={s} k={period} />
      </div>

      {/* Bo'limlar */}
      <div className="relative mt-4 rounded-[22px] border border-white/[0.07] bg-white/[0.035] p-4">
        <p className="text-[11px] font-extrabold tracking-[0.18em] text-neutral-400">BO‘LIMLAR</p>
        <div key={`rings-${period}`} className="mt-3 grid grid-cols-5 gap-1">
          {s.cats.map((c, i) => (
            <Ring key={c.cat} cat={c.cat} avg={c.avg} count={c.count} i={i} />
          ))}
        </div>
      </div>

      {/* Umumiy ko'rsatkichlar */}
      <div key={`tot-${period}`} className="relative mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: "✅", label: "Bajarilgan", value: String(s.count) },
          { icon: "🏅", label: "Eng yaxshi", value: s.best == null ? "—" : `${s.best}%` },
          { icon: "🔥", label: "Faol kun", value: String(s.activeDays) },
        ].map((t, i) => (
          <div key={t.label} className="sc-rise rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-3 text-center" style={{ animationDelay: `${150 + i * 80}ms` }}>
            <span className="text-lg">{t.icon}</span>
            <b className="block text-xl font-black tabular-nums text-white">{t.value}</b>
            <span className="text-[11px] font-semibold text-neutral-500">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
