import { z } from "zod";

/**
 * Brauzerga ham ochiq bo'lgan o'zgaruvchilar (NEXT_PUBLIC_*).
 * Next.js ularni faqat to'liq nomi bilan yozilganda bundle'ga qo'shadi,
 * shuning uchun process.env.X ko'rinishida aniq yozilgan.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function getPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Supabase sozlamalari topilmadi. .env.local faylida NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY ni to'ldiring.",
    );
  }
  return parsed.data;
}
