import "server-only";
import { avatarUrl } from "@/lib/avatar";
import { loadStreakFor } from "@/lib/streak";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Your Wanderland" sayohat jamoasi: qabul qilingan do'stlar (va o'zi) seriyasi bilan,
 * kelgan va yuborilgan takliflar. Do'stlar bir-birining faqat ismi va sayohatini ko'radi.
 */

export const MAX_FRIENDS = 10;

export type CrewMember = { id: string; name: string; count: number; today: boolean; me: boolean; avatar: string | null };
export type CrewInvite = { id: string; name: string };
export type Crew = { code: string; members: CrewMember[]; incoming: CrewInvite[]; outgoing: CrewInvite[] };

export async function loadCrew(meId: string, meName: string, myCount: number, myToday: boolean, nowMs: number): Promise<Crew> {
  const admin = createAdminClient();
  const [{ data: me }, { data: links }] = await Promise.all([
    admin.from("profiles").select("friend_code, avatar_path").eq("id", meId).maybeSingle(),
    admin.from("travel_friends").select("id, from_id, to_id, status").or(`from_id.eq.${meId},to_id.eq.${meId}`),
  ]);
  const rows = links ?? [];
  const otherOf = (r: { from_id: string; to_id: string }) => (r.from_id === meId ? r.to_id : r.from_id);
  const friendIds = rows.filter((r) => r.status === "accepted").map(otherOf).slice(0, MAX_FRIENDS);
  const pendingIn = rows.filter((r) => r.status === "pending" && r.to_id === meId);
  const pendingOut = rows.filter((r) => r.status === "pending" && r.from_id === meId);

  const ids = [...new Set([...friendIds, ...pendingIn.map((r) => r.from_id), ...pendingOut.map((r) => r.to_id)])];
  const { data: people } = ids.length ? await admin.from("profiles").select("id, full_name, avatar_path").in("id", ids) : { data: [] };
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, (p.full_name as string) || "Student"]));
  const avatarOf = new Map((people ?? []).map((p) => [p.id as string, avatarUrl(p.avatar_path as string | null)]));

  const streaks = await Promise.all(friendIds.map((id) => loadStreakFor(id, nowMs)));
  const members: CrewMember[] = [
    { id: meId, name: meName || "Siz", count: myCount, today: myToday, me: true, avatar: avatarUrl(me?.avatar_path as string | null) },
    ...friendIds.map((id, i) => ({ id, name: nameOf.get(id) ?? "Student", count: streaks[i].count, today: streaks[i].today, me: false, avatar: avatarOf.get(id) ?? null })),
  ].sort((a, b) => b.count - a.count || Number(b.today) - Number(a.today));

  return {
    code: (me?.friend_code as string) ?? "",
    members,
    incoming: pendingIn.map((r) => ({ id: r.id as string, name: nameOf.get(r.from_id) ?? "Student" })),
    outgoing: pendingOut.map((r) => ({ id: r.id as string, name: nameOf.get(r.to_id) ?? "Student" })),
  };
}
