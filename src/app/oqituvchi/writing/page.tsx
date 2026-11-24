import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackView, parseFeedback } from "@/components/feedback-view";
import { requireTeacher } from "@/lib/auth";
import { after } from "next/server";
import { retryFailedWriting } from "@/lib/writing/grade";
import { createClient } from "@/lib/supabase/server";
import { findCard } from "@/lib/writing/data";
import { findMlTask } from "@/lib/writing/multilevel";

/** card_id → ko‘rinish: oddiy letter cue card yoki SEFR Multilevel task. */
function describe(cardId: string): { icon: string; color: string; label: string; task: string | null; max: number } {
  const ml = findMlTask(cardId);
  if (ml) return { icon: "🎓", color: ml.mock.color, label: `SEFR Multilevel · Mock ${ml.mock.no} · ${ml.task.label} (${ml.task.kind})`, task: ml.task.prompt, max: 20 };
  const f = findCard(cardId);
  if (f) return { icon: f.type.icon, color: f.type.color, label: `${f.type.title} · Cue card ${f.card.n}`, task: f.card.task, max: 10 };
  return { icon: "✉️", color: "#888888", label: cardId, task: null, max: 10 };
}
import { scoreColor } from "@/lib/writing/load";

/** Fondagi AI navbati uchun vaqt. */
export const maxDuration = 60;
export const metadata: Metadata = { title: "Writing" };

type Row = { id: string; student_id: string; card_id: string; text: string; words: number; status: string; score: number | null; feedback: unknown; checked_count: number; updated_at: string };

/** O'qituvchi: o'quvchilar yozgan letter/email'lar — AI bahosi, izohi va matnning o'zi. */
export default async function TeacherWritingPage({ searchParams }: { searchParams: Promise<{ oquvchi?: string }> }) {
  await requireTeacher();
  // Tekshirilmay qolgan xatlar — sahifa ochilgandan keyin fonda qayta tekshiriladi.
  after(() => retryFailedWriting({ limit: 3 }));
  const { oquvchi } = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("writing_attempts")
    .select("id, student_id, card_id, text, words, status, score, feedback, checked_count, updated_at")
    .neq("status", "draft")
    .not("card_id", "like", "%-quiz")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (oquvchi) q = q.eq("student_id", oquvchi);
  const [{ data }, { data: people }] = await Promise.all([q, supabase.from("profiles").select("id, full_name").eq("role", "student")]);
  const rows = (data ?? []) as Row[];
  const name = new Map((people ?? []).map((p) => [p.id as string, (p.full_name as string) || "O‘quvchi"]));
  const checked = rows.filter((r) => r.score !== null);
  const avg = checked.length ? checked.reduce((t, r) => t + (Number(r.score) / describe(r.card_id).max) * 10, 0) / checked.length : null;
  const writers = new Set(rows.map((r) => r.student_id)).size;

  return (
    <section className="space-y-5">
      <div className="wr-hero relative overflow-clip rounded-[28px] p-5">
        <span aria-hidden className="wr-env absolute -right-2 top-2 text-[90px] opacity-20">
          ✉️
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">✍️ PRE-INTERMEDIATE WRITING</p>
        <h1 className="relative text-[26px] font-black tracking-tight text-white">O‘quvchilar xatlari</h1>
        <p className="relative text-sm text-[#a3ada8]">AI har bir xatni 10 ballik shkalada tekshiradi: vazifa, format va ohang, tuzilma, til. Matn va izohni ochib ko‘ring.</p>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["📨", "Xatlar", String(rows.length)],
            ["👥", "Yozganlar", String(writers)],
            ["🎯", "O‘rtacha", avg === null ? "—" : `${avg.toFixed(1)}/10`],
          ].map(([i, l, v]) => (
            <div key={l} className="rounded-2xl border border-white/10 bg-black/25 px-2 py-2.5">
              <p className="text-[11px] text-[#a3ada8]">
                {i} {l}
              </p>
              <b className="text-[18px] text-white">{v}</b>
            </div>
          ))}
        </div>
        {oquvchi ? (
          <Link href="/oqituvchi/writing" className="relative mt-3 inline-block text-sm font-bold text-[#F5C76A] hover:underline">
            ← Barcha o‘quvchilar
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-[#a3ada8]">Hali hech kim xat yozib tekshirtirmagan.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const info = describe(r.card_id);
            const fb = parseFeedback(r.feedback);
            const s = r.score === null ? null : Number(r.score);
            return (
              <li key={r.id}>
                <details className="group rounded-[20px] border border-white/[0.08] bg-[#121a17] open:border-white/20">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: `${info.color}26` }}>
                      {info.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/oqituvchi/writing?oquvchi=${r.student_id}`} className="block truncate font-bold text-white hover:text-[#F5C76A]">
                        {name.get(r.student_id) ?? "O‘quvchi"}
                      </Link>
                      <span className="block truncate text-xs text-[#a3ada8]">
                        {info.label} · {r.words} so‘z · {r.checked_count} marta tekshirildi
                      </span>
                    </span>
                    {s !== null ? (
                      <b className="shrink-0 text-xl tabular-nums" style={{ color: scoreColor((s / info.max) * 10) }}>
                        {s}
                        <span className="text-xs text-[#808a85]">/{info.max}</span>
                      </b>
                    ) : (
                      <span className="shrink-0 text-xs font-bold text-[#ffb347]">{r.status === "checking" ? "⏳ tekshirilmoqda" : "⏳ navbatda — AI band edi"}</span>
                    )}
                    <span className="text-[#808a85] transition group-open:rotate-90">›</span>
                  </summary>
                  <div className="grid gap-3 border-t border-white/[0.06] p-3.5 lg:grid-cols-2">
                    <div>
                      {info.task ? (
                        <p lang="en" className="mb-2 text-[13px] font-semibold text-[#cfd6d2]">
                          {info.task}
                        </p>
                      ) : null}
                      <div className="wr-paper rounded-2xl p-4">
                        <p lang="en" className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-[#2a2214]">
                          {r.text}
                        </p>
                      </div>
                    </div>
                    <div className="wr-feedback rounded-2xl bg-white/[0.03] p-4 text-sm">{fb ? <FeedbackView feedback={fb} /> : <p className="text-[#a3ada8]">AI izohi yo‘q.</p>}</div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
