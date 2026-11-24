"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const HIDE_KEY = "nsp-install-hidden";

/** Service worker'ni ro'yxatdan o'tkazadi (o'rnatish uchun shart). Root layout'da bir marta. */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

/**
 * "📲 Bosh ekranga qo'shish" kartasi.
 *  - Android / Chrome / Edge: tugma bosilsa — tizimning o'rnatish oynasi chiqadi.
 *  - iPhone (Safari): qisqa ko'rsatma — "Ulashish" → "Bosh ekranga qo'shish".
 *  - Allaqachon ilova sifatida ochilgan bo'lsa yoki foydalanuvchi yopsa — ko'rinmaydi.
 */
export function InstallApp() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [howto, setHowto] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = Date.now() - Number(window.localStorage.getItem(HIDE_KEY) ?? 0) < 7 * 86_400_000;
    } catch {}
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    const t = window.setTimeout(() => {
      setIos(isIos);
      if (isIos) setHidden(false);
    }, 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;
  const close = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(HIDE_KEY, String(Date.now()));
    } catch {}
  };

  return (
    <div className="relative overflow-clip rounded-[24px] border border-[#F5C76A]/35 p-4" style={{ background: "linear-gradient(120deg,#2c2412 0%,#121a17 60%,#0f1712 100%)" }}>
      <span aria-hidden className="absolute -right-6 -top-8 size-32 rounded-full bg-[#F5C76A] opacity-15 blur-3xl" />
      <div className="relative flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={52} height={52} className="size-[52px] shrink-0 rounded-2xl shadow-lg" />
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] text-white">📲 NSP’ni telefoningizga o‘rnating</b>
          <span className="block text-xs text-white/65">Bosh ekranda ilova kabi turadi — bir bosishda ochiladi, brauzer paneli yo‘q.</span>
        </div>
        <button type="button" onClick={close} aria-label="Yopish" className="self-start text-white/40 hover:text-white">
          ✕
        </button>
      </div>
      {evt ? (
        <button
          type="button"
          onClick={async () => {
            await evt.prompt();
            const r = await evt.userChoice.catch(() => null);
            if (r?.outcome === "accepted") setHidden(true);
            setEvt(null);
          }}
          className="relative mt-3 w-full rounded-2xl py-2.5 text-sm font-black text-[#1d1608] [background:linear-gradient(135deg,#fff3c4,#F5C76A,#f1a93b)]"
        >
          Bosh ekranga qo‘shish
        </button>
      ) : ios ? (
        <>
          <button type="button" onClick={() => setHowto(!howto)} className="relative mt-3 w-full rounded-2xl py-2.5 text-sm font-black text-[#1d1608] [background:linear-gradient(135deg,#fff3c4,#F5C76A,#f1a93b)]">
            {howto ? "Yopish" : "Qanday qo‘shiladi?"}
          </button>
          {howto ? (
            <ol className="relative mt-3 space-y-1.5 rounded-2xl bg-black/30 p-3 text-[13px] text-white/85">
              <li>
                1. Pastdagi <b>Ulashish</b> tugmasini bosing <span className="rounded bg-white/15 px-1.5">⬆︎</span>
              </li>
              <li>
                2. <b>“На экран «Домой»” / “Add to Home Screen”</b> ni tanlang
              </li>
              <li>
                3. <b>Qo‘shish</b> ni bosing — NSP belgisi bosh ekranda paydo bo‘ladi ✅
              </li>
            </ol>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
