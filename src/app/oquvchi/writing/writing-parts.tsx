"use client";

import { useState } from "react";

/** Bosilganda nusxa olinadigan ibora. */
export function PhraseChip({ text, color, onPick }: { text: string; color: string; onPick?: (t: string) => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      lang="en"
      onClick={async () => {
        if (onPick) onPick(text);
        else
          try {
            await navigator.clipboard.writeText(text);
          } catch {}
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      }}
      className="rounded-full border px-3 py-1.5 text-left text-[13px] font-semibold text-white transition hover:-translate-y-0.5 active:scale-95"
      style={{ borderColor: `${color}55`, background: done ? `${color}40` : `${color}14` }}
    >
      {done ? (onPick ? "✓ qo‘shildi" : "✓ nusxa olindi") : text}
    </button>
  );
}

/** Namunaviy xat — "qog'oz" ko'rinishida, xatboshilar birma-bir chiqadi. */
export function SampleLetter({ text, color }: { text: string; color: string }) {
  const [open, setOpen] = useState(true);
  const paras = text.split(/\n\n+/);
  return (
    <div className="wr-paper relative overflow-clip rounded-[22px] p-5 pl-7 shadow-[0_25px_50px_-25px_rgba(0,0,0,.9)]">
      <span aria-hidden className="absolute inset-y-0 left-3 w-[3px] rounded-full" style={{ background: color }} />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-extrabold tracking-[0.18em] text-[#6b5a35]">✉️ SAMPLE ANSWER</span>
        <button type="button" onClick={() => setOpen(!open)} className="text-xs font-bold text-[#6b5a35] underline">
          {open ? "Yashirish" : "Ko‘rsatish"}
        </button>
      </div>
      {open ? (
        <div lang="en" className="space-y-3 font-serif text-[15px] leading-relaxed text-[#2a2214]">
          {paras.map((p, i) => (
            <p key={i} className="sp-rise whitespace-pre-line" style={{ animationDelay: `${i * 90}ms` }}>
              {p}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
