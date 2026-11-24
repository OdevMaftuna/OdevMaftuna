import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { loadGroupsOverview } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "./create-group";

export const metadata: Metadata = { title: "Guruhlar" };

/**
 * GURUHLAR NAZORATI: har bir guruh — o'qituvchisi, o'quvchilari, kim saytga kirmagan, checklist holati.
 * Asosiy o'qituvchi — yangi guruh ochadi va a'zolarni tasdiqlaydi.
 */
export default async function GroupsPage() {
  const me = await requireTeacher();
  const supabase = await createClient();
  const [groups, courses, { data: teachers }] = await Promise.all([loadGroupsOverview(), loadCourses(), supabase.from("profiles").select("id, full_name").eq("role", "teacher").eq("is_active", true).order("created_at")]);
  const sum = (k: "members" | "pending" | "none" | "never" | "active" | "idle") => groups.reduce((t, g) => t + g[k], 0);
  const byTeacher = [...new Set(groups.map((g) => g.teacherName ?? "O‘qituvchisiz"))];

  return (
    <section className="space-y-5">
      <div className="relative overflow-clip rounded-[28px] border border-[#22c55e]/30 p-5" style={{ background: "radial-gradient(120% 120% at 100% 0%, #1f4a16 0%, #121a17 50%, #0b110f 100%)" }}>
        <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#22c55e]">✅ GURUHLAR NAZORATI</p>
        <h1 className="text-[28px] font-black tracking-tight">Guruhlar</h1>
        <p className="max-w-xl text-sm text-neutral-500">Har bir guruh: o‘qituvchisi, o‘quvchilari, kim saytga kirmagan va offline checklist (mavzu, lug‘at, test) qanday ketyapti.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["👥", "O‘quvchilar", sum("members"), "#e9ecea"],
            ["🟢", "Faol (3 kun)", sum("active"), "#7ddc5a"],
            ["⚠️", "Hisobi bor, kirmagan", sum("never") + sum("idle"), "#FAB219"],
            ["⛔", "Saytda hisobi yo‘q", sum("none"), "#ff9a9a"],
          ].map(([i, l, v, c]) => (
            <div key={String(l)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[11px] text-neutral-500">
                {i} {l}
              </p>
              <b className="text-2xl" style={{ color: String(c) }}>
                {v}
              </b>
            </div>
          ))}
        </div>
        {me.isAdmin && sum("pending") ? <p className="mt-3 inline-block rounded-full bg-[#FAB219] px-3 py-1 text-xs font-black text-[#1d1608]">⏳ {sum("pending")} ta o‘quvchi tasdiqingizni kutmoqda</p> : null}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-neutral-500">Hali guruh yo‘q.{me.isAdmin ? " Pastdan birinchisini oching." : ""}</p>
      ) : (
        byTeacher.map((tn) => (
          <div key={tn}>
            <h2 className="mb-2 text-[16px] font-black">👩‍🏫 {tn}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {groups
                .filter((g) => (g.teacherName ?? "O‘qituvchisiz") === tn)
                .map((g) => {
                  const on = g.members ? Math.round((g.active / g.members) * 100) : 0;
                  return (
                    <li key={g.id}>
                      <Link href={`/oqituvchi/guruhlar/${g.id}`} className="group block rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4 transition hover:-translate-y-0.5 hover:border-[#22c55e]/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <b className="block truncate text-[16px]">{g.name}</b>
                            <span className="text-xs text-neutral-500">{[g.courseName, g.schedule || null].filter(Boolean).join(" · ")}</span>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-black">👥 {g.members}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                          <span className="rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[#7ddc5a]">🟢 faol {g.active}</span>
                          {g.never + g.idle ? <span className="rounded-full bg-[#FAB219]/20 px-2 py-0.5 text-[#FAB219]">⚠️ kirmagan {g.never + g.idle}</span> : null}
                          {g.none ? <span className="rounded-full bg-[#D03B3B]/20 px-2 py-0.5 text-[#ff9a9a]">⛔ hisobsiz {g.none}</span> : null}
                          {g.pending ? <span className="rounded-full bg-[#FAB219] px-2 py-0.5 text-[#1d1608]">⏳ {g.pending}</span> : null}
                          {g.joined30 ? <span className="rounded-full bg-[#5ab0ff]/20 px-2 py-0.5 text-[#7cc4ff]">➕ kelgan {g.joined30}</span> : null}
                          {g.left30 ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">🚪 ketgan {g.left30}</span> : null}
                        </div>
                        {[
                          ["Saytda faol", on],
                          ["Mavzular", g.topicPct],
                          ["Lug‘atlar", g.vocabPct],
                        ].map(([l, v]) => (
                          <div key={String(l)} className="mt-2 flex items-center gap-2">
                            <span className="w-20 text-[11px] text-neutral-500">{l}</span>
                            <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                              <span className="sp-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2f6b1f] to-[#22c55e]" style={{ width: `${Math.max(2, Number(v))}%` }} />
                            </span>
                            <b className="w-9 text-right text-xs">{v}%</b>
                          </div>
                        ))}
                        {g.attention.length ? (
                          <p className="mt-2.5 line-clamp-2 text-[11px] text-neutral-500">
                            <b className="text-[#FAB219]">Shug‘ullanish kerak:</b> {g.attention.map((a) => a.name).join(", ")}
                          </p>
                        ) : null}
                        {g.current_unit ? <p className="mt-1.5 text-[11px] font-bold text-[#22c55e]">🎯 Joriy: Unit {g.current_unit}</p> : null}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))
      )}

      {me.isAdmin ? <CreateGroupForm courses={courses.map((c) => ({ id: c.id, name: c.name }))} teachers={((teachers ?? []) as { id: string; full_name: string }[]).map((t) => ({ id: t.id, name: t.full_name }))} /> : null}
    </section>
  );
}
