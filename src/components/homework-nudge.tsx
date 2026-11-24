"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sticker } from "@/components/score-sticker";
import { EVERY_MS, onPrefsChange, readPrefs, type ReminderPrefs } from "@/lib/reminder-prefs";
import { pickSticker, pickText } from "@/lib/stickers";

export type PendingTask = { id: string; title: string; dueAt: string };

const KEY = "nsp-nudge-last";
const HOUR = 60 * 60 * 1000;
/** Kurs sahifalari orasida yurganda — ketma-ket eslatmalar orasidagi eng kam vaqt. */
const COURSE_GAP = 2 * 60 * 1000;
const VISIT_KEY = "nsp-nudge-visit";

/** Shu tab/sessiyada birinchi marta — "saytga yangi kirish". */
const newVisit = () => {
  try {
    if (window.sessionStorage.getItem(VISIT_KEY)) return false;
    window.sessionStorage.setItem(VISIT_KEY, "1");
    return true;
  } catch {
    return false;
  }
};

const readLast = () => {
  try {
    return Number(window.localStorage.getItem(KEY) ?? 0);
  } catch {
    return 0;
  }
};
const writeLast = (t: number) => {
  try {
    window.localStorage.setItem(KEY, String(t));
  } catch {}
};

function left(dueAt: string) {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return "muddati o‘tdi";
  const h = Math.floor(ms / HOUR);
  const m = Math.floor((ms % HOUR) / 60000);
  return h > 0 ? `${h} soat ${m} daqiqa qoldi` : `${m} daqiqa qoldi`;
}

/**
 * VAZIFA ESLATMASI: topshirilmagan vazifa bo'lsa — pastdan stikerli eslatma chiqadi (har safar boshqa stiker va matn).
 * Qanchalik tez-tez va qanday ohangda — o'quvchi Profil → "Reminders" bo'limida o'zi tanlaydi
 * (standart: 18+ yoshga 2 soatda bir va yumshoq; kichiklarga 30 daqiqada bir).
 * Ruxsat berilgan bo'lsa va sahifa orqa fonda bo'lsa — telefon/kompyuter bildirishnomasi ham keladi.
 */
export function HomeworkNudge({ tasks, age = null }: { tasks: PendingTask[]; age?: number | null }) {
  const path = usePathname();
  const [shown, setShown] = useState<{ seed: number; soft: boolean } | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const doing = path.startsWith("/oquvchi/vazifa/");
  const first = tasks[0];

  const firstId = first?.id;
  const onCourse = path.startsWith("/oquvchi/kurs/");

  useEffect(() => {
    if (!first || doing) return;
    let prefs: ReminderPrefs = readPrefs(age);
    const stopPrefs = onPrefsChange(() => {
      prefs = readPrefs(age);
      if (prefs.every === "off") setShown(null);
    });
    const fire = () => {
      if (prefs.every === "off") return;
      const seed = Math.random();
      const soft = prefs.tone === "soft";
      writeLast(Date.now());
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        const t = pickText("nudge", seed, { soft });
        try {
          new Notification(`${t.title} — NSP`, { body: `${first.title}: ${left(first.dueAt)}`, icon: "/apple-icon.png", tag: "nsp-nudge" });
        } catch {}
      }
      setShown({ seed, soft });
    };
    const check = () => {
      if (Date.now() - readLast() >= EVERY_MS[prefs.every]) fire();
    };
    const t0 = window.setTimeout(() => {
      setPerm("Notification" in window ? Notification.permission : "unsupported");
      // 1) Saytga har yangi kirish (yangi tab / qayta ochish) — darhol eslatma.
      if (newVisit()) return fire();
      // 2) Kurs sahifalarini ko'rayotganda — faqat "30 daqiqa" rejimida (oxirgisidan 2 daqiqa o'tgan bo'lsa).
      if (prefs.every === "30m" && onCourse && Date.now() - readLast() >= COURSE_GAP) return fire();
      // 3) Aks holda — tanlangan jadval bo'yicha.
      check();
    }, 2500);
    const id = window.setInterval(check, 30_000);
    // Orqa fondan qaytganda ham tekshiriladi (telefon uyqudan uyg'onganda taymer to'xtagan bo'ladi).
    const onVis = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopPrefs();
      window.clearTimeout(t0);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstId, doing, path, age]);

  if (!shown || !first || doing) return null;
  const def = pickSticker("nudge", shown.seed, { soft: shown.soft });
  const t = pickText("nudge", shown.seed, { soft: shown.soft });

  return (
    <div className="nudge-in fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-md sm:bottom-6">
      <div className="flex items-center gap-3 rounded-[22px] border border-[#F5C76A]/30 bg-[#141d19]/95 p-3 pr-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] backdrop-blur">
        <div className="shrink-0">
          <Sticker def={def} size={76} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white">{t.title}</p>
          <p className="truncate text-xs text-white/60">
            {first.title} · <span className="text-orange-300">{left(first.dueAt)}</span>
            {tasks.length > 1 ? ` · yana ${tasks.length - 1} ta` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={`/oquvchi/vazifa/${first.id}`} onClick={() => setShown(null)} className="rounded-full px-3 py-1 text-xs font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
              Hozir bajarish →
            </Link>
            {perm === "default" ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setPerm(await Notification.requestPermission());
                  } catch {}
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70"
              >
                🔔 Eslatmalarni yoqish
              </button>
            ) : null}
            <Link href="/oquvchi/kabinet#eslatmalar" onClick={() => setShown(null)} className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
              ⚙️ Sozlash
            </Link>
          </div>
        </div>
        <button type="button" onClick={() => setShown(null)} aria-label="Yopish" className="self-start text-white/40 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
