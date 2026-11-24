import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env.server";

/**
 * Service role client — RLS'ni chetlab o'tadi.
 * FAQAT serverda va FAQAT o'qituvchi ekanligi tekshirilgandan keyin chaqiriladi
 * (o'quvchi hisobini yaratish, parolni tiklash va h.k.).
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
