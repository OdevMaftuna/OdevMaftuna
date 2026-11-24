import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireTeacher, type CurrentProfile } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * SUPPORT O'QITUVCHI — butun guruh (barcha o'qituvchilar o'quvchilari) natijalarini ko'radigan o'qituvchi.
 * Huquq Supabase Auth'dagi `app_metadata.support = true` da saqlanadi (bazaga ustun qo'shish shart emas,
 * foydalanuvchi o'zi o'zgartira olmaydi — faqat service role). Asosiy o'qituvchi (admin) doim ko'radi
 * va Sozlamalar sahifasida istalgan o'qituvchiga bu huquqni beradi yoki oladi.
 */

/** Tezkor tekshiruv (menyu uchun): token ichidagi app_metadata. Huquq berilgach — keyingi token yangilanishida ko'rinadi. */
export const hasSupportClaim = cache(async (): Promise<boolean> => {
  const me = await getCurrentProfile();
  if (me.isAdmin) return true;
  if (me.role !== "teacher") return false;
  const { data } = await (await createClient()).auth.getClaims();
  const meta = data?.claims?.app_metadata as { support?: boolean } | undefined;
  return meta?.support === true;
});

/** Aniq tekshiruv (sahifa uchun): to'g'ridan-to'g'ri Auth'dan o'qiydi. */
export async function isSupportTeacher(id: string): Promise<boolean> {
  const { data } = await createAdminClient().auth.admin.getUserById(id);
  return (data.user?.app_metadata as { support?: boolean } | undefined)?.support === true;
}

/** Support sahifasiga kirish: admin yoki support huquqli o'qituvchi. Aks holda — bosh sahifaga. */
export async function requireSupport(): Promise<CurrentProfile> {
  const me = await requireTeacher();
  if (me.isAdmin || (await isSupportTeacher(me.id))) return me;
  redirect(ROUTES.teacher);
}

/** Barcha o'qituvchilarning support huquqi (Sozlamalar ro'yxati uchun). */
export async function loadSupportFlags(ids: string[]): Promise<Set<string>> {
  const admin = createAdminClient();
  const out = new Set<string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if ((data.user?.app_metadata as { support?: boolean } | undefined)?.support === true) out.add(id);
    }),
  );
  return out;
}
