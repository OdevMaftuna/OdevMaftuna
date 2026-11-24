import type { Metadata } from "next";
import { PageHeader, card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AddTeacherForm } from "./add-teacher-form";
import { SettingsForm } from "./settings-form";
import { TeacherReset } from "./teacher-reset";
import { SupportToggle } from "./support-toggle";
import { loadSupportFlags } from "@/lib/support";

export const metadata: Metadata = { title: "Sozlamalar" };

/** O'qituvchilar ro'yxati (e-pochtasi bilan). */
async function loadTeachers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("role", "teacher")
    .order("created_at", { ascending: true });
  const admin = createAdminClient();
  return Promise.all(
    (data ?? []).map(async (t) => {
      const { data: u } = await admin.auth.admin.getUserById(t.id);
      return { ...t, email: u.user?.email ?? "" };
    }),
  );
}

export default async function SettingsPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const [{ data }, teachers] = await Promise.all([
    supabase.from("app_settings").select("feedback_language, show_ai_score_immediately").maybeSingle(),
    loadTeachers(),
  ]);
  const support = await loadSupportFlags(teachers.map((t) => t.id));

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <div>
        <PageHeader title="Sozlamalar" description="Sun’iy intellekt tekshiruvi qanday ishlashini belgilang." />
        <div className={`${card} p-5`}>
          <SettingsForm
            language={data?.feedback_language === "en" ? "en" : "uz"}
            showScore={data?.show_ai_score_immediately ?? true}
          />
        </div>
      </div>

      <div>
        <PageHeader
          title="O‘qituvchilar"
          description="Siz — asosiy o‘qituvchi: pul, narxlar, sozlamalar va o‘qituvchilar faqat sizda. Boshqa o‘qituvchilar vazifa beradi, tekshiradi va faqat o‘z guruhidagi (va guruhsiz) o‘quvchilarni boshqaradi. “🛟 Support” huquqi berilgan o‘qituvchi butun guruh natijalarini (Support markazi) ko‘radi."
        />
        <ul className={`${card} mb-4 divide-y divide-neutral-200`}>
          {teachers.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {t.full_name || "—"}
                  {t.id === me.id ? <span className="ml-2 text-xs font-normal text-neutral-500">(siz · asosiy)</span> : null}
                </p>
                <p className="break-all text-sm text-neutral-600">{t.email}</p>
              </div>
              {t.is_active ? null : <span className="text-xs text-red-700">Nofaol</span>}
              {t.id === me.id ? null : (
                <div className="flex flex-wrap items-start gap-2">
                  <SupportToggle id={t.id} name={t.full_name || "O‘qituvchi"} on={support.has(t.id)} />
                  <TeacherReset id={t.id} name={t.full_name || "O‘qituvchi"} />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className={`${card} p-5`}>
          <h2 className="mb-4 font-semibold">Yangi o‘qituvchi qo‘shish</h2>
          <AddTeacherForm />
        </div>
      </div>
    </section>
  );
}
