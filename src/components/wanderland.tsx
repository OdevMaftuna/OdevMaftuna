"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type React from "react";
import { CREW_COLORS, CrewPanel, initials } from "@/components/crew-panel";
import type { Crew } from "@/lib/crew";
import { tripFor, WEATHER_LABEL, type Scenery, type Trip, type Weather, type WeatherKind } from "@/lib/road-trips";

/**
 * "YOUR WANDERLAND" — kunlik seriya: Amerika bo'ylab road trip.
 *  - Har ketma-ket kun mashina g'arbga yuradi (sayohatlar: src/lib/road-trips.ts).
 *  - Osmon Toshkent vaqtiga mos: quyosh chiqadi/botadi, tunda oy va yulduzlar.
 *  - Ob-havo — mashina turgan shaharning haqiqiy ob-havosi (yomg'ir, qor, tuman, momaqaldiroq, bulut).
 *  - Manzara yo'lga qarab: cho'l (kaktus, mesa), okean sohili (qarag'ay, to'lqin), dalalar (tegirmon, ombor).
 */

const W = 360;
const H = 208;
const X0 = 24;
const X1 = 336;
const HORIZON = 118;
const dayToX = (d: number) => X0 + (Math.max(0, Math.min(30, d)) / 30) * (X1 - X0);
const roadY = (x: number) => 150 - 10 * Math.sin((x - X0) / 38) - 6 * Math.sin((x - X0) / 17 + 1);
const line = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
const ROAD: [number, number][] = [];
for (let x = 0; x <= W; x += 2) ROAD.push([x, roadY(x)]);
const ROAD_D = line(ROAD);

const wave = (base: number, amp: number, f: number, ph: number, step = 3) => {
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += step) pts.push([x, base - amp * Math.sin((x / W) * Math.PI * f + ph) - amp * 0.25 * Math.sin(x / 7 + ph)]);
  return `${line(pts)} L${W} ${H} L0 ${H} Z`;
};
const FAR_MOUNTAINS = wave(104, 16, 2.2, 0.6, 4);
const MESA_BACK = "M0 120 L22 120 L30 104 L58 104 L66 120 L118 120 L124 110 L150 110 L156 120 L230 120 L238 98 L262 96 L270 120 L320 120 L326 108 L348 108 L354 120 L360 120 L360 208 L0 208 Z";
const MESA_FRONT = "M0 134 L40 134 L48 121 L84 121 L92 134 L180 134 L188 125 L204 125 L210 134 L282 134 L290 117 L306 117 L314 134 L360 134 L360 208 L0 208 Z";
const HILLS_BACK = wave(124, 7, 3.1, 1.2);
const HILLS_FRONT = wave(136, 6, 4.3, 0.2);

/* ---------------- Vaqt va osmon ---------------- */
function tashkentNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hourCycle: "h23", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { hour: get("hour") + get("minute") / 60, doy: Math.round((get("month") - 1) * 30.4 + get("day")) };
}
function sunTimes(doy: number) {
  const half = 6.1 + 1.5 * Math.cos((2 * Math.PI * (doy - 172)) / 365);
  return { rise: 12.4 - half, set: 12.4 + half };
}
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a: string, b: string, t: number) {
  const A = a.startsWith("rgb") ? a.match(/\d+/g)!.map(Number) : hex(a);
  const B = b.startsWith("rgb") ? b.match(/\d+/g)!.map(Number) : hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
}
const hm = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`;

/** Ob-havoning osmonga ta'siri: bulutlilik (0..1). */
const OVERCAST: Record<WeatherKind, number> = { clear: 0, clouds: 0.35, fog: 0.55, rain: 0.65, snow: 0.5, storm: 0.85 };
const CLOUDS: Record<WeatherKind, number> = { clear: 2, clouds: 5, fog: 3, rain: 6, snow: 5, storm: 7 };

function skyAt(hour: number, doy: number, kind: WeatherKind) {
  const { rise, set } = sunTimes(doy);
  const dayLen = set - rise;
  const isDay = hour >= rise && hour <= set;
  const t = isDay ? (hour - rise) / dayLen : ((hour - set + 24) % 24) / (24 - dayLen);
  const arc = Math.sin(Math.PI * t);
  const elev = (isDay ? 1 : -1) * arc * 60;
  const light = Math.max(0, Math.min(1, (elev + 6) / 20));
  const glow = Math.max(0, 1 - Math.abs(elev) / 10);
  const oc = OVERCAST[kind];
  const grey = mix("#0b1014", "#8d99a3", light);
  const top = mix(mix("#060b10", "#2a6c9c", light), grey, oc * 0.85);
  const mid = mix(mix("#0b1520", "#7fb6d6", light), grey, oc * 0.8);
  const bottom = mix(mix(mix("#0c1411", "#cfe3e6", light), "#ee8a4b", glow * 0.85 * (1 - oc)), grey, oc * 0.7);
  return {
    isDay,
    light,
    glow,
    oc,
    body: { x: 30 + t * 300, y: HORIZON - arc * 92 },
    top,
    mid,
    bottom,
    far: mix(mix("#121e22", "#8fb0bf", light), grey, oc * 0.6),
    back: mix("#1a2b24", "#7d8b6f", light * (1 - oc * 0.4)),
    front: mix("#13221c", "#5a6e4c", light * (1 - oc * 0.4)),
    cloud: mix(mix("#26323b", "#ffffff", light), "#5f6b74", Math.max(0, oc - 0.3)),
    stars: Math.max(0, 1 - light * 1.6) * (1 - oc),
    phase: isDay ? (glow > 0.4 ? (hour < 12 ? "Tong" : "Shom") : "Kunduz") : glow > 0.4 ? (hour < 12 ? "Tong oldi" : "Shom") : "Tun",
    next: isDay ? `quyosh botishi ${hm(set)}` : `quyosh chiqishi ${hm(rise)}`,
  };
}

const subscribeMinute = (fn: () => void) => {
  const id = window.setInterval(fn, 60_000);
  return () => window.clearInterval(id);
};
let cacheKey = "";
let cache = { hour: 20, doy: 320 };
function nowSnapshot() {
  const n = tashkentNow();
  const k = `${n.hour.toFixed(2)}-${n.doy}`;
  if (k !== cacheKey) {
    cacheKey = k;
    cache = n;
  }
  return cache;
}
const SERVER_NOW = { hour: 20, doy: 320 };

/* ---------------- Manzara bo'laklari ---------------- */
function Cloud({ x, y, s, fill, dur, delay }: { x: number; y: number; s: number; fill: string; dur: number; delay: number }) {
  return (
    <g className="wl-cloud" style={{ animationDuration: `${dur}s`, animationDelay: `${-delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
        <ellipse cx="0" cy="0" rx="22" ry="7" />
        <ellipse cx="-9" cy="-5" rx="10" ry="8" />
        <ellipse cx="6" cy="-7" rx="12" ry="10" />
        <ellipse cx="17" cy="-2" rx="8" ry="6" />
      </g>
    </g>
  );
}

