/**
 * PRE-INTERMEDIATE GRAMMATIKA MAVZULARINI JOYLASH.
 *   node --env-file=.env.local scripts/load-preint-grammar.mjs
 * Manba: materiallar/preint/grammar-out/u<N>.json (qoida + 100 ta mashq, izohlar bilan) va plan.json.
 * Qayta ishga tushirsa bo'ladi: mavzu yangilanadi, o'quvchilarning javoblari o'chmaydi.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: course, error: cErr } = await admin.from("courses").select("id").eq("name", "Pre-Intermediate").single();
if (cErr) throw cErr;

const DIR = "materiallar/preint/grammar-out";
const plan = JSON.parse(fs.readFileSync(path.join(DIR, "plan.json"), "utf8"));
const TITLES = {
  verb: "Complete the sentences with the correct form of the word in brackets (qavsdagi so‘zni to‘g‘ri shaklda yozing)",
  choose: "Choose the correct words (to‘g‘ri variantni tanlang)",
  rewrite: "Rewrite the sentences (gapni qayta yozing — davomini yozing)",
  correct: "Find the correct sentence — two have a mistake (xatosiz gapni toping)",
};
const LETTERS = "ABC";

let n = 0;
for (const u of plan) {
  const file = path.join(DIR, `u${u.unit}.json`);
  if (!fs.existsSync(file)) { console.log(`U${u.unit}: hali yo‘q`); continue; }
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!d.intro) { console.log(`U${u.unit}: qoida yo‘q — o‘tkazib yuborildi`); continue; }
  // Har bir mavzu bo'yicha batafsil qo'llanma (gen-guide.mjs) — bo'lsa, qoida qismida shu ko'rsatiladi.
  const guideFile = path.join(DIR, `u${u.unit}.guide.json`);
  if (fs.existsSync(guideFile)) d.intro.topics = JSON.parse(fs.readFileSync(guideFile, "utf8"));
  const test = [];
  const key = [];
  d.parts.forEach((items, p) => {
    for (const it of items) {
      if (it.kind === "choose" || it.kind === "correct") test.push({ type: "mc", q: it.q, options: it.options, part: p });
      else test.push({ type: "fill", q: it.q, ...(it.hint ? { hint: it.hint } : {}), part: p });
      key.push({
        answer: it.answer,
        accept: it.accept ?? [],
        explain: it.explain,
        ...(it.wrong && Object.keys(it.wrong).length ? { wrong: it.wrong } : {}),
      });
    }
  });
  const testParts = u.parts.map(([kind], p) => `${LETTERS[p]}. ${TITLES[kind]}`);
  const { data, error } = await admin
    .from("practice_topics")
    .upsert(
      {
        course_id: course.id,
        kind: "grammar",
        unit: u.unit,
        code: String(u.code),
        title: u.title,
        title_uz: u.uz,
        sort_order: u.unit,
        content: {
          intro: { signal_words: [], mistakes: [], when: [], ...d.intro },
          parts: [],
          translations: [],
          test,
          testParts,
        },
      },
      { onConflict: "course_id,kind,code" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key: { translations: [], test: key } });
  if (kErr) throw kErr;
  console.log(`U${u.unit}: ${u.title} · ${test.length} mashq`);
  n++;
}
console.log(`Pre-Intermediate: ${n} ta grammatika mavzusi joylandi.`);
