/**
 * PRE-INTERMEDIATE "USEFUL PHRASES" (Functions Bank) BO'LIMINI JOYLASH.
 *   node --env-file=.env.local scripts/load-preint-functions.mjs
 * Manba: materiallar/preint/functions.json (iboralar) + functions-out/u<N>.json (qo'llanma + 100 ta mashq).
 * Har bir unit — bitta to'plam: avval o'rganish (iboralar ma'nosi, misollar, tuzilishi), keyin mashqlar.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: course, error: cErr } = await admin.from("courses").select("id").eq("name", "Pre-Intermediate").single();
if (cErr) throw cErr;

const units = JSON.parse(fs.readFileSync("materiallar/preint/functions.json", "utf8"));
const TITLES = {
  abc: "Read the dialogues and choose A, B or C (dialogni o‘qib, to‘g‘ri variantni tanlang)",
  abctext: "Read the texts and choose A, B or C (matnni o‘qib, to‘g‘ri variantni tanlang)",
  word: "Complete the dialogues with one word in each gap (har bo‘shliqqa bitta so‘z yozing)",
  rewrite: "Rewrite the sentences with the word in brackets (qavsdagi so‘z bilan qayta yozing)",
  fix: "Find the mistake and write the correct word (xatoni topib, to‘g‘ri so‘zni yozing)",
};
const LETTERS = "ABC";

let n = 0;
for (const u of units) {
  const file = path.join("materiallar/preint/functions-out", `u${u.unit}.json`);
  if (!fs.existsSync(file)) { console.log(`U${u.unit}: hali yo‘q`); continue; }
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!d.guide?.topics?.length) { console.log(`U${u.unit}: qo‘llanma yo‘q`); continue; }
  const test = [];
  const key = [];
  const kinds = [];
  d.parts.forEach((items, p) => {
    for (const it of items) {
      kinds[p] = it.kind;
      if (it.kind === "abc" || it.kind === "abctext") test.push({ type: "mc", q: it.q, options: it.options, part: p });
      else test.push({ type: "fill", q: it.q, ...(it.hint ? { hint: it.hint } : {}), part: p });
      key.push({
        answer: it.answer,
        accept: it.accept ?? [],
        explain: it.explain,
        ...(it.wrong && Object.keys(it.wrong).length ? { wrong: it.wrong } : {}),
      });
    }
  });
  const phrases = u.sets.flatMap((s) => s.phrases.map(([en, uz]) => ({ en, uz })));
  const titles = u.sets.map((s) => `${s.lesson} ${s.title}`);
  const { data, error } = await admin
    .from("practice_topics")
    .upsert(
      {
        course_id: course.id,
        kind: "phrasal",
        unit: u.unit,
        code: `F${u.unit}`,
        title: `Unit ${u.unit} useful phrases`,
        title_uz: `${u.sets.map((s) => s.uz).join(" · ")} (${phrases.length} ta ibora)`,
        sort_order: 200 + u.unit,
        content: {
          intro: {
            what: titles.join(" · "),
            when: [],
            structures: [],
            rules: [],
            signal_words: [],
            mistakes: d.guide.mistakes ?? [],
            topics: d.guide.topics,
          },
          parts: [],
          translations: [],
          test,
          testParts: kinds.map((k, p) => `${LETTERS[p]}. ${TITLES[k] ?? k}`),
        },
      },
      { onConflict: "course_id,kind,code" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key: { translations: [], test: key } });
  if (kErr) throw kErr;
  console.log(`U${u.unit}: ${phrases.length} ibora · ${test.length} mashq`);
  n++;
}
console.log(`Useful phrases: ${n} ta unit joylandi.`);
