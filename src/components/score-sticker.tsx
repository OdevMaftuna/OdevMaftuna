"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { moodForPercent, pickSticker, pickText, stickerSrc, type StickerDef } from "@/lib/stickers";

/** NATIJA STIKERI: ballga qarab qiziqarli animatsiya chiqadi (stikerlar: lib/stickers.ts). */

function LottieSticker({ src, size }: { src: string; size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: { destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const [{ default: lottie }, data] = await Promise.all([import("lottie-web"), fetch(src).then((r) => r.json())]);
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: true, animationData: data });
    })().catch(() => {});
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [src]);
  return <div ref={ref} style={{ width: size, height: size }} aria-hidden />;
}

/** Bitta stiker (video / Lottie / rasm). Video ochilmasa (masalan eski iPhone) — emoji ko'rsatiladi. */
export function Sticker({ def, size = 120, className = "" }: { def: StickerDef; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden className={`grid place-items-center ${className}`} style={{ width: size, height: size, fontSize: size * 0.6 }}>
        {def.emoji}
      </span>
    );
  }
  if (def.kind === "lottie") {
    return (
      <span className={className} style={{ display: "inline-block", width: size, height: size }}>
        <LottieSticker src={stickerSrc(def)} size={size} />
      </span>
    );
  }
  if (def.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={stickerSrc(def)} alt="" aria-hidden width={size} height={size} className={`object-contain ${className}`} onError={() => setFailed(true)} />;
  }
  return (
    <video
      key={def.id}
      src={stickerSrc(def)}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Natija stikeri: ballga qarab kayfiyat (a'lo / yaxshi / o'rtacha / past) va shu kayfiyatdagi
 * stikerlardan biri. seed har safar boshqa bo'lsa — stiker va matn ham almashadi.
 */
export function ScoreSticker({ percent, size = 140, showText = true, seed }: { percent: number; size?: number; showText?: boolean; seed?: number }) {
  const mood = moodForPercent(percent);
  const sd = seed ?? ((percent * 0.6180339) % 1);
  const def = pickSticker(mood, sd);
  const t = pickText(mood, sd);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="sticker-pop grid place-items-center" style={{ width: size, height: size }}>
        <Sticker def={def} size={size} />
      </div>
      {showText ? (
        <>
          <p className="mt-3 text-lg font-semibold" style={{ color: "#F5C76A" }}>
            {t.title}
          </p>
          <p className="mt-0.5 max-w-xs text-sm text-neutral-600">{t.text}</p>
        </>
      ) : null}
    </div>
  );
}

/** Tekshirilgandan keyin ekran o'rtasida chiqadigan natija oynasi. */
export function StickerPopup({ score, total, onClose }: { score: number; total: number; onClose: () => void }) {
  const percent = total > 0 ? (score / total) * 100 : 0;
  const [closing, setClosing] = useState(false);
  const [seed] = useState(() => Math.random());
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat bir marta ulanadi
  }, []);
  // Portal: animatsiyali (transform/filter) ota-elementlar ichida "fixed" ekranga emas, ularga
  // bog'lanib qoladi — oyna to'g'ridan-to'g'ri <body> ga chiqariladi (faqat brauzerda).
  if (!isClient) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Result"
      onClick={close}
      className={`fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="page-in w-full max-w-sm rounded-3xl border border-sun-400/40 bg-surface p-6 text-center shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
      >
        <ScoreSticker percent={percent} size={170} seed={seed} />
        <p className="mt-4 text-3xl font-bold tabular-nums">
          {score}
          <span className="text-lg font-normal text-neutral-500"> / {total}</span>
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-700 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          See my answers
        </button>
      </div>
    </div>,
    document.body,
  );
}
