import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { requireStudent } from "@/lib/auth";
import { after } from "next/server";
import { retryFailedWriting } from "@/lib/writing/grade";
import { ALL_CARD_IDS, CHECKLIST, DIFFERENCES, FORMULA, TONE_LABEL, WRITING_TYPES, WORDS } from "@/lib/writing/data";
import { ML_MOCKS } from "@/lib/writing/multilevel";
import { loadMyWriting, scoreColor, writingAccess } from "@/lib/writing/load";

/** Fondagi AI navbati uchun vaqt. */
export const maxDuration = 60;
export const metadata: Metadata = { title: "Writing" };

/** WRITING MARKAZI: 12 ta xat turi × 3 ta cue card, universal formula, farqlar va checklist. */
export default async function WritingHub() {
  const me = await requireStudent();
  after(() => retryFailedWriting({ studentId: me.id, limit: 2 }));
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  // Faqat letter cue card'lar (Multilevel ishlari o'z sahifasida hisoblanadi).
  const letterIds = new Set(ALL_CARD_IDS);
  const checked = [...mine.values()].filter((a) => letterIds.has(a.card_id) && a.status === "checked" && a.score !== null);
  const mlDone = [...mine.values()].filter((a) => a.card_id.startsWith("ml-") && !a.card_id.endsWith("-quiz") && a.status === "checked").length;
  const avg = checked.length ? checked.reduce((t, a) => t + (a.score ?? 0), 0) / checked.length : null;
  const total = WRITING_TYPES.length * 3;
  const pct = Math.round((checked.length / total) * 100);
  const R = 34;
  const L = 2 * Math.PI * R;

  return (
    <section className="space-y-6 pb-4">
      <Link href={access.courseId ? `/oquvchi/kurs/${access.courseId}` : "/oquvchi"} className="text-sm text-[#a3ada8] hover:text-white">
        ← Pre-Intermediate
      </Link>

      {/* HERO */}
      <div className="wr-hero relative overflow-clip rounded-[30px] p-5 sm:p-6">
        <span aria-hidden className="sc-glow sc-glow-1" />
        <span aria-hidden className="sc-glow sc-glow-2" />
        <span aria-hidden className="wr-env absolute -right-3 top-3 text-[90px] opacity-20 sm:text-[120px]">✉️</span>
        <div className="relative flex items-center gap-4">
          <div className="relative size-[84px] shrink-0">
            <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90">
              <circle cx="42" cy="42" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
              <circle cx="42" cy="42" r={R} fill="none" stroke="#F5C76A" strokeWidth="8" strokeLinecap="round" strokeDasharray={L} className="sc-arc" style={{ "--len": `${L}`, "--off": `${L * (1 - pct / 100)}` } as CSSProperties} />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-center leading-none">
              <b className="text-xl font-black text-white">{checked.length}</b>
              <span className="-mt-3 block text-[10px] font-bold text-[#a3ada8]">/ {total}</span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">✍️ SEFR WRITING</p>
            <h1 className="text-[26px] font-black leading-tight tracking-tight text-white sm:text-[32px]">Letter & Email</h1>
            <p className="text-sm text-[#a3ada8]">12 ta xat turi · 36 ta cue card · AI tekshiradi · muddat yo‘q</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["📨", "Yozildi", `${checked.length} ta`],
            ["🎯", "O‘rtacha", avg === null ? "—" : `${avg.toFixed(1)}/10`],
            ["📏", "Hajm", `${WORDS.min}–${WORDS.max} so‘z`],
          ].map(([i, l, v]) => (
            <div key={l} className="rounded-2xl border border-white/10 bg-black/25 px-2 py-2.5">
              <p className="text-[11px] text-[#a3ada8]">
                {i} {l}
              </p>
              <b className="text-[17px] text-white">{v}</b>
            </div>
          ))}
        </div>
        {!access.open ? (
          <p className="relative mt-3 rounded-2xl border border-[#F5C76A]/30 bg-[#F5C76A]/10 px-3 py-2 text-sm text-[#F5C76A]">
            🔒 Qo‘llanmalarni o‘qish bepul. Yozish va AI tekshiruvi — Pre-Intermediate kursi o‘quvchilari uchun.
          </p>
        ) : null}
      </div>

      {/* SEFR MULTILEVEL */}
      <Link
        href="/oquvchi/writing/multilevel"
        className="group relative flex items-center gap-4 overflow-clip rounded-[26px] border border-[#5ab0ff]/35 p-4 transition hover:-translate-y-0.5 hover:border-[#5ab0ff]/80"
        style={{ background: "linear-gradient(120deg,#16325c 0%,#1a2240 45%,#0f1c2e 100%)" }}
      >
        <span aria-hidden className="absolute -right-8 -top-10 size-40 rounded-full bg-[#5ab0ff] opacity-25 blur-3xl" />
        <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl">🎓</span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <b className="text-[17px] text-white">SEFR Multilevel — Task 1</b>
            <span className="up-badge rounded-full bg-[#ff3d6e] px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
          </span>
          <span className="block text-xs text-[#bfe0ff]">
            Imtihon formatidagi {ML_MOCKS.length} ta mock · Task 1.1 + 1.2 · model javoblar · 20 savollik mashqlar
          </span>
          {mlDone ? <span className="mt-1 block text-[11px] font-bold text-[#7cc4ff]">✓ {mlDone} ta task yozilgan</span> : null}
        </span>
        <span className="relative grid size-10 place-items-center rounded-full bg-[#5ab0ff] text-sm font-black text-[#0d1512] transition group-hover:scale-110">▶</span>
      </Link>

      {/* UNIVERSAL FORMULA */}
      <div>
        <h2 className="mb-2.5 text-[17px] font-black text-white">🧪 Universal xat formulasi</h2>
        <ol className="grid gap-2 sm:grid-cols-5">
          {FORMULA.map((f, i) => (
            <li key={f.label} className="sp-rise relative rounded-2xl border border-white/[0.08] bg-[#121a17] p-3" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="grid size-7 place-items-center rounded-full bg-[#F5C76A] text-sm font-black text-[#1d1608]">{i + 1}</span>
              <b className="mt-1.5 block text-sm text-white">{f.label}</b>
              <span lang="en" className="mt-0.5 block text-[12px] leading-snug text-[#a3ada8]">
                {f.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 12 TUR */}
      <div>
        <h2 className="mb-2.5 text-[17px] font-black text-white">📚 12 ta xat turi — tanlang</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WRITING_TYPES.map((t, i) => {
            const cards = t.cards.map((c) => mine.get(`${t.id}-${c.n}`));
            const done = cards.filter((a) => a?.status === "checked").length;
            const best = Math.max(-1, ...cards.map((a) => a?.score ?? -1));
            return (
              <li key={t.id} className="sp-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <Link
                  href={`/oquvchi/writing/${t.id}`}
                  className="group relative flex h-full items-center gap-3 overflow-clip rounded-[22px] border border-white/[0.08] bg-[#121a17] p-3.5 transition hover:-translate-y-0.5 hover:border-white/25"
                >
                  <span aria-hidden className="absolute -left-8 -top-8 size-24 rounded-full opacity-25 blur-2xl transition group-hover:opacity-50" style={{ background: t.color }} />
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl text-[28px]" style={{ background: `${t.color}26`, boxShadow: `inset 0 0 0 1px ${t.color}55` }}>
                    {t.icon}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <b className="block truncate text-[15px] text-white">{t.title}</b>
                    <span className="block truncate text-xs text-[#a3ada8]">{t.purpose}</span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: `${t.color}22`, color: t.color }}>
                        {TONE_LABEL[t.tone]}
                      </span>
                      {cards.map((a, k) => (
                        <span key={k} title={`Cue card ${k + 1}`} className="size-2.5 rounded-full" style={{ background: a?.status === "checked" ? scoreColor(a.score) : a?.text ? "rgba(245,199,106,.35)" : "rgba(255,255,255,.12)" }} />
                      ))}
                      <span className="text-[11px] text-[#808a85]">{done}/3</span>
                    </span>
                  </span>
                  <span className="relative text-right">
                    {best >= 0 ? (
                      <b className="block text-lg tabular-nums" style={{ color: scoreColor(best) }}>
                        {best}
                        <span className="text-xs text-[#808a85]">/10</span>
                      </b>
                    ) : (
                      <span className="text-xl text-[#808a85] transition group-hover:translate-x-0.5">→</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* FARQLAR */}
      <div>
        <h2 className="mb-2.5 text-[17px] font-black text-white">⚖️ Eng muhim farqlar</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DIFFERENCES.map((d) => (
            <div key={d.a + d.b} className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5">
              <p className="flex items-center gap-2 text-sm font-black">
                <span className="rounded-full bg-[#5ab0ff]/20 px-2.5 py-0.5 text-[#7cc4ff]">{d.a}</span>
                <span className="text-[#808a85]">vs</span>
                <span className="rounded-full bg-[#ff7ab6]/20 px-2.5 py-0.5 text-[#ff9cc8]">{d.b}</span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#cfd6d2]">{d.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="rounded-[22px] border border-[#3ddc97]/25 bg-[#3ddc97]/[0.05] p-4">
        <h2 className="text-[17px] font-black text-white">✅ Topshirishdan oldin tekshiring</h2>
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {CHECKLIST.map((c) => (
            <li key={c} className="flex items-start gap-2 text-[13px] text-[#cfd6d2]">
              <span className="mt-0.5 text-[#3ddc97]">☐</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
