import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/run-by";
import { SectionNav } from "@/components/section-nav";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { getCurrentProfile } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { HomeworkNudge } from "@/components/homework-nudge";
import { StudentSearch } from "@/components/student-search";
import { loadStudentAssignments } from "@/lib/student-data";

const NAV = [
  { href: "/oquvchi", label: "Home", exact: true },
  { href: "/oquvchi/vazifalar", label: "Homework" },
  { href: "/oquvchi/testlar", label: "Exam tests" },
  { href: "/oquvchi/tarix", label: "History" },
  { href: "/oquvchi/kabinet", label: "Profile" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  // Pastki menyudagi "Practice" — o'quvchining o'z kursi sahifasi (lug'at, mavzular, iboralar).
  const [profile, courses, assignments] = await Promise.all([getCurrentProfile(), loadCourses(), loadStudentAssignments().catch(() => ({ items: [], now: 0 }))]);
  // Eslatma: topshirilmagan, muddati hali o'tmagan (yoki kech topshirish mumkin) vazifalar — eng yaqin muddat birinchi.
  const pending = assignments.items
    .filter((a) => !a.submission && a.state !== "closed")
    .sort((x, y) => x.due_at.localeCompare(y.due_at))
    .map((a) => ({ id: a.id, title: a.title, dueAt: a.due_at }));
  const myCourse = courses.find((c) => c.name === profile.courseName);
  const tabs: NavItem[] = [
    { href: "/oquvchi", label: "Home", icon: "home", exact: true },
    { href: "/oquvchi/vazifalar", label: "Homework", icon: "homework" },
    { href: myCourse ? `/oquvchi/kurs/${myCourse.id}` : "/oquvchi", label: "Practice", icon: "practice", exact: !myCourse },
    { href: "/oquvchi/kabinet", label: "Profile", icon: "user" },
  ];
  return (
    <>
      <AppHeader roleLabel="Student" width="max-w-2xl" signOutLabel="Log out" actions={<StudentSearch />} />
      <Suspense fallback={null}>
        <div className="hidden sm:block">
          <SectionNav items={NAV} width="max-w-2xl" />
        </div>
      </Suspense>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <PageTransition>
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </PageTransition>
      </main>
      <SiteFooter width="max-w-2xl" />
      {profile.role === "student" ? <HomeworkNudge tasks={pending} age={profile.age} /> : null}
      <BottomNav items={tabs} center={{ href: "/oquvchi/testlar", label: "Exams", icon: "trophy" }} />
    </>
  );
}
