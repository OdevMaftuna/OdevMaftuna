import "server-only";
import { loadDailyHomework, type DailyGroup } from "@/lib/daily-homework";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSupportFlags } from "@/lib/support";

/**
 * SUPPORT JAMOASI (0023).
 *  - Har bir guruhga bitta mas'ul support (class_groups.support_id).
 *  - Support o'quvchi bilan qilgan ishini belgilaydi (support_actions): eslatma, qo'ng'iroq, mavzu tushuntirish, 100/100.
 *  - Asosiy o'qituvchi har bir support qanday ishlayotganini ko'radi (loadSupportBoard).
 */

import type { ActionKind } from "@/lib/support-kinds";
export type { ActionKind } from "@/lib/support-kinds";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type ActionRow = { support_id: string; student_id: string | null; group_id: string | null; kind: ActionKind; note: string; created_at: string };

/* ------------------------------------------------------------------ */
/* Support o'zi uchun: "Mening o'quvchilarim"                          */
/* ------------------------------------------------------------------ */

export type SupportDeskData = {
  groups: DailyGroup[];
  /** Oxirgi 24 soatda o'quvchi bilan qilingan ishlar: studentId → turlar. */
  actions: Record<string, ActionKind[]>;
  /** Past natija bilan ishlangan (natijadan keyin "tushuntirdi" yoki "100 oldi" belgilangan): `${studentId}|${at}`. */
  handledLow: string[];
  /** Bugungi (24 soat) harakatlar soni. */
  doneToday: number;
  /** Server soati (ms). */
  now: number;
};

export async function loadSupportDesk(supportId: string, now = Date.now()): Promise<SupportDeskData | null> {
  const groups = (await loadDailyHomework(now).catch(() => [] as DailyGroup[])).filter((g) => g.supportId === supportId);
  if (!groups.length) return null;
  const studentIds = [
    ...new Set(groups.flatMap((g) => [...(g.today?.notDone ?? []), ...(g.today?.done ?? [])].map((p) => p.studentId).concat(g.low.map((l) => l.studentId))).filter((x): x is string => Boolean(x))),
  ];
  const { data } = studentIds.length
    ? await createAdminClient()
        .from("support_actions")
        .select("support_id, student_id, group_id, kind, note, created_at")
        .in("student_id", studentIds)
        .gte("created_at", new Date(now - 4 * DAY).toISOString())
    : { data: [] as ActionRow[] };
  const rows = (data ?? []) as ActionRow[];
  const actions: Record<string, ActionKind[]> = {};
  let doneToday = 0;
  for (const r of rows) {
    if (!r.student_id || now - Date.parse(r.created_at) > DAY) continue;
    (actions[r.student_id] ??= []).push(r.kind);
    if (r.support_id === supportId) doneToday++;
  }
  const handledLow = groups.flatMap((g) =>
    g.low
      .filter((l) => rows.some((r) => r.student_id === l.studentId && (r.kind === "explain" || r.kind === "retake") && Date.parse(r.created_at) >= Date.parse(l.at)))
      .map((l) => `${l.studentId}|${l.at}`),
  );
  return { groups, actions, handledLow, doneToday, now };
}

/* ------------------------------------------------------------------ */
/* Asosiy o'qituvchi uchun: supportlar nazorati                        */
/* ------------------------------------------------------------------ */

export type SupportStatus = "green" | "yellow" | "red";

export type SupportCard = {
  id: string;
  name: string;
  email: string | null;
  lastSignIn: string | null;
  groups: { id: string; name: string }[];
  students: number;
  today: { done: number; total: number; dueAt: string | null };
  yesterday: { done: number; total: number };
  lowOpen: { name: string; pct: number; what: string }[];
  lowHandled: number;
  actions24h: number;
  actions7d: number;
  perKind7d: Record<ActionKind, number>;
  messages7d: number;
  checks7d: number;
  lastActionAt: string | null;
  status: SupportStatus;
  reasons: string[];
  recent: { kind: ActionKind; student: string; group: string; note: string; at: string }[];
};

