import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { loadGroupGrid } from "@/lib/groups";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupportTeacher } from "@/lib/support";
import { GroupGrid } from "../group-grid";
import { StartDateCard } from "./start-date";

export const metadata: Metadata = { title: "Guruh checklisti" };

/** Guruh checklisti: mavzular va lug'atlar (o'qituvchi belgilaydi) + test natijalari (avtomatik) + saytdagi holat. */
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const data = await loadGroupGrid(id);
  if (!data) notFound();
  const { group, courseName, teacherName, members, testUnits, accounts } = data;
  const approved = members.filter((s) => s.status === "approved");
  const admin = createAdminClient();
  const [{ data: course }, { data: firstTasks }] = group.course_id
    ? await Promise.all([
        admin.from("courses").select("schedule_start").eq("id", group.course_id).maybeSingle(),
        admin.from("assignments").select("title, due_at").eq("course_id", group.course_id).order("due_at").limit(3),
      ])
    : [{ data: null }, { data: null }];
  const scheduleStart = (course?.schedule_start as string | null | undefined) ?? null;
  const preview = (firstTasks ?? []) as { title: string; due_at: string }[];
  const avg = approved.length ? Math.round(approved.reduce((t, s) => t + s.overall, 0) / approved.length) : 0;

  return (
    <section className="space-y-4">
      <Link href="/oqituvchi/guruhlar" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Barcha guruhlar
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#22c55e]">✅ GURUH CHECKLISTI{courseName ? ` · ${courseName.toUpperCase()}` : ""}</p>
          <h1 className="text-[26px] font-black tracking-tight">{group.name}</h1>
          <p className="text-sm text-neutral-500">{[teacherName ? `👩‍🏫 ${teacherName}` : null, group.schedule || null].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2 text-center">
          {[
            ["👥", "O‘quvchi", String(approved.length)],
            ["📊", "O‘rtacha", `${avg}%`],
            ["🎯", "Joriy unit", group.current_unit ? `Unit ${group.current_unit}` : "—"],
          ].map(([i, l, v]) => (
            <div key={l} className="rounded-2xl border border-white/10 bg-[#121a17] px-3 py-2">
              <p className="text-[11px] text-neutral-500">
                {i} {l}
              </p>
              <b className="text-[16px]">{v}</b>
            </div>
          ))}
        </div>
      </div>
      {group.course_id ? (
        <StartDateCard groupId={group.id} startDate={group.start_date} scheduleStart={scheduleStart} canEdit={me.isAdmin} preview={preview} />
      ) : null}
      <GroupGrid groupId={group.id} title={group.name} units={group.units} testUnits={testUnits} current={group.current_unit} members={members} accounts={accounts} canManage={me.isAdmin || (await isSupportTeacher(me.id))} />
    </section>
  );
}