function Saguaro({ x, base, s, fill }: { x: number; base: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${s})`} fill={fill}>
      <rect x="-2.2" y="-22" width="4.4" height="22" rx="2.2" />
      <path d="M-2 -10 h-4 a2 2 0 0 1 -2 -2 v-6 a1.6 1.6 0 0 1 3.2 0 v4.6 h2.8 z" />
      <path d="M2 -13 h4 a2 2 0 0 0 2 -2 v-5 a1.6 1.6 0 0 0 -3.2 0 v3.6 h-2.8 z" />
    </g>
  );
}
function Pine({ x, base, s, fill }: { x: number; base: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${s})`} fill={fill}>
      <rect x="-1" y="-4" width="2" height="4" />
      <path d="M0 -26 L7 -14 L4 -14 L9 -6 L-9 -6 L-4 -14 L-7 -14 Z" />
    </g>
  );
}
function Windmill({ x, base, fill }: { x: number; base: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${base})`} fill={fill} stroke={fill}>
      <path d="M-1.5 0 L-0.6 -24 L0.6 -24 L1.5 0 Z" stroke="none" />
      <g transform="translate(0 -24)">
        <g className="wl-spin">
          {[0, 90, 180, 270].map((r) => (
            <rect key={r} x="-0.8" y="-11" width="1.6" height="11" transform={`rotate(${r})`} stroke="none" />
          ))}
        </g>
      </g>
    </g>
  );
}
function Silo({ x, base, fill }: { x: number; base: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${base})`} fill={fill}>
      <rect x="-5" y="-20" width="10" height="20" />
      <path d="M-5 -20 Q0 -27 5 -20 Z" />
      <path d="M5 -12 L18 -12 L18 0 L5 0 Z M4 -12 L11.5 -19 L19 -12 Z" />
    </g>
  );
}

function Scenery({ kind, back, front, light }: { kind: Scenery; back: string; front: string; light: number }) {
  const ink = mix("#0a120f", "#2f3d2c", light);
  if (kind === "coast") {
    return (
      <>
        <rect x="0" y={HORIZON} width={W} height="22" fill={mix("#0d1d2a", "#3f88b4", light)} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${(i * 41) % W} ${HORIZON + 5 + (i % 3) * 5} h${10 + (i % 4) * 4}`} stroke="#fff" strokeOpacity={0.12 + light * 0.25} strokeWidth=".8" className="wl-shimmer" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        <path d="M250 140 L262 112 L290 106 L320 112 L360 104 L360 208 L240 208 Z" fill={back} />
        <path d={HILLS_FRONT} fill={front} transform="translate(0 6)" />
        {[18, 34, 274, 300, 332, 348].map((x, i) => (
          <Pine key={x} x={x} base={138 + (i % 2) * 2} s={0.9 + (i % 3) * 0.2} fill={ink} />
        ))}
      </>
    );
  }
  if (kind === "plains") {
    return (
      <>
        <path d={HILLS_BACK} fill={back} />
        <path d={HILLS_FRONT} fill={front} />
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M${i * 27} ${140 + (i % 3) * 3} l4 -6 l4 6`} stroke={mix("#2c3a25", "#c9b46a", light)} strokeOpacity=".5" fill="none" strokeWidth=".8" />
        ))}
        <Windmill x={58} base={132} fill={ink} />
        <Silo x={268} base={133} fill={ink} />
        <Windmill x={330} base={130} fill={ink} />
      </>
    );
  }
  return (
    <>
      <path d={MESA_BACK} fill={back} />
      <path d={MESA_FRONT} fill={front} />
      {[
        [12, 140, 1],
        [70, 136, 0.7],
        [212, 135, 0.8],
        [262, 139, 1.1],
        [348, 141, 1],
      ].map(([x, b, s]) => (
        <Saguaro key={x} x={x} base={b} s={s} fill={ink} />
      ))}
    </>
  );
}

