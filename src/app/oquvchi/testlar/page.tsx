import type { Metadata } from "next";
import Link from "next/link";
import { PromoCarousel } from "@/components/promo-carousel";
import { TestCover } from "@/components/test-cover";
import { Badge } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { testMotivation } from "@/lib/test-motivation";
import { formatSom, isTestCourse, loadMyTests, loadPromoOffers, TEST_COURSES, type MyTestState } from "@/lib/paid-tests";

export const metadata: Metadata = { title: "Exam tests" };

function Status({ s }: { s: MyTestState }) {
  if (s.attempt?.submitted_at) {
    const score = s.attempt.score ?? 0;
    return <Badge tone={score >= 80 ? "green" : score >= 60 ? "sun" : "red"}>✓ {score}/100</Badge>;
  }
  if (s.purchase?.status === "approved") return <Badge tone="green">Open</Badge>;
  if (s.purchase?.status === "pending") return <Badge tone="amber">Checking…</Badge>;
  return <span className="text-xs font-bold tabular-nums" style={{ color: "#F5C76A" }}>{formatSom(s.test.price)}</span>;
}

const locked = (s: MyTestState) => s.purchase?.status !== "approved";

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ kurs?: string }> }) {
  const profile = await requireStudent();
  const { kurs } = await searchParams;
  // Daraja: URL dagi ?kurs=, bo'lmasa o'quvchining o'z kursi, bo'lmasa Beginner.
  const course = isTestCourse(kurs) ? kurs : isTestCourse(profile.courseName) ? profile.courseName : "Beginner";
  const [mine, offers] = await Promise.all([loadMyTests(profile.id), loadPromoOffers("/oquvchi/testlar")]);
  const all = mine.filter((s) => s.test.course === course);
  const levels = all.filter((s) => s.test.kind === "level");
  const units = all.filter((s) => s.test.kind === "unit");
  const done = all.filter((s) => s.attempt?.submitted_at).length;
  const next = units.filter((s) => !s.attempt?.submitted_at).slice(0, 6);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Exam tests</h1>
        <p className="mt-0.5 text-sm text-neutral-600">Darsni o‘qish — yarim yo‘l. Haqiqiy bilim imtihonda ko‘rinadi.</p>
      </div>

      {/* Daraja tanlash */}
      <nav aria-label="Level" className="flex gap-2">
        {TEST_COURSES.map((c) => (
          <Link
            key={c}
            href={`/oquvchi/testlar?kurs=${encodeURIComponent(c)}`}
            aria-current={c === course ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              c === course ? "border-brand-500 bg-brand-600 text-white" : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300"
            }`}
          >
            {c}
          </Link>
        ))}
      </nav>

      {/* Hamma darajalarning pullik testlari; tanlangan daraja birinchi. */}
      <PromoCarousel offers={[...offers].sort((x, y) => Number(y.course === course) - Number(x.course === course))} testsHref={`/oquvchi/testlar?kurs=${encodeURIComponent(course)}`} />

      {/* Afzalliklar — kategoriya tugmalari kabi */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["📘 Kitobdagi imtihon formati", "⚡ Natija darhol", "✅ Har bir xato tushuntiriladi", "👩‍🏫 O‘qituvchi ham ko‘radi"].map((t) => (
          <li key={t} className="shrink-0 rounded-2xl border border-neutral-200 bg-surface px-3.5 py-2 text-sm font-medium">
            {t}
          </li>
        ))}
      </ul>

      {/* Keyingi testlar — gorizontal javon */}
      {next.length ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Siz uchun keyingi testlar</h2>
            <span className="text-sm text-neutral-500">{units.length - done < 0 ? 0 : units.filter((s) => !s.attempt?.submitted_at).length} ta ›</span>
          </div>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {next.map((s) => (
              <li key={s.test.id} className="w-28 shrink-0">
                <Link href={`/oquvchi/testlar/${s.test.id}`} className="group block">
                  <TestCover unit={s.test.unit} course={course} title={s.test.title} locked={locked(s)} size={12} className="transition group-hover:-translate-y-1" />
                  <p className="mt-2 truncate text-sm font-semibold">{s.test.title}</p>
                  <Status s={s} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Hamma unit testlari — muqovalar to'plami */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Barcha unit testlari</h2>
          <span className="text-sm text-neutral-500">Done: {done} / {all.length}</span>
        </div>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
          {units.map((s, i) => (
            <li key={s.test.id} className="stagger" style={{ "--i": i } as React.CSSProperties}>
              <Link href={`/oquvchi/testlar/${s.test.id}`} className="group block">
                <TestCover unit={s.test.unit} course={course} title={s.test.title} subtitle={s.test.subtitle.split(" · ")[1]} locked={locked(s)} size={12} className="transition group-hover:-translate-y-1" />
                <p className="mt-2 truncate text-sm font-semibold">{s.test.title}</p>
                {testMotivation(course, s.test.unit) ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-500">{testMotivation(course, s.test.unit)?.short}</p>
                ) : null}
                <Status s={s} />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Umumiy (level) testlar — premium */}
      {levels.map((level) => (
        <Link
          key={level.test.id}
          href={`/oquvchi/testlar/${level.test.id}`}
          className="group flex gap-4 rounded-3xl border-2 border-sun-400/50 bg-gradient-to-r from-sun-50 to-surface p-4 transition hover:-translate-y-0.5"
        >
          <TestCover unit={null} level course={course} code={level.test.code} title={level.test.title} locked={locked(level)} size={13} className="w-28 shrink-0 sm:w-32" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="w-fit rounded-full bg-sun-400 px-2.5 py-0.5 text-[11px] font-bold text-[#1d1608]">{level.test.code === "PC19" || course === "Beginner" ? "FINAL EXAM" : "CUMULATIVE TEST"}</span>
            <h2 className="mt-1.5 text-lg font-bold leading-tight">{level.test.title}</h2>
            <p className="mt-1 text-sm leading-snug text-neutral-600">
              {level.test.subtitle.split(" · ").slice(1).join(" · ") || `Butun ${course} bitta imtihonda`} — tayyorligingizni isbotlang 🎓
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <Status s={level} />
              <span className="text-sm font-semibold text-sun-700 transition group-hover:translate-x-0.5">
                {level.attempt?.submitted_at ? "Result →" : level.purchase?.status === "approved" ? "Start →" : "Get →"}
              </span>
            </div>
          </div>
        </Link>
      ))}

      <p className="rounded-2xl border border-dashed border-sun-400/40 p-4 text-center text-sm text-neutral-600">
        {course === "Pre-Intermediate" ? (
          <>
            Bitta test — bir tushlik narxida 🍽️. Tushlik bir soatda unutiladi, bilim esa umrbod qoladi —
            <b> xatolaringizni shu yerda toping, sinfda esa faqat g‘alaba qozoning!</b>
          </>
        ) : (
          <>
            Bitta test — bir chashka qahva narxida ☕. Sinfdagi imtihondan oldin xatolaringizni shu yerda topib oling —
            <b> o‘z bilimingizga eng arzon va eng foydali sarmoya.</b>
          </>
        )}
      </p>
    </section>
  );
}
