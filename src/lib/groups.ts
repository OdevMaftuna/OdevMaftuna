import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GURUHLAR va OFFLINE CHECKLIST.
 * Guruh ro'yxati (group_members) — ism + telefon; saytdagi hisob (student_id) bo'lsa — bog'langan.
 * Mavzu va lug'at belgilari — o'qituvchi qo'yadi (group_checks). Test natijalari — test_attempts dan avtomatik.
 */

export type GroupRow = {
  id: string;
  name: string;
  course_id: string | null;
  /** Guruh boshlangan kun (YYYY-MM-DD) — vazifa muddatlari shundan hisoblanadi (lib/schedule.ts). */
  start_date: string | null;
  schedule: string;
  teacher_id: string | null;
  units: string[];
  current_unit: string | null;
  sort: number;
};

export type SiteState = "none" | "never" | "today" | "recent" | "idle";

export type GridMember = {
  id: string;
  studentId: string | null;
  name: string;
  phone: string | null;
  status: "pending" | "approved" | "left";
  /** Guruhga qo'shilgan va (ketgan bo'lsa) ketgan sana. */
  joinedAt: string;
  leftAt: string | null;
  /** Saytdagi holat: hisob yo'q / hech kirmagan / bugun / yaqinda / uzoq vaqtdan beri. */
  site: SiteState;
  lastSeen: string | null;
  topic: Record<string, boolean>;
  vocab: Record<string, boolean>;
  tests: Record<string, number | null>;
  overall: number;
};

const COLS = "id, name, course_id, schedule, teacher_id, units, current_unit, sort, start_date";
const DAY = 86_400_000;

/** "+998 90 123-45-67" → "998901234567" (9 xonali bo'lsa 998 qo'shiladi). */
export function normPhone(raw: string | null | undefined): string | null {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 9) return `998${d}`;
  return d.length >= 9 && d.length <= 15 ? d : null;
}
export const fmtPhone = (p: string | null) => (p && p.length === 12 ? `+${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 8)}-${p.slice(8, 10)}-${p.slice(10)}` : p ? `+${p}` : "—");

export async function loadGroups(): Promise<GroupRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("class_groups").select(COLS).order("sort").order("name");
  return (data ?? []) as GroupRow[];
}

