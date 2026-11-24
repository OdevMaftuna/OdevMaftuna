import "server-only";
import { avatarUrl } from "@/lib/avatar";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * O'quvchi ↔ o'qituvchilar chati. Har o'quvchining bitta ipi (student_id) bor;
 * barcha o'qituvchilar (asosiy va support) o'quvchi ipini ko'radi va javob yozadi.
 * Faqat server: chaqiruvchi avval rolni tekshirgan bo'lishi shart.
 */

export type ChatKind = "text" | "sticker" | "excuse" | "nudge";
export type ChatMessage = {
  id: string;
  sender: { id: string; name: string; teacher: boolean; avatar: string | null };
  kind: ChatKind;
  body: string;
  stickerId: string | null;
  assignmentTitle: string | null;
  createdAt: string;
  readAt: string | null;
};

export async function loadThread(studentId: string, limit = 120): Promise<ChatMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("chat_messages")
    .select("id, sender_id, kind, body, sticker_id, created_at, read_at, assignments(title)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []).reverse();
  const ids = [...new Set(rows.map((r) => r.sender_id as string))];
  const { data: people } = ids.length ? await admin.from("profiles").select("id, full_name, role, avatar_path").in("id", ids) : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id as string, p]));
  return rows.map((r) => {
    const p = who.get(r.sender_id as string);
    const a = r.assignments as { title: string } | { title: string }[] | null;
    return {
      id: r.id as string,
      sender: { id: r.sender_id as string, name: (p?.full_name as string) || "—", teacher: p?.role === "teacher", avatar: avatarUrl(p?.avatar_path as string | null) },
      kind: r.kind as ChatKind,
      body: r.body as string,
      stickerId: (r.sticker_id as string | null) ?? null,
      assignmentTitle: Array.isArray(a) ? (a[0]?.title ?? null) : (a?.title ?? null),
      createdAt: r.created_at as string,
      readAt: (r.read_at as string | null) ?? null,
    };
  });
}

/** O'quvchi uchun: o'qituvchilardan kelgan o'qilmagan xabarlar soni. */
export async function unreadForStudent(studentId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .neq("sender_id", studentId)
    .is("read_at", null);
  return count ?? 0;
}

export type InboxRow = { studentId: string; name: string; avatar: string | null; last: string; lastKind: ChatKind; lastAt: string; unread: number; fromStudent: boolean };

/** O'qituvchi uchun: barcha iplar — oxirgi xabar va o'quvchidan kelgan o'qilmaganlar soni. */
export async function loadInbox(): Promise<InboxRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("chat_messages")
    .select("student_id, sender_id, kind, body, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(1500);
  const rows = data ?? [];
  const byStudent = new Map<string, InboxRow>();
  for (const r of rows) {
    const sid = r.student_id as string;
    let row = byStudent.get(sid);
    if (!row) {
      row = { studentId: sid, name: "", avatar: null, last: r.body as string, lastKind: r.kind as ChatKind, lastAt: r.created_at as string, unread: 0, fromStudent: r.sender_id === sid };
      byStudent.set(sid, row);
    }
    if (r.sender_id === sid && !r.read_at) row.unread++;
  }
  const ids = [...byStudent.keys()];
  const { data: people } = ids.length ? await admin.from("profiles").select("id, full_name, avatar_path").in("id", ids) : { data: [] };
  for (const p of people ?? []) {
    const row = byStudent.get(p.id as string);
    if (row) {
      row.name = (p.full_name as string) || "—";
      row.avatar = avatarUrl(p.avatar_path as string | null);
    }
  }
  return [...byStudent.values()].sort((a, b) => b.unread - a.unread || b.lastAt.localeCompare(a.lastAt));
}

/** O'qituvchi menyusi uchun: o'quvchilardan kelgan o'qilmagan xabarlar jami. */
export async function unreadForTeachers(): Promise<number> {
  const rows = await loadInbox();
  return rows.reduce((t, r) => t + r.unread, 0);
}

/** Sababi hali yozilmagan, muddati o'tgan va topshirilmagan vazifalar id'lari (oxirgi 3 kun). */
export async function excusedAssignmentIds(studentId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data } = await admin.from("chat_messages").select("assignment_id").eq("student_id", studentId).eq("kind", "excuse");
  return new Set((data ?? []).map((r) => r.assignment_id as string).filter(Boolean));
}
