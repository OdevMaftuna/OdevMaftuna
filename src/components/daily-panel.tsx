"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { warnGroup } from "@/app/actions/groups";
import type { DailyGroup } from "@/lib/daily-homework";

const left = (dueAt: string, now: number) => {
  const ms = Date.parse(dueAt) - now;
  if (ms <= 0) return "muddat tugadi";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} soat ${m} daqiqa qoldi` : `${m} daqiqa qoldi`;
};

function GroupCard({ g, now }: { g: DailyGroup; now: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const t = g.today;
  const total = t ? t.done.length + t.notDone.length : 0;
  const pct = total ? Math.round(((t?.done.length ?? 0) / total) * 100) : 0;
  const urgent = t && t.notDone.length > 0 && Date.parse(t.dueAt) - now < 4 * 3_600_000;

  return (
    <div className={`rounded-[22px] border p-4 ${urgent ? "border-[#ff6a5a]/60 bg-[#ff6a5a]/[0.06]" : "border-white/[0.08] bg-[#121a17]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/oqituvchi/guruhlar/${g.groupId}`} className="block truncate text-[16px] font-black hover:text-[#7ddc5a]">
            {g.groupName}
          </Link>
          <span className="text-xs text-neutral-500">{[g.teacherName ? `👩‍🏫 ${g.teacherName}` : null, g.courseName].filter(Boolean).join(" · ")}</span>
        </div>
        {t ? (
          <span className="shrink-0 text-right">
            <b className="block text-2xl tabular-nums" style={{ color: pct >= 80 ? "#7ddc5a" : pct >= 50 ? "#FAB219" : "#ff8a8a" }}>
              {t.done.length}/{total}
            </b>
            <span className={`text-[11px] font-bold ${urgent ? "text-[#ff9a8a]" : "text-neutral-500"}`}>⏰ {left(t.dueAt, now)}</span>
          </span>
        ) : null}
      </div>

      {t ? (
        <>
          <p className="mt-1 truncate text-[12px] text-neutral-500">📋 {t.title}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#2f6b1f] to-[#22c55e] transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {t.done.map((p) => (
              <span key={p.memberId} className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[11px] font-bold text-[#7ddc5a]">
                ✓ {p.name}
              </span>
            ))}
            {t.notDone.map((p) => (
              <Link key={p.memberId} href={`/oqituvchi/chat/${p.studentId}`} className="rounded-full bg-[#D03B3B]/15 px-2 py-0.5 text-[11px] font-bold text-[#ff9a9a] hover:bg-[#D03B3B]/30">
                ✗ {p.name}
              </Link>
            ))}
          </div>
          {t.notDone.length ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await warnGroup(g.groupId);
                  setMsg(r.error ?? (r.sent ? `✓ ${r.sent} ta o‘quvchiga eslatma yuborildi${r.skipped ? ` (${r.skipped} tasi yaqinda olgan)` : ""}` : "Hammasi yaqinda eslatma olgan (30 daqiqa)."));
                })
              }
              className="mt-3 rounded-full bg-gradient-to-r from-[#ff8a5a] to-[#ff5a7a] px-4 py-1.5 text-xs font-black text-white shadow-[0_8px_20px_-8px_rgba(255,90,122,.8)] disabled:opacity-50"
            >
              {pending ? "Yuborilmoqda…" : `⚠️ Bajarmagan ${t.notDone.length} kishiga eslatma yuborish`}
            </button>
          ) : (
            <p className="mt-3 text-xs font-bold text-[#7ddc5a]">🎉 Hamma topshirdi!</p>
          )}
          {msg ? <p className="mt-1.5 text-xs text-white/70">{msg}</p> : null}
        </>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">{g.courseName ? "Hozir ochiq vazifa yo‘q." : "Bu guruh kursida saytda kunlik vazifa yo‘q (offline)."}</p>
      )}

      {g.low.length ? (
        <div className="mt-3 rounded-xl border border-[#ffb35a]/40 bg-[#ffb35a]/[0.07] p-2.5">
          <p className="text-[12px] font-black text-[#ffb35a]">⚠️ Past natija — shu o‘quvchilar bilan ishlang</p>
          <ul className="mt-1 space-y-1">
            {g.low.slice(0, 6).map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-[12px]">
                <Link href={`/oqituvchi/chat/${l.studentId}`} className="min-w-0 truncate text-white hover:text-[#ffb35a]">
                  <b>{l.name}</b> <span className="text-white/50">· {l.what}</span>
                </Link>
                <b className="shrink-0 rounded px-1.5 text-[11px]" style={{ background: l.pct < 40 ? "#D03B3B" : "#FAB219", color: l.pct < 40 ? "#fff" : "#1d1608" }}>
                  {l.pct}%
                </b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {g.yesterday ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          Kechagi: <b className="text-white/80">{g.yesterday.done}/{g.yesterday.total}</b> topshirgan
          {g.yesterday.missed.length ? <span> · bajarmagan: {g.yesterday.missed.slice(0, 6).join(", ")}{g.yesterday.missed.length > 6 ? "…" : ""}</span> : null}
        </p>
      ) : null}
      {g.noAccount.length ? <p className="mt-1 text-[11px] text-[#ff9a9a]/80">⛔ Saytda hisobi yo‘q: {g.noAccount.map((p) => p.name).join(", ")}</p> : null}
    </div>
  );
}

/** Asosiy sahifa: guruhlar bo'yicha bugungi vazifa — kim bajardi, kim yo'q, qancha vaqt qoldi, eslatma tugmasi. */
export function DailyPanel({ groups }: { groups: DailyGroup[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const withHw = groups.filter((g) => g.today);
  const totalDone = withHw.reduce((t, g) => t + g.today!.done.length, 0);
  const totalAll = withHw.reduce((t, g) => t + g.today!.done.length + g.today!.notDone.length, 0);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#ff8a5a]">📋 KUNLIK NAZORAT</p>
          <h2 className="text-[20px] font-black tracking-tight">Bugungi vazifa — guruhlar bo‘yicha</h2>
        </div>
        {totalAll ? (
          <span className="rounded-full bg-white/[0.07] px-3 py-1 text-sm font-black">
            Jami: <span className="text-[#7ddc5a]">{totalDone}</span>/{totalAll} topshirgan
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[...groups]
          .sort((a, b) => Number(Boolean(b.today)) - Number(Boolean(a.today)))
          .map((g) => (
            <GroupCard key={g.groupId} g={g} now={now} />
          ))}
      </div>
    </section>
  );
}
