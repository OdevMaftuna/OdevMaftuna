"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { sendExcuse } from "@/app/actions/chat";
import { Sticker } from "@/components/score-sticker";
import { onPrefsChange, readPrefs } from "@/lib/reminder-prefs";
import { pickSticker, pickText } from "@/lib/stickers";

export type MissedItem = { id: string; title: string; dueAt: string; late: boolean; penalty: number };

const noop = () => () => {};

/**
 * Vazifa bajarilmay qolgan bo'lsa — "jahli chiqqan" stiker bilan oyna: "Nima qilib o'tiribsan?! Tur, dars qil!"
 * O'quvchi sababini yozadi — u ustozlar chatiga boradi. Har bajarilmagan vazifa uchun bir marta so'raladi.
 */
export function MissedWork({ items: initial, seed, age = null }: { items: MissedItem[]; seed: number; age?: number | null }) {
  // Ro'yxat birinchi ko'rinishda "muzlatiladi": sabab yuborilgach sahifa yangilansa ham rahmat oynasi ko'rinib tursin.
  const [items] = useState(initial);
  const router = useRouter();
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const [idx, setIdx] = useState(0);
  const [later, setLater] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Yumshoq rejim (Profil → Reminders): "jahli chiqqan" stiker va silkinish o'rniga xotirjam oyna.
  const [soft, setSoft] = useState(false);
  useEffect(() => {
    const sync = () => setSoft(readPrefs(age).tone === "soft");
    sync();
    return onPrefsChange(sync);
  }, [age]);

  const item = items[idx];
  if (!isClient || !item || later) return null;
  const s = seed + idx * 0.37;
  const def = soft ? pickSticker("low", s % 1) : pickSticker("angry", s % 1);
  const t = pickText("angry", s % 1, { soft });
  const due = (() => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(item.dueAt));
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
    return `${g("day")}-${months[Number(g("month")) - 1]}, ${g("hour")}:${g("minute")}`;
  })();

  const next = () => {
    setSent(false);
    setText("");
    setError(null);
    if (idx + 1 < items.length) setIdx(idx + 1);
    else {
      setLater(true);
      router.refresh();
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Vazifa bajarilmadi" className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        className={
          soft
            ? "w-full max-w-sm rounded-[28px] border border-white/10 bg-gradient-to-b from-[#16201c] to-[#0f1613] p-5 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]"
            : "mw-shake w-full max-w-sm rounded-[28px] border border-red-500/40 bg-gradient-to-b from-[#2a1210] to-[#140c0b] p-5 text-center shadow-[0_30px_80px_-20px_rgba(220,38,38,.5)]"
        }
      >
        {sent ? (
          <>
            <div className="mx-auto grid size-[150px] place-items-center">
              <Sticker def={pickSticker("great", s % 1)} size={150} />
            </div>
            <p className="mt-2 text-lg font-bold text-white">Sababingiz ustozga yuborildi 📨</p>
            <p className="mt-1 text-sm text-white/60">Endi bugungisini o‘tkazib yubormang — kelishdikmi?</p>
            <button type="button" onClick={next} className="mt-4 h-11 w-full rounded-2xl text-sm font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
              {idx + 1 < items.length ? "Keyingisi →" : "Kelishdik 💪"}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-[170px] place-items-center">
              <Sticker def={def} size={170} />
            </div>
            <p className="mt-1 text-2xl font-black text-white">{t.title}</p>
            <p className={`text-base font-bold ${soft ? "text-white/70" : "text-red-300"}`}>{t.text}</p>
            <div className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-left text-sm">
              <p className="text-white/50">Bajarilmagan vazifa{items.length > 1 ? ` (${idx + 1}/${items.length})` : ""}:</p>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/40">Muddati: {due}</p>
              {item.late ? (
                <Link href={`/oquvchi/vazifa/${item.id}`} className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
                  Hali kech topshirish mumkin{item.penalty ? ` (−${item.penalty}%)` : ""} → hozir bajarish
                </Link>
              ) : null}
            </div>
            <label className="mt-3 block text-left text-xs font-semibold uppercase tracking-wider text-white/50" htmlFor="excuse">
              Nega bajarmadingiz? Sababini yozing
            </label>
            <textarea
              id="excuse"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Masalan: kasal bo‘ldim / internet yo‘q edi…"
              className="mt-1 block w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400"
            />
            {error ? <p className="mt-1 text-left text-xs text-red-300">{error}</p> : null}
            <button
              type="button"
              disabled={pending || text.trim().length < 3}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await sendExcuse(item.id, text);
                  if (!r.ok) return setError(r.error);
                  setSent(true);
                })
              }
              className="mt-3 h-11 w-full rounded-2xl bg-red-500 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-40"
            >
              {pending ? "Yuborilmoqda…" : "Ustozga yuborish"}
            </button>
            <div className="mt-2 flex items-center justify-between text-xs">
              <button type="button" onClick={() => setLater(true)} className="text-white/40 hover:text-white/70">
                Keyinroq
              </button>
              <Link href="/oquvchi/vazifalar" className="font-semibold text-[#F5C76A] hover:underline">
                Bugungi vazifalar →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
