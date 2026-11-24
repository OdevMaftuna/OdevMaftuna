import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { after } from "next/server";
import { retryFailedWriting } from "@/lib/writing/grade";
import { TONE_LABEL, WRITING_TYPES } from "@/lib/writing/data";
import { loadMyWriting, scoreColor, writingAccess } from "@/lib/writing/load";
import { PhraseChip, SampleLetter } from "../writing-parts";

/** Fondagi AI navbati uchun vaqt. */
export const maxDuration = 60;
export const metadata: Metadata = { title: "Writing" };

/** Bitta xat turi: qachon yoziladi, tuzilma, kalit iboralar, namuna va 3 ta cue card. */
export default async function WritingTypePage({ params }: { params: Promise<{ type: string }> }) {
  const me = await requireStudent();
  const { type: id } = await params;
  const t = WRITING_TYPES.find((x) => x.id === id);
  if (!t) notFound();
  after(() => retryFailedWriting({ studentId: me.id, limit: 2 }));
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  const idx = WRITING_TYPES.indexOf(t);
  const next = WRITING_TYPES[idx + 1];

  return (
    <section className="space-y-6 pb-4">
      <Link href="/oquvchi/writing" className="text-sm text-[#a3ada8] hover:text-white">
        ← Writing
      </Link>

      {/* SARLAVHA */}
      <div className="relative overflow-clip rounded-[28px] border p-5" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${t.color}33 0%, #121a17 50%, #0b110f 100%)`, borderColor: `${t.color}44` }}>
        <span aria-hidden className="wr-env absolute -right-2 -top-2 text-[96px] opacity-25">
          {t.icon}
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em]" style={{ color: t.color }}>
          {t.no}. {TONE_LABEL[t.tone].toUpperCase()} · {t.purpose.toUpperCase()}
        </p>
        <h1 className="relative mt-1 text-[28px] font-black leading-tight tracking-tight text-white">{t.title}</h1>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-[#cfd6d2]">
          <b className="text-white">Qachon yoziladi?</b> {t.when}
        </p>
      </div>

      {/* TUZILMA */}
      <div>
        <h2 className="mb-3 text-[17px] font-black text-white">🧱 Tuzilma (structure)</h2>
        <ol className="relative space-y-2 pl-1">
          <span aria-hidden className="absolute bottom-4 left-[19px] top-4 w-[3px] rounded-full" style={{ background: `linear-gradient(${t.color}, transparent)` }} />
          {t.structure.map((s, i) => (
            <li key={s.label} className="sp-rise relative flex items-start gap-3" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-black text-[#0d1512]" style={{ background: t.color }}>
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-[#121a17] px-3.5 py-2.5">
                <b className="block text-sm text-white">{s.label}</b>
                <span className="text-[13px] text-[#a3ada8]">{s.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* IBORALAR */}
      <div>
        <h2 className="text-[17px] font-black text-white">🔑 Kalit iboralar</h2>
        <p className="mb-3 text-xs text-[#808a85]">Bossangiz — nusxa olinadi. Yozayotganda ham pastdan qo‘shsa bo‘ladi.</p>
        <div className="space-y-3">
          {t.phrases.map((g) => (
            <div key={g.group}>
              {t.phrases.length > 1 ? <p className="mb-1.5 text-xs font-bold text-[#a3ada8]">{g.group}</p> : null}
              <div className="flex flex-wrap gap-1.5">
                {g.list.map((p) => (
                  <PhraseChip key={p} text={p} color={t.color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NAMUNA */}
      <div>
        <h2 className="mb-3 text-[17px] font-black text-white">✍️ Namuna</h2>
        <div className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#a3ada8]">SAMPLE QUESTION</p>
          <p lang="en" className="mt-1 text-[15px] font-semibold text-white">
            {t.sample.question}
          </p>
        </div>
        <div className="mt-3">
          <SampleLetter text={t.sample.answer} color={t.color} />
        </div>
      </div>

      {/* CUE CARDS */}
      <div>
        <h2 className="mb-3 text-[17px] font-black text-white">🎯 Endi o‘zingiz yozing — 3 ta cue card</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {t.cards.map((c) => {
            const a = mine.get(`${t.id}-${c.n}`);
            const checked = a?.status === "checked";
            return (
              <div key={c.n} className="flex flex-col rounded-[22px] border bg-[#121a17] p-4" style={{ borderColor: checked ? `${scoreColor(a?.score)}66` : "rgba(255,255,255,.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: `${t.color}22`, color: t.color }}>
                    CUE CARD {c.n}
                  </span>
                  {checked ? (
                    <b className="text-lg tabular-nums" style={{ color: scoreColor(a?.score) }}>
                      {a?.score}
                      <span className="text-xs text-[#808a85]">/10</span>
                    </b>
                  ) : a?.text ? (
                    <span className="text-[11px] font-bold text-[#F5C76A]">✏️ qoralama</span>
                  ) : null}
                </div>
                <p lang="en" className="mt-2.5 text-[14px] font-semibold leading-snug text-white">
                  {c.task}
                </p>
                <p className="mt-2 text-[11px] text-[#808a85]">You should include:</p>
                <ul lang="en" className="mt-1 flex-1 space-y-1 text-[13px] text-[#cfd6d2]">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <span style={{ color: t.color }}>•</span>
                      {p}
                    </li>
                  ))}
                </ul>
                {access.open ? (
                  <Link
                    href={`/oquvchi/writing/${t.id}/${c.n}`}
                    className="mt-3 rounded-2xl py-2.5 text-center text-sm font-black text-[#1d1608] transition hover:brightness-110"
                    style={{ background: `linear-gradient(135deg, #fff3c4, ${t.color})` }}
                  >
                    {checked ? "↻ Qayta yozish" : a?.text ? "Davom ettirish →" : "Yozishni boshlash →"}
                  </Link>
                ) : (
                  <span className="mt-3 rounded-2xl border border-white/10 py-2.5 text-center text-sm font-bold text-[#808a85]">🔒 Pre-Intermediate uchun</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {next ? (
        <Link href={`/oquvchi/writing/${next.id}`} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#121a17] px-4 py-3 transition hover:border-white/25">
          <span className="text-sm text-[#a3ada8]">Keyingi tur</span>
          <b className="text-white">
            {next.icon} {next.title} →
          </b>
        </Link>
      ) : null}
    </section>
  );
}
