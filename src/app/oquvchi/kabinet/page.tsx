import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { requireStudent } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { loadMyCourseAccess } from "@/lib/course-access";
import { loadMyTests } from "@/lib/paid-tests";
import { LEVEL_INFO } from "@/lib/practice/data";
import { loadStreak } from "@/lib/streak";
import { loadStudentAssignments } from "@/lib/student-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import { unreadForStudent } from "@/lib/chat";
import { loadStudentStats } from "@/lib/student-stats";
import { StatsCard } from "@/components/stats-card";
import { AvatarUpload, CopyId, EditName, ExpandRow, PasswordPanel, RowIcon } from "./profile-parts";
import { ReminderSettings } from "./reminder-settings";

export const metadata: Metadata = { title: "My profile" };

function MenuLink({ href, icon, label, tone = "dark", badge }: { href: string; icon: ReactNode; label: string; tone?: "gold" | "dark"; badge?: string }) {
  return (
    <Link href={href} className="cab-row group flex items-center gap-4 p-3.5">
      <RowIcon tone={tone}>{icon}</RowIcon>
      <span className="flex-1 text-[17px] font-bold">{label}</span>
      {badge ? <span className="rounded-full bg-[#3a2c12] px-2.5 py-0.5 text-xs font-bold text-[#F5C76A]">{badge}</span> : null}
      <span aria-hidden className="text-xl text-neutral-500 transition group-hover:translate-x-0.5">›</span>
    </Link>
  );
}

