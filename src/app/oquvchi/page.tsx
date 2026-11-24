import type { Metadata } from "next";
import Link from "next/link";
import { TiltCard } from "@/components/motion";
import { loadStreak } from "@/lib/streak";
import { Badge, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { loadMyCourseAccess } from "@/lib/course-access";
import { LEVEL_INFO, loadTopics } from "@/lib/practice/data";
import { loadStudentAssignments } from "@/lib/student-data";
import { StoryRail, UpdatesBanner } from "@/components/stories";
import { Wanderland } from "@/components/wanderland";
import { loadTripWeather } from "@/lib/weather";
import { loadCrew } from "@/lib/crew";
import { avatarUrl } from "@/lib/avatar";
import { excusedAssignmentIds, unreadForStudent } from "@/lib/chat";
import { MissedWork } from "@/components/missed-work";
import { MyGroupCard } from "@/components/my-group-card";
import { InstallApp } from "@/components/install-app";
import { loadMyGroups } from "@/lib/groups";
import { loadGroupLeagues } from "@/lib/group-league";
import { GroupRace } from "@/components/group-race";
import { freshSeed } from "@/lib/stickers";
import { PromoCarousel } from "@/components/promo-carousel";
import { MissionCompact } from "@/components/mission-card";
import { loadTodayMission } from "@/lib/mission";
import { loadPromoOffers } from "@/lib/paid-tests";
import { createClient } from "@/lib/supabase/server";
import { dayTheme, greeting, quoteOfDay, todayKey, wordOfDay } from "@/lib/daily";
import { DailyCard, HomeTiles, HomeTopBar, QuickCards, SectionTitle, type Tile } from "@/components/home-blocks";

export const metadata: Metadata = { title: "Home" };

/** O'quvchining bosh sahifasi: bugungi vazifalar va 5 ta bo'lim. */
export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const profile = await requireStudent();
  const [courses, access, topics, { items, now }] = await Promise.all([
    loadCourses(),
    loadMyCourseAccess(profile.id),
    loadTopics(),
    loadStudentAssignments(),
  ]);
  const todo = items.filter((a) => a.state !== "closed" && !a.submission).length;
  const supabase = await createClient();
  const [streak, offers, mission, { data: practice }, { data: vocabRows }] = await Promise.all([
    loadStreak(profile.id, now),
    loadPromoOffers("/oquvchi/testlar"),
    loadTodayMission(profile.id, access.primary, items, now),
    supabase.from("practice_attempts").select("best_score").eq("student_id", profile.id),
    access.primary
      ? supabase.from("practice_topics").select("words:content->words").eq("course_id", access.primary).eq("kind", "vocab")
      : Promise.resolve({ data: [] as { words: unknown }[] }),
  ]);

  // "Your Wanderland": mashina turgan shaharning haqiqiy ob-havosi (30 daqiqa kesh).
  const [tripWeather, crew, { data: meRow }] = await Promise.all([
    loadTripWeather(streak.count),
    loadCrew(profile.id, profile.fullName, streak.count, streak.today, now).catch(() => null),
    supabase.from("profiles").select("avatar_path").eq("id", profile.id).maybeSingle(),
  ]);
  const [myGroups, leagues] = await Promise.all([loadMyGroups(profile.id).catch(() => []), loadGroupLeagues(profile.id, now).catch(() => [])]);
  const [chatUnread, excused] = await Promise.all([unreadForStudent(profile.id).catch(() => 0), excusedAssignmentIds(profile.id).catch(() => new Set<string>())]);
  // Oxirgi 3 kunda muddati o'tib, topshirilmagan va sababi hali yozilmagan vazifalar.
  const missed = items
    .filter((a) => !a.submission && !excused.has(a.id) && new Date(a.due_at).getTime() < now && now - new Date(a.due_at).getTime() < 3 * 86_400_000)
    .map((a) => ({ id: a.id, title: a.title, dueAt: a.due_at, late: a.state === "late_open", penalty: a.late_penalty_percent }));
  const myAvatar = avatarUrl(meRow?.avatar_path as string | null);
  // XP: har bir to'g'ri javob (eng yaxshi natija) + har bir topshirilgan vazifa uchun 20.
  const xp =
    (practice ?? []).reduce((t, r) => t + (Number(r.best_score) || 0), 0) + items.filter((a) => a.submission).length * 20;
  // Kunlik elementlar: rang, kun so'zi (o'z kursidan), iqtibos.
  const key = todayKey(now);
  const theme = dayTheme(key);
  const words = (vocabRows ?? []).flatMap((r) => (Array.isArray(r.words) ? (r.words as { en: string; uz: string }[]) : []));
  const word = wordOfDay(words.filter((w) => w?.en && w?.uz && w.en.length <= 28), key);
  const dateLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "numeric", month: "long" }).format(new Date(now));
  const myCourse = courses.find((c) => c.id === access.primary);
  const courseBase = myCourse ? `/oquvchi/kurs/${myCourse.id}` : "/oquvchi";
  const tiles: Tile[] = [
    { href: "/oquvchi/vazifalar", label: "Homework", icon: "📋", from: "#ff7a9a", to: "#c2185b", badge: todo > 0 ? String(todo) : undefined },
    { href: `${courseBase}/lugat`, label: "Vocabulary", icon: "🔤", from: "#5ab0ff", to: "#1d5fd1" },
    { href: `${courseBase}/mavzular`, label: "Grammar", icon: "🧩", from: "#3ddc97", to: "#0a7a5a" },
    { href: `${courseBase}/phrasal`, label: "Phrases", icon: "💬", from: "#ffb347", to: "#e0752e" },
    { href: "/oquvchi/testlar", label: "Exams", icon: "🏆", from: "#f5c76a", to: "#c9822a" },
    { href: "/oquvchi/tarix", label: "History", icon: "📈", from: "#b388ff", to: "#6a3fd0" },
  ];
  const level = myCourse ? (LEVEL_INFO[myCourse.name]?.level ?? null) : null;

  return (
    <section className="space-y-6">
      <HomeTopBar name={profile.fullName} level={level} xp={xp} greeting={greeting(now)} avatar={myAvatar} chatUnread={chatUnread} />

      <MyGroupCard groups={myGroups} />

      <InstallApp />

      <MissedWork items={missed} seed={freshSeed()} age={profile.age} />

      {/* Story-qo‘llanma: birinchi kirishda o‘zi ochiladi */}
      <StoryRail welcome={welcome === "1"} />

      {/* Yangiliklar — doim shu yerda, xohlagan payt qayta ko'riladi */}
      <UpdatesBanner />

      {/* Pullik imtihon testlari — kirishi bilan ko'zga tashlanadigan joyda */}
      {offers.length ? (
        <div>
          <SectionTitle href="/oquvchi/testlar">Exam tests</SectionTitle>
          <PromoCarousel offers={offers} testsHref="/oquvchi/testlar" />
        </div>
      ) : null}

      <GroupRace leagues={leagues} />

      <Wanderland count={streak.count} today={streak.today} week={streak.week} weather={tripWeather} lost={streak.lost} crew={crew} avatar={myAvatar} />

      <DailyCard theme={theme} dateLabel={dateLabel} word={word} quote={quoteOfDay(key)} />

      <QuickCards courseHref={courseBase} courseName={myCourse?.name ?? null} />

      {mission ? <MissionCompact mission={mission} /> : null}

      <HomeTiles tiles={tiles} />



      <div>
        <SectionTitle>All courses</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.filter((c) => !c.is_hidden || access.all.includes(c.id)).map((c) => {
            const info = LEVEL_INFO[c.name];
            const grammar = topics.filter((t) => t.course_id === c.id && t.kind === "grammar").length;
            const vocab = topics.filter((t) => t.course_id === c.id && t.kind === "vocab").length;
            const mine = c.id === access.primary;
            const extra = access.extra.includes(c.id);
            return (
              <li key={c.id} className="stagger" style={{ "--i": courses.indexOf(c) } as React.CSSProperties}>
                <TiltCard>
                <Link
                  href={`/oquvchi/kurs/${c.id}`}
                  className={`${card} group flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 ${mine ? "ring-1 ring-sun-400/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{c.name}</p>
                      {info ? <p className="text-xs text-neutral-500">{info.en}</p> : null}
                    </div>
                    {info ? <Badge tone="brand">{info.level}</Badge> : null}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-neutral-600">
                    {mine ? <Badge tone="sun">Your course</Badge> : null}
                    {extra ? <Badge tone="green">Extra course</Badge> : null}
                    {grammar ? <span>{grammar} topics</span> : null}
                    {grammar && vocab ? <span>·</span> : null}
                    {vocab ? <span>{vocab} vocabulary units</span> : null}
                    {!grammar && !vocab ? <span className="text-neutral-400">Coming soon</span> : null}
                  </div>
                </Link>
                </TiltCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
