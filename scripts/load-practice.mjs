/**
 * MUDDATSIZ MASHQLARNI JOYLASH (Beginner): grammatika mavzulari va lug'at mashqlari.
 *
 *   npm run load-practice                 — tayyor mavzular va 14 ta lug'at unitini joylaydi / yangilaydi
 *
 * Qayta ishga tushirsa bo'ladi: mavjud mavzular yangilanadi (o'quvchilarning javoblari o'chmaydi).
 * Manba: materiallar/beginner/grammar/topics.json + out/<kod>.json, materiallar/beginner/vocab.json
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const fail = (m, e) => {
  console.error(`Xato: ${m}${e ? ` — ${e.message ?? e}` : ""}`);
  process.exit(1);
};

const { data: course, error: cErr } = await admin.from("courses").select("id").eq("name", "Beginner").single();
if (cErr) fail("Beginner kursi topilmadi", cErr);

async function upsertTopic(row, key) {
  const { data, error } = await admin
    .from("practice_topics")
    .upsert({ course_id: course.id, ...row }, { onConflict: "course_id,kind,code" })
    .select("id")
    .single();
  if (error) fail(`mavzu ${row.code}`, error);
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key });
  if (kErr) fail(`kalit ${row.code}`, kErr);
}

// ---------------------------------------------------------------- grammatika
const GDIR = "materiallar/beginner/grammar";
const topics = JSON.parse(fs.readFileSync(path.join(GDIR, "topics.json"), "utf8"));
let g = 0;
for (const [i, t] of topics.entries()) {
  const file = path.join(GDIR, "out", `${t.code}.json`);
  if (!fs.existsSync(file)) continue;
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!d.intro || !d.test || !d.tr1 || !d.tr51) continue;
  const tr = [...d.tr1, ...d.tr51];
  // Ishora javobning o'zi bo'lsa — ko'rsatilmaydi (javobni aytib qo'ymasin).
  const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ").trim();
  const givesAway = (q) =>
    !/\/|\+/.test(q.hint ?? "") && [q.answer, ...(q.accept ?? [])].some((a) => norm(a) === norm(q.hint));
  const test = d.test.map((q) =>
    q.type === "mc"
      ? { type: "mc", q: q.q, options: q.options }
      : { type: "fill", q: q.q, ...(q.hint && !givesAway(q) ? { hint: q.hint } : {}) },
  );
  await upsertTopic(
    {
      kind: "grammar",
      unit: t.unit,
      code: t.code,
      title: t.title,
      title_uz: t.uz,
      sort_order: i,
      content: {
        intro: { signal_words: [], mistakes: [], when: [], ...d.intro },
        parts: t.parts,
        translations: tr.map((x) => ({ part: Math.min(2, Math.max(0, x.part ?? 0)), uz: x.uz })),
        test,
      },
    },
    {
      translations: tr.map((x) => ({ en: x.en, rule: x.rule ?? "" })),
      test: d.test.map((q) => ({ answer: q.answer, accept: (q.accept ?? []).filter(Boolean), explain: q.explain })),
    },
  );
  g++;
}

// ---------------------------------------------------------------- lug'at (100 ta mashq, har safar bir xil)
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const vocab = JSON.parse(fs.readFileSync("materiallar/beginner/vocab.json", "utf8"));
let v = 0;
for (const u of vocab) {
  const r = rng(1000 + u.unit);
  const words = u.words.map((w) => ({ en: w.en.trim(), uz: w.uz.trim() })).filter((w) => w.en && w.uz);
  if (words.length < 4) continue;
  const pick = (n, salt) => {
    const out = [];
    let pool = [];
    while (out.length < n) {
      if (!pool.length) pool = shuffle(words, rng(salt + out.length));
      out.push(pool.pop());
    }
    return out;
  };
  const distractors = (w, field) => {
    const others = shuffle(words.filter((x) => x[field] !== w[field]), r);
    const uniq = [...new Set(others.map((x) => x[field]))];
    return uniq.slice(0, 2);
  };
  const test = [];
  const key = [];
  for (const w of pick(35, u.unit * 7)) {
    const options = shuffle([w.uz, ...distractors(w, "uz")], r);
    test.push({ type: "mc", q: `${w.en} — o‘zbekchasi?`, options });
    key.push({ answer: w.uz, explain: `${w.en} — ${w.uz}` });
  }
  for (const w of pick(35, u.unit * 13)) {
    const options = shuffle([w.en, ...distractors(w, "en")], r);
    test.push({ type: "mc", q: `${w.uz} — inglizchasi?`, options });
    key.push({ answer: w.en, explain: `${w.uz} — ${w.en}` });
  }
  for (const w of pick(30, u.unit * 29)) {
    test.push({ type: "write", q: w.uz });
    key.push({ answer: w.en, accept: [], explain: `${w.uz} — ${w.en}` });
  }
  await upsertTopic(
    {
      kind: "vocab",
      unit: u.unit,
      code: `L${u.unit}`,
      title: `Unit ${u.unit} vocabulary`,
      title_uz: `${u.unit}-unit so‘zlari (${words.length} ta)`,
      sort_order: 100 + u.unit,
      content: { words, test },
    },
    { test: key },
  );
  v++;
}

console.log(`Beginner: ${g} ta grammatika mavzusi, ${v} ta lug'at uniti joylandi.`);
