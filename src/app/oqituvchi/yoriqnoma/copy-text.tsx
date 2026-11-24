"use client";

import { useState } from "react";

/** Tayyor xabar shabloni — bir bosishda nusxa olinadi (chatga yoki Telegramga qo'yish uchun). */
export function CopyText({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <b className="text-sm text-white">{title}</b>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setDone(true);
              window.setTimeout(() => setDone(false), 1500);
            } catch {}
          }}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black transition ${done ? "bg-[#22c55e] text-[#062a20]" : "bg-[#F5C76A] text-[#1d1608]"}`}
        >
          {done ? "✓ Nusxa olindi" : "📋 Nusxa olish"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-[#cfd6d2]">{text}</p>
    </div>
  );
}
