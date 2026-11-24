"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { logSupportAction } from "@/app/actions/support";
import type { DailyGroup, DailyPerson, LowScore } from "@/lib/daily-homework";
import type { ActionKind } from "@/lib/support-kinds";
import type { SupportDeskData } from "@/lib/support-team";

const KIND_TAG: Record<ActionKind, string> = { remind: "📩", call: "📞", explain: "📚", retake: "💯", note: "📝" };

const leftText = (dueAt: string, now: number) => {
  const ms = Date.parse(dueAt) - now;
  if (ms <= 0) return "muddat tugadi";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} soat ${m} daqiqa qoldi` : `${m} daqiqa qoldi`;
};

function ActButton({ label, onClick, done }: { label: string; onClick: () => Promise<string | null>; done?: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(await onClick());
          })
        }
        className={`rounded-full px-2.5 py-1 text-[11px] font-black transition disabled:opacity-50 ${done ? "bg-[#22c55e]/20 text-[#7ddc5a]" : "bg-white/[0.08] text-white hover:bg-white/[0.16]"}`}
      >
        {pending ? "…" : label}
      </button>
      {err ? <span className="mt-0.5 max-w-[180px] text-[10px] text-[#ff9a9a]">{err}</span> : null}
    </span>
  );
}

function PersonRow({ g, p, kinds }: { g: DailyGroup; p: DailyPerson; kinds: ActionKind[] }) {
  const act = (kind: ActionKind) => async () =>
    (await logSupportAction({ groupId: g.groupId, studentId: p.studentId, memberId: p.memberId, kind, taskTitle: g.today?.title ?? null })).error ?? null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
      <div className="min-w-0">
        {p.studentId ? (
          <Link href={`/oqituvchi/chat/${p.studentId}`} className="font-bold text-white hover:text-[#ffb35a]">
            {p.name}
          </Link>
        ) : (
          <b className="text-white">{p.name}</b>
        )}
        {p.phone ? <span className="ml-2 text-[11px] text-white/50">📱 +{p.phone}</span> : null}
        {kinds.length ? <span className="ml-2 text-[11px] text-[#7ddc5a]">bugun: {kinds.map((k) => KIND_TAG[k]).join(" ")}</span> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.studentId ? <ActButton label="📩 Eslatma yuborish" done={kinds.includes("remind")} onClick={act("remind")} /> : null}
        <ActButton label="📞 Qo‘ng‘iroq qildim" done={kinds.includes("call")} onClick={act("call")} />
      </div>
    </li>
  );
}

function LowRow({ g, l, kinds, handled }: { g: DailyGroup; l: LowScore; kinds: ActionKind[]; handled: boolean }) {
  const act = (kind: ActionKind) => async () => (await logSupportAction({ groupId: g.groupId, studentId: l.studentId, memberId: l.memberId, kind, note: `${l.what} — ${l.pct}%` })).error ?? null;
  return (
    <li className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 ${handled ? "bg-[#22c55e]/[0.07]" : "bg-[#ffb35a]/[0.08]"}`}>
      <div className="min-w-0">
        <Link href={`/oqituvchi/chat/${l.studentId}`} className="font-bold text-white hover:text-[#ffb35a]">
          {l.name}
        </Link>
        <span className="ml-2 text-[11px] text-white/60">{l.what}</span>
        <b className="ml-2 rounded px-1.5 text-[11px]" style={{ background: l.pct < 40 ? "#D03B3B" : "#FAB219", color: l.pct < 40 ? "#fff" : "#1d1608" }}>
          {l.pct}%
        </b>
        {handled ? <span className="ml-2 text-[11px] font-bold text-[#7ddc5a]">✓ ishlandi</span> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ActButton label="📚 Mavzuni tushuntirdim" done={kinds.includes("explain")} onClick={act("explain")} />
        <ActButton label="💯 Qayta ishlab 100 oldi" done={kinds.includes("retake")} onClick={act("retake")} />
      </div>
    </li>
  );
}

/**
 * SUPPORT STOLI: support o'qituvchiga biriktirilgan guruhlar — bugun kimga vazifa bajartirish kerak,
 * kim bilan mavzu ishlash kerak. Har bir ish tugma bilan belgilanadi (asosiy o'qituvchi ko'radi).
 */
