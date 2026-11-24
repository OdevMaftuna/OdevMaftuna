import "server-only";
import { avatarUrl } from "@/lib/avatar";
import { groupShiftMs, loadScheduleStarts } from "@/lib/schedule";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GURUH POYGASI — o'quvchi o'z guruhidagilar qanday ketayotganini ko'radi.
 * Reyting o'qituvchi hisobotidagi bilan bir xil: oxirgi 30 kunda muddati o'tgan har bir vazifa bo'yicha
 * o'rtacha foiz, topshirilmagani 0. Guruhga qo'shilishidan oldingi vazifalar hisoblanmaydi.
 * Ball o'quvchiga hali ko'rsatilmagan bo'lsa (AI bali yashirin) — o'sha vazifa hisobga olinmaydi.
 * O'quvchilar bir-birining faqat ismi, avatari va umumiy foizini ko'radi.
 */

const DAY = 86_400_000;
const WINDOW = 30 * DAY;

export type LeagueRow = {
  id: string;
  name: string;
  avatar: string | null;
  me: boolean;
  rating: number;
  /** Hisobga olingan vazifalar va topshirilganlari. */
  due: number;
  done: number;
  /** Bir hafta oldingi o'rniga nisbatan siljish: + yuqoriga, − pastga. */
  move: number;
};

export type League = {
  groupId: string;
  groupName: string;
  tasks: number;
  rows: LeagueRow[];
};

type Member = { student_id: string; created_at: string; profiles: { full_name: string; avatar_path: string | null; is_active: boolean } | null };
type Sub = { assignment_id: string; student_id: string; submitted_at: string; ai_score: number | null; teacher_score: number | null; reviewed_at: string | null };

export async function loadGroupLeagues(studentId: string, now = Date.now()): Promise<League[]> {
  const admin = createAdminClient();
  const { data: mine } = await admin.from("group_members").select("group_id").eq("student_id", studentId).eq("status", "approved");
  const groupIds = [...new Set(((mine ?? []) as { group_id: string }[]).map((m) => m.group_id))];
  if (!groupIds.length) return [];

  const [{ data: groups }, { data: membersRaw }, starts, { data: settings }] = await Promise.all([
    admin.from("class_groups").select("id, name, course_id, start_date").in("id", groupIds),
    admin
      .from("group_members")
      .select("group_id, student_id, created_at, profiles!group_members_student_id_fkey(full_name, avatar_path, is_active)")
      .in("group_id", groupIds)
      .eq("status", "approved")
      .not("student_id", "is", null),
    loadScheduleStarts(),
    admin.from("app_settings").select("show_ai_score_immediately").limit(1).maybeSingle(),
  ]);
  const showAi = (settings as { show_ai_score_immediately: boolean | null } | null)?.show_ai_score_immediately ?? true;
  const allMembers = (membersRaw ?? []) as unknown as (Member & { group_id: string })[];

  const out: League[] = [];
  for (const g of (groups ?? []) as { id: string; name: string; course_id: string | null; start_date: string | null }[]) {
    if (!g.course_id) continue;
    const shift = groupShiftMs(g.start_date, starts.get(g.course_id) ?? null);
    const members = allMembers.filter((m) => m.group_id === g.id && m.profiles?.is_active);
    if (!members.length) continue;

    // Guruh jadvalida (siljigan) muddati oxirgi 30+7 kunga tushgan vazifalar.
    const from = new Date(now - WINDOW - 7 * DAY - shift).toISOString();
    const to = new Date(now - shift).toISOString();
    const { data: aRaw } = await admin
      .from("assignments")
      .select("id, due_at, max_score")
      .eq("course_id", g.course_id)
      .gt("due_at", from)
      .lte("due_at", to);
    const assignments = ((aRaw ?? []) as { id: string; due_at: string; max_score: number }[]).map((a) => ({ ...a, due: Date.parse(a.due_at) + shift }));
    const ids = assignments.map((a) => a.id);
    const studentIds = members.map((m) => m.student_id);
    const { data: sRaw } = ids.length
      ? await admin.from("submissions").select("assignment_id, student_id, submitted_at, ai_score, teacher_score, reviewed_at").in("assignment_id", ids).in("student_id", studentIds)
      : { data: [] };
    const subs = new Map(((sRaw ?? []) as Sub[]).map((s) => [`${s.student_id}:${s.assignment_id}`, s]));

    /** T vaqtdagi reyting (T dan keyin topshirilganlar hisobga olinmaydi). */
    const ratingAt = (m: Member, t: number) => {
      const joined = Date.parse(m.created_at);
      let due = 0, done = 0, sum = 0;
      for (const a of assignments) {
        if (a.due > t || a.due <= t - WINDOW || a.due < joined) continue;
        const s = subs.get(`${m.student_id}:${a.id}`);
        const got = s && Date.parse(s.submitted_at) <= t ? s : null;
        if (got) {
          const visible = got.teacher_score !== null || got.reviewed_at !== null || showAi;
          const v = got.teacher_score ?? (visible ? got.ai_score : null);
          if (v === null || v === undefined) continue; // ball hali yashirin — hisobga olinmaydi
          sum += Math.max(0, Math.min(100, (Number(v) / (a.max_score || 100)) * 100));
          done++;
        }
        due++;
      }
      return { rating: due ? sum / due : 0, due, done };
    };

    const rank = (vals: { id: string; rating: number }[]) => {
      const sorted = [...vals].sort((a, b) => b.rating - a.rating);
      return new Map(sorted.map((v, i) => [v.id, i]));
    };
    const nowVals = members.map((m) => ({ m, ...ratingAt(m, now) }));
    const weekAgoFull = members.map((m) => ({ id: m.student_id, ...ratingAt(m, now - 7 * DAY) }));
    // Bir hafta oldin hali vazifa bo'lmagan bo'lsa — siljish ma'nosiz, ko'rsatilmaydi.
    const prevRank = weekAgoFull.some((w) => w.due > 0) ? rank(weekAgoFull) : new Map<string, number>();

    const rows: LeagueRow[] = nowVals
      .map(({ m, rating, due, done }) => ({
        id: m.student_id,
        name: m.profiles?.full_name || "O‘quvchi",
        avatar: avatarUrl(m.profiles?.avatar_path),
        me: m.student_id === studentId,
        rating: Math.round(rating),
        due,
        done,
        move: 0,
      }))
      .sort((a, b) => b.rating - a.rating || b.done - a.done || a.name.localeCompare(b.name));
    rows.forEach((r, i) => {
      const before = prevRank.get(r.id);
      r.move = before === undefined ? 0 : before - i;
    });
    // Sarlavhadagi son — o'quvchilarga hisoblangan eng ko'p vazifa (kech qo'shilganlarga oldingilari kirmaydi).
    out.push({ groupId: g.id, groupName: g.name, tasks: Math.max(0, ...rows.map((r) => r.due)), rows });
  }
  return out;
}
