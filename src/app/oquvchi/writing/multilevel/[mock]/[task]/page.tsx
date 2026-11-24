import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { parseFeedback } from "@/components/feedback-view";
import { requireStudent } from "@/lib/auth";
import { findMlTask, plainModel } from "@/lib/writing/multilevel";
import { loadMyWriting, writingAccess } from "@/lib/writing/load";
import { WritingDesk } from "../../../[type]/[n]/writing-desk";

export const metadata: Metadata = { title: "Multilevel writing" };
/** AI tekshiruvi ~10–40 soniya. */
export const maxDuration = 60;

const ML_CHECKLIST = [
  "Savoldagi hamma narsaga javob berdimmi?",
  "Uslub to‘g‘rimi? (1.1 — do‘stona, 1.2 — rasmiy)",
  "Salomlashish va xayrlashuv uslubga mosmi?",
  "Xat maqsadi birinchi xatboshida aniqmi?",
  "Har bir g‘oyaga sabab yoki misol qo‘shdimmi?",
  "Linking so‘zlar ishlatdimmi? (Firstly, However, In addition…)",
  "Kamida 2 ta murakkab grammatika (conditional, perfect, relative clause)?",
  "So‘z limitiga rioya qildimmi?",
];

export default async function MlWritePage({ params }: { params: Promise<{ mock: string; task: string }> }) {
  const me = await requireStudent();
  const { mock, task: key } = await params;
  const found = findMlTask(`${mock}-${key}`);
  if (!found) notFound();
  const [mine, access] = await Promise.all([loadMyWriting(me.id), writingAccess(me.id)]);
  if (!access.open) redirect(`/oquvchi/writing/multilevel/${mock}`);
  const { mock: m, task } = found;
  const cardId = `${m.id}-${task.key}`;
  const a = mine.get(cardId);
  const other = m.tasks.find((t) => t.key !== task.key)!;
  const informal = task.register === "informal";

  return (
    <section className="space-y-4 pb-4">
      <Link href={`/oquvchi/writing/multilevel/${m.id}`} className="text-sm text-[#a3ada8] hover:text-white">
        ← Mock {m.no} · {m.title}
      </Link>
      <WritingDesk
        cardId={cardId}
        type={{
          id: informal ? "reply" : "formal",
          title: `${task.label} — ${task.kind}`,
          icon: informal ? "💬" : "🏛",
          color: m.color,
          tone: informal ? "informal" : "formal",
          structure: task.plan.map((p, i) => ({ label: `${i + 1}-band`, hint: p.replace(/^\d-band\s*/, "") })),
          phrases: [{ group: "Useful phrases", list: task.phrases.map((p) => p.en) }],
          sample: plainModel(task),
        }}
        task={{
          kicker: `SEFR MULTILEVEL · MOCK ${m.no} · ${task.label.toUpperCase()} · ${task.kind.toUpperCase()}`,
          context: { intro: m.context, letter: `${m.letter.greeting}\n${m.letter.body}\n${m.letter.from}` },
          text: task.prompt,
          pointsTitle: "Reja — bajarganingizni belgilang:",
          points: task.plan,
          words: { min: task.words[0], ideal: Math.round((task.words[0] + task.words[1]) / 2), max: task.words[1] },
          maxScore: 20,
          multilevel: true,
          checklist: ML_CHECKLIST,
          placeholder: informal ? "Hi …,\n\nHave you seen …?" : "Dear Sir or Madam,\n\nI am writing in response to …",
        }}
        initial={{
          text: a?.text ?? "",
          score: a?.status === "checked" ? a.score : null,
          feedback: a?.status === "checked" ? parseFeedback(a.feedback) : null,
          history: a?.history ?? [],
          failed: a?.status === "failed",
        }}
      />
      <Link href={`/oquvchi/writing/multilevel/${m.id}/${other.key}`} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#121a17] px-4 py-3 transition hover:border-white/25">
        <span className="text-sm text-[#a3ada8]">Keyingi task</span>
        <b className="text-white">
          {other.label} · {other.kind} →
        </b>
      </Link>
    </section>
  );
}
