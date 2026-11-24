import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AttendanceGrid, BarChart, ColumnChart, DonutChart, LineChart, RankBars, StackedBars, VIZ } from "@/components/charts";
import { CountUp } from "@/components/motion";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { currentMonthKey, loadReport, monthRange, type StudentRow } from "@/lib/report";

export const metadata: Metadata = { title: "Hisobot" };

const nowMs = () => Date.now();
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v)}%`);

function Tile({ label, value, suffix, note }: { label: string; value: number | null; suffix?: string; note: string }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">
        {value === null ? "—" : <CountUp value={Math.round(value)} />}
        {value !== null && suffix ? <span className="text-lg font-normal text-neutral-500">{suffix}</span> : null}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">{note}</p>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <h2 className="font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">{children}</p>;
}

function PersonList({ rows, tone, render }: { rows: StudentRow[]; tone: "good" | "warning" | "critical"; render: (r: StudentRow) => string }) {
  const color = tone === "good" ? VIZ.good : tone === "warning" ? VIZ.warning : VIZ.critical;
  if (!rows.length) return <p className="text-sm text-neutral-500">Hech kim yo‘q.</p>;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-2.5 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: color }}>
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate">{r.name}</span>
          <span className="shrink-0 text-xs tabular-nums text-neutral-600">{render(r)}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ kurs?: string; oy?: string }> }) {
  await requireTeacher();
  const [{ kurs, oy }, courses] = await Promise.all([searchParams, loadCourses()]);
  const now = nowMs();
  const month = oy && /^\d{4}-\d{2}$/.test(oy) ? oy : currentMonthKey(now);
  const course = courses.find((c) => c.id === kurs) ?? courses[0];
  if (!course) return <Empty>Kurs topilmadi.</Empty>;
  const range = monthRange(month);
  const r = await loadReport(course.id, month, now);
  const q = (k: string, m: string) => `/oqituvchi/hisobot?kurs=${k}&oy=${m}`;

  const ranked = r.students.filter((s) => s.rating !== null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const top = ranked.slice(0, 3);
  const bottom = ranked.length > 3 ? [...ranked].reverse().slice(0, 3) : [];
  const missedList = r.students.filter((s) => s.missed > 0).sort((a, b) => b.missed - a.missed);
  const monthOver = now >= range.end;

  // Donut: barcha muddati o'tgan katakchalar holati.
  const cells = r.students.flatMap((s) => s.cells);
  const statusParts = [
    { key: "ontime", label: "O‘z vaqtida", value: cells.filter((c) => c.state === "ontime").length, color: VIZ.good },
    { key: "late", label: "Kech topshirilgan", value: cells.filter((c) => c.state === "late").length, color: VIZ.warning },
    { key: "missed", label: "Topshirilmagan", value: cells.filter((c) => c.state === "missed").length, color: VIZ.critical },
  ];
  // Ball taqsimoti: tartibli oraliqlar — bitta rang (ko'k), yuqori ball yorqinroq.
  const scored = cells.map((c) => c.pct).filter((p): p is number => p !== null);
  const histogram = [
    { key: "b0", label: "0–59", note: "taslim bo‘lmang", min: 0, max: 59.999, color: "#1C5CAB" },
    { key: "b60", label: "60–79", note: "yaxshi", min: 60, max: 79.999, color: "#2A78D6" },
    { key: "b80", label: "80–84", note: "zo‘r", min: 80, max: 84.999, color: "#3987E5" },
    { key: "b85", label: "85–99", note: "ajoyib", min: 85, max: 99.999, color: "#5598E7" },
    { key: "b100", label: "100", note: "mukammal", min: 100, max: 100, color: "#86B6EF" },
  ].map((b) => ({ ...b, value: scored.filter((p) => p >= b.min && p <= b.max).length }));
  const dueDays = r.assignments.filter((a) => a.isDue);

  return (
    <section className="space-y-5">
      <PageHeader
        title="Hisobot"
        description="O‘quvchilar qanday ketib borayotgani: ballar, topshirish, reyting va oy yakuni. Har bir nuqta, ustun va katakchaga sichqonchani olib borsangiz, tafsiloti chiqadi."
      />

      {/* Filtrlar: kurs va oy — bitta qatorda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1" aria-label="Kurslar">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={q(c.id, month)}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                c.id === course.id ? "border-brand-600 bg-brand-700 text-white" : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link href={q(course.id, range.prev)} className="grid size-9 place-items-center rounded-lg border border-neutral-200" aria-label="Oldingi oy">
            ‹
          </Link>
          <span className="min-w-32 text-center text-sm font-semibold">{range.label}</span>
          <Link href={q(course.id, range.next)} className="grid size-9 place-items-center rounded-lg border border-neutral-200" aria-label="Keyingi oy">
            ›
          </Link>
        </div>
      </div>

      {/* Asosiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="O‘quvchilar" value={r.totals.students} note={`${course.name} kursida`} />
        <Tile label="Topshirish darajasi" value={r.totals.completion} suffix="%" note={`${r.totals.dueAssignments} ta muddati o‘tgan vazifa`} />
        <Tile label="O‘rtacha ball" value={r.totals.avg} suffix="%" note="topshirilgan vazifalar bo‘yicha" />
        <Tile label="Mashq urinishlari" value={r.students.reduce((t, s) => t + s.practiceAttempts, 0)} note="lug‘at, grammatika, iboralar — shu oyda" />
      </div>

      {r.totals.students === 0 ? (
        <Empty>Bu kursda hali o‘quvchi yo‘q.</Empty>
      ) : r.assignments.length === 0 ? (
        <Empty>{range.label} oyida bu kursda uy vazifasi yo‘q.</Empty>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Vazifalar holati" hint="Muddati o‘tgan barcha vazifalar: o‘z vaqtida, kech yoki umuman topshirilmagan.">
              {statusParts.some((p) => p.value) ? (
                <DonutChart parts={statusParts} centerLabel="vazifa" label="Vazifalar holati" />
              ) : (
                <Empty>Muddati o‘tgan vazifa hali yo‘q.</Empty>
              )}
            </Panel>
            <Panel title="Ball taqsimoti" hint="Topshirilgan ishlar qaysi ball oralig‘iga tushgani (stikerlar bilan bir xil oraliqlar).">
              {histogram.some((b) => b.value) ? (
                <BarChart bars={histogram} label="Ball taqsimoti" />
              ) : (
                <Empty>Hali baholangan ish yo‘q.</Empty>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="O‘rtacha ball — kunlar bo‘yicha" hint="Har bir kungi dars uchun sinfning o‘rtacha natijasi.">
              {dueDays.some((a) => a.avg !== null) ? (
                <LineChart label="Kunlik o'rtacha ball" points={r.days.map((d) => ({ day: d.day, value: d.avg }))} />
              ) : (
                <Empty>Hali baholangan vazifa yo‘q — birinchi darsdan keyin chiziq paydo bo‘ladi.</Empty>
              )}
            </Panel>
            <Panel title="Topshirganlar ulushi — kunlar bo‘yicha" hint="Yashil: 80%+ · sariq: 50–79% · qizil: 50% dan kam o‘quvchi topshirgan.">
              {dueDays.length ? (
                <ColumnChart
                  label="Kunlik topshirish ulushi"
                  points={r.assignments.map((a, i) => ({ day: r.days[i].day, value: r.days[i].completion, note: `${a.submitted}/${r.totals.students}` }))}
                />
              ) : (
                <Empty>Muddati o‘tgan vazifa hali yo‘q.</Empty>
              )}
            </Panel>
          </div>

          <Panel
            title="Umumiy reyting"
            hint="Muddati o‘tgan har bir vazifa bo‘yicha o‘rtacha foiz; topshirilmagan vazifa 0 hisoblanadi."
          >
            {ranked.length ? (
              <RankBars
                rows={ranked.map((s) => ({
                  id: s.id,
                  name: s.name,
                  value: s.rating,
                  sub: `topshirdi ${s.submitted}/${s.due}, kech ${s.late}, o‘rtacha ${pct(s.avg)}`,
                }))}
              />
            ) : (
              <Empty>Reyting birinchi vazifa muddati tugagach hisoblanadi.</Empty>
            )}
          </Panel>

          <Panel
            title="Har bir o‘quvchi: o‘z vaqtida, kech, qoldirgan"
            hint="Tayoqcha uzunligi — o‘quvchiga tegishli vazifalar soni; ranglar — ular qanday topshirilgani."
          >
            {ranked.length ? (
              <>
                <StackedBars
                  rows={ranked.map((s) => ({
                    id: s.id,
                    name: s.name,
                    parts: [
                      { key: "ontime", label: "O‘z vaqtida", value: s.submitted - s.late, color: VIZ.good },
                      { key: "late", label: "Kech", value: s.late, color: VIZ.warning },
                      { key: "missed", label: "Qoldirgan", value: s.missed, color: VIZ.critical },
                    ],
                  }))}
                />
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
                  {[
                    ["O‘z vaqtida", VIZ.good],
                    ["Kech", VIZ.warning],
                    ["Qoldirgan", VIZ.critical],
                  ].map(([l, c]) => (
                    <li key={l} className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm" style={{ background: c }} />
                      {l}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty>Birinchi vazifa muddati tugagach ko‘rinadi.</Empty>
            )}
          </Panel>

          <Panel title={`Oy yakuni — ${range.label}`} hint={monthOver ? "Oy tugadi: yakuniy natijalar." : "Oy hali davom etyapti: hozirgi holat bo‘yicha."}>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Badge tone="green">Eng yaxshi</Badge>
                </h3>
                <PersonList rows={top} tone="good" render={(s) => pct(s.rating)} />
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Badge tone="amber">Eng sust</Badge>
                </h3>
                {bottom.length ? (
                  <PersonList rows={bottom} tone="warning" render={(s) => pct(s.rating)} />
                ) : (
                  <p className="text-sm text-neutral-500">O‘quvchilar kam — ro‘yxat 4 nafardan boshlab chiqadi.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Badge tone="red">Dars qilmaganlar</Badge>
                </h3>
                <PersonList rows={missedList} tone="critical" render={(s) => `${s.missed} ta qoldirgan`} />
              </div>
            </div>
          </Panel>

          <Panel title="Davomat jadvali" hint="Har bir katakcha — bitta kungi dars. Sichqonchani olib borsangiz, ball ham ko‘rinadi.">
            <AttendanceGrid students={r.students} days={r.days.map((d) => d.day)} />
          </Panel>



          <Panel title="Vazifalar bo‘yicha" hint="Har bir kungi dars: nechta o‘quvchi topshirdi va o‘rtacha ball.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-neutral-500">
                  <tr>
                    <th className="py-2 font-medium">Dars</th>
                    <th className="py-2 text-right font-medium">Topshirdi</th>
                    <th className="py-2 text-right font-medium">Kech</th>
                    <th className="py-2 text-right font-medium">O‘rtacha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 tabular-nums">
                  {r.assignments.map((a) => (
                    <tr key={a.id} className={a.isDue ? "" : "text-neutral-500"}>
                      <td className="max-w-80 truncate py-2">
                        <Link href={`/oqituvchi/kuzatuv/${a.id}`} className="hover:underline">
                          {a.title}
                        </Link>
                      </td>
                      <td className="py-2 text-right">
                        {a.submitted}/{r.totals.students}
                      </td>
                      <td className="py-2 text-right">{a.late}</td>
                      <td className="py-2 text-right font-semibold">{a.isDue || a.submitted ? pct(a.avg) : "hali ochilmagan"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {r.totals.students > 0 ? (
        <Panel
          title="O‘quvchilar ko‘rsatkichlari"
          hint="Har bir o‘quvchi: uy vazifasi, mashqlar (foiz va urinishlar) va pullik testlar — shu oyda. Ismni bossangiz, xatolari bilan batafsil sahifa ochiladi."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-neutral-500">
                <tr>
                  <th className="py-2 font-medium">O‘quvchi</th>
                  <th className="py-2 text-right font-medium">Reyting</th>
                  <th className="py-2 text-right font-medium">Vazifa bali</th>
                  <th className="py-2 text-right font-medium">Topshirdi</th>
                  <th className="py-2 text-right font-medium">Qoldirdi</th>
                  <th className="py-2 text-right font-medium">Mashq to‘plami</th>
                  <th className="py-2 text-right font-medium">Mashq %</th>
                  <th className="py-2 text-right font-medium">Urinishlar</th>
                  <th className="py-2 text-right font-medium">Testlar (100 dan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 tabular-nums">
                {(ranked.length ? [...ranked, ...r.students.filter((s) => s.rating === null)] : r.students).map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">
                      <Link href={`/oqituvchi/oquvchilar/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right font-semibold">{pct(s.rating)}</td>
                    <td className="py-2 text-right">{pct(s.avg)}</td>
                    <td className="py-2 text-right">{s.due ? `${s.submitted}/${s.due}` : "—"}</td>
                    <td className="py-2 text-right" style={{ color: s.missed ? VIZ.critical : undefined }}>
                      {s.missed}
                    </td>
                    <td className="py-2 text-right">{s.practiceChecks || "—"}</td>
                    <td className="py-2 text-right font-semibold">{pct(s.practiceAvg)}</td>
                    <td className="py-2 text-right">{s.practiceAttempts || "—"}</td>
                    <td className="py-2 text-right">
                      {s.testsDone ? (
                        <>
                          <b>{Math.round(s.testsAvg ?? 0)}</b> <span className="text-neutral-500">· {s.testsDone} ta</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Panel title="Mashqlar bo‘yicha" hint="Shu oyda ishlangan mashqlar: nechta o‘quvchi, jami urinishlar va o‘rtacha eng yaxshi natija. Bossangiz, har bir o‘quvchining natijasi chiqadi.">
        {r.topics.length ? (
          <ul className="space-y-2">
            {r.topics.map((t) => (
              <li key={t.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="text-xs font-semibold tabular-nums text-neutral-500">{t.code}</span>
                <span className="min-w-0">
                  <Link href={`/oqituvchi/mashqlar/${t.id}`} lang="en" className="block truncate hover:underline">
                    {t.title}
                  </Link>
                  <span className="relative mt-1 block h-2 overflow-hidden rounded-full" style={{ background: VIZ.grid }}>
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${t.avg ?? 0}%`, background: VIZ.series }} />
                  </span>
                </span>
                <span className="text-right text-xs tabular-nums text-neutral-600">
                  {t.students} o‘quvchi · {t.attempts} urinish · <b className="text-neutral-800">{pct(t.avg)}</b>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Shu oyda mashq ishlanmagan.</Empty>
        )}
      </Panel>
    </section>
  );
}
