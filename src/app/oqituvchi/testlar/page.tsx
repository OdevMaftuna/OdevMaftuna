import type { Metadata } from "next";
import Link from "next/link";
import { TestCover } from "@/components/test-cover";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { formatSom, loadPaymentSettings, RECEIPTS_BUCKET, TEST_COURSES } from "@/lib/paid-tests";
import { createClient } from "@/lib/supabase/server";
import { PaymentSettingsForm, PriceEditor, PurchaseButtons } from "./controls";

export const metadata: Metadata = { title: "Pullik testlar" };

type PurchaseRow = {
  id: string;
  amount: number;
  note: string;
  status: string;
  receipt_path: string;
  created_at: string;
  profiles: { full_name: string } | null;
  paid_tests: { title: string } | null;
};

/** O'qituvchi: to'lov cheklarini tasdiqlash, karta raqami, narxlar va natijalar. */
export default async function TeacherPaidTestsPage() {
  const me = await requireTeacher();
  const supabase = await createClient();
  const [{ data: pendingRaw }, { data: recentRaw }, { data: tests }, { data: attempts }, payment] = await Promise.all([
    supabase
      .from("test_purchases")
      .select("id, amount, note, status, receipt_path, created_at, profiles!test_purchases_student_id_fkey(full_name), paid_tests(title)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("test_purchases")
      .select("id, amount, note, status, receipt_path, created_at, profiles!test_purchases_student_id_fkey(full_name), paid_tests(title)")
      .neq("status", "pending")
      .order("decided_at", { ascending: false })
      .limit(30),
    supabase.from("paid_tests").select("id, code, title, subtitle, unit, price, kind, course").order("sort"),
    supabase
      .from("test_attempts")
      .select("score, submitted_at, profiles!test_attempts_student_id_fkey(full_name), paid_tests(title)")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(30),
    loadPaymentSettings(),
  ]);
  const pending = (pendingRaw ?? []) as unknown as PurchaseRow[];
  const recent = (recentRaw ?? []) as unknown as PurchaseRow[];
  const results = (attempts ?? []) as unknown as {
    score: number;
    submitted_at: string;
    profiles: { full_name: string } | null;
    paid_tests: { title: string } | null;
  }[];

  // Cheklar uchun 1 soatlik havolalar.
  const paths = pending.map((p) => p.receipt_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrls(paths, 3600)
    : { data: [] };
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const income = recent.filter((r) => r.status === "approved").reduce((t, r) => t + r.amount, 0);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Pullik testlar"
        description="Beginner: 14 ta unit testi va level test. Pre-Intermediate: 9 ta unit testi. O‘quvchi kartangizga to‘laydi va chek yuboradi — siz tasdiqlaganingizdan keyin test ochiladi."
      />

      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-semibold">Testlar <span className="text-sm font-normal text-neutral-500">· bosib savollar va javoblar kalitini ko‘ring</span></h2>
          <span className="text-sm text-neutral-500">{(tests ?? []).length} ta</span>
        </div>
        {TEST_COURSES.map((course) => (
        <div key={course} className="mb-5">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sun-400">{course}</h3>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-8">
          {(tests ?? []).filter((t) => t.course === course).map((t) => (
            <li key={t.id}>
              <Link href={`/oqituvchi/testlar/${t.id}`} className="group block">
                <TestCover
                  unit={t.unit}
                  level={t.kind === "level"}
                  course={t.course}
                  code={t.code}
                  title={t.title}
                  subtitle={t.subtitle.split(" · ")[1]}
                  size={11}
                  className="transition group-hover:-translate-y-1"
                />
                <p className="mt-1.5 truncate text-xs font-semibold">{t.title}</p>
                <p className="text-[11px] tabular-nums" style={{ color: "#F5C76A" }}>{formatSom(t.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
        </div>
        ))}
      </div>

      {me.isAdmin ? (<>
      <div className={`${card} p-4`}>
        <h2 className="flex items-center gap-2 font-semibold">
          To‘lov so‘rovlari
          {pending.length ? <span className="rounded-full bg-sun-50 px-2 py-0.5 text-xs tabular-nums text-sun-700">{pending.length}</span> : null}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Hozircha yangi to‘lov yo‘q.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {pending.map((p) => {
              const url = urlFor.get(p.receipt_path);
              return (
                <li key={p.id} className="flex flex-wrap items-start gap-4 py-4">
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="To‘lov cheki" className="h-36 w-28 rounded-lg border border-neutral-200 object-cover" />
                    </a>
                  ) : (
                    <div className="flex h-36 w-28 items-center justify-center rounded-lg border border-neutral-200 text-xs text-neutral-500">chek yo‘q</div>
                  )}
                  <div className="min-w-[14rem] flex-1 space-y-1">
                    <p className="font-medium">{p.profiles?.full_name || "—"}</p>
                    <p className="text-sm">
                      {p.paid_tests?.title ?? "—"} · <b>{formatSom(p.amount)}</b>
                    </p>
                    <p className="text-xs text-neutral-500">{formatDateTime(p.created_at)}</p>
                    {p.note ? <p className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-sm">“{p.note}”</p> : null}
                    <p className="text-xs text-neutral-500">Chekni bosib kattalashtiring. Kartangizga pul tushganini tekshirib, keyin tasdiqlang.</p>
                    <PurchaseButtons purchaseId={p.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${card} p-4`}>
          <h2 className="font-semibold">Karta ma’lumotlari</h2>
          <p className="mt-0.5 text-xs text-neutral-500">O‘quvchilar to‘lov sahifasida shu kartani ko‘radi.</p>
          <div className="mt-3">
            <PaymentSettingsForm card={payment.card} holder={payment.holder} />
          </div>
        </div>
        <div className={`${card} p-4`}>
          <h2 className="font-semibold">Narxlar</h2>
          <ul className="mt-3 divide-y divide-neutral-200">
            {(tests ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className={t.kind === "level" ? "font-semibold" : ""}>
                  {t.title} <span className="text-xs text-neutral-500">· {t.course}</span>
                </span>
                <PriceEditor testId={t.id} price={t.price} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      </>) : (
        <p className="rounded-2xl border border-dashed border-sun-400/40 p-4 text-sm text-neutral-600">
          To‘lovlarni tasdiqlash, karta va narxlar — asosiy o‘qituvchi (Maftuna Ismoilova) boshqaruvida. Siz testlar va o‘quvchilar natijalarini ko‘rasiz.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${card} p-4`}>
          <h2 className="font-semibold">Oxirgi natijalar</h2>
          {results.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Hali hech kim test topshirmagan.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-200 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">{r.profiles?.full_name || "—"}</span>
                    <span className="block text-xs text-neutral-500">{r.paid_tests?.title} · {formatDateTime(r.submitted_at)}</span>
                  </span>
                  <Badge tone={r.score >= 80 ? "green" : r.score >= 60 ? "amber" : "red"}>{Number(r.score)} / 100</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        {me.isAdmin ? <div className={`${card} p-4`}>
          <h2 className="font-semibold">
            Tasdiqlangan to‘lovlar <span className="text-sm font-normal text-neutral-500">· oxirgi 30 ta: {formatSom(income)}</span>
          </h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Hali yo‘q.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-200 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">{r.profiles?.full_name || "—"}</span>
                    <span className="block text-xs text-neutral-500">{r.paid_tests?.title} · {formatSom(r.amount)}</span>
                  </span>
                  <Badge tone={r.status === "approved" ? "green" : "red"}>{r.status === "approved" ? "Tasdiqlangan" : "Rad etilgan"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div> : null}
      </div>
    </section>
  );
}
