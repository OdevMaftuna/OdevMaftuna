import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

/**
 * Server component / server action / route handler uchun Supabase client.
 * Foydalanuvchining sessiyasi (cookie) bilan ishlaydi, ya'ni RLS qoidalari amal qiladi.
 */
export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server component ichida cookie yozib bo'lmaydi.
            // Sessiyani yangilash proxy (middleware) da bajariladi, shuning uchun e'tiborsiz qoldiriladi.
          }
        },
      },
    },
  );
}
