import type { Metadata } from "next";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { after } from "next/server";
import { retryFailedWriting } from "@/lib/writing/grade";
import { ML_CRITERIA, ML_MOCKS, mlLevel, mlTotal } from "@/lib/writing/multilevel";
import { loadMyWriting } from "@/lib/writing/load";

/** Fondagi AI navbati uchun vaqt. */
export const maxDuration = 60;
export const metadata: Metadata = { title: "SEFR Multilevel Writing" };

/** SEFR MULTILEVEL WRITING: format, baholash va mocklar ro'yxati (hozircha Task 1.1 + 1.2). */
export default async function MultilevelHub() {
  const me = await requireStudent();
  after(() => retryFailedWriting({ studentId: me.id, limit: 2 }));
  const mine = await loadMyWriting(me.id);

  return (
    <section className="space-y-6 pb-4">
      <Link href="/oquvchi/writing" className="text-sm text-[#a3ada8] hover:text-white">
        ← Writing
      </Link>

      <div className="relative overflow-clip rounded-[30px] border border-[#5ab0ff]/30 p-5 sm:p-6" style={{ background: "radial-gradient(120% 120% at 100% 0%, #16325c 0%, #121a17 50%, #0b110f 100%)" }}>
        <span aria-hidden className="sc-glow sc-glow-1" style={{ background: "#5ab0ff" }} />
        <span aria-hidden className="wr-env absolute -right-2 top-2 text-[90px] opacity-20">
          🎓
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em] text-[#7cc4ff]">SEFR · CEFR MULTILEVEL</p>
        <h1 className="relative text-[28px] font-black leading-tight tracking-tight text-white sm:text-[34px]">Writing — Task 1</h1>
        <p className="relative mt-1 max-w-xl text-sm text-[#cfd6d2]">
          Haqiqiy imtihon formatidagi mocklar: vaziyat + kelgan xat → <b className="text-white">Task 1.1</b> (do‘stga, 50–70 so‘z) va <b className="text-white">Task 1.2</b> (rasmiy, 120–150 so‘z). Har bir task uchun reja, rangli belgilangan model javob, iboralar va 20 savollik mashq.
        </p>
        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["📝", "Task 1.1", "Informal · 50–70"],
            ["🏛", "Task 1.2", "Formal · 120–150"],
            ["⏱", "Vaqt", "~25 daqiqa"],
            ["🤖", "Baho", "20 ball · AI"],
          ].map(([i, a, b]) => (
            <div key={a} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[11px] text-[#a3ada8]">
                {i} {a}
              </p>
              <b className="text-[14px] text-white">{b}</b>
            </div>
          ))}
        </div>
      </div>

      {/* QANDAY BAHOLANADI */}
      <div>
        <h2 className="mb-1 text-[17px] font-black text-white">⚖️ Qanday baholanadi?</h2>
        <p className="mb-3 text-xs text-[#808a85]">Har bir task 4 mezon bo‘yicha 0–5 ball, jami 20. AI imtihonchi kabi tekshiradi (natija taxminiy).</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ML_CRITERIA.map((c, i) => (
            <div key={c.key} className="sp-rise flex gap-3 rounded-2xl border border-white/[0.08] bg-[#121a17] p-3.5" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#5ab0ff]/20 text-sm font-black text-[#7cc4ff]">0–5</span>
              <span>
                <b className="block text-sm text-white">
                  {c.key} <span className="font-semibold text-[#a3ada8]">· {c.uz}</span>
                </b>
                <span className="text-[12px] leading-snug text-[#cfd6d2]">{c.text}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
          {[
            ["17–20", "≈ C1", "#b388ff"],
            ["13–16", "≈ B2", "#3ddc97"],
            ["9–12", "≈ B1", "#F5C76A"],
            ["0–8", "B1 dan past", "#ff8a8a"],
          ].map(([r, l, c]) => (
            <span key={r} className="rounded-full border px-3 py-1 font-bold" style={{ borderColor: `${c}66`, color: c }}>
              {r} → {l}
            </span>
          ))}
        </div>
        <ul className="mt-3 space-y-1 rounded-2xl border border-[#F5C76A]/25 bg-[#F5C76A]/[0.05] p-3.5 text-[13px] text-[#e9ecea]">
          <li>⚠️ So‘z limitidan ancha kam yozsangiz — “Vazifa” bahosi tushadi.</li>
          <li>⚠️ Task 1.1 — do‘stona uslub (Hi…, Speak soon), Task 1.2 — rasmiy (Dear Sir or Madam…, Yours faithfully). Aralashtirmang!</li>
          <li>✅ Savoldagi hamma narsaga javob bering va har biriga bitta detal/misol qo‘shing.</li>
        </ul>
      </div>

      {/* MOCKLAR */}
      <div>
        <h2 className="mb-3 text-[17px] font-black text-white">🗂 Mocklar</h2>
        <ul className="grid gap-3">
          {ML_MOCKS.map((m, i) => {
            const t11 = mine.get(`${m.id}-t11`);
            const t12 = mine.get(`${m.id}-t12`);
            const quiz = mine.get(`${m.id}-quiz`);
            const s11 = t11?.status === "checked" ? t11.score : null;
            const s12 = t12?.status === "checked" ? t12.score : null;
            const total = mlTotal({ t11: s11, t12: s12 });
            const lv = total ? mlLevel(total.of75) : null;
            return (
              <li key={m.id} className="sp-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <Link href={`/oquvchi/writing/multilevel/${m.id}`} className="group relative flex items-center gap-4 overflow-clip rounded-[24px] border border-white/[0.08] bg-[#121a17] p-4 transition hover:-translate-y-0.5 hover:border-white/25">
                  <span aria-hidden className="absolute -left-10 -top-10 size-32 rounded-full opacity-25 blur-2xl" style={{ background: m.color }} />
                  <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: `${m.color}26`, boxShadow: `inset 0 0 0 1px ${m.color}66` }}>
                    {m.icon}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold tracking-[0.16em]" style={{ color: m.color }}>
                      MOCK {m.no}
                    </span>
                    <b className="block truncate text-[17px] text-white">{m.title}</b>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[#cfd6d2]">1.1: {s11 !== null ? `${s11}/20` : "—"}</span>
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[#cfd6d2]">1.2: {s12 !== null ? `${s12}/20` : "—"}</span>
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[#cfd6d2]">🎯 mashq: {quiz?.score != null ? `${quiz.score}/20` : "—"}</span>
                    </span>
                  </span>
                  <span className="relative text-right">
                    {lv ? (
                      <>
                        <b className="block text-xl" style={{ color: lv.color }}>
                          {lv.level}
                        </b>
                        <span className="text-[10px] text-[#808a85]">{total?.pct}%</span>
                      </>
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
    </section>
  );
}
