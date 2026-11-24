import Link from "next/link";
import { Badge, card } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { kindLabel, type Mistake, type PracticeInsight, type TestInsight } from "@/lib/student-insights";

const tone = (p: number | null) => (p === null ? undefined : p >= 80 ? "green" : p >= 60 ? "amber" : "red");

function Mistakes({ list, label }: { list: Mistake[]; label: string }) {
  if (!list.length) return <p className="text-xs text-green-600">✓ Oxirgi urinishda xato yo‘q</p>;
  return (
    <details className="group">
      <summary className="cursor-pointer select-none text-xs font-semibold text-red-500 hover:underline">
        ✗ {list.length} ta xato — {label}
      </summary>
      <ol className="mt-2 space-y-2">
        {list.map((m, i) => (
          <li key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm">
            <p lang="en" className="whitespace-pre-line text-neutral-800">{m.q}</p>
            <p className="mt-1">
              <span className="text-red-500">Javobi: {m.given}</span>
              <span className="mx-1.5 text-neutral-400">→</span>
              <span className="font-semibold text-green-600">To‘g‘ri: {m.correct}</span>
            </p>
            {m.explain ? <p className="mt-1 whitespace-pre-line text-xs text-neutral-500">{m.explain}</p> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function PracticeInsights({ rows }: { rows: PracticeInsight[] }) {
  const avgBest = rows.length ? Math.round(rows.reduce((t, r) => t + (r.best ?? 0), 0) / rows.length) : null;
  const attempts = rows.reduce((t, r) => t + r.attempts, 0);
  return (
    <section className={`${card} p-4`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold">Mashqlar (lug‘at, grammatika, iboralar)</h2>
          <p className="text-xs text-neutral-500">Har bir to‘plam: eng yaxshi va oxirgi natija, necha marta tekshirgani va oxirgi urinishdagi xatolari.</p>
        </div>
        {rows.length ? (
          <p className="text-sm text-neutral-600">
            {rows.length} ta to‘plam · {attempts} ta urinish · o‘rtacha eng yaxshi <b>{avgBest}%</b>
          </p>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Hali mashq ishlamagan.</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200">
          {rows.map((r) => (
            <li key={`${r.topicId}:${r.section}`} className="space-y-1.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">
                    {r.course} · {kindLabel(r.kind)} · {r.code}
                    {r.section === "translate" ? " · Tarjima" : ""}
                  </p>
                  <Link href={`/oqituvchi/mashqlar/${r.topicId}`} lang="en" className="font-medium hover:underline">
                    {r.title}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                  <Badge tone={tone(r.best)}>Eng yaxshi: {r.best ?? "—"}%</Badge>
                  <Badge>Oxirgi: {r.last ?? "—"}%</Badge>
                  <Badge tone="brand">{r.attempts} marta</Badge>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                {r.total} ta savol{r.checkedAt ? ` · oxirgi marta ${formatDateTime(r.checkedAt)}` : ""}
              </p>
              {r.history.length > 1 ? (
                <p className="text-xs text-neutral-500">
                  Urinishlar: {r.history.map((h, i) => (
                    <span key={i}>
                      {i ? " → " : ""}
                      <b className="tabular-nums text-neutral-700">{h}%</b>
                    </span>
                  ))}
                </p>
              ) : null}
              <Mistakes list={r.mistakes} label="ko‘rish" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TestInsights({ rows }: { rows: TestInsight[] }) {
  return (
    <section className={`${card} p-4`}>
      <h2 className="font-semibold">Pullik imtihon testlari</h2>
      <p className="text-xs text-neutral-500">Har bir test: 100 dan ball, to‘g‘ri javoblar soni va xatolari.</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Hali test topshirmagan.</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200">
          {rows.map((r) => (
            <li key={r.testId} className="space-y-1.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-neutral-500">{r.course} · {formatDateTime(r.submittedAt)}</p>
                  <Link href={`/oqituvchi/testlar/${r.testId}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <Badge tone={tone(r.score)}>{r.score} / 100</Badge>
                  <span className="text-xs text-neutral-500">{r.correct}/{r.total} to‘g‘ri</span>
                </div>
              </div>
              <Mistakes list={r.mistakes} label="ko‘rish" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
