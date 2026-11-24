import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PracticeView } from "@/app/oquvchi/mashq/[id]/practice-view";
import { card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { loadTopic } from "@/lib/practice/data";
import { isGrammar, type PracticeKey } from "@/lib/practice/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mashq" };

export default async function TeacherTopicPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const topic = await loadTopic(id);
  if (!topic) notFound();

  const supabase = await createClient();
  const [{ data: keyRow }, { data: attempts }, { data: students }] = await Promise.all([
    supabase.from("practice_keys").select("key").eq("topic_id", id).maybeSingle(),
    supabase.from("practice_attempts").select("student_id, section, best_score, total, checked_count, checked_at").eq("topic_id", id),
    supabase.from("profiles").select("id, full_name").eq("role", "student"),
  ]);
  const key = keyRow?.key as PracticeKey | undefined;
  const names = new Map((students ?? []).map((s) => [s.id as string, s.full_name as string]));
  const grammar = isGrammar(topic.content);

  type Row = { name: string; tr?: string; test?: string; last?: string };
  const rows = new Map<string, Row>();
  for (const a of attempts ?? []) {
    const r = rows.get(a.student_id) ?? { name: names.get(a.student_id) || "—" };
    const v = a.checked_count ? `${a.best_score}/${a.total}` : "boshlangan";
    if (a.section === "translate") r.tr = v;
    else r.test = v;
    if (a.checked_at && (!r.last || a.checked_at > r.last)) r.last = a.checked_at;
    rows.set(a.student_id, r);
  }
  const list = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href={`/oqituvchi/mashqlar?kurs=${topic.course_id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Mashqlar
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">
          {topic.courses?.name} · Unit {topic.unit} · {topic.code}
        </p>
        <h1 lang="en" className="mt-1 text-xl font-semibold tracking-tight">{topic.title}</h1>
        <p className="text-sm text-neutral-600">{topic.title_uz}</p>
      </header>

      <section className={`${card} p-4`}>
        <h2 className="font-semibold">O‘quvchilar natijasi</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Hali hech kim ishlamagan.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr>
                <th className="py-1.5 font-medium">O‘quvchi</th>
                {grammar ? <th className="py-1.5 font-medium">Tarjima</th> : null}
                <th className="py-1.5 font-medium">{grammar ? "Test" : "Mashq"}</th>
                <th className="py-1.5 font-medium">Oxirgi marta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {list.map((r, i) => (
                <tr key={i}>
                  <td className="py-2">{r.name}</td>
                  {grammar ? <td className="py-2 tabular-nums">{r.tr ?? "—"}</td> : null}
                  <td className="py-2 tabular-nums">{r.test ?? "—"}</td>
                  <td className="py-2 text-xs text-neutral-500">{r.last ? formatDateTime(r.last) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {key ? (
        <details className={`${card} group p-4`}>
          <summary className="cursor-pointer list-none font-semibold text-brand-800">
            Javoblar kaliti <span className="ml-1 text-xs font-normal text-neutral-500 group-open:hidden">(ochish uchun bosing)</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-sun-400">{grammar ? "Test" : "Mashq"}</h3>
              <ol className="mt-2 space-y-1.5">
                {topic.content.test.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 shrink-0 text-neutral-500">{i + 1}.</span>
                    <span lang="en" className="min-w-0 flex-1 text-neutral-700">
                      {q.q}
                      {q.type === "fill" && q.hint ? <span className="text-neutral-500"> ({q.hint})</span> : null}
                    </span>
                    <b lang="en" className="shrink-0 text-emerald-700">{key.test[i]?.answer}</b>
                  </li>
                ))}
              </ol>
            </div>
            {isGrammar(topic.content) && key.translations ? (
              <div>
                <h3 className="font-semibold text-sun-400">Tarjima (100)</h3>
                <ol className="mt-2 space-y-1.5">
                  {topic.content.translations.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-6 shrink-0 text-neutral-500">{i + 1}.</span>
                      <span className="min-w-0 flex-1">
                        {t.uz}
                        <span lang="en" className="block font-medium text-emerald-700">{key.translations![i]?.en.join("  |  ")}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">O‘quvchi ko‘radigan sahifa</h2>
        <PracticeView topicId={topic.id} content={topic.content} attempts={{}} preview introLabel={topic.kind === "phrasal" ? "Learn" : "Rule"} />
      </div>
    </article>
  );
}