/** Hisoblarning oxirgi kirishi va faolligi (o'qituvchi uchun, service role). */
async function siteActivity(ids: string[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (!ids.length) return out;
  const admin = createAdminClient();
  const want = new Set(ids);
  for (let page = 1; page <= 10; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    for (const u of data?.users ?? []) if (want.has(u.id)) out.set(u.id, u.last_sign_in_at ?? null);
    if (!data?.users || data.users.length < 1000) break;
  }
  // Kirishdan tashqari: oxirgi topshiriq yoki mashq ham "faollik" hisoblanadi.
  const [{ data: subs }, { data: prac }] = await Promise.all([
    admin.from("submissions").select("student_id, submitted_at").in("student_id", ids).order("submitted_at", { ascending: false }).limit(2000),
    admin.from("practice_attempts").select("student_id, updated_at").in("student_id", ids).order("updated_at", { ascending: false }).limit(2000),
  ]);
  for (const r of [...((subs ?? []) as { student_id: string; submitted_at: string }[]).map((x) => [x.student_id, x.submitted_at] as const), ...((prac ?? []) as { student_id: string; updated_at: string }[]).map((x) => [x.student_id, x.updated_at] as const)]) {
    const cur = out.get(r[0]);
    if (r[1] && (!cur || r[1] > cur)) out.set(r[0], r[1]);
  }
  return out;
}

function siteState(studentId: string | null, last: string | null | undefined, now: number): SiteState {
  if (!studentId) return "none";
  if (!last) return "never";
  const days = (now - Date.parse(last)) / DAY;
  return days < 1 ? "today" : days < 4 ? "recent" : "idle";
}

/** Umumiy ko'rsatkich: mavzu + lug'at belgilari va topshirilgan unit testlari ulushi. */
export function overallOf(units: string[], m: Pick<GridMember, "topic" | "vocab" | "tests">, testUnits: Set<string>) {
  const total = units.length * 2 + units.filter((u) => testUnits.has(u)).length;
  if (!total) return 0;
  const done = units.filter((u) => m.topic[u]).length + units.filter((u) => m.vocab[u]).length + units.filter((u) => testUnits.has(u) && m.tests[u] != null).length;
  return Math.round((done / total) * 100);
}

/** Guruh jadvali: ro'yxat, belgilar, test natijalari, saytdagi holat va qo'shish uchun hisoblar. */
export async function loadGroupGrid(groupId: string): Promise<{
  group: GroupRow;
  courseName: string | null;
  teacherName: string | null;
  members: GridMember[];
  testUnits: string[];
  accounts: { id: string; name: string; course: string | null }[];
} | null> {
  const supabase = await createClient();
  const { data: g } = await supabase.from("class_groups").select(COLS).eq("id", groupId).maybeSingle();
  if (!g) return null;
  const group = g as GroupRow;
  const [{ data: members }, { data: course }, { data: teacher }, { data: allStudents }] = await Promise.all([
    supabase.from("group_members").select("id, student_id, full_name, phone, status, created_at, left_at").eq("group_id", groupId),
    group.course_id ? supabase.from("courses").select("name").eq("id", group.course_id).maybeSingle() : Promise.resolve({ data: null }),
    group.teacher_id ? supabase.from("profiles").select("full_name").eq("id", group.teacher_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("profiles").select("id, full_name, courses!profiles_course_id_fkey(name)").eq("role", "student").eq("is_active", true).order("full_name").limit(5000),
  ]);
  const courseName = (course as { name: string } | null)?.name ?? null;
  type M = { id: string; student_id: string | null; full_name: string; phone: string | null; status: "pending" | "approved" | "left"; created_at: string; left_at: string | null };
  const mem = (members ?? []) as M[];
  const memberIds = mem.map((m) => m.id);
  const studentIds = mem.map((m) => m.student_id).filter((x): x is string => Boolean(x));

  const [{ data: checks }, { data: testsRaw }, activity] = await Promise.all([
    memberIds.length ? supabase.from("group_checks").select("member_id, kind, unit").in("member_id", memberIds) : Promise.resolve({ data: [] as never[] }),
    courseName ? supabase.from("paid_tests").select("id, unit").eq("course", courseName).eq("kind", "unit") : Promise.resolve({ data: [] as never[] }),
    siteActivity(studentIds),
  ]);
  const unitOfTest = new Map(((testsRaw ?? []) as { id: string; unit: number | null }[]).filter((t) => t.unit != null).map((t) => [t.id, String(t.unit)]));
  const { data: attempts } =
    studentIds.length && unitOfTest.size
      ? await supabase.from("test_attempts").select("student_id, test_id, score, max_score").in("student_id", studentIds).in("test_id", [...unitOfTest.keys()]).not("submitted_at", "is", null)
      : { data: [] as { student_id: string; test_id: string; score: number | null; max_score: number }[] };

  const testUnits = new Set(unitOfTest.values());
  const now = Date.now();
  const list: GridMember[] = mem
    .map((m) => {
      const topic: Record<string, boolean> = {};
      const vocab: Record<string, boolean> = {};
      for (const c of (checks ?? []) as { member_id: string; kind: string; unit: string }[]) {
        if (c.member_id !== m.id) continue;
        if (c.kind === "topic") topic[c.unit] = true;
        else vocab[c.unit] = true;
      }
      const tests: Record<string, number | null> = {};
      for (const a of (attempts ?? []) as { student_id: string; test_id: string; score: number | null; max_score: number }[]) {
        if (!m.student_id || a.student_id !== m.student_id || a.score == null) continue;
        const u = unitOfTest.get(a.test_id);
        if (u) tests[u] = Math.max(tests[u] ?? 0, Math.round((Number(a.score) / (a.max_score || 100)) * 100));
      }
      const last = m.student_id ? (activity.get(m.student_id) ?? null) : null;
      const base = { topic, vocab, tests };
      return {
        id: m.id,
        studentId: m.student_id,
        name: m.full_name,
        phone: m.phone,
        status: m.status,
        joinedAt: m.created_at,
        leftAt: m.left_at,
        site: siteState(m.student_id, last, now),
        lastSeen: last,
        ...base,
        overall: overallOf(group.units, base, testUnits),
      };
    })
    .sort((a, b) => {
      const rank = { approved: 0, pending: 1, left: 2 } as const;
      return rank[a.status] - rank[b.status] || a.name.localeCompare(b.name);
    });

  const linked = new Set(studentIds);
  const accounts = ((allStudents ?? []) as { id: string; full_name: string; courses: { name: string } | { name: string }[] | null }[])
    .filter((s) => !linked.has(s.id))
    .map((s) => ({ id: s.id, name: s.full_name || "O‘quvchi", course: (Array.isArray(s.courses) ? s.courses[0]?.name : s.courses?.name) ?? null }));

  return { group, courseName, teacherName: (teacher as { full_name: string } | null)?.full_name ?? null, members: list, testUnits: [...testUnits], accounts };
}

export type GroupStat = { members: number; pending: number; linked: number; topic: number; vocab: number; slots: number };

/** Guruhlar ro'yxati uchun qisqa statistika. */
export async function loadGroupStats(): Promise<Map<string, GroupStat>> {
  const supabase = await createClient();
  const [{ data: groups }, { data: members }, { data: checks }] = await Promise.all([
    supabase.from("class_groups").select("id, units"),
    supabase.from("group_members").select("id, group_id, status, student_id"),
    supabase.from("group_checks").select("member_id, kind"),
  ]);
  const groupOf = new Map(((members ?? []) as { id: string; group_id: string }[]).map((m) => [m.id, m.group_id]));
  const out = new Map<string, GroupStat>();
  for (const g of (groups ?? []) as { id: string; units: string[] }[]) {
    const ms = ((members ?? []) as { group_id: string; status: string; student_id: string | null }[]).filter((m) => m.group_id === g.id);
    const approved = ms.filter((m) => m.status === "approved");
    const cs = ((checks ?? []) as { member_id: string; kind: string }[]).filter((c) => groupOf.get(c.member_id) === g.id);
    out.set(g.id, {
      members: approved.length,
      pending: ms.filter((m) => m.status === "pending").length,
      linked: approved.filter((m) => m.student_id).length,
      topic: cs.filter((c) => c.kind === "topic").length,
      vocab: cs.filter((c) => c.kind === "vocab").length,
      slots: approved.length * g.units.length,
    });
  }
  return out;
}

/** O'quvchi: o'zi a'zo bo'lgan guruhlar (nomi, vaqti, o'qituvchisi). */
export async function loadMyGroups(studentId: string): Promise<{ id: string; name: string; schedule: string; teacher: string | null }[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("group_members").select("group_id, class_groups(name, schedule, teacher_id)").eq("student_id", studentId).eq("status", "approved");
  const rows = (data ?? []) as unknown as { group_id: string; class_groups: { name: string; schedule: string; teacher_id: string | null } | null }[];
  const tIds = rows.map((r) => r.class_groups?.teacher_id).filter((x): x is string => Boolean(x));
  const { data: ts } = tIds.length ? await admin.from("profiles").select("id, full_name").in("id", tIds) : { data: [] as { id: string; full_name: string }[] };
  const tName = new Map(((ts ?? []) as { id: string; full_name: string }[]).map((t) => [t.id, t.full_name]));
  return rows.filter((r) => r.class_groups).map((r) => ({ id: r.group_id, name: r.class_groups!.name, schedule: r.class_groups!.schedule, teacher: r.class_groups!.teacher_id ? (tName.get(r.class_groups!.teacher_id) ?? null) : null }));
}

/**
 * Telefon bo'yicha bog'lash: shu telefon yozilgan, hali hisobi yo'q guruh qatorlarini o'quvchiga bog'laydi
 * va profilga telefonni saqlaydi. Bog'langan guruhlar sonini qaytaradi.
 */
export async function linkStudentByPhone(studentId: string, rawPhone: string): Promise<number> {
  const phone = normPhone(rawPhone);
  if (!phone) return 0;
  const admin = createAdminClient();
  await admin.from("profiles").update({ phone }).eq("id", studentId);
  const { data } = await admin.from("group_members").update({ student_id: studentId }).eq("phone", phone).is("student_id", null).select("id");
  if ((data ?? []).length) await syncGroupCourses(studentId);
  return (data ?? []).length;
}

export type GroupOverview = GroupRow & {
  teacherName: string | null;
  courseName: string | null;
  members: number;
  pending: number;
  /** Oxirgi 30 kunda kelgan / ketgan. */
  joined30: number;
  left30: number;
  none: number;
  never: number;
  active: number;
  idle: number;
  topicPct: number;
  vocabPct: number;
  /** Diqqat talab qiladiganlar: hisobi yo'q yoki 4+ kun kirmagan (ism bilan). */
  attention: { name: string; site: SiteState; lastSeen: string | null }[];
};

/** Barcha guruhlar bo'yicha nazorat: o'qituvchi, a'zolar, saytdagi faollik, checklist foizi. */
export async function loadGroupsOverview(): Promise<GroupOverview[]> {
  const supabase = await createClient();
  const [groups, { data: members }, { data: checks }, { data: courses }, { data: teachers }] = await Promise.all([
    loadGroups(),
    supabase.from("group_members").select("id, group_id, student_id, full_name, status, created_at, left_at"),
    supabase.from("group_checks").select("member_id, kind"),
    supabase.from("courses").select("id, name"),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher"),
  ]);
  type M = { id: string; group_id: string; student_id: string | null; full_name: string; status: string; created_at: string; left_at: string | null };
  const ms = (members ?? []) as M[];
  const activity = await siteActivity([...new Set(ms.map((m) => m.student_id).filter((x): x is string => Boolean(x)))]);
  const now = Date.now();
  const cName = new Map(((courses ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));
  const tName = new Map(((teachers ?? []) as { id: string; full_name: string }[]).map((t) => [t.id, t.full_name]));
  const groupOf = new Map(ms.map((m) => [m.id, m.group_id]));
  return groups.map((g) => {
    const mine = ms.filter((m) => m.group_id === g.id);
    const ok = mine.filter((m) => m.status === "approved");
    const states = ok.map((m) => ({ name: m.full_name, last: m.student_id ? (activity.get(m.student_id) ?? null) : null, site: siteState(m.student_id, m.student_id ? activity.get(m.student_id) : null, now) }));
    const cs = ((checks ?? []) as { member_id: string; kind: string }[]).filter((c) => groupOf.get(c.member_id) === g.id);
    const slots = ok.length * g.units.length;
    return {
      ...g,
      teacherName: g.teacher_id ? (tName.get(g.teacher_id) ?? null) : null,
      courseName: g.course_id ? (cName.get(g.course_id) ?? null) : null,
      members: ok.length,
      pending: mine.filter((m) => m.status === "pending").length,
      joined30: ok.filter((m) => now - Date.parse(m.created_at) < 30 * DAY).length,
      left30: mine.filter((m) => m.status === "left" && m.left_at && now - Date.parse(m.left_at) < 30 * DAY).length,
      none: states.filter((s) => s.site === "none").length,
      never: states.filter((s) => s.site === "never").length,
      active: states.filter((s) => s.site === "today" || s.site === "recent").length,
      idle: states.filter((s) => s.site === "idle").length,
      topicPct: slots ? Math.round((cs.filter((c) => c.kind === "topic").length / slots) * 100) : 0,
      vocabPct: slots ? Math.round((cs.filter((c) => c.kind === "vocab").length / slots) * 100) : 0,
      attention: states.filter((s) => s.site === "none" || s.site === "never" || s.site === "idle").map((s) => ({ name: s.name, site: s.site, lastSeen: s.last })),
    };
  });
}

/**
 * Guruh orqali kursga kirish: o'quvchi a'zo bo'lgan (tasdiqlangan) guruhlarning kurslari unga ochiladi
 * (asosiy kursi bo'lmasa — course_enrollments ga qo'shiladi). Masalan, yashirin Kids kursi faqat shu yo'l bilan ochiladi.
 */
export async function syncGroupCourses(studentId: string): Promise<void> {
  const admin = createAdminClient();
  const [{ data: rows }, { data: me }] = await Promise.all([
    admin.from("group_members").select("class_groups(course_id)").eq("student_id", studentId).eq("status", "approved"),
    admin.from("profiles").select("course_id").eq("id", studentId).maybeSingle(),
  ]);
  const courseIds = [
    ...new Set(
      ((rows ?? []) as unknown as { class_groups: { course_id: string | null } | null }[])
        .map((r) => r.class_groups?.course_id)
        .filter((x): x is string => Boolean(x) && x !== me?.course_id),
    ),
  ];
  if (courseIds.length) {
    await admin.from("course_enrollments").upsert(
      courseIds.map((course_id) => ({ student_id: studentId, course_id })),
      { onConflict: "student_id,course_id", ignoreDuplicates: true },
    );
  }
}
