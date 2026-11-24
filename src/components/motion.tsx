"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Raqam noldan qiymatgacha sanalib chiqadi (ekranda ko'ringanda). */
export function CountUp({ value, duration = 1000, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    let started = false;
    const run = () => {
      started = true;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setShown(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) run();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const f = 10 ** decimals;
  return (
    <span ref={ref} className="tabular-nums">
      {(Math.round(shown * f) / f).toLocaleString("en-US", { maximumFractionDigits: decimals })}
    </span>
  );
}

/** Konfetti — NSP ranglarida, butun ekran bo'ylab bir marta otiladi. */
export function fireConfetti() {
  if (typeof document === "undefined" || reduced()) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "60" });
  document.body.appendChild(canvas);
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const c = canvas.getContext("2d");
  if (!c) return canvas.remove();
  c.scale(dpr, dpr);
  const colors = ["#F1A93B", "#F5C76A", "#38C98D", "#0F8A63", "#FFFFFF"];
  const parts = Array.from({ length: 160 }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? w * 0.15 : w * 0.85,
      y: h * 0.75,
      vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 7),
      vy: -(9 + Math.random() * 9),
      s: 5 + Math.random() * 6,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.4,
      color: colors[i % colors.length],
    };
  });
  let frame = 0;
  const tick = () => {
    c.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32;
      p.vx *= 0.99;
      p.a += p.va;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.a);
      c.fillStyle = p.color;
      c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      c.restore();
    }
    if (++frame < 150) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/** Ball halqasi: oltin aylana to'lib boradi, ichida raqam sanaladi. */
export function ScoreRing({ score, total, size = 92 }: { score: number; total: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? score / total : 0;
  const [p, setP] = useState(ratio);

  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      setP(ratio * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ratio]);

  const color = ratio >= 0.8 ? "#F1A93B" : ratio >= 0.5 ? "#38C98D" : "#FF7A85";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} stroke="rgb(255 255 255 / 0.08)" strokeWidth="9" fill="none" />
        <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl font-bold tabular-nums">{Math.round(p * 100)}%</span>
    </div>
  );
}

/** 3D egiladigan karta (sichqoncha / barmoq ostida), ustidan nur o'tadi. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch" || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(800px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg)`;
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt-card relative h-full rounded-2xl ${className}`}>
      {children}
      <span aria-hidden className="tilt-glare" />
    </div>
  );
}
