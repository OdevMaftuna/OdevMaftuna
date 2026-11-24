// Gemini limiti tugagani sabab "error" bo'lib qolgan AI tekshiruvlarini qayta navbatga qo'yish.
//   node --env-file=.env.local scripts/requeue-ai.mjs
// Faqat kvota/limit xatolari (boshqa xatolarga tegmaydi). Navbat o'quvchi yoki o'qituvchi sahifani ochganda
// (yoki keyingi topshirishda) avtomatik ishlaydi.
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await admin
  .from("submissions")
  .update({ ai_status: "pending", ai_error: null, ai_attempts: 0, ai_locked_at: null })
  .eq("ai_status", "error")
  .or("ai_error.ilike.%kvota%,ai_error.ilike.%quota%,ai_error.ilike.%429%,ai_error.ilike.%urinish%")
  .select("id");
if (error) throw error;
console.log(`Qayta navbatga qo'yildi: ${data.length} ta`);
