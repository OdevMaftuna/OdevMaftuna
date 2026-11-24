"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Urgent = { groupId: string; groupName: string; notDone: number; dueAt: string | null; low: string[] };

const KEY = "nsp-teacher-alert";
const EVERY = 30 * 60 * 1000;

const left = (dueAt: string | null) => {
  if (!dueAt) return "";
  const ms = Date.parse(dueAt) - Date.now();
  if (ms <= 0) return "muddat tugadi";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} soat ${m} daqiqa` : `${m} daqiqa`;
};

/**
 * ASOSIY / SUPPORT O'QITUVCHI OGOHLANTIRISHI: bugungi vazifa muddatiga 4 soatdan kam qolgan va bajarmaganlar bor bo'lsa —
 * o'qituvchi sahifalarida pastdan ogohlantirish (yopsa, 30 daqiqadan keyin yana). Sahifa orqa fonda bo'lsa — bildirishnoma.
 */
export function TeacherAlert({ urgent }: { urgent: Urgent[] }) {
  const [show, setShow] = useState(false);
  const total = urgent.reduce((t, u) => t + u.notDone, 0);
  const lows = urgent.flatMap((u) => u.low.map((l) => `${l} (${u.groupName})`));

  useEffect(() => {
    if (!urgent.length) return;
    const check = () => {
      let last = 0;
      try {
        last = Number(window.localStorage.getItem(KEY) ?? 0);
      } catch {}
      if (Date.now() - last < EVERY) return;
      setShow(true);
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(lows.length ? "⚠️ NSP — past natija" : "⏰ NSP — vazifa muddati yaqin", {
            body: [total ? `${total} ta o‘quvchi hali topshirmagan` : "", lows.length ? `Past natija: ${lows.slice(0, 3).join("; ")}` : ""].filter(Boolean).join(" · "),
            tag: "nsp-teacher-alert",
            icon: "/apple-icon.png",
          });
        } catch {}
      }
    };
    const t0 = window.setTimeout(check, 1500);
    const id = window.setInterval(check, 60_000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, [urgent, total, lows]);

  if (!show || !urgent.length) return null;
  const close = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };

  return (
    <div className="nudge-in fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-md sm:bottom-6">
      <div className="rounded-[22px] border border-[#ff6a5a]/50 bg-[#1b1412]/95 p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="text-3xl">⏰</span>
          <div className="min-w-0 flex-1">
            {total ? (
              <>
                <p className="text-[15px] font-black text-white">{total} ta o‘quvchi bugungi vazifani hali topshirmagan</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                  {urgent
                    .filter((u) => u.notDone)
                    .map((u) => (
                      <li key={u.groupId}>
                        <b className="text-white">{u.groupName}</b>: {u.notDone} kishi · <span className="text-[#ff9a8a]">{left(u.dueAt)} qoldi</span>
                      </li>
                    ))}
                </ul>
              </>
            ) : null}
            {lows.length ? (
              <div className={total ? "mt-2 border-t border-white/10 pt-2" : ""}>
                <p className="text-[14px] font-black text-[#ffb35a]">⚠️ Past natija — shu o‘quvchilar bilan ishlang:</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/75">
                  {lows.slice(0, 6).map((l) => (
                    <li key={l}>• {l}</li>
                  ))}
                  {lows.length > 6 ? <li>… yana {lows.length - 6} ta</li> : null}
                </ul>
              </div>
            ) : null}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link href="/oqituvchi" onClick={close} className="rounded-full bg-gradient-to-r from-[#ff8a5a] to-[#ff5a7a] px-3 py-1 text-xs font-black text-white">
                Ko‘rish va eslatma yuborish →
              </Link>
              {"Notification" in globalThis && typeof Notification !== "undefined" && Notification.permission === "default" ? (
                <button type="button" onClick={() => Notification.requestPermission().catch(() => undefined)} className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
                  🔔 Bildirishnomalarni yoqish
                </button>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Yopish" className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
