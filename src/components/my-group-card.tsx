"use client";

import { useState, useTransition } from "react";
import { linkMyPhone } from "@/app/actions/groups";

/**
 * O'quvchi bosh sahifasi: "Siz … guruhidasiz" kartasi.
 * Guruhga hali bog'lanmagan bo'lsa — telefon raqamini kiritib, o'z guruhini topadi.
 */
export function MyGroupCard({ groups }: { groups: { id: string; name: string; schedule: string; teacher: string | null }[] }) {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (groups.length) {
    return (
      <div className="relative overflow-clip rounded-[24px] border border-[#22c55e]/35 p-4" style={{ background: "linear-gradient(120deg,#163a12 0%,#121a17 60%,#0f1712 100%)" }}>
        <span aria-hidden className="absolute -right-6 -top-8 size-32 rounded-full bg-[#22c55e] opacity-20 blur-3xl" />
        {groups.map((g) => (
          <div key={g.id} className="relative flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#22c55e]/20 text-2xl">🏫</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-extrabold tracking-[0.16em] text-[#7ddc5a]">SIZ SHU GURUHDASIZ</span>
              <b className="block truncate text-[17px] text-white">{g.name}</b>
              <span className="block text-xs text-white/60">{[g.teacher ? `👩‍🏫 ${g.teacher}` : null, g.schedule || null].filter(Boolean).join(" · ")}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await linkMyPhone(phone);
          setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "Topildi! Guruhingiz bog‘landi 🎉" });
        });
      }}
      className="rounded-[24px] border border-dashed border-[#22c55e]/40 bg-[#22c55e]/[0.05] p-4"
    >
      <p className="text-[15px] font-black text-white">🏫 Guruhingizni toping</p>
      <p className="text-xs text-white/60">O‘quv markazda yozdirilgan telefon raqamingizni kiriting — guruhingiz va ustozingiz shu yerda chiqadi.</p>
      <div className="mt-2.5 flex gap-2">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" autoComplete="tel" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22c55e] focus:outline-none" />
        <button type="submit" disabled={pending || phone.replace(/\D/g, "").length < 9} className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-black text-[#062a20] disabled:opacity-40">
          {pending ? "…" : "Topish"}
        </button>
      </div>
      {msg ? <p className={`mt-2 text-sm font-semibold ${msg.ok ? "text-[#7ddc5a]" : "text-[#ff9a9a]"}`}>{msg.text}</p> : null}
    </form>
  );
}
