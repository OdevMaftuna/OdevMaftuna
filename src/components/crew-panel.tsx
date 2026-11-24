"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteFriend, leaveFriend, respondInvite } from "@/app/actions/crew";
import { tripFor, currentStop } from "@/lib/road-trips";
import type { Crew } from "@/lib/crew";

/** Do'stlar mashinalarining ranglari (o'zingiz — oltin). */
export const CREW_COLORS = ["#7DD3FC", "#F9A8D4", "#86EFAC", "#C4B5FD", "#FDBA74", "#FCA5A5", "#5EEAD4", "#FDE68A", "#A5B4FC", "#F0ABFC"];
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

/**
 * "Your Wanderland" sayohat jamoasi: reyting (kim oldinda), raqobat qatori, ID orqali taklif,
 * kelgan takliflarni qabul qilish. demo — o'qituvchi namunasi (amallar o'chirilgan).
 */
export function CrewPanel({ crew, demo = false }: { crew: Crew; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const friends = crew.members.filter((m) => !m.me);
  const myIdx = crew.members.findIndex((m) => m.me);
  const me = crew.members[myIdx];
  const ahead = myIdx > 0 ? crew.members[myIdx - 1] : null;
  const behind = crew.members[myIdx + 1] ?? null;
  const colorOf = (id: string) => CREW_COLORS[friends.findIndex((f) => f.id === id) % CREW_COLORS.length];

  let rivalry = "";
  if (friends.length) {
    if (ahead) {
      const gap = ahead.count - me.count;
      rivalry = gap === 0 ? `${ahead.name.split(" ")[0]} bilan yonma-yon ketyapsiz — bugun bitta vazifa bilan oldinga o‘ting! ⚡` : `${ahead.name.split(" ")[0]} sizdan ${gap} kun oldinda — quvib yeting! 🏁`;
    } else if (behind) {
      const gap = me.count - behind.count;
      rivalry = gap === 0 ? `Yetakchisiz, lekin ${behind.name.split(" ")[0]} yonma-yon — bo‘sh kelmang! 👀` : `Siz yetakchisiz! 🏆 ${behind.name.split(" ")[0]} ${gap} kun orqada.`;
    }
  }

  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      if (demo) return setMsg({ ok: true, text: "Namuna rejimi — o‘quvchilarda ishlaydi." });
      const r = await fn();
      setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error ?? "Xatolik." });
      if (r.ok) {
        setCode("");
        router.refresh();
      }
    });

  return (
    <div className="relative border-t border-white/[0.06] px-5 pb-5 pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Travel crew</p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full border border-[#F2D38A]/40 px-3 py-1 text-[11px] font-semibold text-[#F2D38A] transition hover:bg-[#F2D38A]/10">
          {open ? "Yopish" : "+ Do‘st taklif qilish"}
        </button>
      </div>

      {/* Kelgan takliflar */}
      {crew.incoming.map((inv) => (
        <div key={inv.id} className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-[#F2D38A]/30 bg-[#F2D38A]/[0.07] p-3 text-sm">
          <span className="min-w-0 flex-1">
            🚗 <b className="text-white">{inv.name}</b> <span className="text-white/60">sizni sayohatga taklif qildi</span>
          </span>
          <button type="button" disabled={pending} onClick={() => act(() => respondInvite(inv.id, true))} className="rounded-full px-3 py-1 text-xs font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
            Birga ketamiz
          </button>
          <button type="button" disabled={pending} onClick={() => act(() => respondInvite(inv.id, false))} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
            Rad etish
          </button>
        </div>
      ))}

      {open ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/60">Sizning ID’ingiz</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(crew.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {}
              }}
              className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-base font-bold tracking-[0.2em] text-[#F2D38A]"
            >
              {crew.code} <span className="text-xs tracking-normal text-white/40">{copied ? "✓" : "⧉"}</span>
            </button>
          </div>
          <p className="text-xs text-white/45">Do‘stingizga ID’ingizni yuboring yoki uning ID’sini yozing — birga yo‘lga chiqasiz va kim uzoqroq ketishini ko‘rasiz.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              act(() => inviteFriend(code));
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Do‘st ID'si"
              aria-label="Do‘st ID'si"
              className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 font-mono text-base uppercase tracking-[0.2em] text-white outline-none placeholder:tracking-normal placeholder:text-white/30 focus:border-[#f1a93b]"
            />
            <button type="submit" disabled={pending || code.length !== 6} className="h-10 rounded-xl px-4 text-sm font-bold text-[#1d1608] disabled:opacity-50 [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
              {pending ? "…" : "Taklif qilish"}
            </button>
          </form>
          {crew.outgoing.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 text-xs text-white/55">
              <span>✉️ {o.name} — javob kutilmoqda</span>
              <button type="button" disabled={pending} onClick={() => act(() => leaveFriend(o.id))} className="text-white/40 underline-offset-2 hover:underline">
                bekor qilish
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {msg ? <p className={`mt-2 text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p> : null}

      {/* Reyting */}
      {friends.length ? (
        <>
          {rivalry ? <p className="mt-3 text-[13px] font-semibold text-[#F2D38A]">{rivalry}</p> : null}
          <ol className="mt-2 space-y-1.5">
            {crew.members.map((m, i) => {
              const t = tripFor(m.count);
              return (
                <li key={m.id} className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${m.me ? "bg-[#F2D38A]/[0.08] ring-1 ring-[#F2D38A]/30" : ""}`}>
                  <span className="w-5 text-center font-mono text-sm font-bold text-white/45">{i === 0 ? "🏆" : i + 1}</span>
                  <span
                    className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-black text-[#0d1512] ring-2"
                    style={{ background: m.me ? "linear-gradient(135deg,#f5c76a,#f1a93b)" : colorOf(m.id), ["--tw-ring-color" as string]: m.me ? "#F5C76A" : colorOf(m.id) }}
                  >
                    {m.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar} alt="" className="size-full object-cover" />
                    ) : (
                      initials(m.name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm text-white">{m.me ? "Siz" : m.name}</b>
                    <span className="block truncate text-[11px] text-white/45">
                      {t.trip.title} · {currentStop(m.count).name}
                    </span>
                  </span>
                  <span className="text-right">
                    <b className="block font-mono text-sm tabular-nums text-white">{m.count} kun</b>
                    <span className={`text-[10px] ${m.today ? "text-emerald-300" : "text-orange-300"}`}>{m.today ? "✓ bugun yo‘lda" : "⏳ hali yo‘q"}</span>
                  </span>
                  {!m.me && !demo ? (
                    <button
                      type="button"
                      aria-label={`${m.name}ni sayohatdan chiqarish`}
                      title="Sayohatdan chiqarish"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`${m.name} sayohat jamoangizdan chiqarilsinmi?`)) act(() => leaveFriend(m.id));
                      }}
                      className="text-white/25 hover:text-white/60"
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-xs text-white/45">Yolg‘iz sayohat zerikarli 🙂 Do‘stlaringizni taklif qiling — kim uzoqroq ketarkin?</p>
      )}
    </div>
  );
}