export function SupportDesk({ data, name, now }: { data: SupportDeskData; name: string; now: number }) {
  const notDone = data.groups.flatMap((g) => (g.today?.notDone ?? []).map((p) => ({ g, p })));
  const done = data.groups.reduce((n, g) => n + (g.today?.done.length ?? 0), 0);
  const handled = new Set(data.handledLow);
  const lows = data.groups.flatMap((g) => g.low.map((l) => ({ g, l, handled: handled.has(`${l.studentId}|${l.at}`) })));
  const openLows = lows.filter((x) => !x.handled).length;
  const reminded = notDone.filter(({ p }) => p.studentId && (data.actions[p.studentId] ?? []).some((k) => k === "remind" || k === "call")).length;
  const allClear = notDone.length === 0 && openLows === 0;

  return (
    <section className="space-y-3 rounded-[26px] border border-[#ff8a5a]/40 p-4 sm:p-5" style={{ background: "radial-gradient(120% 120% at 0% 0%, #3a1d12 0%, #16201b 55%, #0b110f 100%)" }}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#ff8a5a]">🎯 SIZNING BUGUNGI ISHINGIZ</p>
          <h2 className="text-[22px] font-black leading-tight tracking-tight text-white">{name.split(" ")[0]}, {allClear ? "hammasi joyida! 🎉" : "mana kimlar bilan ishlash kerak"}</h2>
          <p className="mt-0.5 text-xs text-white/60">Mas’ul guruhlaringiz: {data.groups.map((g) => g.groupName).join(", ")}</p>
        </div>
        <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-black text-white">Bugun qilgan ishingiz: {data.doneToday} ta</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["✅", "Topshirgan", `${done}`, "#7ddc5a"],
          ["⏰", "Bajarmagan", `${notDone.length}`, notDone.length ? "#ff9a9a" : "#7ddc5a"],
          ["⚠️", "Past natija", `${openLows}`, openLows ? "#ffb35a" : "#7ddc5a"],
        ].map(([i, l, v, c]) => (
          <div key={l} className="rounded-2xl bg-black/25 px-2 py-2">
            <p className="text-[11px] text-white/60">
              {i} {l}
            </p>
            <b className="text-xl tabular-nums" style={{ color: c }}>
              {v}
            </b>
          </div>
        ))}
      </div>

      {notDone.length ? (
        <div>
          <p className="text-[13px] font-black text-[#ff9a9a]">1) Vazifani bajartiring — {reminded}/{notDone.length} kishiga murojaat qilindi</p>
          {data.groups
            .filter((g) => g.today?.notDone.length)
            .map((g) => (
              <div key={g.groupId} className="mt-2">
                <p className="text-[12px] text-white/70">
                  <b className="text-white">{g.groupName}</b> · 📋 {g.today!.title} · ⏰ {leftText(g.today!.dueAt, now)}
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {g.today!.notDone.map((p) => (
                    <PersonRow key={p.memberId} g={g} p={p} kinds={p.studentId ? (data.actions[p.studentId] ?? []) : []} />
                  ))}
                </ul>
              </div>
            ))}
        </div>
      ) : null}

      {lows.length ? (
        <div>
          <p className="text-[13px] font-black text-[#ffb35a]">2) Past natija — mavzuni tushuntiring va 100/100 ga yetkazing</p>
          <ul className="mt-1.5 space-y-1.5">
            {lows.map(({ g, l, handled: h }, i) => (
              <LowRow key={`${l.studentId}-${i}`} g={g} l={l} handled={h} kinds={data.actions[l.studentId] ?? []} />
            ))}
          </ul>
        </div>
      ) : null}

      {data.groups.some((g) => g.noAccount.length) ? (
        <p className="text-[12px] text-[#ff9a9a]/90">⛔ Saytda hisobi yo‘q (telefon qilib ro‘yxatdan o‘tkazing): {data.groups.flatMap((g) => g.noAccount.map((p) => p.name)).join(", ")}</p>
      ) : null}

      {allClear ? <p className="rounded-2xl bg-[#22c55e]/10 px-4 py-3 text-sm font-bold text-[#7ddc5a]">🎉 Bugun hamma topshirgan va past natija yo‘q. Ertaga ham shunday bo‘lsin!</p> : null}
      <p className="text-[11px] text-white/45">Har bir tugma bosilganda ishingiz saqlanadi — asosiy o‘qituvchi ko‘rib turadi.</p>
    </section>
  );
}
