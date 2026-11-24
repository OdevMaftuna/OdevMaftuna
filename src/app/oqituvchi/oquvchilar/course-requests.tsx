import { Badge, card } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { formatSom } from "@/lib/paid-tests";
import { DecideButtons, GrantFree, RemoveEnrollmentButton } from "./request-buttons";

type Req = {
  id: string;
  message: string;
  created_at: string;
  amount: number;
  receipt_path: string | null;
  profiles: { id: string; full_name: string; courses: { name: string } | null } | null;
  courses: { name: string } | null;
};

/** Kutilayotgan so'rovlar soni (bosh sahifa va menyu uchun). */
export async function countPendingRequests(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("course_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
}

/** O'qituvchi: boshqa kursga qatnashish so'rovlari va berilgan ruxsatlar. */
export async function CourseRequests({
  isAdmin,
  students,
  courses,
}: {
  isAdmin: boolean;
  /** O'qituvchi boshqara oladigan o'quvchilar (bepul ochish uchun). */
  students: { id: string; name: string; courseId: string | null }[];
  courses: { id: string; name: string }[];
}) {
  const supabase = await createClient();
  const [{ data: pendingRaw }, { data: enrollRaw }] = await Promise.all([
    supabase
      .from("course_requests")
      .select("id, message, created_at, amount, receipt_path, profiles!course_requests_student_id_fkey(id, full_name, courses!profiles_course_id_fkey(name)), courses(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("course_enrollments")
      .select("student_id, course_id, created_at, profiles(full_name), courses(name)")
      .order("created_at", { ascending: false }),
  ]);
  const pending = (pendingRaw ?? []) as unknown as Req[];
  const enrollments = (enrollRaw ?? []) as unknown as {
    student_id: string;
    course_id: string;
    created_at: string;
    profiles: { full_name: string } | null;
    courses: { name: string } | null;
  }[];
  const paths = pending.map((r) => r.receipt_path).filter((x): x is string => Boolean(x));
  const { data: signed } = paths.length ? await supabase.storage.from("receipts").createSignedUrls(paths, 3600) : { data: [] };
  const urlFor = new Map<string, string>((signed ?? []).flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl] as [string, string]] : [])));

  return (
    <section id="sorovlar" className="mb-6 scroll-mt-24 space-y-4">
      {pending.length ? (
        <div className={`${card} border-sun-400/50 p-4`}>
          <h2 className="flex items-center gap-2 font-semibold">
            Kurs so‘rovlari
            <span className="rounded-full bg-sun-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-sun-700">{pending.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            O‘quvchilar boshqa kursni pullik ochmoqchi. {isAdmin ? "Kartangizga pul tushganini tekshirib, tasdiqlang." : "To‘lovni asosiy o‘qituvchi tasdiqlaydi."}
          </p>
          <ul className="mt-4 divide-y divide-neutral-200">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                {r.receipt_path && urlFor.get(r.receipt_path) ? (
                  <a href={urlFor.get(r.receipt_path)} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlFor.get(r.receipt_path)} alt="To‘lov cheki" className="h-28 w-20 rounded-lg border border-neutral-200 object-cover" />
                  </a>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.profiles?.full_name || "—"}
                    <span className="text-neutral-500"> → </span>
                    <Badge tone="sun">{r.courses?.name ?? "—"}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Asosiy kursi: {r.profiles?.courses?.name ?? "yo‘q"} · {formatDateTime(r.created_at)}
                    {r.amount ? <b className="ml-1 text-sun-700">· {formatSom(r.amount)}</b> : null}
                  </p>
                  {r.message ? <p className="mt-1.5 max-w-prose rounded-lg bg-neutral-50 px-3 py-2 text-sm">“{r.message}”</p> : null}
                </div>
                {isAdmin ? <DecideButtons requestId={r.id} /> : <span className="text-xs text-neutral-500">Maftuna tasdiqlaydi</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${card} p-4`}>
        <h2 className="font-semibold">Boshqa kursni bepul ochish</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          O‘quvchi o‘zi boshqa kursni faqat 40 000 so‘mga ochadi. Siz esa bepul ochib bera olasiz (asosiy kursni almashtirish — ro‘yxatdagi kurs tanlovida).
        </p>
        <GrantFree students={students} courses={courses} />
      </div>

      {enrollments.length ? (
        <details className={`${card} group p-4`}>
          <summary className="cursor-pointer list-none font-semibold">
            Qo‘shimcha kurslarda qatnashayotganlar
            <span className="ml-2 text-xs font-normal text-neutral-500">{enrollments.length} ta · ochish uchun bosing</span>
          </summary>
          <ul className="mt-3 divide-y divide-neutral-200">
            {enrollments.map((e) => (
              <li key={`${e.student_id}:${e.course_id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  {e.profiles?.full_name || "—"} <span className="text-neutral-500">→</span> <Badge tone="green">{e.courses?.name ?? "—"}</Badge>
                  <span className="ml-2 text-xs text-neutral-500">{formatDateTime(e.created_at)} dan</span>
                </span>
                <RemoveEnrollmentButton studentId={e.student_id} courseId={e.course_id} label={e.courses?.name ?? ""} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
