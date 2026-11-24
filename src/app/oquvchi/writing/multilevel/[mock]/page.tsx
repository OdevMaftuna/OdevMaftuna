import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { findMock, mlLevel, mlTotal } from "@/lib/writing/multilevel";
import { loadMyWriting, writingAccess } from "@/lib/writing/load";
import { TaskTabs } from "../ml-parts";

export const metadata: Metadata = { title: "Multilevel mock" };

/** Bitta mock: vaziyat va kelgan xat, Task 1.1/1.2 o'rganish materiallari, yozish va 20 savollik mashq. */
export default async function MockPage({ params }: { params: Promise<{ mock: string }> }) {
  const me = await requireStudent();
  const { mock: id } = await params;
  const m = findMock(id);
  if (!m) notFound();
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  const sc = (k: string) => {
    const a = mine.get(`${m.id}-${k}`);
    return a?.status === "checked" ? a.score : null;
  };
  const s11 = sc("t11");
  const s12 = sc("t12");
  const total = mlTotal({ t11: s11, t12: s12 });
  const lv = total ? mlLevel(total.of75) : null;
  const quiz = mine.get(`${m.id}-quiz`);

  return (
    <section className="space-y-5 pb-4">
      <Link href="/oquvchi/writing/multilevel" className="text-sm text-[#a3ada8] hover:text-white">
        ← SEFR Multilevel
      </Link>

      <div className="relative overflow-clip rounded-[28px] border p-5" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${m.color}33 0%, #121a17 50%, #0b110f 100%)`, borderColor: `${m.color}44` }}>
        <span aria-hidden className="wr-env absolute -right-2 -top-2 text-[90px] opacity-25">
          {m.icon}
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em]" style={{ color: m.color }}>
          SEFR MULTILEVEL · MOCK {m.no} · TASK 1
        </p>
        <h1 className="relative text-[28px] font-black leading-tight tracking-tight text-white">{m.title}</h1>
        <div className="relative mt-3 flex flex-wrap gap-2 text-xs font-bold">
          {[
            ["Task 1.1", s11 !== null ? `${s11}/20` : "yozilmagan"],
            ["Task 1.2", s12 !== null ? `${s12}/20` : "yozilmagan"],
            ["Mashq", quiz?.score != null ? `${quiz.score}/20` : "—"],
          ].map(([a, b]) => (
            <span key={a} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[#cfd6d2]">
              {a}: <b className="text-white">{b}</b>
            </span>
          ))}
          {lv ? (
            <span className="rounded-full px-3 py-1 text-[#0d1512]" style={{ background: lv.color }}>
              Task 1 natijasi: {total?.pct}% · ≈ {lv.level}
            </span>
          ) : null}
        </div>
      </div>

      {/* VAZIYAT VA XAT */}
      <div className="rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4">
        <p lang="en" className="text-[14px] font-semibold text-white">
          {m.context}
        </p>
        <div lang="en" className="mt-3 rounded-2xl border-l-4 bg-black/25 px-4 py-3 font-serif text-[15px] leading-relaxed text-[#e9ecea]" style={{ borderColor: m.color }}>
          <p>{m.letter.greeting}</p>
          <p className="mt-2">{m.letter.body}</p>
          <p className="mt-2 italic">{m.letter.from}</p>
        </div>
      </div>

      <TaskTabs tasks={m.tasks} color={m.color} writeBase={`/oquvchi/writing/multilevel/${m.id}`} open={access.open} />

      {/* MASHQ */}
      <Link href={`/oquvchi/writing/multilevel/${m.id}/mashq`} className="group relative flex items-center gap-4 overflow-clip rounded-[24px] border border-[#3ddc97]/30 bg-[#3ddc97]/[0.07] p-4 transition hover:border-[#3ddc97]/70">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#3ddc97]/20 text-3xl">🎯</span>
        <span className="min-w-0 flex-1">
          <b className="block text-[16px] text-white">Iboralarni amalda sinang — 20 savol</b>
          <span className="text-xs text-[#a3ada8]">To‘g‘ri iborani tanlash, xatoni topish, so‘zlardan gap tuzish. Natija darhol.</span>
        </span>
        <span className="text-right">
          {quiz?.score != null ? (
            <b className="block text-lg text-[#3ddc97]">
              {quiz.score}
              <span className="text-xs text-[#808a85]">/20</span>
            </b>
          ) : (
            <span className="text-xl text-[#3ddc97] transition group-hover:translate-x-0.5">→</span>
          )}
        </span>
      </Link>
      {!access.open ? <p className="text-center text-xs text-[#808a85]">🔒 Yozish va AI tekshiruvi — Pre-Intermediate kursi o‘quvchilari uchun.</p> : null}
    </section>
  );
}
