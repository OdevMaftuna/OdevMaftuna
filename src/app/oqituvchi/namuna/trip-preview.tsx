"use client";

import { useState } from "react";
import { Wanderland } from "@/components/wanderland";
import { currentStop, WEATHER_LABEL, type WeatherKind } from "@/lib/road-trips";

export function TripPreview() {
  const [days, setDays] = useState(5);
  const [today, setToday] = useState(true);
  // null — haqiqiy Toshkent vaqti; son — qo'lda tanlangan soat.
  const [hour, setHour] = useState<number | null>(null);
  const [kind, setKind] = useState<WeatherKind>("clear");
  const [lost, setLost] = useState(0);
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 text-neutral-400">Ketma-ket kunlar</span>
          <input type="range" min={0} max={62} value={days} onChange={(e) => setDays(Number(e.target.value))} className="flex-1 accent-[#f1a93b]" />
          <b className="w-10 text-right tabular-nums">{days}</b>
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={today} onChange={(e) => setToday(e.target.checked)} className="accent-[#f1a93b]" />
          Bugun vazifa qilingan
        </label>
        <label className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 text-neutral-400">Soat (Toshkent)</span>
          <input type="range" min={0} max={23.75} step={0.25} value={hour ?? 12} onChange={(e) => setHour(Number(e.target.value))} className="flex-1 accent-[#f1a93b]" />
          <b className="w-12 text-right tabular-nums">{hour === null ? "hozir" : `${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`}</b>
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["Hozir", null],
            ["Tong 7:30", 7.5],
            ["Kunduz 12:30", 12.5],
            ["Shom 17:00", 17],
            ["Tun 22:00", 22],
          ].map(([l, h]) => (
            <button key={String(l)} type="button" onClick={() => setHour(h as number | null)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${hour === h ? "border-[#f1a93b] text-[#f5c76a]" : "border-white/10 hover:border-[#f1a93b]/60"}`}>
              {l as string}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WEATHER_LABEL) as WeatherKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${kind === k ? "border-[#f1a93b] text-[#f5c76a]" : "border-white/10 hover:border-[#f1a93b]/60"}`}>
              {WEATHER_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button type="button" onClick={() => { setLost(0); setDays(15); setToday(false); setHour(20); }} className="rounded-full border border-orange-400/40 px-3 py-1 text-xs font-semibold text-orange-300 hover:border-orange-400">
            🌪 Bugun vazifa qilinmagan (20:00)
          </button>
          <button type="button" onClick={() => { setLost(15); setDays(0); setToday(false); setHour(9); }} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-300 hover:border-red-400">
            💥 Kecha uzildi → tushdan uyg‘onish
          </button>
          <button type="button" onClick={() => { setLost(0); setDays(15); setToday(true); }} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:border-[#f1a93b]/60">
            ✓ Hammasi joyida
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 5, 10, 15, 20, 25, 30, 45, 65].map((d) => (
            <button key={d} type="button" onClick={() => { setLost(0); setDays(d); }} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:border-[#f1a93b]/60">
              {d} kun
            </button>
          ))}
        </div>
      </div>
      {/* key: kun o'zgarganda samolyot qaytadan uchib keladi */}
      <Wanderland key={`${days}-${today}-${lost}`} count={days} today={today} lost={lost} demo crew={{ code: "4A951D", incoming: [{ id: "i1", name: "Dilnoza Rahimova" }], outgoing: [], members: [{ id: "me", name: "Siz", count: days, today, me: true, avatar: null }, { id: "a", name: "Aziz Karimov", count: days + 3, today: true, me: false, avatar: null }, { id: "b", name: "Malika Yusupova", count: Math.max(0, days - 2), today: false, me: false, avatar: null }, { id: "c", name: "Jasur Toshev", count: days + 34, today: true, me: false, avatar: null }].sort((x, y) => y.count - x.count) }} hour={hour ?? undefined} weather={{ kind, temp: kind === "snow" ? -4 : kind === "clear" ? 18 : 9, city: currentStop(days).name }} week={Array.from({ length: 7 }, (_, i) => ({ key: String(i), label: ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"][i], active: i < 6 ? i >= 6 - Math.min(6, days - (today ? 1 : 0)) : today && days > 0, isToday: i === 6 }))} />
    </div>
  );
}
