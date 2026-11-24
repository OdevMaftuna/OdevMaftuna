/**
 * PRE-INTERMEDIATE LUG'AT MASHQLARINI JOYLASH.
 *   node --env-file=.env.local scripts/load-preint-vocab.mjs
 * Manba: materiallar/preint/vocab.json (so'zlar) + materiallar/preint/vocab-out/u<N>.json (100 ta mashq).
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

const DIR = "materiallar/preint";
const units = JSON.parse(fs.readFileSync(path.join(DIR, "vocab.json"), "utf8"));
const PARTS = [
  "A. Situations — choose the word from the box (vaziyatga mos so‘zni tanlang)",
  "B. Complete the sentences with the words in the box (gapni to‘ldiring)",
  "C. The first letter is given — write the word (birinchi harfiga qarab yozing)",
];
const hintFor = (w) => [w[0], ..."_".repeat(w.length - 1)].join(" ");

let n = 0;
for (const u of units) {
  const file = path.join(DIR, "vocab-out", `u${u.unit}.json`);
  if (!fs.existsSync(file)) { console.log(`U${u.unit}: mashqlar hali yo‘q`); continue; }
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  // Batafsil izohlar (gen-explain.mjs): why — nega to'g'ri, wrong — har bir xato variant uchun.
  const exFile = path.join(DIR, "vocab-out", `u${u.unit}.explain.json`);
  const ex = fs.existsSync(exFile) ? JSON.parse(fs.readFileSync(exFile, "utf8")) : [];
  let idx = 0;
  const explainOf = (it) => {
    const e = ex[idx++];
    if (!e?.why) return { explain: it.explain };
    // Izohdagi birinchi «...» so'zni aniq javob bilan almashtiramiz (AI imlo xatosidan saqlanish uchun).
    const why = e.why.replace(/«[^»]*»/, `«${it.answer}»`);
    return { explain: why, ...(e.wrong && Object.keys(e.wrong).length ? { wrong: e.wrong } : {}) };
  };
  const test = [];
  const key = [];
  // Kitobdagi unit boshidagi so'zlar bo'yicha qo'shimcha mashqlar (gen-book.mjs) — A va B qismlar orasiga aralashtiriladi.
  const bookFile = path.join(DIR, "vocab-out", `u${u.unit}.book.json`);
  const book = fs.existsSync(bookFile) ? JSON.parse(fs.readFileSync(bookFile, "utf8")) : [];
  const fromBook = (it) => ({
    t: { type: "mc", q: it.q, options: it.options },
    k: { answer: it.answer, explain: it.why, ...(Object.keys(it.wrong ?? {}).length ? { wrong: it.wrong } : {}) },
  });
  const mix = (base, extra) => {
    // Qo'shimchalarni teng oraliqda joylashtiramiz (oxiriga to'planib qolmasin).
    const out = [...base];
    extra.forEach((x, i) => out.splice(Math.round(((i + 1) * out.length) / (extra.length + 1)), 0, x));
    return out;
  };
  const partA = mix(
    d.a.map((it) => ({ t: { type: "mc", q: it.q, options: it.options }, k: { answer: it.answer, ...explainOf(it) } })),
    book.filter((b) => b.kind === "situation").map(fromBook),
  );
  const partB = mix(
    d.b.map((it) => ({ t: { type: "mc", q: it.q, options: it.options }, k: { answer: it.answer, ...explainOf(it) } })),
    book.filter((b) => b.kind !== "situation").map(fromBook),
  );
  for (const [p, list] of [[0, partA], [1, partB]]) {
    for (const x of list) {
      test.push({ ...x.t, part: p });
      key.push(x.k);
    }
  }
  for (const it of d.c) {
    // Savolda birinchi harf "a______" bo'lib qolgan bo'lsa, faqat bo'shliqni qoldiramiz (harf maslahatda bor).
    const q = it.q.replace(new RegExp("(^|[^A-Za-z])" + it.answer[0] + "(_{3,})", "i"), "$1$2").replace(/(_{3,})/, "$1", "$1");
    test.push({ type: "fill", q, hint: hintFor(it.answer), part: 2 });
    key.push({ answer: it.answer, accept: [], explain: explainOf(it).explain });
  }
  const words = u.words.map((w) => ({ en: w.en, uz: w.uz }));
  const { data, error } = await admin
    .from("practice_topics")
    .upsert(
      {
        course_id: course.id,
        kind: "vocab",
        unit: u.unit,
        code: `L${u.unit}`,
        title: `Unit ${u.unit} vocabulary`,
        title_uz: `${u.unit}-unit so‘zlari (${words.length} ta)`,
        sort_order: 100 + u.unit,
        content: { words, test, testParts: PARTS },
      },
      { onConflict: "course_id,kind,code" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key: { test: key } });
  if (kErr) throw kErr;
  console.log(`U${u.unit}: ${words.length} so‘z · ${test.length} mashq`);
  n++;
}
console.log(`Pre-Intermediate: ${n} ta lug‘at uniti joylandi.`);
