"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/lib/auth";
import { MAX_FRIENDS } from "@/lib/crew";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Your Wanderland" do'stlari: ID orqali taklif, qabul/rad, o'chirish.
 * Hamma yozuv service role orqali, har doim joriy o'quvchi tekshirilgandan keyin.
 */

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function friendCount(meId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("travel_friends")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`from_id.eq.${meId},to_id.eq.${meId}`);
  return count ?? 0;
}

export async function inviteFriend(rawCode: string): Promise<Result> {
  const me = await requireStudent();
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) return { ok: false, error: "ID 6 ta belgidan iborat (masalan 4A951D)." };
  const admin = createAdminClient();
  const { data: friend } = await admin.from("profiles").select("id, full_name, role, is_active, friend_code").eq("friend_code", code).maybeSingle();
  if (!friend || friend.role !== "student" || !friend.is_active) return { ok: false, error: "Bunday ID'li o‘quvchi topilmadi." };
  if (friend.id === me.id) return { ok: false, error: "Bu sizning o‘z ID'ingiz 🙂" };
  if ((await friendCount(me.id)) >= MAX_FRIENDS) return { ok: false, error: `Sayohatda ko‘pi bilan ${MAX_FRIENDS} ta do‘st bo‘ladi.` };

  const { data: existing } = await admin
    .from("travel_friends")
    .select("id, from_id, status")
    .or(`and(from_id.eq.${me.id},to_id.eq.${friend.id}),and(from_id.eq.${friend.id},to_id.eq.${me.id})`)
    .maybeSingle();
  if (existing?.status === "accepted") return { ok: false, error: "Siz allaqachon birga sayohat qilyapsiz." };
  if (existing && existing.from_id === me.id) return { ok: false, error: "Taklif allaqachon yuborilgan — javobini kuting." };
  if (existing) {
    // U sizni avval taklif qilgan ekan — darhol birga sayohatga chiqasiz.
    await admin.from("travel_friends").update({ status: "accepted" }).eq("id", existing.id);
    revalidatePath("/oquvchi");
    return { ok: true, message: `${friend.full_name} bilan birga yo‘lga chiqdingiz! 🚗` };
  }
  const { error } = await admin.from("travel_friends").insert({ from_id: me.id, to_id: friend.id });
  if (error) return { ok: false, error: "Taklif yuborib bo‘lmadi. Qayta urinib ko‘ring." };
  revalidatePath("/oquvchi");
  return { ok: true, message: `Taklif ${friend.full_name}ga yuborildi ✉️` };
}

export async function respondInvite(inviteId: string, accept: boolean): Promise<Result> {
  const me = await requireStudent();
  if (!z.uuid().safeParse(inviteId).success) return { ok: false, error: "Taklif topilmadi." };
  const admin = createAdminClient();
  const { data: inv } = await admin.from("travel_friends").select("id, to_id, status").eq("id", inviteId).maybeSingle();
  if (!inv || inv.to_id !== me.id || inv.status !== "pending") return { ok: false, error: "Taklif topilmadi." };
  if (accept && (await friendCount(me.id)) >= MAX_FRIENDS) return { ok: false, error: `Sayohatda ko‘pi bilan ${MAX_FRIENDS} ta do‘st bo‘ladi.` };
  const { error } = accept
    ? await admin.from("travel_friends").update({ status: "accepted" }).eq("id", inviteId)
    : await admin.from("travel_friends").delete().eq("id", inviteId);
  if (error) return { ok: false, error: "Saqlab bo‘lmadi." };
  revalidatePath("/oquvchi");
  return { ok: true };
}

/** Do'stni sayohatdan chiqarish yoki yuborilgan taklifni bekor qilish. */
export async function leaveFriend(otherId: string): Promise<Result> {
  const me = await requireStudent();
  if (!z.uuid().safeParse(otherId).success) return { ok: false, error: "Topilmadi." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("travel_friends")
    .delete()
    .or(`and(from_id.eq.${me.id},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${me.id})`);
  if (error) return { ok: false, error: "O‘chirib bo‘lmadi." };
  revalidatePath("/oquvchi");
  return { ok: true };
}
