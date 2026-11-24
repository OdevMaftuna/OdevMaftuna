// "So'z tarjimasi" sinonimlari qo'shilgach, eski topshiriqlarni qayta baholash
// va yozma qismni AI'ga qayta yuborish (har bir javob bo'yicha ✓/✗ + izoh chiqishi uchun).
//   node --env-file=.env.local scripts/regrade-wordtr.mjs [--dry] [--no-ai]
import { createClient } from "@supabase/supabase-js";
import { WORD_SYNONYMS } from "../src/lib/lesson/synonyms.ts";

const DRY = process.argv.includes("--dry");
const NO_AI = process.argv.includes("--no-ai");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// grade.ts dagi bilan bir xil.
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[.!?,;:"“”()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the|to)\s+/, "");
const matches = (answer, key) => {
  const a = norm(answer);
  if (!a) return false;
  if (a === norm(key)) return true;
  return key.split(/[/,]/).map(norm).filter(Boolean).some((x) => x === a);
};
const trMatches = (answer, key) => matches(answer, key) || (WORD_SYNONYMS[norm(key)] ?? []).some((alt) => matches(answer, alt));
const display = (key) => {
  const alts = WORD_SYNONYMS[norm(key)] ?? [];
  return alts.length ? [key, ...alts].join(" / ") : key;
};

/** Bitta natija (asosiy yoki retry) ichidagi wordTr ni qayta belgilaydi; nechta o'zgarganini qaytaradi. */
function fixResult(res, answers, key) {
  let gained = 0;
  const fixList = (items, given, keys) =>
    items.map((it, j) => {
      const k = keys?.[j];
      if (!k) return it;
      const ok = trMatches(given?.[j] ?? "", k);
      if (ok && !it.ok) gained++;
      return { ok: it.ok || ok, correct: display(k) };
    });
  if (res.readings) {
    res.readings = res.readings.map((r, i) => ({ ...r, wordTr: fixList(r.wordTr ?? [], answers.readings?.[i]?.wordTr, key.readings?.[i]?.wordTr) }));
  }
  if (res.review) {
    res.review = { ...res.review, wordTr: fixList(res.review.wordTr ?? [], answers.review?.wordTr, key.review?.wordTr) };
  }
  if (gained && res.auto) {
    const correct = res.auto.correct + gained;
    res.auto = { ...res.auto, correct, score: Math.round((correct / res.auto.total) * res.auto.max * 10) / 10 };
  }
  return gained;
}

const { data: subs, error } = await admin
  .from("submissions")
  .select("id, assignment_id, answers, lesson_result, ai_status, assignments!inner(title, lesson)")
  .not("lesson_result", "is", null);
if (error) throw error;

let changed = 0;
let requeued = 0;
for (const s of subs) {
  const kind = s.assignments.lesson?.kind;
  if (kind !== "reading" && kind !== "review") continue;
  const { data: keyRow } = await admin.from("assignment_keys").select("key").eq("assignment_id", s.assignment_id).maybeSingle();
  if (!keyRow) continue;
  const res = structuredClone(s.lesson_result);
  let gained = fixResult(res, s.answers ?? {}, keyRow.key);
  for (const r of res.retries ?? []) gained += fixResult(r.result, r.answers ?? {}, keyRow.key);

  const update = { lesson_result: res };
  // Yozma qismga har bir javob bo'yicha izoh hali yo'q bo'lsa — AI qayta tekshiradi (speaking qayta tekshirilmaydi).
  const needItems = !NO_AI && res.writtenFeedback && !res.writtenFeedback.items;
  if (needItems) {
    delete res.writtenFeedback;
    delete res.ai;
    Object.assign(update, { ai_status: "pending", ai_error: null, ai_attempts: 0, ai_locked_at: null });
  } else if (!NO_AI && s.ai_status === "error") {
    Object.assign(update, { ai_status: "pending", ai_error: null, ai_attempts: 0, ai_locked_at: null });
  }
  if (!gained && !needItems && !update.ai_status) continue;
  console.log(`${s.assignments.title} · ${s.id.slice(0, 8)} · +${gained} so'z${update.ai_status ? " · AI qayta" : ""}`);
  if (gained) changed++;
  if (update.ai_status) requeued++;
  if (!DRY) {
    const { error: e } = await admin.from("submissions").update(update).eq("id", s.id);
    if (e) throw e;
  }
}
console.log(`${DRY ? "[dry] " : ""}So'z tarjimasi tuzatildi: ${changed} ta · AI qayta tekshiradi: ${requeued} ta`);
