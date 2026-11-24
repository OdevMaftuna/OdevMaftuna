"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setGroupSupport } from "@/app/actions/support";
import { ACTION_LABEL, type ActionKind } from "@/lib/support-kinds";
import type { SupportBoard, SupportCard } from "@/lib/support-team";

const STATUS = {
  green: { label: "🟢 Yaxshi ishlayapti", color: "#7ddc5a", border: "border-[#22c55e]/40" },
  yellow: { label: "🟡 E’tibor kerak", color: "#FAB219", border: "border-[#FAB219]/50" },
  red: { label: "🔴 Ishlamayapti", color: "#ff8a8a", border: "border-[#ff6a5a]/60" },
} as const;

function ago(iso: string | null, now: number) {
  if (!iso) return "hech qachon";
  const m = Math.floor((now - Date.parse(iso)) / 60_000);
  if (m < 1) return "hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

const pctColor = (done: number, total: number) => (!total ? "#a3ada8" : done / total >= 0.8 ? "#7ddc5a" : done / total >= 0.5 ? "#FAB219" : "#ff8a8a");

function Card({ s, now }: { s: SupportCard; now: number }) {
  const st = STATUS[s.status];
  return (
    <div className={`rounded-[24px] border ${st.border} bg-[#121a17] p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[18px] font-black text-white">🛟 {s.name}</p>
          <p className="text-[12px] text-[#a3ada8]">{s.groups.length ? s.groups.map((g) => g.name).join(", ") : "Guruh biriktirilmagan"}</p>
          {s.email ? <p className="text-[11px] text-[#808a85]">Login: {s.email}</p> : null}
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: `${st.color}22`, color: st.color }}>
          {st.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Bugungi vazifa", s.today.total ? `${s.today.done}/${s.today.total}` : "—", pctColor(s.today.done, s.today.total)],
          ["Kecha", s.yesterday.total ? `${s.yesterday.done}/${s.yesterday.total}` : "—", pctColor(s.yesterday.done, s.yesterday.total)],
          ["Past natija (ochiq)", String(s.lowOpen.length), s.lowOpen.length ? "#ffb35a" : "#7ddc5a"],
          ["Bugun qilgan ishi", String(s.actions24h), s.actions24h ? "#7ddc5a" : "#ff8a8a"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl bg-black/25 px-3 py-2">
            <p className="text-[11px] text-[#a3ada8]">{l}</p>
            <b className="text-xl tabular-nums" style={{ color: c }}>
              {v}
            </b>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[12px] text-[#cfd6d2]">
        Oxirgi ishi: <b className="text-white">{ago(s.lastActionAt, now)}</b> · Saytga kirgan: <b className="text-white">{ago(s.lastSignIn, now)}</b>
      </p>
      <p className="mt-1 text-[12px] text-[#cfd6d2]">
        7 kunda: <b className="text-white">{s.actions7d}</b> ish —{" "}
        {(Object.keys(ACTION_LABEL) as ActionKind[])
          .filter((k) => s.perKind7d[k])
          .map((k) => `${ACTION_LABEL[k]} ${s.perKind7d[k]}`)
          .concat(s.messages7d ? [`💬 Chat ${s.messages7d}`] : [], s.checks7d ? [`✅ Checklist ${s.checks7d}`] : [])
          .join(" · ") || "hech narsa"}
        {s.lowHandled ? <span> · past natija bilan ishlangan: {s.lowHandled}</span> : null}
      </p>

      {s.reasons.length ? (
        <ul className="mt-2 space-y-0.5 text-[12px]" style={{ color: st.color }}>
          {s.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      ) : null}

      {s.lowOpen.length ? (
        <p className="mt-2 text-[12px] text-[#ffb35a]">
          ⚠️ Ishlanmagan past natijalar: {s.lowOpen.slice(0, 6).map((l) => `${l.name} (${l.pct}%)`).join(", ")}
          {s.lowOpen.length > 6 ? "…" : ""}
        </p>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] font-bold text-[#7ddc5a]">Oxirgi ishlari ({s.recent.length})</summary>
        {s.recent.length ? (
          <ul className="mt-2 space-y-1 text-[12px] text-[#cfd6d2]">
            {s.recent.map((r, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span>{ACTION_LABEL[r.kind]}</span>
                <b className="text-white">{r.student}</b>
                {r.group ? <span className="text-[#808a85]">· {r.group}</span> : null}
                {r.note ? <span className="text-[#808a85]">· {r.note}</span> : null}
                <span className="text-[#808a85]">· {ago(r.at, now)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12px] text-[#808a85]">Hali belgilangan ish yo‘q.</p>
        )}
      </details>
    </div>
  );
}

function AssignRow({ g, candidates }: { g: SupportBoard["allGroups"][number]; candidates: SupportBoard["candidates"] }) {
  const [value, setValue] = useState(g.supportId ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
      <Link href={`/oqituvchi/guruhlar/${g.id}`} className="font-bold text-white hover:text-[#7ddc5a]">
        {g.name}
      </Link>
      <span className="flex items-center gap-2">
        <select
          value={value}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            start(async () => {
              const r = await setGroupSupport(g.id, v || null);
              setMsg(r.error ?? "✓");
            });
          }}
          className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        >
          <option value="">— mas’ul yo‘q —</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              🛟 {c.name}
            </option>
          ))}
        </select>
        {msg ? <span className={`text-xs ${msg === "✓" ? "text-[#7ddc5a]" : "text-[#ff9a9a]"}`}>{msg}</span> : null}
      </span>
    </li>
  );
}

/** Asosiy o'qituvchi: supportlar reytingi (qizil → sariq → yashil), har birining natijasi va qilgan ishlari. */
export function SupportBoardView({ board, now }: { board: SupportBoard; now: number }) {
  const red = board.supports.filter((s) => s.status === "red").length;
  const yellow = board.supports.filter((s) => s.status === "yellow").length;
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#ff8a5a]">🛟 SUPPORTLAR NAZORATI</p>
        <h1 className="text-[26px] font-black tracking-tight">Kim ishlayapti, kim yo‘q</h1>
        <p className="text-sm text-[#a3ada8]">
          Har bir support o‘z guruhidagi o‘quvchilar vazifani bajarishi va natijasi uchun mas’ul. Holat ular qilgan ishlar (eslatma, qo‘ng‘iroq, tushuntirish, 100/100), chat va checklist bo‘yicha avtomatik hisoblanadi.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm font-black">
        <span className="rounded-full bg-[#ff6a5a]/15 px-3 py-1 text-[#ff8a8a]">🔴 {red}</span>
        <span className="rounded-full bg-[#FAB219]/15 px-3 py-1 text-[#FAB219]">🟡 {yellow}</span>
        <span className="rounded-full bg-[#22c55e]/15 px-3 py-1 text-[#7ddc5a]">🟢 {board.supports.length - red - yellow}</span>
      </div>

      {board.supports.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {board.supports.map((s) => (
            <Card key={s.id} s={s} now={now} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#a3ada8]">Hali support yo‘q. Sozlamalarda o‘qituvchiga “Support” huquqini bering.</p>
      )}

      <div className="rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4">
        <p className="text-[15px] font-black text-white">👥 Guruhlarga mas’ul biriktirish</p>
        <p className="text-xs text-[#a3ada8]">
          {board.unassigned.length ? `Mas’ulsiz guruhlar: ${board.unassigned.map((g) => g.name).join(", ")}` : "Hamma guruhning mas’uli bor."}
        </p>
        <ul className="mt-2 space-y-1.5">
          {board.allGroups.map((g) => (
            <AssignRow key={g.id} g={g} candidates={board.candidates} />
          ))}
        </ul>
      </div>
    </section>
  );
}
