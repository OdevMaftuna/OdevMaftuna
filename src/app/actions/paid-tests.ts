"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent, requireTeacher } from "@/lib/auth";
import type { TestAnswer, TestKeyItem, TestResult } from "@/lib/paid-tests";
import { matchesAny } from "@/lib/practice/normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Ok = { ok: true } | { ok: false; error: string };

/** O'quvchi: chekni yukladi → o'qituvchiga to'lov so'rovi. */
export async function requestTestPurchase(testId: string, receiptPath: string, note: string): Promise<Ok> {
  const profile = await requireStudent();
  if (!z.uuid().safeParse(testId).success) return { ok: false, error: "Test not found." };
  if (!receiptPath.startsWith(`${profile.id}/`) || receiptPath.length > 300) return { ok: false, error: "Please upload the receipt again." };
  const supabase = await createClient();
  const { data: test } = await supabase.from("paid_tests").select("id, price").eq("id", testId).maybeSingle();
  if (!test) return { ok: false, error: "Test not found." };
  const { error } = await supabase.from("test_purchases").insert({
    student_id: profile.id,
    test_id: testId,
    amount: test.price,
    receipt_path: receiptPath,
    note: note.trim().slice(0, 300),
  });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "You already sent a payment for this test — wait for your teacher." : "Couldn’t send. Please try again.",
    };
  }
  revalidatePath("/oquvchi/testlar");
  revalidatePath("/oqituvchi/testlar");
  return { ok: true };
}

const answersSchema = z.array(z.union([z.number().int(), z.boolean(), z.string().max(300), z.null()])).max(300);

function grade(answers: TestAnswer[], key: TestKeyItem[], options: (string[] | undefined)[]): TestResult {
  const items = key.map((k, i) => {
    const given = answers[i] ?? null;
    if (typeof k === "boolean") return { ok: given === k, correct: k ? "True" : "False" };
    if (typeof k === "number") return { ok: given === k, correct: options[i]?.[k] ?? "" };
    return { ok: typeof given === "string" && matchesAny(given, k), correct: k[0] };
  });
  return { items, correct: items.filter((x) => x.ok).length, total: items.length };
}

/** O'quvchi: testni topshiradi (bir xarid — bir urinish). Baholash serverda, kalit o'quvchiga ko'rinmaydi. */
export async function submitPaidTest(testId: string, raw: unknown): Promise<{ ok: true; score: number } | { ok: false; error: string }> {
  const profile = await requireStudent();
  if (!z.uuid().safeParse(testId).success) return { ok: false, error: "Test not found." };
  const parsed = answersSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Couldn’t read your answers. Refresh the page and try again." };

  const admin = createAdminClient();
  const { data: purchase } = await admin
    .from("test_purchases")
    .select("id")
    .eq("student_id", profile.id)
    .eq("test_id", testId)
    .eq("status", "approved")
    .maybeSingle();
  if (!purchase) return { ok: false, error: "This test is not open for you yet." };

  const [{ data: existing }, { data: keyRow }, { data: contentRow }] = await Promise.all([
    admin.from("test_attempts").select("id, submitted_at").eq("purchase_id", purchase.id).maybeSingle(),
    admin.from("paid_test_keys").select("answers").eq("test_id", testId).maybeSingle(),
    admin.from("paid_test_content").select("content").eq("test_id", testId).maybeSingle(),
  ]);
  if (existing?.submitted_at) return { ok: false, error: "You have already finished this test." };
  if (!keyRow || !contentRow) return { ok: false, error: "Test not found." };

  const key = keyRow.answers as TestKeyItem[];
  const options = (contentRow.content as { sections: { items: { o?: string[] }[] }[] }).sections.flatMap((s) => s.items.map((it) => it.o));
  const result = grade(parsed.data, key, options);
  const score = Math.round((result.correct / Math.max(1, result.total)) * 100);

  const { error } = await admin.from("test_attempts").upsert(
    {
      purchase_id: purchase.id,
      student_id: profile.id,
      test_id: testId,
      answers: parsed.data,
      result,
      score,
      max_score: 100,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "purchase_id" },
  );
  if (error) return { ok: false, error: "Couldn’t save your result. Please try again." };
  revalidatePath("/oquvchi/testlar");
  return { ok: true, score };
}

/** O'qituvchi: to'lovni tasdiqlaydi yoki rad etadi. */
export async function decideTestPurchase(purchaseId: string, approve: boolean): Promise<{ error?: string }> {
  const teacher = await requireTeacher();
  if (!teacher.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  if (!z.uuid().safeParse(purchaseId).success) return { error: "So‘rov topilmadi." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_purchases")
    .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString(), decided_by: teacher.id })
    .eq("id", purchaseId)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: "Saqlab bo‘lmadi. Qayta urinib ko‘ring." };
  if (!data?.length) return { error: "So‘rov topilmadi yoki allaqachon hal qilingan." };
  revalidatePath("/oqituvchi/testlar");
  revalidatePath("/oqituvchi");
  return {};
}

/** O'qituvchi: karta raqami va egasining ismi. */
export async function savePaymentSettings(card: string, holder: string): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  const digits = card.replace(/\D/g, "");
  if (digits && (digits.length < 16 || digits.length > 19)) return { error: "Karta raqami 16 ta raqamdan iborat bo‘lishi kerak." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_settings")
    .update({ value: { card: digits, holder: holder.trim().slice(0, 80) }, updated_at: new Date().toISOString() })
    .eq("key", "payment");
  if (error) return { error: "Saqlab bo‘lmadi." };
  revalidatePath("/oqituvchi/testlar");
  revalidatePath("/oquvchi/testlar");
  return { ok: true };
}

/** O'qituvchi: test narxini o'zgartiradi. */
export async function saveTestPrice(testId: string, price: number): Promise<{ error?: string }> {
  const me = await requireTeacher();
  if (!me.isAdmin) return { error: "Bu amal faqat asosiy o‘qituvchi (Maftuna Ismoilova) uchun." };
  if (!z.uuid().safeParse(testId).success || !Number.isInteger(price) || price < 0 || price > 10_000_000) return { error: "Narx noto‘g‘ri." };
  const supabase = await createClient();
  const { error } = await supabase.from("paid_tests").update({ price }).eq("id", testId);
  if (error) return { error: "Saqlab bo‘lmadi." };
  revalidatePath("/oqituvchi/testlar");
  revalidatePath("/oquvchi/testlar");
  return {};
}