function WeatherFx({ kind, light }: { kind: WeatherKind; light: number }) {
  if (kind === "rain" || kind === "storm") {
    return (
      <g stroke={mix("#9fb3c4", "#e6eef5", light)} strokeOpacity=".5" strokeWidth=".8">
        {Array.from({ length: 55 }, (_, i) => {
          const x = (i * 37) % (W + 40);
          return <line key={i} x1={x} y1={-12} x2={x - 3} y2={-3} className="wl-drop" style={{ animationDelay: `${-((i * 0.137) % 0.8)}s`, animationDuration: `${0.6 + (i % 4) * 0.08}s` }} />;
        })}
        {kind === "storm" ? <rect width={W} height={H} fill="#fff" className="wl-flash" stroke="none" /> : null}
      </g>
    );
  }
  if (kind === "snow") {
    return (
      <g fill="#fff">
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={(i * 41) % W} cy={-6} r={0.8 + (i % 3) * 0.5} opacity={0.5 + (i % 4) * 0.12} className="wl-snow" style={{ animationDelay: `${-(i * 0.37) % 7}s`, animationDuration: `${6 + (i % 5)}s` }} />
        ))}
      </g>
    );
  }
  if (kind === "fog") {
    return (
      <g fill="#dfe6ea">
        <rect x="-40" y="100" width={W + 80} height="26" opacity=".22" className="wl-fog" />
        <rect x="-60" y="122" width={W + 120} height="30" opacity=".18" className="wl-fog" style={{ animationDelay: "-6s" }} />
      </g>
    );
  }
  return null;
}

/** Xaritadagi dumaloq rasm (yoki bosh harflar) — rangli halqa bilan. */
function Bubble({ id, r, color, photo, label }: { id: string; r: number; color: string; photo: string | null; label: string }) {
  const clip = `wl-av-${id.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <g>
      <circle r={r + 1.8} fill={color} />
      {photo ? (
        <>
          <clipPath id={clip}>
            <circle r={r} />
          </clipPath>
          <image href={photo} x={-r} y={-r} width={r * 2} height={r * 2} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />
        </>
      ) : (
        <>
          <circle r={r} fill={color} />
          <text y={r * 0.36} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fill="#0d1512">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

function Sign({ x, y, text, on }: { x: number; y: number; text: string; on: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-7 -8 Q-3.5 -10 0 -8 Q3.5 -10 7 -8 L7 -2 Q7 5 0 9 Q-7 5 -7 -2 Z" fill={on ? "#F2D38A" : "#0d1512"} stroke={on ? "#b8862f" : "rgba(255,255,255,.35)"} strokeWidth="1" />
      <text y="2.6" textAnchor="middle" fontSize={text.length > 1 ? 6.5 : 7.5} fontWeight="800" fill={on ? "#1d1608" : "rgba(255,255,255,.45)"}>
        {text}
      </text>
    </g>
  );
}

function mileAt(trip: Trip, d: number) {
  const c = Math.max(0, Math.min(30, d));
  const s = trip.stops;
  let i = 0;
  while (i < s.length - 2 && c >= s[i + 1].day) i++;
  return Math.round(s[i].mile + ((c - s[i].day) / (s[i + 1].day - s[i].day)) * (s[i + 1].mile - s[i].mile));
}

const WEATHER_ICON: Record<WeatherKind, string> = { clear: "☀", clouds: "☁", fog: "🌫", rain: "🌧", snow: "❄", storm: "⛈" };

/* ---------------- Tabiat ofatlari ---------------- */
/**
 * Tornado — qatlamli, chang rangidagi voronka: gradientli tana, aylanuvchi spiral tasmalar, chayqalish,
 * atrofida shamol chiziqlari, tagida chang buluti va uchayotgan siniqlar. k — kuchi (0..1).
 */
function Tornado({ x, k, light = 0.3 }: { x: number; k: number; light?: number }) {
  const h = 104 + k * 34;
  const top = 30 + k * 14; // voronka yuqori yarim kengligi
  const dust = mix("#3b3026", "#8b7356", light);
  const body = `M${-top} ${-h} C${-top * 0.9} ${-h * 0.72} ${-top * 0.32} ${-h * 0.5} -7 ${-h * 0.2} C-4 ${-h * 0.08} -3 -6 0 0 C3 -6 5 ${-h * 0.08} 8 ${-h * 0.2} C${top * 0.34} ${-h * 0.5} ${top * 0.92} ${-h * 0.72} ${top} ${-h} Z`;
  return (
    <g transform={`translate(${x} 150)`} opacity={0.6 + k * 0.4}>
      {/* chang buluti */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={(i - 1.5) * 9} cy={-2} rx={16 + k * 10 + i * 3} ry={5 + i} fill={dust} opacity={0.35 - i * 0.05} filter="url(#wl-soft)" className="wl-dust" style={{ animationDelay: `${-i * 0.4}s` }} />
      ))}
      <g className="wl-sway">
        <path d={body} fill="url(#wl-funnel)" filter="url(#wl-rough)" />
        {/* yuqori og'iz */}
        <ellipse cx="0" cy={-h} rx={top} ry={top * 0.24} fill="#2a231c" opacity=".55" />
        <ellipse cx="0" cy={-h + 2} rx={top * 0.8} ry={top * 0.15} fill="#1a1612" opacity=".5" />
        {/* aylanuvchi spiral tasmalar */}
        <g clipPath="url(#wl-funnel-clip)">
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M${-top - 10} ${-h + 8 + i * (h / 7)} q${top * 0.6} ${10 + i} ${top * 1.2} 0 t${top * 1.2} 0`}
              fill="none"
              stroke="#21190f"
              strokeOpacity={0.28 - i * 0.02}
              strokeWidth={4 - i * 0.35}
              className="wl-band"
              style={{ animationDelay: `${-i * 0.18}s` }}
            />
          ))}
        </g>
        {/* shamol chiziqlari */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = -h * (0.25 + i * 0.12);
          const r = top * (0.5 + i * 0.12) + 10;
          return (
            <path
              key={`w${i}`}
              d={`M${-r} ${y} q${r} ${8 + i} ${r * 2} 0`}
              fill="none"
              stroke={mix("#6d6255", "#d8cbb6", light)}
              strokeOpacity=".55"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="14 60"
              className="wl-whip"
              style={{ animationDelay: `${-i * 0.23}s` }}
            />
          );
        })}
      </g>
      {/* siniqlar */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={-1.5} y={-1} width={2 + (i % 3)} height={1.6} fill="#2a2119" className="wl-debris" style={{ animationDelay: `${-i * 0.27}s`, transformOrigin: `0 ${-h * (0.3 + (i % 4) * 0.12)}px`, animationDuration: `${1 + (i % 3) * 0.35}s` }} />
      ))}
    </g>
  );
}

