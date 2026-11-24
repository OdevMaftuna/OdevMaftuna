import "server-only";
import { loadGroupShifts, shiftDates } from "@/lib/schedule";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * KUNLIK VAZIFA NAZORATI (asosiy va support o'qituvchi uchun).
 * Har bir guruh: hozir ochiq turgan vazifa (publish_at ≤ hozir < due_at) — kim topshirdi, kim yo'q, qancha vaqt qoldi;
 * hamda kechagi (yaqinda yopilgan) vazifa natijasi. Saytda hisobi yo'q a'zolar alohida ko'rsatiladi.
 */

export type DailyPerson = { memberId: string; studentId: string | null; name: string; phone: string | null };

/** Past natija: oxirgi 3 kunda uy vazifa yoki unit testdan LOW_PCT dan kam. */
export type LowScore = { memberId: string; studentId: string; name: string; what: string; pct: number; at: string };
export const LOW_PCT = 60;

export type DailyGroup = {
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  /** Mas'ul support o'qituvchi (0023). */
  supportId: string | null;
  low: LowScore[];
  courseName: string | null;
  today: { id: string; title: string; dueAt: string; done: DailyPerson[]; notDone: DailyPerson[] } | null;
  yesterday: { title: string; done: number; total: number; missed: string[] } | null;
  noAccount: DailyPerson[];
};

export async function loadDailyHomework(now = Date.now()): Promise<DailyGroup[]> {
  const admin = createAdminClient();
  const [{ data: groups }, { data: members }, { data: teachers }, { data: courses }, shifts] = await Promise.all([
    admin.from("class_groups").select("id, name, course_id, teacher_id, support_id, sort").order("sort"),
    admin.from("group_members").select("id, group_id, student_id, full_name, phone").eq("status", "approved"),
    admin.from("profiles").select("id, full_name").eq("role", "teacher"),
    admin.from("courses").select("id, name"),
    loadGroupShifts(),
  ]);
  // Keyinroq boshlangan guruhlar uchun vazifa sanalari suriladi — shuning uchun oyna kengroq olinadi.
  const maxShift = Math.max(0, ...shifts.values());
  const courseIds = [...new Set(((groups ?? []) as { course_id: string | null }[]).map((g) => g.course_id).filter((x): x is string => Boolean(x)))];
  const nowIso = new Date(now).toISOString();
  const { data: assignments } = courseIds.length
    ? await admin
        .from("assignments")
        .select("id, title, course_id, publish_at, due_at")
        .in("course_id", courseIds)
        .lte("publish_at", nowIso)
        .gte("due_at", new Date(now - 30 * 3_600_000 - maxShift).toISOString())
        .order("due_at")
    : { data: [] as never[] };
  type A = { id: string; title: string; course_id: string; publish_at: string; due_at: string };
  const list = (assignments ?? []) as A[];
  const ids = list.map((a) => a.id);
  const { data: subs } = ids.length ? await admin.from("submissions").select("assignment_id, student_id").in("assignment_id", ids) : { data: [] as never[] };

  // Past natijalar (oxirgi 3 kun): uy vazifa (o'qituvchi yoki AI bahosi) va pullik testlar.
  const since = new Date(now - 3 * 86_400_000).toISOString();
  const linkedIds = [...new Set(((members ?? []) as { student_id: string | null }[]).map((m) => m.student_id).filter((x): x is string => Boolean(x)))];
  const [{ data: recentSubs }, { data: recentTests }] = linkedIds.length
    ? await Promise.all([
        admin.from("submissions").select("student_id, submitted_at, ai_score, teacher_score, assignments(title, max_score)").in("student_id", linkedIds).gte("submitted_at", since),
        admin.from("test_attempts").select("student_id, submitted_at, score, max_score, paid_tests(title, course)").in("student_id", linkedIds).gte("submitted_at", since),
      ])
    : [{ data: [] as never[] }, { data: [] as never[] }];
  const lowByStudent = new Map<string, { what: string; pct: number; at: string }[]>();
  const pushLow = (sid: string, what: string, pct: number, at: string) => {
    if (pct >= LOW_PCT) return;
    lowByStudent.set(sid, [...(lowByStudent.get(sid) ?? []), { what, pct: Math.round(pct), at }]);
  };
  for (const r of (recentSubs ?? []) as unknown as { student_id: string; submitted_at: string; ai_score: number | null; teacher_score: number | null; assignments: { title: string; max_score: number } | null }[]) {
    const v = r.teacher_score ?? r.ai_score;
    if (v == null || !r.assignments) continue;
    pushLow(r.student_id, `Uy vazifa: ${r.assignments.title}`, (Number(v) / (r.assignments.max_score || 100)) * 100, r.submitted_at);
  }
  for (const r of (recentTests ?? []) as unknown as { student_id: string; submitted_at: string; score: number | null; max_score: number; paid_tests: { title: string; course: string } | null }[]) {
    if (r.score == null) continue;
    pushLow(r.student_id, `Test: ${r.paid_tests?.course ?? ""} ${r.paid_tests?.title ?? ""}`.trim(), (Number(r.score) / (r.max_score || 100)) * 100, r.submitted_at);
  }
  const done = new Set(((subs ?? []) as { assignment_id: string; student_id: string }[]).map((s) => `${s.assignment_id}:${s.student_id}`));
  const tName = new Map(((teachers ?? []) as { id: string; full_name: string }[]).map((t) => [t.id, t.full_name]));
  const cName = new Map(((courses ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));

  return ((groups ?? []) as { id: string; name: string; course_id: string | null; teacher_id: string | null; support_id: string | null }[]).map((g) => {
    const ms = ((members ?? []) as { id: string; group_id: string; student_id: string | null; full_name: string; phone: string | null }[])
      .filter((m) => m.group_id === g.id)
      .map((m) => ({ memberId: m.id, studentId: m.student_id, name: m.full_name, phone: m.phone }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const online = ms.filter((m) => m.studentId);
    const shift = shifts.get(g.id) ?? 0;
    const mine = list
      .filter((a) => a.course_id === g.course_id)
      .map((a) => shiftDates(a, shift))
      .filter((a) => Date.parse(a.publish_at) <= now && Date.parse(a.due_at) >= now - 30 * 3_600_000)
      .sort((x, y) => Date.parse(x.due_at) - Date.parse(y.due_at));
    const cur = mine.find((a) => Date.parse(a.due_at) > now) ?? null;
    const prev = [...mine].reverse().find((a) => Date.parse(a.due_at) <= now) ?? null;
    const low: LowScore[] = online
      .flatMap((m) => (lowByStudent.get(m.studentId!) ?? []).map((l) => ({ memberId: m.memberId, studentId: m.studentId!, name: m.name, ...l })))
      .sort((a, b) => a.pct - b.pct);
    return {
      groupId: g.id,
      groupName: g.name,
      teacherId: g.teacher_id,
      supportId: g.support_id,
      low,
      teacherName: g.teacher_id ? (tName.get(g.teacher_id) ?? null) : null,
      courseName: g.course_id ? (cName.get(g.course_id) ?? null) : null,
      today: cur
        ? {
            id: cur.id,
            title: cur.title,
            dueAt: cur.due_at,
            done: online.filter((m) => done.has(`${cur.id}:${m.studentId}`)),
            notDone: online.filter((m) => !done.has(`${cur.id}:${m.studentId}`)),
          }
        : null,
      yesterday: prev
        ? {
            title: prev.title,
            done: online.filter((m) => done.has(`${prev.id}:${m.studentId}`)).length,
            total: online.length,
            missed: online.filter((m) => !done.has(`${prev.id}:${m.studentId}`)).map((m) => m.name),
          }
        : null,
      noAccount: ms.filter((m) => !m.studentId),
    };
  });
}

/**
 * Ogohlantirish kerak bo'lgan guruhlar: muddatgacha `hours` soatdan kam qolgan va bajarmaganlar bor,
 * yoki oxirgi 24 soatda past natija olganlar bor.
 */
export function urgentGroups(list: DailyGroup[], now = Date.now(), hours = 4) {
  return list
    .map((g) => ({
      groupId: g.groupId,
      groupName: g.groupName,
      notDone: g.today && Date.parse(g.today.dueAt) - now < hours * 3_600_000 ? g.today.notDone.length : 0,
      dueAt: g.today?.dueAt ?? null,
      low: g.low.filter((l) => now - Date.parse(l.at) < 86_400_000).map((l) => `${l.name} — ${l.pct}%`),
    }))
    .filter((u) => u.notDone > 0 || u.low.length > 0);
}