/** O'quvchi kabineti: profil, joriy kurs, yutuqlar va menyu. */
export default async function CabinetPage() {
  const profile = await requireStudent();
  const supabase = await createClient();
  const [courses, access, { items, now }, tests, { data: me }, { data: practice }] = await Promise.all([
    loadCourses(),
    loadMyCourseAccess(profile.id),
    loadStudentAssignments(),
    loadMyTests(profile.id),
    supabase.from("profiles").select("age, teacher_id, created_at, friend_code, avatar_path").eq("id", profile.id).maybeSingle(),
    supabase.from("practice_attempts").select("best_score").eq("student_id", profile.id),
  ]);
  const [streak, chatUnread, stats] = await Promise.all([
    loadStreak(profile.id, now),
    unreadForStudent(profile.id).catch(() => 0),
    loadStudentStats(profile.id, items, now).catch(() => null),
  ]);
  const teacher = me?.teacher_id
    ? (await createAdminClient().from("profiles").select("full_name").eq("id", me.teacher_id).maybeSingle()).data?.full_name
    : null;

  const course = courses.find((c) => c.id === access.primary);
  const level = course ? (LEVEL_INFO[course.name]?.level ?? null) : null;
  const mine = items.filter((a) => a.course_id === access.primary);
  const done = mine.filter((a) => a.submission).length;
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
  const xp = (practice ?? []).reduce((t, r) => t + (Number(r.best_score) || 0), 0) + items.filter((a) => a.submission).length * 20;
  const myTests = tests.filter((t) => t.purchase?.status === "approved").length;
  const extra = courses.filter((c) => access.extra.includes(c.id));
  const others = courses.filter((c) => c.id !== access.primary && !access.extra.includes(c.id) && !c.is_hidden);
  const initial = (profile.fullName.trim()[0] ?? "S").toUpperCase();
  const shortId = (me?.friend_code as string | undefined) ?? profile.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const since = me?.created_at
    ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Tashkent" }).format(new Date(me.created_at))
    : null;

  return (
    <section className="space-y-5 pb-4">
      {/* 1. Profil */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <AvatarUpload userId={profile.id} url={avatarUrl(me?.avatar_path as string | null)} initial={initial} />
          {level ? (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-4 border-[#0d1512] px-2.5 py-0.5 text-xs font-black text-[#1d1608]" style={{ backgroundColor: "#F5C76A" }}>
              {level}
            </span>
          ) : null}
        </div>
        <h1 className="mt-5 max-w-full text-2xl font-bold tracking-tight">
          <EditName name={profile.fullName} age={me?.age ?? null} />
        </h1>
        <p className="mt-1 break-all text-sm text-neutral-400">{profile.email}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {[me?.age ? `${me.age} years old` : null, teacher ? `Teacher: ${teacher}` : null, since ? `with NSP since ${since}` : null].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3">
          <CopyId id={shortId} />
        </div>
      </div>

      {/* 2. Joriy kurs kartasi */}
      <div className="cab-card rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-neutral-400">Your current course</p>
            <p className="mt-1 text-2xl font-black uppercase leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl" style={{ color: "#F5C76A" }}>
              {course?.name ?? "No course"}
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-[#3a2c12] px-3 py-1.5 text-sm font-bold text-[#F5C76A]">
            {mine.length ? `${done}/${mine.length} lessons` : level ? `Level ${level}` : "—"}
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
          <div className="cab-bar h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
        </div>
        <p className="mt-1.5 text-right text-xs text-neutral-500">{pct}% done</p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3.5">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-[#3a2c12] text-xl">⭐</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-neutral-400">Your XP</p>
            <p className="text-2xl font-black tabular-nums">
              {xp.toLocaleString("en-US")}
              <span className="ml-2 text-sm font-semibold text-orange-300">🔥 {streak.count} day{streak.count === 1 ? "" : "s"}</span>
            </p>
          </div>
          <Link
            href="/oquvchi/testlar"
            className="shrink-0 rounded-2xl px-4 py-3 text-sm font-extrabold text-[#1d1608] shadow-[0_10px_24px_-10px_rgb(241_169_59/0.8)] transition hover:brightness-110 [background:linear-gradient(135deg,#f5c76a,#f1a93b)]"
          >
            Exam tests
          </Link>
        </div>
      </div>

      {/* 3. Statistika: haftalik / oylik / umumiy natijalar */}
      {stats ? <StatsCard stats={stats} /> : null}

      {/* 4. Menyu */}
      <nav aria-label="Profile menu" className="space-y-3">
        {course ? <MenuLink href={`/oquvchi/kurs/${course.id}`} tone="gold" icon="📚" label="My course" badge={course.name} /> : null}
        <MenuLink href="/oquvchi/vazifalar" tone="gold" icon="📋" label="Homework" badge={mine.length - done > 0 ? `${mine.length - done} left` : undefined} />
        <MenuLink href="/oquvchi/chat" tone="gold" icon="💬" label="Chat with teachers" badge={chatUnread ? `${chatUnread} new` : undefined} />
        <MenuLink href="/oquvchi/testlar" icon="🏆" label="My exam tests" badge={myTests ? `${myTests} open` : undefined} />
        <MenuLink href="/oquvchi/tarix" icon="📈" label="Results history" />
        {extra.map((c) => (
          <MenuLink key={c.id} href={`/oquvchi/kurs/${c.id}`} icon="➕" label={c.name} badge="Extra" />
        ))}
        {others.length ? (
          <ExpandRow icon="🔓" label="Other courses">
            <p className="mb-3 text-sm text-neutral-400">Look inside any course. To study it too, unlock it — or ask your teacher.</p>
            <div className="grid grid-cols-2 gap-2">
              {others.map((c) => (
                <Link key={c.id} href={`/oquvchi/kurs/${c.id}`} className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold transition hover:border-[#f1a93b]/60">
                  {c.name} <span className="text-neutral-500">· 🔒</span>
                </Link>
              ))}
            </div>
          </ExpandRow>
        ) : null}
        <div id="eslatmalar">
          <ExpandRow icon="⏰" label="Reminders">
            <ReminderSettings age={profile.age} />
          </ExpandRow>
        </div>
        <ExpandRow icon="🔑" label="Change password">
          <PasswordPanel />
        </ExpandRow>
        <ExpandRow icon="❓" label="Help">
          <ul className="space-y-3 text-sm text-neutral-300">
            <li>
              <b className="block text-white">How do I change my course?</b>
              Only your teacher can move you to another course. Ask them in class.
            </li>
            <li>
              <b className="block text-white">How is my score counted?</b>
              Tests are checked at once. Writing and speaking are checked by AI — every answer gets ✓ or ✗ with an explanation.
            </li>
            <li>
              <b className="block text-white">I paid for a test, but it is still locked.</b>
              Your teacher checks the receipt first. It usually takes a few hours.
            </li>
            <li>
              <b className="block text-white">I forgot my password.</b>
              Ask your teacher — they can give you a new one.
            </li>
          </ul>
        </ExpandRow>
        <form action={signOut}>
          <button type="submit" className="cab-row flex w-full items-center gap-4 p-3.5 text-left">
            <RowIcon tone="red">🚪</RowIcon>
            <span className="flex-1 text-[17px] font-bold text-red-400">Log out</span>
          </button>
        </form>
      </nav>
    </section>
  );
}