/** Ulkan to'lqin (okean sohilida): qatlamli suv massasi, ko'pik, chayqalish. */
function Wave({ x, k }: { x: number; k: number }) {
  const h = 64 + k * 56;
  return (
    <g transform={`translate(${x} 152)`} opacity={0.65 + k * 0.35}>
      <g className="wl-surge">
        <path d={`M-80 0 C-56 -${h * 0.28} -26 -${h} 18 -${h} C46 -${h} 56 -${h * 0.72} 40 -${h * 0.56} C58 -${h * 0.6} 70 -${h * 0.38} 86 0 Z`} fill="url(#wl-water)" filter="url(#wl-rough)" />
        <path d={`M-66 0 C-44 -${h * 0.26} -18 -${h * 0.86} 18 -${h * 0.9} C40 -${h * 0.9} 48 -${h * 0.7} 36 -${h * 0.58}`} fill="none" stroke="#e6f3fa" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={-6 + i * 4.5} cy={-h * 0.93 + (i % 3) * 3} r={1.2 + (i % 3) * 0.9} fill="#fff" opacity=".75" className="wl-foam" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={`s${i}`} cx={30 + i * 6} cy={-h * 0.6 + i * 3} r="1.3" fill="#dff1fa" className="wl-spray" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </g>
    </g>
  );
}

/** Halokat: mashina havoga ko'tarilib aylanadi, ag'darilib tushadi, keyin tutun. */
function Wreck({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="16" fill="#f97316" opacity="0" className="wl-burst" />
      <g className="wl-tumble">
        <rect x="-7" y="-4.5" width="14" height="6" rx="2.5" fill="#0d1512" stroke="#f59e6b" strokeWidth="1.3" />
        <path d="M-4 -4.5 L-2 -8 L3 -8 L5 -4.5" fill="#0d1512" stroke="#f59e6b" strokeWidth="1.1" />
        <circle cx="-4" cy="2" r="1.6" fill="#f59e6b" />
        <circle cx="4" cy="2" r="1.6" fill="#f59e6b" />
      </g>
      <g className="wl-after">
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={(i % 3) * 3 - 3} cy={-6} r={4 + (i % 3) * 2} fill="#3d3d3d" opacity=".55" className="wl-smoke" style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
        <path d="M10 6 l5 -2 M-20 3 l4 1 M14 -1 l3 3 M-12 7 l-3 2" stroke="#f59e6b" strokeOpacity=".6" strokeWidth="1" />
        <circle cx="-15" cy="5" r="1.6" fill="none" stroke="#f59e6b" strokeWidth="1" />
      </g>
    </g>
  );
}

