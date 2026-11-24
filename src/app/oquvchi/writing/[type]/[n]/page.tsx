import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { parseFeedback } from "@/components/feedback-view";
import { TONE_LABEL, WORDS, findCard } from "@/lib/writing/data";
import { loadMyWriting, writingAccess } from "@/lib/writing/load";
import { WritingDesk } from "./writing-desk";

export const metadata: Metadata = { title: "Writing" };
/** AI tekshiruvi server action ichida ~10–40 soniya davom etishi mumkin. */
export const maxDuration = 60;

export default async function WritePage({ params }: { params: Promise<{ type: string; n: string }> }) {
  const me = await requireStudent();
  const { type, n } = await params;
  const found = findCard(`${type}-${n}`);
  if (!found) notFound();
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  if (!access.open) redirect(`/oquvchi/writing/${type}`);
  const a = mine.get(`${type}-${n}`);
  const { type: t, card } = found;
  const others = t.cards.filter((c) => c.n !== card.n);

  return (
    <section className="space-y-4 pb-4">
      <Link href={`/oquvchi/writing/${t.id}`} className="text-sm text-[#a3ada8] hover:text-white">
        ← {t.title}
      </Link>
      <WritingDesk
        cardId={`${t.id}-${card.n}`}
        type={{ id: t.id, title: t.title, icon: t.icon, color: t.color, tone: t.tone, structure: t.structure, phrases: t.phrases, sample: t.sample.answer }}
        task={{
          kicker: `${t.title.toUpperCase()} · CUE CARD ${card.n} · ${TONE_LABEL[t.tone].toUpperCase()}`,
          text: card.task,
          pointsTitle: "You should include: (bajarganingizni belgilang)",
          points: card.points,
          words: WORDS,
          maxScore: 10,
        }}
        initial={{
          text: a?.text ?? "",
          score: a?.status === "checked" ? a.score : null,
          feedback: a?.status === "checked" ? parseFeedback(a.feedback) : null,
          history: a?.history ?? [],
          failed: a?.status === "failed",
        }}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {others.map((c) => (
          <Link key={c.n} href={`/oquvchi/writing/${t.id}/${c.n}`} className="rounded-2xl border border-white/[0.08] bg-[#121a17] px-4 py-3 text-sm transition hover:border-white/25">
            <span className="text-[11px] font-black" style={{ color: t.color }}>
              CUE CARD {c.n}
            </span>
            <span lang="en" className="mt-0.5 line-clamp-2 block text-[#cfd6d2]">
              {c.task}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
