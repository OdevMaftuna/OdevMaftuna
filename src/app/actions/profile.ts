"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  full_name: z.string().trim().min(3, "Please enter your full name.").max(120, "The name is too long."),
  age: z.coerce.number().int().min(5, "Please enter your real age.").max(99, "Please enter your real age."),
});

/** O'quvchi kabinetida o'z ismi va yoshini o'zgartiradi (kursi va guruhi — faqat o'qituvchi orqali). */
export async function updateMyProfile(fullName: string, age: string): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireStudent();
  const parsed = schema.safeParse({ full_name: fullName, age });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ full_name: parsed.data.full_name, age: parsed.data.age }).eq("id", me.id);
  if (error) return { error: "Couldn’t save. Please try again." };
  await admin.auth.admin.updateUserById(me.id, { user_metadata: { full_name: parsed.data.full_name } });
  refresh();
  return { ok: true };
}

/** Kabinet: yangi profil rasmini saqlash (fayl brauzerdan o'z papkasiga yuklangan bo'ladi). */
export async function setMyAvatar(path: string | null): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireStudent();
  if (path !== null && (!path.startsWith(`${me.id}/`) || path.length > 200 || !/\.(jpg|jpeg|png|webp)$/.test(path))) {
    return { error: "Rasmni qayta yuklang." };
  }
  const admin = createAdminClient();
  const { data: old } = await admin.from("profiles").select("avatar_path").eq("id", me.id).maybeSingle();
  const { error } = await admin.from("profiles").update({ avatar_path: path }).eq("id", me.id);
  if (error) return { error: "Saqlab bo‘lmadi." };
  // Eski rasmni o'chiramiz (joy egallamasin).
  const prev = old?.avatar_path as string | null | undefined;
  if (prev && prev !== path && prev.startsWith(`${me.id}/`)) await admin.storage.from("avatars").remove([prev]);
  refresh();
  return { ok: true };
}
