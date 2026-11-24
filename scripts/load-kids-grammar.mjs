/**
 * KIDS (Prezident maktabi) — GRAMMATIKA: kitobdagi 1–25 mavzu (Mock'larsiz), har biriga
 *   • dars (qo'llanilishi, tuzilishi, signal so'zlar, eslatma, ko'p uchraydigan xatolar)
 *   • 200 ta test (Prezident maktabi uslubida, 4 variantli), har bir javobga o'zbekcha izoh,
 *     noto'g'ri variant tanlansa — nega noto'g'ri ekanligi.
 *
 *   node --env-file=.env.local scripts/load-kids-grammar.mjs        — joylaydi / yangilaydi
 *   node --env-file=.env.local scripts/load-kids-grammar.mjs --dry  — faqat tekshiradi, namunani yozadi
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { assemble } from "./kids-grammar/common.mjs";
import * as t1 from "./kids-grammar/t1-plurals.mjs";
import * as t2 from "./kids-grammar/t2-countable.mjs";
import * as t3 from "./kids-grammar/t3-pronouns.mjs";
import * as t4 from "./kids-grammar/t4-tobe.mjs";
import * as t5 from "./kids-grammar/t5-articles.mjs";
import * as t6 from "./kids-grammar/t6-demonstratives.mjs";
import * as t7 from "./kids-grammar/t7-havegot.mjs";
import * as t8 from "./kids-grammar/t8-possessive.mjs";
import * as t9 from "./kids-grammar/t9-continuous.mjs";
import * as t10 from "./kids-grammar/t10-simple.mjs";
import * as t11 from "./kids-grammar/t11-simple-vs-continuous.mjs";
import * as t12 from "./kids-grammar/t12-quantifiers.mjs";
import * as t13 from "./kids-grammar/t13-past-simple.mjs";
import * as t14 from "./kids-grammar/t14-past-continuous.mjs";
import * as t15 from "./kids-grammar/t15-there-is.mjs";
import * as t16 from "./kids-grammar/t16-present-perfect.mjs";
import * as t17 from "./kids-grammar/t17-perfect-vs-past.mjs";
import * as t18 from "./kids-grammar/t18-prepositions.mjs";
import * as t19 from "./kids-grammar/t19-future.mjs";
import * as t20 from "./kids-grammar/t20-adjectives.mjs";
import * as t21 from "./kids-grammar/t21-questions.mjs";
import * as t22 from "./kids-grammar/t22-modals.mjs";
import * as t23 from "./kids-grammar/t23-passive.mjs";
import * as t24 from "./kids-grammar/t24-conditionals.mjs";
import * as t25 from "./kids-grammar/t25-both-neither.mjs";

const DRY = process.argv.includes("--dry");
const COURSE = "Kids (Prezident maktabi)";

const ALL = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18, t19, t20, t21, t22, t23, t24, t25];
// --only=11-25 — faqat shu mavzularni joylaydi (masalan: --only=11-25 yoki --only=13).
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const [from, to] = only ? only.split("-").map(Number) : [1, ALL.length];
const built = ALL.slice(from - 1, (to || from)).map((m) => {
  const t = m.build();
  const { test, key } = assemble(t.pool, t.quotas, t.seed);
  // Sifat nazorati.
  test.forEach((q, i) => {
    const k = key[i];
    if (t.unit >= 11 && q.options.length !== 4) throw new Error(`${t.code} #${i + 1}: 4 ta variant bo'lishi kerak`);
    if (!q.options.includes(k.answer)) throw new Error(`${t.code} #${i + 1}: javob variantlarda yo'q`);
    for (const o of q.options) if (o !== k.answer && !k.wrong[o]) throw new Error(`${t.code} #${i + 1}: “${o}” uchun izoh yo'q`);
    if (!k.explain) throw new Error(`${t.code} #${i + 1}: izoh yo'q`);
    if (/undefined|NaN/.test(JSON.stringify([q, k]))) throw new Error(`${t.code} #${i + 1}: undefined`);
  });
  const perPart = t.parts.map((_, p) => test.filter((x) => x.part === p).length);
  console.log(`${t.code} ${t.title}: ${test.length} ta test · bo'limlar ${perPart.join("/")} · dars ${t.intro.topics.length} qism`);
  return { ...t, test, key };
});
console.log("✓ Sifat nazorati o'tdi.");

if (DRY) {
  fs.writeFileSync(
    "materiallar/kids/grammar-preview.json",
    JSON.stringify(built.map((b) => ({ code: b.code, sample: b.test.slice(0, 5).map((q, i) => ({ ...q, ...b.key[i] })) })), null, 1),
  );
  process.exit(0);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: course, error: cErr } = await admin.from("courses").select("id").eq("name", COURSE).single();
if (cErr) throw new Error(`${COURSE} kursi topilmadi: ${cErr.message}`);
for (const b of built) {
  const { data, error } = await admin
    .from("practice_topics")
    .upsert(
      {
        course_id: course.id,
        kind: "grammar",
        unit: b.unit,
        code: b.code,
        title: b.title,
        title_uz: b.title_uz,
        sort_order: b.unit,
        content: { intro: b.intro, parts: [], translations: [], test: b.test, testParts: b.parts },
      },
      { onConflict: "course_id,kind,code" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`${b.code}: ${error.message}`);
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key: { test: b.key } });
  if (kErr) throw new Error(`${b.code} kalit: ${kErr.message}`);
}
console.log(`✓ ${built.length} ta grammatika mavzusi “${COURSE}” kursiga joylandi.`);
