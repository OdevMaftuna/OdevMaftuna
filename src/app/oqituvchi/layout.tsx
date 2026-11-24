import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/run-by";
import { SectionNav } from "@/components/section-nav";
import { BottomNav } from "@/components/bottom-nav";
import { getCurrentProfile } from "@/lib/auth";
import { hasSupportClaim } from "@/lib/support";
import { loadDailyHomework, urgentGroups } from "@/lib/daily-homework";
import { TeacherAlert } from "@/components/teacher-alert";

const NAV = [
  { href: "/oqituvchi", label: "Bosh sahifa", exact: true },
  { href: "/oqituvchi/vazifalar", label: "Vazifalar" },
  { href: "/oqituvchi/guruhlar", label: "Guruhlar" },
  { href: "/oqituvchi/mashqlar", label: "Mashqlar" },
  { href: "/oqituvchi/writing", label: "Writing" },
  { href: "/oqituvchi/kuzatuv", label: "Kuzatuv" },
  { href: "/oqituvchi/seriyalar", label: "Seriyalar" },
  { href: "/oqituvchi/hisobot", label: "Hisobot" },
  { href: "/oqituvchi/testlar", label: "Pullik testlar" },
  { href: "/oqituvchi/oquvchilar", label: "O‘quvchilar" },
  { href: "/oqituvchi/chat", label: "Chat" },
  { href: "/oqituvchi/yangiliklar", label: "Yangiliklar" },
  { href: "/oqituvchi/yoriqnoma", label: "📘 Yo‘riqnoma" },
];
const ADMIN_NAV = { href: "/oqituvchi/sozlamalar", label: "Sozlamalar" };
const TEAM_NAV = { href: "/oqituvchi/supportlar", label: "🛟 Supportlar" };
/** Butun guruh natijalari — asosiy o'qituvchi va "Support" huquqi berilgan o'qituvchilar. */
const SUPPORT_NAV = { href: "/oqituvchi/support", label: "🛟 Support" };

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentProfile();
  const support = await hasSupportClaim();
  // Asosiy / support o‘qituvchi: muddat yaqin va bajarmaganlar bor guruhlar — ogohlantirish.
  // Oddiy o‘qituvchi — faqat o‘z guruhlari (past natija va muddat).
  const daily = await loadDailyHomework().catch(() => []);
  const urgent = urgentGroups(support ? daily : daily.filter((g) => g.teacherId === me.id));
  const nav = [...(support ? [SUPPORT_NAV] : []), ...NAV, ...(me.isAdmin ? [TEAM_NAV, ADMIN_NAV] : [])];
  return (
    <>
      <AppHeader roleLabel={me.isAdmin ? "Asosiy o‘qituvchi" : "O‘qituvchi"} />
      <Suspense fallback={null}>
        <div className="hidden sm:block">
          <SectionNav items={nav} />
        </div>
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <PageTransition>
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </PageTransition>
      </main>
      <SiteFooter />
      {urgent.length ? <TeacherAlert urgent={urgent} /> : null}
      <BottomNav
        items={[
          { href: "/oqituvchi", label: "Asosiy", icon: "home", exact: true },
          { href: "/oqituvchi/vazifalar", label: "Vazifalar", icon: "tasks" },
          { href: "/oqituvchi/oquvchilar", label: "O‘quvchilar", icon: "users" },
        ]}
        center={{ href: "/oqituvchi/hisobot", label: "Hisobot", icon: "chart" }}
        more={[
          ...(support ? [SUPPORT_NAV] : []),
          { href: "/oqituvchi/guruhlar", label: "Guruhlar" },
          { href: "/oqituvchi/mashqlar", label: "Mashqlar" },
          { href: "/oqituvchi/writing", label: "Writing" },
          { href: "/oqituvchi/kuzatuv", label: "Kuzatuv" },
          { href: "/oqituvchi/seriyalar", label: "Seriyalar" },
          { href: "/oqituvchi/testlar", label: "Pullik testlar" },
          { href: "/oqituvchi/chat", label: "Chat" },
          { href: "/oqituvchi/yangiliklar", label: "Yangiliklar" },
          { href: "/oqituvchi/yoriqnoma", label: "📘 Yo‘riqnoma" },
          ...(me.isAdmin ? [TEAM_NAV, ADMIN_NAV] : []),
        ]}
        moreLabel="Yana"
      />
    </>
  );
}