export type SupportBoard = {
  supports: SupportCard[];
  /** Mas'ul support biriktirilmagan guruhlar. */
  unassigned: { id: string; name: string }[];
  /** Biriktirish uchun barcha guruhlar va mumkin bo'lgan supportlar. */
  allGroups: { id: string; name: string; supportId: string | null }[];
  candidates: { id: string; name: string }[];
  now: number;
};

export async function loadSupportBoard(now = Date.now()): Promise<SupportBoard> {
  const admin = createAdminClient();
  const since7 = new Date(now - 7 * DAY).toISOString();
  const [{ data: teachers }, { data: groups }, daily, { data: acts }, { data: msgs }, { data: checks }, { data: studentNames }] = await Promise.all([
    admin.from("profiles").select("id, full_name, is_admin").eq("role", "teacher").eq("is_active", true),
    admin.from("class_groups").select("id, name, support_id, sort").order("sort"),
    loadDailyHomework(now).catch(() => [] as DailyGroup[]),
    admin.from("support_actions").select("support_id, student_id, group_id, kind, note, created_at").gte("created_at", since7).order("created_at", { ascending: false }).limit(5000),
    admin.from("chat_messages").select("sender_id, created_at").gte("created_at", since7).limit(20000),
    admin.from("group_checks").select("marked_by, marked_at").gte("marked_at", since7).limit(20000),
    admin.from("profiles").select("id, full_name").eq("role", "student").limit(5000),
  ]);
  const tList = ((teachers ?? []) as { id: string; full_name: string; is_admin: boolean }[]).filter((t) => !t.is_admin);
  const gList = (groups ?? []) as { id: string; name: string; support_id: string | null }[];
  const flags = await loadSupportFlags(tList.map((t) => t.id));
  const assigned = new Set(gList.map((g) => g.support_id).filter(Boolean));
  const supportIds = tList.filter((t) => flags.has(t.id) || assigned.has(t.id)).map((t) => t.id);
  const sName = new Map(((studentNames ?? []) as { id: string; full_name: string }[]).map((s) => [s.id, s.full_name]));
  const gName = new Map(gList.map((g) => [g.id, g.name]));
  const actions = (acts ?? []) as ActionRow[];

  // Oxirgi kirish — Auth'dan.
  const users = new Map<string, { email: string | null; last: string | null; created: string | null }>();
  await Promise.all(
    supportIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      users.set(id, { email: data.user?.email ?? null, last: data.user?.last_sign_in_at ?? null, created: data.user?.created_at ?? null });
    }),
  );

  const supports: SupportCard[] = supportIds.map((id) => {
    const t = tList.find((x) => x.id === id)!;
    const myGroups = gList.filter((g) => g.support_id === id);
    const myDaily = daily.filter((d) => d.supportId === id);
    const mine = actions.filter((a) => a.support_id === id);
    const perKind7d = { remind: 0, call: 0, explain: 0, retake: 0, note: 0 } as Record<ActionKind, number>;
    for (const a of mine) perKind7d[a.kind]++;
    const myMsgs = ((msgs ?? []) as { sender_id: string | null; created_at: string }[]).filter((m) => m.sender_id === id);
    const myChecks = ((checks ?? []) as { marked_by: string | null; marked_at: string }[]).filter((c) => c.marked_by === id);
    const times = [...mine.map((a) => a.created_at), ...myMsgs.map((m) => m.created_at), ...myChecks.map((c) => c.marked_at)].map(Date.parse);
    const lastActionAt = times.length ? new Date(Math.max(...times)).toISOString() : null;
    const actions24h =
      mine.filter((a) => now - Date.parse(a.created_at) < DAY).length +
      myMsgs.filter((m) => now - Date.parse(m.created_at) < DAY).length +
      myChecks.filter((c) => now - Date.parse(c.marked_at) < DAY).length;

    const today = myDaily.reduce(
      (acc, g) => (g.today ? { done: acc.done + g.today.done.length, total: acc.total + g.today.done.length + g.today.notDone.length, dueAt: acc.dueAt ?? g.today.dueAt } : acc),
      { done: 0, total: 0, dueAt: null as string | null },
    );
    const yesterday = myDaily.reduce((acc, g) => (g.yesterday ? { done: acc.done + g.yesterday.done, total: acc.total + g.yesterday.total } : acc), { done: 0, total: 0 });
    const lows = myDaily.flatMap((g) => g.low);
    const isHandled = (l: (typeof lows)[number]) => actions.some((a) => a.student_id === l.studentId && (a.kind === "explain" || a.kind === "retake") && Date.parse(a.created_at) >= Date.parse(l.at));
    const lowOpen = lows.filter((l) => !isHandled(l)).map((l) => ({ name: l.name, pct: l.pct, what: l.what }));
    const students = myDaily.reduce((n, g) => n + (g.today ? g.today.done.length + g.today.notDone.length : 0) + g.noAccount.length, 0);

    // Holat: qizil — 2 kundan beri hech narsa qilmagan yoki muddat yaqin, bajarmaganlar bor, lekin bugun harakat yo'q.
    const reasons: string[] = [];
    const idleH = lastActionAt ? (now - Date.parse(lastActionAt)) / HOUR : Infinity;
    const notDone = today.total - today.done;
    if (!myGroups.length) reasons.push("Guruh biriktirilmagan");
    const created = users.get(id)?.created;
    const isNew = idleH === Infinity && created !== null && created !== undefined && now - Date.parse(created) < 2 * DAY;
    if (isNew) reasons.push("Yangi hisob — hali ish boshlamagan");
    else if (idleH === Infinity) reasons.push("Hali birorta ish qilmagan");
    else if (idleH >= 48) reasons.push(`${Math.floor(idleH / 24)} kundan beri harakat yo‘q`);
    else if (idleH >= 24) reasons.push("24 soatdan beri harakat yo‘q");
    if (notDone > 0 && actions24h === 0) reasons.push(`${notDone} kishi bugungi vazifani qilmagan — eslatma yuborilmagan`);
    if (lowOpen.length) reasons.push(`${lowOpen.length} ta past natija bilan hali ishlanmagan`);
    if (yesterday.total && yesterday.done / yesterday.total < 0.6) reasons.push(`Kecha faqat ${yesterday.done}/${yesterday.total} topshirgan`);
    const status: SupportStatus =
      (idleH >= 48 && !isNew) || (notDone > 0 && actions24h === 0 && today.dueAt !== null && Date.parse(today.dueAt) - now < 4 * HOUR)
        ? "red"
        : idleH >= 24 || lowOpen.length > 0 || (notDone > 0 && actions24h === 0)
          ? "yellow"
          : "green";

    return {
      id,
      name: t.full_name || "Support",
      email: users.get(id)?.email ?? null,
      lastSignIn: users.get(id)?.last ?? null,
      groups: myGroups.map((g) => ({ id: g.id, name: g.name })),
      students,
      today,
      yesterday,
      lowOpen,
      lowHandled: lows.length - lowOpen.length,
      actions24h,
      actions7d: mine.length + myMsgs.length + myChecks.length,
      perKind7d,
      messages7d: myMsgs.length,
      checks7d: myChecks.length,
      lastActionAt,
      status,
      reasons,
      recent: mine.slice(0, 8).map((a) => ({
        kind: a.kind,
        student: (a.student_id && sName.get(a.student_id)) || "—",
        group: (a.group_id && gName.get(a.group_id)) || "",
        note: a.note,
        at: a.created_at,
      })),
    };
  });

  const order: Record<SupportStatus, number> = { red: 0, yellow: 1, green: 2 };
  supports.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));

  return {
    supports,
    unassigned: gList.filter((g) => !g.support_id).map((g) => ({ id: g.id, name: g.name })),
    allGroups: gList.map((g) => ({ id: g.id, name: g.name, supportId: g.support_id })),
    candidates: tList.filter((t) => flags.has(t.id) || assigned.has(t.id)).map((t) => ({ id: t.id, name: t.full_name })),
    now,
  };
}