/* ---------------- Asosiy komponent ---------------- */
export function Wanderland({
  count,
  today,
  week,
  weather,
  lost = 0,
  crew,
  demo = false,
  avatar,
  hour: hourOverride,
}: {
  count: number;
  today: boolean;
  week?: { key: string; label: string; active: boolean; isToday: boolean }[];
  /** Mashina turgan shaharning haqiqiy ob-havosi (serverdan). */
  weather?: Weather | null;
  /** Kecha uzilgan seriya uzunligi — halokat va "tushdan uyg'onish" sahnasi. */
  lost?: number;
  /** Sayohat jamoasi (do'stlar bilan poyga). */
  crew?: Crew | null;
  /** O'qituvchi namunasi: jamoa amallari o'chirilgan. */
  demo?: boolean;
  /** O'quvchining profil rasmi (mashina ustida chiqadi). */
  avatar?: string | null;
  /** Namuna uchun: soatni qo'lda berish. */
  hour?: number;
}) {
  const { trip, inTrip, cycle } = tripFor(count);
  const myAvatar = avatar ?? crew?.members.find((m) => m.me)?.avatar ?? null;
  const from = today && inTrip > 0 ? inTrip - 1 : inTrip;
  const now = useSyncExternalStore(subscribeMinute, nowSnapshot, () => SERVER_NOW);
  const hour = hourOverride ?? now.hour;
  // Seriya kecha uzilgan bo'lsa: halokat → tushdan uyg'onish → yangi tong (kuniga bir marta to'liq ko'rsatiladi).
  const dreamKey = `wl-dream-${lost}-${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date())}`;
  const broken = lost > 0 && count === 0;
  const [phase, setPhase] = useState<"wreck" | "wake" | "fresh">(broken ? "wreck" : "fresh");
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (!broken) return;
    let seen = false;
    try {
      seen = replay === 0 && window.localStorage.getItem(dreamKey) === "1";
    } catch {}
    const timers = seen
      ? [window.setTimeout(() => setPhase("fresh"), 0)]
      : [window.setTimeout(() => setPhase("wake"), 4600), window.setTimeout(() => {
          setPhase("fresh");
          try {
            window.localStorage.setItem(dreamKey, "1");
          } catch {}
        }, 8400)];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [broken, dreamKey, replay]);
  const wrecked = lost > 0 && count === 0 && phase !== "fresh";
  const lostTrip = tripFor(lost);
  const scene = phase !== "fresh" && lost > 0 && count === 0 ? lostTrip.trip : trip;

  const minsLeft = Math.max(0, Math.round((24 - hour) * 60));
  const danger = count > 0 && !today ? Math.max(0.15, Math.min(1, hour / 22)) : 0;
  const kind: WeatherKind = wrecked ? "storm" : danger > 0.55 ? "storm" : danger > 0 ? (weather?.kind === "snow" ? "snow" : "clouds") : (weather?.kind ?? "clear");
  const sky = skyAt(hour, now.doy, kind);
  const disaster = trip.scenery === "coast" ? "wave" : "tornado";

  // Bugun ishlangan bo'lsa — mashina kechagi joyidan bugungi joyga yurib keladi.
  const [shown, setShown] = useState(from);
  useEffect(() => {
    if (from === inTrip) return;
    let raf = 0;
    const t0 = performance.now() + 350;
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - t0) / 1700));
      setShown(from + (inTrip - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, inTrip]);

  const mx = wrecked ? dayToX(lostTrip.inTrip) : dayToX(shown);
  const my = roadY(mx);
  const driven = line(ROAD.filter((p) => p[0] >= X0 && p[0] <= mx).concat([[mx, my]]));
  const arrived = inTrip >= 30;
  const next = trip.stops.find((s) => s.day > inTrip);
  const warn = count > 0 && !today;
  const weekDone = week?.filter((d) => d.active).length ?? 0;
  const miles = mileAt(trip, inTrip);
  const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
  const accent = warn ? "#f59e6b" : "#F2D38A";
  const nClouds = CLOUDS[kind];
  const showBirds = sky.light > 0.5 && (kind === "clear" || kind === "clouds");

  const hLeft = `${Math.floor(minsLeft / 60)} soat ${minsLeft % 60} daqiqa`;
  const status = wrecked
    ? `💥 Kecha vazifa bajarilmadi — ${lostTrip.trip.scenery === "coast" ? "ulkan to‘lqin" : "tornado"} ${lost} kunlik sayohatingizni (${fmt(mileAt(lostTrip.trip, lostTrip.inTrip))} mil) yo‘q qildi…`
    : lost > 0 && count === 0
      ? `☀ Yangi tong. Kechagi ${lost} kunlik sayohat tush bo‘lib qoldi — ${trip.stops[0].name}dan yangi mashina bilan qayta boshlang. Bugun bitta vazifa — va yo‘ldasiz.`
      : danger > 0
        ? `${disaster === "wave" ? "🌊 Okeandan ulkan to‘lqin kelmoqda" : "🌪 Tornado yaqinlashmoqda"}! Yarim tungacha ${hLeft} qoldi — bitta vazifa bajaring va mashina qochib qutuladi.`
        : count === 0
      ? `Sayohat ${trip.stops[0].name}dan boshlanadi — bugun bitta vazifa bajaring va yo‘lga chiqing.`
      : arrived
          ? `${trip.title} yakunlandi — ${trip.stops[trip.stops.length - 1].name}ga yetib keldingiz. Ertaga yangi yo‘l.`
          : `Keyingi shahar: ${next?.name} — ${next ? next.day - inTrip : 0} kun, ${next ? fmt(next.mile - miles) : 0} mil.`;

  return (
    <section className="wl-card relative overflow-hidden rounded-[24px] border border-white/[0.08]">
      <div className="relative flex items-end justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <p className="wl-title text-[11px] font-semibold uppercase tracking-[0.34em]">Your Wanderland</p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className={`text-[44px] font-light leading-none tracking-tight tabular-nums ${wrecked ? "text-[#f59e6b] line-through decoration-2" : "text-white"}`}>{wrecked ? lost : count}</span>
            <span className="text-sm font-medium text-white/50">{count === 1 ? "day" : "days"} on the road</span>
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            <span className="rounded-[4px] border border-[#F2D38A]/60 px-1 py-px font-mono text-[9px] tracking-normal text-[#F2D38A]">{trip.badge}</span>
            {trip.title}
          </p>
          <p className="mt-1 font-mono text-xl font-medium tabular-nums" style={{ color: "#E9C77B" }}>
            {fmt(wrecked ? mileAt(lostTrip.trip, lostTrip.inTrip) : miles)}
            <span className="text-xs text-white/35"> mi</span>
          </p>
        </div>
      </div>

      {/* Joy, ob-havo va vaqt */}
      <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 text-[11px] font-medium text-white/55">
        <span className="text-white/80">📍 {wrecked ? [...lostTrip.trip.stops].reverse().find((s) => s.day <= lostTrip.inTrip)?.name : (weather?.city ?? [...trip.stops].reverse().find((s) => s.day <= inTrip)?.name)}</span>
        {weather ? (
          <span>
            {WEATHER_ICON[kind]} {weather.temp > 0 ? "+" : ""}
            {weather.temp}°C · {WEATHER_LABEL[kind]}
          </span>
        ) : null}
        <span>
          {sky.isDay ? "☀" : "☾"} {hm(hour)} · {sky.phase} · {sky.next}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={`relative mt-2 block w-full ${phase === "wreck" && lost > 0 && count === 0 ? "wl-shake" : ""}`} role="img" aria-label={`${trip.title}: ${count} kun, ${miles} mil`}>
        <defs>
          <linearGradient id="wl-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky.top} />
            <stop offset=".62" stopColor={sky.mid} />
            <stop offset="1" stopColor={sky.bottom} />
          </linearGradient>
          <radialGradient id="wl-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFE7A8" stopOpacity=".95" />
            <stop offset=".4" stopColor="#f0a24a" stopOpacity=".35" />
            <stop offset="1" stopColor="#f0a24a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wl-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#dfe9f5" stopOpacity=".35" />
            <stop offset="1" stopColor="#dfe9f5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wl-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b8862f" />
            <stop offset="1" stopColor="#F2D38A" />
          </linearGradient>
          <linearGradient id="wl-funnel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2e261e" />
            <stop offset=".35" stopColor="#6e5c48" />
            <stop offset=".55" stopColor="#8a7660" />
            <stop offset="1" stopColor="#2a2219" />
          </linearGradient>
          <linearGradient id="wl-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3f7f9f" />
            <stop offset=".6" stopColor="#174563" />
            <stop offset="1" stopColor="#0b2536" />
          </linearGradient>
          <clipPath id="wl-funnel-clip">
            <rect x="-80" y="-150" width="160" height="150" />
          </clipPath>
          <filter id="wl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="wl-rough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
          <linearGradient id="wl-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset=".6" stopColor="#0c1411" stopOpacity="0" />
            <stop offset="1" stopColor="#0c1411" stopOpacity=".85" />
          </linearGradient>
        </defs>

        {/* Osmon */}
        <rect width={W} height={H} fill="url(#wl-sky)" className="wl-sky" />
        {sky.stars > 0.02
          ? Array.from({ length: 40 }, (_, i) => (
              <circle key={i} cx={(i * 53) % W} cy={5 + ((i * 29) % 90)} r={i % 5 === 0 ? 1 : 0.55} fill="#fff" opacity={(0.25 + (i % 4) * 0.13) * sky.stars} className={i % 6 === 0 ? "rd-twinkle" : undefined} />
            ))
          : null}

        {/* Quyosh nurlari va quyosh / oy */}
        {sky.isDay ? (
          <g opacity={1 - sky.oc * 0.85}>
            {sky.light > 0.4 && sky.oc < 0.5 ? (
              <g transform={`translate(${sky.body.x} ${sky.body.y})`}>
                <g className="wl-rays" opacity={0.18 * (1 - sky.oc)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <path key={i} d="M-2 0 L0 -70 L2 0 Z" fill="#FFF3CF" transform={`rotate(${i * 30})`} />
                  ))}
                </g>
              </g>
            ) : null}
            <circle cx={sky.body.x} cy={sky.body.y} r="60" fill="url(#wl-sun)" opacity={0.55 + sky.glow * 0.45} />
            <circle cx={sky.body.x} cy={sky.body.y} r="13" fill={sky.glow > 0.3 ? "#F7B860" : "#FFF4D1"} />
          </g>
        ) : (
          <g opacity={1 - sky.oc * 0.8}>
            <circle cx={sky.body.x} cy={sky.body.y} r="34" fill="url(#wl-moon)" />
            <circle cx={sky.body.x} cy={sky.body.y} r="10" fill="#e9eef5" />
            <circle cx={sky.body.x + 4.5} cy={sky.body.y - 3} r="9" fill={sky.top} opacity=".92" />
          </g>
        )}

        {/* Bulutlar va qushlar */}
        {Array.from({ length: nClouds }, (_, i) => (
          <Cloud key={i} x={(i * 71) % W} y={18 + ((i * 23) % 52)} s={0.7 + (i % 3) * 0.35} fill={sky.cloud} dur={70 + i * 17} delay={i * 13} />
        ))}
        {showBirds ? (
          <g className="wl-birds" stroke={mix("#2b3438", "#3a4a52", sky.light)} strokeWidth=".9" fill="none" strokeLinecap="round">
            {[
              [0, 0],
              [9, 4],
              [17, -2],
              [-8, 5],
            ].map(([x, y], i) => (
              <path key={i} d={`M${x - 3} ${y} q3 -3 3 0 q0 -3 3 0`} className="wl-wing" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </g>
        ) : null}

        {/* Uzoq tog'lar va manzara */}
        <path d={FAR_MOUNTAINS} fill={sky.far} opacity=".75" />
        <Scenery kind={scene.scenery} back={sky.back} front={sky.front} light={sky.light} />
        <rect width={W} height={H} fill="url(#wl-fade)" />

        {/* Yo'l */}
        <path d={ROAD_D} fill="none" stroke="#070c0a" strokeWidth="9" strokeLinecap="round" />
        <path d={ROAD_D} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth=".8" strokeDasharray="5 6" className="rd-lane" />
        {shown > 0 ? (
          <>
            <path d={driven} fill="none" stroke="#E9C77B" strokeOpacity=".22" strokeWidth="9" strokeLinecap="round" />
            <path d={driven} fill="none" stroke="url(#wl-gold)" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : null}

        {/* Shaharlar */}
        {scene.stops.map((s, i) => {
          const x = dayToX(s.day);
          const y = roadY(x);
          const on = shown >= s.day;
          const up = i % 2 === 1;
          return (
            <g key={s.name}>
              <line x1={x} y1={y - 5} x2={x} y2={up ? y - 20 : y + 14} stroke={on ? "#E9C77B" : "rgba(255,255,255,.25)"} strokeWidth=".7" />
              <Sign x={x} y={up ? y - 29 : y + 23} text={scene.badge} on={on || (wrecked && s.day <= lostTrip.inTrip)} />
              <Label x={i === 0 ? x - 4 : i === scene.stops.length - 1 ? x + 6 : x} y={up ? y - 42 : y + 42} anchor={i === 0 ? "start" : i === scene.stops.length - 1 ? "end" : "middle"} on={on}>
                {s.name.toUpperCase()}
              </Label>
            </g>
          );
        })}

        {/* Tabiat ofati: bugun vazifa qilinmasa yaqinlashadi (yarim tunga qadar) */}
        {danger > 0 && !wrecked ? (
          <>
            <rect width={W} height={H} fill="#2a0f06" opacity={0.15 + danger * 0.3} />
            {disaster === "wave" ? <Wave x={mx + 34 + (1 - danger) * (W - mx)} k={danger} /> : <Tornado x={mx + 30 + (1 - danger) * (W - mx)} k={danger} light={sky.light} />}
          </>
        ) : null}
        {wrecked ? (
          <>
            <rect width={W} height={H} fill="#1a0a05" opacity=".35" />
            <g className="wl-sweep" style={{ "--sx": `${W + 70 - mx}px`, "--ex": `${-mx - 90}px` } as React.CSSProperties}>
              {lostTrip.trip.scenery === "coast" ? <Wave x={mx} k={1} /> : <Tornado x={mx} k={1} light={sky.light} />}
            </g>
            <Wreck x={mx} y={my - 2} />
            <rect width={W} height={H} fill="#fff4e0" className="wl-impact" />
          </>
        ) : null}

        {/* Do'stlar mashinalari (bir xil sayohatda bo'lsa — yo'lda; boshqa sayohatda — chetda strelka) */}
        {crew && !wrecked
          ? crew.members
              .filter((m) => !m.me)
              .map((m, i) => {
                const t = tripFor(m.count);
                const color = CREW_COLORS[i % CREW_COLORS.length];
                if (t.cycle !== cycle) {
                  const right = t.cycle > cycle;
                  return (
                    <g key={m.id} transform={`translate(${right ? W - 16 : 16} ${30 + i * 18})`}>
                      <rect x="-14" y="-7" width="28" height="14" rx="7" fill="#0d1512" stroke={color} strokeWidth="1" opacity=".9" />
                      <text y="3" textAnchor="middle" fontSize="7.5" fontWeight="800" fill={color}>
                        {right ? `${initials(m.name)} →` : `← ${initials(m.name)}`}
                      </text>
                    </g>
                  );
                }
                const fx = dayToX(t.inTrip);
                const fy = roadY(fx) + (i % 2 ? 5 : -5);
                return (
                  <g key={m.id} transform={`translate(${fx} ${fy})`} opacity={m.today ? 1 : 0.6}>
                    <rect x="-6" y="-3.8" width="12" height="5" rx="2.2" fill="#0d1512" stroke={color} strokeWidth="1.1" />
                    <circle cx="-3.5" cy="1.6" r="1.3" fill={color} />
                    <circle cx="3.5" cy="1.6" r="1.3" fill={color} />
                    <g transform={`translate(0 ${i % 2 ? 15 : -17})`}>
                      <Bubble id={m.id} r={8} color={color} photo={m.avatar} label={initials(m.name)} />
                    </g>
                  </g>
                );
              })
          : null}

        {/* Mashina */}
        <g transform={`translate(${mx} ${my})`} style={{ display: wrecked ? "none" : undefined }}>
          {!sky.isDay || sky.oc > 0.5 ? <path d="M5 -2 L46 -11 L46 8 L5 2 Z" fill={accent} opacity=".18" /> : null}
          <circle r="9" fill={accent} opacity=".22" className="rd-pulse" />
          {myAvatar ? (
            <g transform="translate(0 -20)">
              <line y1="8" y2="12" stroke={accent} strokeWidth="1" />
              <Bubble id="me" r={9.5} color={accent} photo={myAvatar} label="" />
            </g>
          ) : null}
          <rect x="-7" y="-4.5" width="14" height="6" rx="2.5" fill="#0d1512" stroke={accent} strokeWidth="1.3" />
          <path d="M-4 -4.5 L-2 -8 L3 -8 L5 -4.5" fill="#0d1512" stroke={accent} strokeWidth="1.1" />
          <circle cx="-4" cy="2" r="1.6" fill={accent} />
          <circle cx="4" cy="2" r="1.6" fill={accent} />
          <circle cx="7" cy="-1.5" r="1" fill="#fff" />
        </g>

        <WeatherFx kind={kind} light={sky.light} />
      </svg>
      {phase === "wake" ? (
        <div className="wl-wake pointer-events-none absolute inset-0 z-20 grid place-items-center text-center">
          <div className="wl-wake-text px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#5b4a2a]">Your Wanderland</p>
            <p className="mt-2 text-2xl font-light text-[#2a2214]">…va siz uyg‘ondingiz.</p>
            <p className="mt-1 text-sm text-[#5b4a2a]">Bu shunchaki tush edi. Yo‘l sizni hali ham kutyapti.</p>
          </div>
        </div>
      ) : null}
      {lost > 0 && count === 0 && phase === "fresh" ? (
        <button
          type="button"
          onClick={() => {
            setPhase("wreck");
            setReplay((r) => r + 1);
          }}
          className="absolute right-4 top-[148px] z-10 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold text-white/70 backdrop-blur transition hover:text-white"
        >
          ↺ Kechagi tush
        </button>
      ) : null}

      <div className="relative grid grid-cols-3 gap-px border-t border-white/[0.06] bg-white/[0.06]">
        {[
          ["This week", `${weekDone}/7`],
          ["To the coast", arrived ? "✓" : `${30 - inTrip} d`],
          ["Road trips", `${cycle - (arrived ? 0 : 1)}`],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#0f1a16] px-4 py-3">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/40">{k}</p>
            <p className="mt-0.5 font-mono text-base font-medium tabular-nums text-white">{v}</p>
          </div>
        ))}
      </div>

      {week ? (
        <div className="relative flex gap-1.5 px-5 pt-4">
          {week.map((d) => (
            <div key={d.key} className="flex-1 text-center">
              <span className={`block h-1.5 rounded-full ${d.active ? "" : d.isToday ? "rd-today" : "bg-white/[0.08]"}`} style={d.active ? { background: "linear-gradient(90deg,#b8862f,#F2D38A)" } : undefined} />
              <span className={`mt-1.5 block text-[9.5px] font-semibold uppercase tracking-wider ${d.isToday ? "text-[#E9C77B]" : "text-white/35"}`}>{d.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className={`relative px-5 pb-5 pt-3 text-[13px] leading-snug ${wrecked || danger > 0 ? "text-[#f59e6b]" : "text-white/60"}`}>{status}</p>
      {crew ? <CrewPanel crew={crew} demo={demo} /> : null}
    </section>
  );
}

function Label({ x, y, anchor, on, children }: { x: number; y: number; anchor: "start" | "middle" | "end"; on: boolean; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="8" fontWeight="700" letterSpacing=".5" fill={on ? "#F2D38A" : "rgba(255,255,255,.75)"} stroke="rgba(0,0,0,.55)" strokeWidth="2.2" paintOrder="stroke">
      {children}
    </text>
  );
}
