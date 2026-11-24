import type { Metadata } from "next";
import Link from "next/link";
import { CountUp, TiltCard } from "@/components/motion";
import { countPendingRequests } from "./oquvchilar/course-requests";
import { Badge, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { LEVEL_INFO, loadTopics } from "@/lib/practice/data";
import { createClient } from "@/lib/supabase/server";
import { PromoCarousel } from "@/components/promo-carousel";
import { loadPromoOffers } from "@/lib/paid-tests";
import { StoryRail } from "@/components/stories";
import { UPDATES, formatUpdateDate } from "@/lib/updates";
import { loadStudentTrips } from "@/lib/teacher-streaks";
import { isSupportTeacher } from "@/lib/support";
import { loadDailyHomework } from "@/lib/daily-homework";
import { DailyPanel } from "@/components/daily-panel";
import { SupportDeskSection } from "@/components/support-desk-section";
import { InstallApp } from "@/components/install-app";

export const metadata: Metadata = { title: "Bosh sahifa" };

/** O'qituvchi bosh sahifasi: o'quvchilar ko'radigan 5 bo'lim — hammasi, oldindan. */
export default async function TeacherDashboard() {
  const profile = await requireTeacher();
  const supabase = await createClient();
  const [courses, topics, { data: assignments }, { data: students }, pendingRequests, { count: pendingPayments }, offers, trips] = await Promise.all([
    loadCourses(),
    loadTopics(),
    supabase.from("assignments").select("course_id"),
    supabase.from("profiles").select("course_id").eq("role", "student").eq("is_active", true),
    countPendingRequests(),
    supabase.from("test_purchases").select("id", { count: "exact", head: true }).eq("status", "pending"),
    loadPromoOffers("/oqituvchi/testlar"),
    loadStudentTrips().catch(() => []),
  ]);
  // Kunlik nazorat — asosiy va support o‘qituvchi uchun.
  const manager = profile.isAdmin || (await isSupportTeacher(profile.id));
  const allDaily = await loadDailyHomework().catch(() => []);
  // Mas'ul support: o'z stoli (pastda) + umumiy panelda faqat o'z guruhlari. Admin — hammasi.
  const mySupportGroups = allDaily.some((g) => g.supportId === profile.id);
  const daily = profile.isAdmin
    ? allDaily
    : mySupportGroups
      ? allDaily.filter((g) => g.supportId === profile.id || g.teacherId === profile.id)
      : manager
        ? allDaily
        : allDaily.filter((g) => g.teacherId === profile.id);
  const onRoad = trips.filter((t) => t.count > 0);
  const todayN = trips.filter((t) => t.today).length;
  const atRisk = trips.filter((t) => t.count > 0 && !t.today).length;
  const n = <T extends { course_id: string | null }>(rows: T[] | null, id: string) => (rows ?? []).filter((r) => r.course_id === id).length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Salom, {profile.fullName.split(" ")[0] || "ustoz"}!</h1>
        <p className="mt-1 text-sm text-neutral-600">
          O‘quvchilar ko‘radigan bo‘limlar. Hammasi sizga oldindan ochiq: uy vazifalari, lug‘at va mavzular.
        </p>
      </div>

      <InstallApp />

      {mySupportGroups ? <SupportDeskSection supportId={profile.id} name={profile.fullName} /> : null}

      {daily.length ? <DailyPanel groups={daily} /> : null}

      <StoryRail audience="teacher" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/oqituvchi/yangiliklar" className={`${card} block p-4 transition hover:border-brand-300`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">📰 Yangiliklar</p>
            <span className="text-sm font-semibold text-brand-700">Hammasi →</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {UPDATES.slice(0, 3).map((u) => (
              <li key={u.title} className="flex gap-2">
                <span>{u.icon}</span>
                <span className="min-w-0 flex-1 truncate">{u.title}</span>
                <span className="shrink-0 text-xs text-neutral-400">{formatUpdateDate(u.date)}</span>
              </li>
            ))}
          </ul>
        </Link>
        <Link href="/oqituvchi/seriyalar" className={`${card} block p-4 transition hover:border-brand-300`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">🗺 Seriyalar · Wanderland</p>
            <span className="text-sm font-semibold text-brand-700">Ko‘rish →</span>
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
            {[
              ["Yo‘lda", onRoad.length],
              ["Bugun ✓", todayN],
              ["Xavfda", atRisk],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-neutral-50 px-1 py-1.5">
                <dd className="text-base font-semibold tabular-nums">{value}</dd>
                <dt className="text-neutral-500">{label}</dt>
              </div>
            ))}
          </dl>
          {onRoad[0] ? <p className="mt-2 truncate text-xs text-neutral-500">🏆 Eng uzun: {onRoad[0].name} — {onRoad[0].count} kun, 📍 {onRoad[0].city}</p> : null}
        </Link>
      </div>

      <PromoCarousel offers={offers} testsHref="/oqituvchi/testlar" />

      {pendingRequests > 0 ? (
        <Link
          href="/oqituvchi/oquvchilar#sorovlar"
          className={`${card} flex items-center justify-between gap-3 border-sun-400/50 p-4 transition hover:border-sun-400`}
        >
          <span className="flex items-center gap-3">
            <span className="pulse-dot size-2.5 rounded-full bg-sun-400" />
            <span>
              <b className="tabular-nums">{pendingRequests}</b> ta o‘quvchi boshqa kursga qatnashishga ruxsat so‘ramoqda
            </span>
          </span>
          <span className="text-sm font-semibold text-sun-700">Ko‘rish →</span>
        </Link>
      ) : null}

      {pendingPayments ? (
        <Link
          href="/oqituvchi/testlar"
          className={`${card} flex items-center justify-between gap-3 border-emerald-500/40 p-4 transition hover:border-emerald-500`}
        >
          <span className="flex items-center gap-3">
            <span className="pulse-dot size-2.5 rounded-full bg-emerald-500" />
            <span>
              <b className="tabular-nums">{pendingPayments}</b> ta yangi to‘lov cheki — pullik testni ochish uchun tasdiqlang
            </span>
          </span>
          <span className="text-sm font-semibold text-emerald-700">Ko‘rish →</span>
        </Link>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {courses.map((c) => {
          const info = LEVEL_INFO[c.name];
          const g = topics.filter((t) => t.course_id === c.id && t.kind === "grammar").length;
          const v = topics.filter((t) => t.course_id === c.id && t.kind === "vocab").length;
          const a = n(assignments as { course_id: string }[] | null, c.id);
          const s = n(students as { course_id: string | null }[] | null, c.id);
          return (
            <li key={c.id} className="stagger" style={{ "--i": courses.indexOf(c) } as React.CSSProperties}>
              <TiltCard>
              <Link
                href={`/oqituvchi/kurs/${c.id}`}
                className={`${card} group flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-brand-300`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{c.name}</p>
                    {info ? <p className="text-xs text-neutral-500">{info.text}</p> : null}
                  </div>
                  {info ? <Badge tone="brand">{info.level}</Badge> : null}
                </div>
                <dl className="mt-auto grid grid-cols-4 gap-1 pt-2 text-center text-xs">
                  {[
                    ["O‘quvchi", s],
                    ["Vazifa", a],
                    ["Lug‘at", v],
                    ["Mavzu", g],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg bg-neutral-50 px-1 py-1.5">
                      <dd className="text-base font-semibold tabular-nums">
                        <CountUp value={Number(value)} />
                      </dd>
                      <dt className="text-neutral-500">{label}</dt>
                    </div>
                  ))}
                </dl>
              </Link>
              </TiltCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
