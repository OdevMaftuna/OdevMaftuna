import type { Metadata } from "next";
import Link from "next/link";
import { StoryRail } from "@/components/stories";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { AREA_LABEL, UPDATES, formatUpdateDate } from "@/lib/updates";

export const metadata: Metadata = { title: "Yangiliklar" };

/** Saytdagi barcha yangiliklar (src/lib/updates.ts) — sana bo'yicha guruhlangan. */
export default async function UpdatesPage() {
  await requireTeacher();
  const days = [...new Set(UPDATES.map((u) => u.date))];
  return (
    <section className="space-y-5">
      <PageHeader title="Yangiliklar" description="Saytga qo‘shilgan va o‘zgargan hamma narsa. Eng yangisi tepada. “O‘quvchilar ham ko‘radi” belgisi borlari ularning storysida ham chiqadi." />
      <StoryRail audience="teacher" />
      {days.map((day) => (
        <div key={day}>
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">{formatUpdateDate(day)}</h2>
          <ul className={`${card} divide-y divide-neutral-200`}>
            {UPDATES.filter((u) => u.date === day).map((u) => (
              <li key={u.title} className="flex gap-3 px-4 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-xl">{u.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{u.title}</p>
                    <Badge tone="brand">{AREA_LABEL[u.area]}</Badge>
                    {u.audience === "all" ? <Badge tone="green">O‘quvchilar ham ko‘radi</Badge> : <Badge>Faqat o‘qituvchilar</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{u.text}</p>
                  {u.href?.teacher ? (
                    <Link href={u.href.teacher} className="mt-1.5 inline-block text-sm font-semibold text-brand-700 hover:underline">
                      Ko‘rish →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
