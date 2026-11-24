import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Pullik testlar: Beginner (14 unit + level) va Pre-Intermediate (9 unit). */

/** Pullik testi bor darajalar (paid_tests.course). */
export const TEST_COURSES = ["Beginner", "Pre-Intermediate"] as const;
export type TestCourse = (typeof TEST_COURSES)[number];
export function isTestCourse(x: unknown): x is TestCourse {
  return typeof x === "string" && (TEST_COURSES as readonly string[]).includes(x);
}

export const RECEIPTS_BUCKET = "receipts";
export const AUDIO_BUCKET = "test-audio";

/**
 * Listening bo'limlariga 3 soatlik audio havolalarini qo'shadi. Faqat test ochiq bo'lgan
 * (sotib olingan yoki o'qituvchi) holatda chaqiriladi — bucket yopiq, havolani server beradi.
 */
export async function withAudioUrls(content: TestContent): Promise<TestContent> {
  const paths = content.sections.flatMap((s) => (s.audio ? [s.audio] : []));
  if (!paths.length) return content;
  const { data } = await createAdminClient().storage.from(AUDIO_BUCKET).createSignedUrls(paths, 3 * 3600);
  const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return { sections: content.sections.map((s) => (s.audio ? { ...s, audioUrl: url.get(s.audio) ?? undefined } : s)) };
}

export type TestItem =
  | { t: "mc"; q: string; o: string[]; hint?: string }
  | { t: "text"; q: string; hint?: string }
  | { t: "tf"; q: string; hint?: string };

export type TestSection = {
  title: string;
  passage?: string;
  box?: string[];
  /** Listening: yopiq "test-audio" bucketidagi fayl yo'li. */
  audio?: string;
  /** Sahifada yaratiladigan vaqtinchalik havola (audio uchun). */
  audioUrl?: string;
  items: TestItem[];
};
export type TestContent = { sections: TestSection[] };
export type TestAnswer = number | boolean | string | null;
export type TestKeyItem = number | boolean | string[];
export type TestResult = { items: { ok: boolean; correct: string }[]; correct: number; total: number };

export type PaidTest = {
  id: string;
  code: string;
  kind: "unit" | "level";
  unit: number | null;
  title: string;
  subtitle: string;
  price: number;
  course: string;
};

export type PurchaseStatus = "pending" | "approved" | "rejected";
export type MyTestState = {
  test: PaidTest;
  purchase: { id: string; status: PurchaseStatus; created_at: string } | null;
  attempt: { score: number | null; submitted_at: string | null } | null;
};

export function formatSom(n: number): string {
  return `${n.toLocaleString("en-US").replace(/,/g, " ")} so‘m`;
}

/** O'quvchi: hamma testlar + o'zining xaridi va natijasi. */
export async function loadMyTests(userId: string): Promise<MyTestState[]> {
  const supabase = await createClient();
  const [{ data: tests }, { data: purchases }, { data: attempts }] = await Promise.all([
    supabase.from("paid_tests").select("id, code, kind, unit, title, subtitle, price, course").order("sort"),
    supabase
      .from("test_purchases")
      .select("id, test_id, status, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("test_attempts").select("test_id, purchase_id, score, submitted_at").eq("student_id", userId),
  ]);
  return ((tests ?? []) as PaidTest[]).map((test) => {
    // Eng so'nggi ochiq (kutilayotgan/tasdiqlangan) xarid, bo'lmasa oxirgi rad etilgani.
    const mine = (purchases ?? []).filter((p) => p.test_id === test.id);
    const open = mine.find((p) => p.status !== "rejected") ?? mine[0] ?? null;
    const attempt = open ? (attempts ?? []).find((a) => a.purchase_id === open.id) ?? null : null;
    return {
      test,
      purchase: open ? { id: open.id, status: open.status as PurchaseStatus, created_at: open.created_at } : null,
      attempt: attempt ? { score: attempt.score === null ? null : Number(attempt.score), submitted_at: attempt.submitted_at } : null,
    };
  });
}

export async function loadPaymentSettings(): Promise<{ card: string; holder: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("payment_settings").select("value").eq("key", "payment").maybeSingle();
  const v = (data?.value ?? {}) as { card?: string; holder?: string };
  return { card: v.card ?? "", holder: v.holder ?? "" };
}

/** "8600123412341234" → "8600 1234 1234 1234". */
export function formatCard(card: string): string {
  return card.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Reklama banneri uchun: har bir daraja bo'yicha pullik testlar (unit testlar soni, narx, level test). */
export type PromoOffer = {
  course: string;
  units: number;
  unitPrice: number;
  unitsHref: string;
  /** Eng katta (yakuniy) umumiy test. */
  level: { price: number; href: string; code: string } | null;
  /** Umumiy (level) testlar soni. */
  levels: number;
};

export async function loadPromoOffers(base: "/oquvchi/testlar" | "/oqituvchi/testlar"): Promise<PromoOffer[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("paid_tests").select("id, code, course, kind, price").eq("is_published", true);
  const rows = (data ?? []) as { id: string; code: string; course: string; kind: string; price: number }[];
  return TEST_COURSES.flatMap((course) => {
    const mine = rows.filter((r) => r.course === course);
    const units = mine.filter((r) => r.kind === "unit");
    const allLevels = mine.filter((r) => r.kind === "level").sort((a, b) => b.price - a.price);
    const level = allLevels[0];
    if (!units.length && !level) return [];
    const q = `?kurs=${encodeURIComponent(course)}`;
    return [
      {
        course,
        units: units.length,
        unitPrice: units[0]?.price ?? 20000,
        unitsHref: base === "/oquvchi/testlar" ? `${base}${q}` : base,
        level: level ? { price: level.price, code: level.code, href: base === "/oquvchi/testlar" ? `${base}/${level.id}` : base } : null,
        levels: allLevels.length,
      },
    ];
  });
}
