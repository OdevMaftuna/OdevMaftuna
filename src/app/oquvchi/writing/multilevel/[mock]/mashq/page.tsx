import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { findMock } from "@/lib/writing/multilevel";
import { loadMyWriting, writingAccess } from "@/lib/writing/load";
import { MlQuiz } from "../../ml-parts";

export const metadata: Metadata = { title: "Phrase practice" };

/** 20 savollik mashq: shu mockdagi iboralar, grammatika va uslubni amalda sinash. */
export default async function MlPracticePage({ params }: { params: Promise<{ mock: string }> }) {
  const me = await requireStudent();
  const { mock: id } = await params;
  const m = findMock(id);
  if (!m) notFound();
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  if (!access.open) redirect(`/oquvchi/writing/multilevel/${m.id}`);
  const best = mine.get(`${m.id}-quiz`)?.score ?? null;

  return (
    <section className="space-y-4 pb-4">
      <Link href={`/oquvchi/writing/multilevel/${m.id}`} className="text-sm text-[#a3ada8] hover:text-white">
        ← Mock {m.no} · {m.title}
      </Link>
      <div>
        <p className="text-[11px] font-extrabold tracking-[0.2em]" style={{ color: m.color }}>
          🎯 PHRASE PRACTICE · MOCK {m.no}
        </p>
        <h1 className="text-[24px] font-black tracking-tight text-white">20 ta savol — iboralarni amalda sinang</h1>
        <p className="text-sm text-[#a3ada8]">Har bir javobdan keyin izoh chiqadi. Oxirgi 4 ta savolda so‘zlarni bosib, gap tuzasiz.</p>
      </div>
      <MlQuiz mockId={m.id} questions={m.practice} color={m.color} backHref={`/oquvchi/writing/multilevel/${m.id}`} initialBest={best} />
    </section>
  );
}
