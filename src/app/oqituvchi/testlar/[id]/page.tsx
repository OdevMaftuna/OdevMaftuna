import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TestCover } from "@/components/test-cover";
import { Badge, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { formatSom, type TestContent, type TestKeyItem, withAudioUrls } from "@/lib/paid-tests";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Testni ko‘rish" };

function answerText(k: TestKeyItem | undefined, options?: string[]): string {
  if (k === undefined) return "—";
  if (typeof k === "boolean") return k ? "True" : "False";
  if (typeof k === "number") return `${"abcdef"[k]}) ${options?.[k] ?? ""}`;
  return k.join("  /  ");
}

/** O'qituvchi: pullik testni o'quvchi ko'radigan tartibda + javoblar kaliti bilan ko'rish. */
export default async function TeacherTestPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data: test }, { data: contentRow }, { count: sold }, { data: attempts }] = await Promise.all([
    supabase.from("paid_tests").select("id, code, kind, unit, title, subtitle, price, course").eq("id", id).maybeSingle(),
    supabase.from("paid_test_content").select("content").eq("test_id", id).maybeSingle(),
    supabase.from("test_purchases").select("id", { count: "exact", head: true }).eq("test_id", id).eq("status", "approved"),
    supabase.from("test_attempts").select("score").eq("test_id", id).not("submitted_at", "is", null),
  ]);
  if (!test || !contentRow) notFound();
  // Javoblar kaliti faqat serverda (service role) o'qiladi.
  const { data: keyRow } = await createAdminClient().from("paid_test_keys").select("answers, scripts").eq("test_id", id).maybeSingle();
  const key = (keyRow?.answers ?? []) as TestKeyItem[];
  const content = await withAudioUrls(contentRow.content as TestContent);
  const scripts = new Map(((keyRow?.scripts ?? []) as { section: number; text: string }[]).map((x) => [x.section, x.text]));
  const total = content.sections.reduce((n, s) => n + s.items.length, 0);
  const offsets = content.sections.map((_, i) => content.sections.slice(0, i).reduce((t, s) => t + s.items.length, 0));
  const scores = (attempts ?? []).map((a) => Number(a.score));
  const avg = scores.length ? Math.round(scores.reduce((t, s) => t + s, 0) / scores.length) : null;

  return (
    <article className="space-y-5">
      <Link href="/oqituvchi/testlar" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Pullik testlar
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <TestCover unit={test.unit} course={test.course} code={test.code} level={test.kind === "level"} title={test.title} subtitle={test.subtitle.split(" · ")[1]} size={13} className="w-28 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sun-400">
            {test.kind === "level" ? "Level test" : `Unit ${test.unit}`} · {test.code}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{test.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{test.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge tone="sun">{formatSom(test.price)}</Badge>
            <Badge tone="brand">{content.sections.length} bo‘lim · {total} savol</Badge>
            <Badge tone="green">{sold ?? 0} ta sotilgan</Badge>
            <Badge>{scores.length ? `${scores.length} ta topshirgan · o‘rtacha ${avg}` : "Hali topshirilmagan"}</Badge>
          </div>
        </div>
      </header>

      <p className={`${card} px-4 py-3 text-sm text-neutral-600`}>
        O‘quvchi aynan shu savollarni ko‘radi (javoblarsiz). Yashil rangda — <b>to‘g‘ri javob</b>; yozma javoblarda bir nechta to‘g‘ri variant bo‘lsa,
        ular “/” bilan ajratilgan. Ball = to‘g‘ri javoblar foizi (100 ballik).
      </p>

      {content.sections.map((s, si) => (
        <section key={si} className="space-y-3 rounded-2xl border border-neutral-200 bg-surface p-4">
          <h2 className="font-semibold">{s.title}</h2>
          {s.box ? (
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-sun-400/50 p-2.5">
              {s.box.map((w) => (
                <span key={w} lang="en" className="rounded-full bg-sun-50 px-2.5 py-0.5 text-sm text-sun-700">{w}</span>
              ))}
            </div>
          ) : null}
          {s.passage ? <p lang="en" className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-[15px] leading-7">{s.passage}</p> : null}
          {s.audioUrl ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
              <p className="text-sm font-semibold">🎧 Listen to the recording, then answer the questions.</p>
              <audio controls preload="none" src={s.audioUrl} className="mt-2 w-full" />
            </div>
          ) : null}
          {scripts.get(si) ? (
            <details className="rounded-xl bg-neutral-50 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-sun-700">📄 Audio matni (faqat sizga ko‘rinadi)</summary>
              <p lang="en" className="mt-2 whitespace-pre-wrap leading-7">{scripts.get(si)}</p>
            </details>
          ) : null}
          <ol className="space-y-3">
            {s.items.map((it, ii) => {
              const k = key[offsets[si] + ii];
              return (
                <li key={ii} className="text-sm">
                  {it.q ? (
                    <p lang="en" className="font-medium">
                      <span className="text-neutral-500">{ii + 1}.</span> {it.q}
                      {it.hint ? <span className="ml-1 text-xs text-neutral-500">({it.hint})</span> : null}
                    </p>
                  ) : null}
                  {it.t === "mc" ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {it.o.map((o, oi) => (
                        <span
                          key={oi}
                          className={`rounded-lg border px-2.5 py-1 ${oi === k ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-700" : "border-neutral-200 text-neutral-600"}`}
                        >
                          {"abcdef"[oi]}) {o}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-emerald-700">
                      <span className="text-neutral-500">Javob: </span>
                      <b lang="en">{answerText(k)}</b>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </article>
  );
}
