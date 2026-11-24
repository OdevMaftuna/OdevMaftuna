/**
 * KIDS (Prezident maktabi) — 1500 TA SO'Z: har bir PDF beti = 1 unit (20 unit).
 * Har bir unit uchun Prezident maktabi lug'at testlari uslubida mashq:
 *   A. Ma'nosini toping (EN → UZ)        — har bir so'z
 *   B. Inglizchasini toping (UZ → EN)    — har bir so'z
 *   C. To'g'ri yozilgan so'zni toping    — spelling
 *   D. Ortiqcha so'zni toping            — odd one out (mavzu bo'yicha)
 *   E. Qaysi mavzuga oid?                — kategoriya
 *   F. Qarama-qarshisini toping          — opposites (bor bo'lsa)
 *   G. Inglizchasini yozing              — write
 * Har bir javobga o'zbekcha izoh; noto'g'ri variant tanlansa — u variant nimani anglatishi.
 *
 *   node --env-file=.env.local scripts/load-kids-vocab.mjs           — joylaydi / yangilaydi
 *   node --env-file=.env.local scripts/load-kids-vocab.mjs --dry     — faqat statistikani ko'rsatadi
 * Manba: materiallar/kids/vocab-1500.json (PDF'dan olingan).
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const COURSE = "Kids (Prezident maktabi)";
const units = JSON.parse(fs.readFileSync("materiallar/kids/vocab-1500.json", "utf8"));

/* ---------- deterministik tasodif ---------- */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- so'zlar va mavzular ---------- */
const clean = (s) => s.replace(/([oOgG])'/g, "$1‘").replace(/'/g, "’").replace(/\s+/g, " ").trim();
const ALL = [];
for (const u of units)
  for (const s of u.sections) {
    const [en, uz] = s.title.split("|").map((x) => x.trim());
    for (const w of s.words) ALL.push({ n: w.n, unit: u.unit, en: w.en.trim(), uz: clean(w.uz), cat: en, catUz: clean(uz ?? en) });
  }
const CATS = [...new Map(ALL.map((w) => [w.cat, w.catUz])).entries()];
const catUz = (c) => CATS.find(([e]) => e === c)?.[1] ?? c;

/** Ma'no guruhlari: "och (rang) / yengil" → ["och", "yengil"]. */
const senses = (uz) => uz.split("/").map((x) => x.replace(/\([^)]*\)/g, "").trim().toLowerCase()).filter(Boolean);
/** Ikki so'z ma'nosi to'qnashadimi (bir xil yoki biri ikkinchisining ichida) — ikkala javob ham to'g'ri bo'lib qolmasin. */
const clash = (a, b) => {
  const A = senses(a.uz);
  const B = senses(b.uz);
  return A.some((x) => B.some((y) => x === y || x.includes(y) || y.includes(x))) || a.en.toLowerCase() === b.en.toLowerCase();
};

/** Qarama-qarshi juftlar (ikkalasi ham ro'yxatda bo'lsa ishlatiladi). */
const OPP = [
  ["big", "small"], ["large", "tiny"], ["long", "short"], ["tall", "short"], ["high", "low"], ["wide", "narrow"], ["thick", "thin"],
  ["fast", "slow"], ["new", "old"], ["young", "old"], ["modern", "ancient"], ["good", "bad"], ["best", "worst"], ["better", "worse"],
  ["beautiful", "ugly"], ["easy", "difficult"], ["hard", "soft"], ["smooth", "rough"], ["wet", "dry"], ["full", "empty"],
  ["possible", "impossible"], ["useful", "useless"], ["same", "different"], ["near", "far"], ["inside", "outside"], ["upper", "lower"],
  ["true", "false"], ["rich", "poor"], ["cheap", "expensive"], ["buy", "sell"], ["win", "lose"], ["open", "close"], ["start", "finish"],
  ["happy", "sad"], ["polite", "rude"], ["careful", "careless"], ["lazy", "hardworking"], ["generous", "greedy"], ["love", "hate"],
  ["laugh", "cry"], ["early", "late"], ["always", "never"], ["before", "after"], ["hot", "cold"], ["push", "pull"], ["arrive", "depart"],
  ["safe", "dangerous"], ["remember", "forget"], ["agree", "disagree"], ["appear", "disappear"], ["up", "down"], ["above", "below"],
  ["upstairs", "downstairs"], ["everywhere", "nowhere"], ["question", "answer"], ["correct", "wrong"], ["pass", "fail"], ["winner", "loser"],
  ["day", "night"], ["summer", "winter"], ["sunny", "cloudy"], ["strong", "weak"], ["healthy", "sick"], ["dark", "light"], ["black", "white"],
  ["sweet", "sour"], ["raw", "boiled"], ["clever", "foolish"], ["honest", "dishonest"], ["friend", "enemy"], ["war", "peace"], ["truth", "lie"],
  ["first", "last"], ["many", "few"], ["all", "none"], ["add", "subtract"], ["multiply", "divide"], ["plus", "minus"], ["today", "yesterday"],
  ["morning", "evening"], ["husband", "wife"], ["king", "queen"], ["prince", "princess"], ["boy", "girl"], ["man", "woman"], ["son", "daughter"],
  ["brother", "sister"], ["uncle", "aunt"], ["give", "take"], ["come", "go"], ["sit", "stand"], ["sleep", "wake up"], ["catch", "throw"],
  ["build", "destroy"], ["front", "back"], ["left", "right"], ["in", "out"], ["on", "off"], ["with", "without"], ["into", "out"],
  ["single", "double"], ["previous", "next"], ["common", "rare"], ["deep", "shallow"], ["usual", "strange"], ["calm", "nervous"],
  ["quiet", "loud"], ["cheerful", "sad"], ["brave", "afraid"], ["employee", "employer"], ["teacher", "pupil"], ["question", "answer"],
];
const byEn = new Map(ALL.map((w) => [w.en.toLowerCase(), w]));
const oppOf = (w) => {
  const e = w.en.toLowerCase();
  for (const [a, b] of OPP) {
    if (a === e && byEn.has(b)) return byEn.get(b);
    if (b === e && byEn.has(a)) return byEn.get(a);
  }
  return null;
};

/** Noto'g'ri yozilishlar (haqiqiy so'z bo'lib qolmasin). */
const REAL = new Set(ALL.map((w) => w.en.toLowerCase()));
function misspell(word, r) {
  const w = word.toLowerCase();
  const out = new Set();
  const vowels = { a: "e", e: "i", i: "e", o: "u", u: "o", y: "i" };
  const ops = [
    () => { // undosh harfni ikkilantirish / ikkitasini bittaga
      const m = /([bcdfgklmnprstz])\1/.exec(w);
      if (m) return w.replace(m[0], m[1]);
      const i = [...w].findIndex((c, k) => k > 0 && k < w.length - 1 && /[bcdfgklmnprstz]/.test(c));
      return i > 0 ? w.slice(0, i) + w[i] + w.slice(i) : null;
    },
    () => { // qo'shni harflar o'rnini almashtirish
      const i = 1 + Math.floor(r() * Math.max(1, w.length - 3));
      return w[i] !== w[i + 1] && /[a-z]/.test(w[i]) && /[a-z]/.test(w[i + 1]) ? w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) : null;
    },
    () => { // unli almashtirish
      const idx = [...w].map((c, k) => (vowels[c] && k > 0 ? k : -1)).filter((k) => k >= 0);
      if (!idx.length) return null;
      const i = idx[Math.floor(r() * idx.length)];
      return w.slice(0, i) + vowels[w[i]] + w.slice(i + 1);
    },
    () => { // bitta harfni tushirib qoldirish
      const i = 1 + Math.floor(r() * Math.max(1, w.length - 2));
      return /[a-z]/.test(w[i]) ? w.slice(0, i) + w.slice(i + 1) : null;
    },
    () => w.replace(/ee/, "ea").replace(/ph/, "f").replace(/ck/, "k").replace(/th/, "t"),
    () => (w.endsWith("e") ? w.slice(0, -1) : w + "e"),
  ];
  for (let t = 0; t < 40 && out.size < 3; t++) {
    const v = ops[Math.floor(r() * ops.length)]();
    if (v && v !== w && !REAL.has(v) && v.length > 2) out.add(v);
  }
  return [...out];
}

/* ---------- bitta unit testi ---------- */
function buildUnit(u) {
  const r = rng(7919 * u.unit);
  const words = ALL.filter((w) => w.unit === u.unit);
  const test = [];
  const key = [];
  const parts = [];
  const part = (title) => parts.push(title) - 1;
  const others = (w, n, pool = words) => shuffle(pool.filter((x) => x !== w && !clash(x, w)), r).filter((x, i, arr) => arr.findIndex((y) => clash(x, y)) === i).slice(0, n);

  // A. EN → UZ
  const pA = part("A. Choose the correct meaning · Ma’nosini toping");
  for (const w of shuffle(words, r)) {
    const ds = others(w, 3);
    if (ds.length < 3) continue;
    const opts = shuffle([w, ...ds], r);
    test.push({ type: "mc", q: `What does “${w.en}” mean?`, options: opts.map((x) => x.uz), part: pA });
    key.push({ answer: w.uz, explain: `“${w.en}” — ${w.uz}.`, wrong: Object.fromEntries(ds.map((d) => [d.uz, `“${d.uz}” — bu “${d.en}” so‘zining ma’nosi.`])) });
  }
  // B. UZ → EN
  const pB = part("B. Find the English word · Inglizchasini toping");
  for (const w of shuffle(words, r)) {
    const ds = others(w, 3);
    if (ds.length < 3) continue;
    const opts = shuffle([w, ...ds], r);
    test.push({ type: "mc", q: `“${w.uz}” — in English?`, options: opts.map((x) => x.en), part: pB });
    key.push({ answer: w.en, explain: `“${w.uz}” — ${w.en}.`, wrong: Object.fromEntries(ds.map((d) => [d.en, `“${d.en}” — ${d.uz}.`])) });
  }
  // C. Spelling
  const pC = part("C. Which word is spelled correctly? · To‘g‘ri yozilganini toping");
  const spellable = words.filter((w) => /^[a-z]+$/i.test(w.en) && w.en.length >= 4);
  for (const w of shuffle(spellable, r).slice(0, Math.min(40, Math.ceil(words.length * 0.45)))) {
    const bad = misspell(w.en, r);
    if (bad.length < 3) continue;
    const opts = shuffle([w.en.toLowerCase(), ...bad], r);
    test.push({ type: "mc", q: `Spelling: “${w.uz}”`, options: opts, part: pC });
    key.push({ answer: w.en.toLowerCase(), explain: `To‘g‘ri yozilishi: ${w.en.toLowerCase()} — ${w.uz}.`, wrong: Object.fromEntries(bad.map((b) => [b, `“${b}” — noto‘g‘ri yozilgan.`])) });
  }
  // D. Odd one out
  const pD = part("D. Odd one out · Ortiqcha so‘zni toping");
  const cats = [...new Set(words.map((w) => w.cat))];
  for (let k = 0; k < 15; k++) {
    const c = cats[k % cats.length];
    const inCat = shuffle(words.filter((w) => w.cat === c), r);
    const three = [];
    for (const w of inCat) if (three.length < 3 && !three.some((x) => clash(x, w))) three.push(w);
    const odd = shuffle(ALL.filter((w) => w.cat !== c && !three.some((x) => clash(x, w))), r)[0];
    if (three.length < 3 || !odd) continue;
    const opts = shuffle([...three, odd], r);
    test.push({ type: "mc", q: "Which word is the odd one out?", options: opts.map((x) => x.en), part: pD });
    key.push({
      answer: odd.en,
      explain: `“${odd.en}” (${odd.uz}) — “${catUz(odd.cat)}” mavzusiga oid; qolganlari — “${catUz(c)}”: ${three.map((x) => `${x.en} (${x.uz})`).join(", ")}.`,
      wrong: Object.fromEntries(three.map((x) => [x.en, `“${x.en}” (${x.uz}) ham “${catUz(c)}” mavzusiga oid — u ortiqcha emas.`])),
    });
  }
  // E. Category
  const pE = part("E. Which topic does it belong to? · Qaysi mavzuga oid?");
  for (const w of shuffle(words, r).slice(0, 12)) {
    const wrongCats = shuffle(CATS.filter(([e]) => e !== w.cat), r).slice(0, 3);
    const opts = shuffle([[w.cat, catUz(w.cat)], ...wrongCats], r).map(([e, z]) => `${e} (${z})`);
    const ans = `${w.cat} (${catUz(w.cat)})`;
    test.push({ type: "mc", q: `“${w.en}” belongs to…`, options: opts, part: pE });
    key.push({ answer: ans, explain: `“${w.en}” — ${w.uz}: bu “${catUz(w.cat)}” mavzusiga oid.` });
  }
  // F. Opposites
  const opp = words.map((w) => [w, oppOf(w)]).filter(([, o]) => o);
  if (opp.length) {
    const pF = part("F. Find the opposite · Qarama-qarshisini toping");
    for (const [w, o] of shuffle(opp, r).slice(0, 20)) {
      const ds = shuffle(ALL.filter((x) => x !== o && x !== w && !clash(x, o) && !clash(x, w) && (x.unit === w.unit || x.cat === w.cat)), r).slice(0, 3);
      if (ds.length < 3) continue;
      const opts = shuffle([o, ...ds], r);
      test.push({ type: "mc", q: `Find the opposite of “${w.en}”.`, options: opts.map((x) => x.en), part: pF });
      key.push({ answer: o.en, explain: `${w.en} (${w.uz}) ↔ ${o.en} (${o.uz}).`, wrong: Object.fromEntries(ds.map((d) => [d.en, `“${d.en}” — ${d.uz}; bu “${w.en}” ning qarama-qarshisi emas.`])) });
    }
  }
  // G. Write
  const pG = part("G. Write the English word · Inglizchasini yozing");
  for (const w of shuffle(words, r).slice(0, Math.min(30, Math.ceil(words.length * 0.35)))) {
    test.push({ type: "write", q: `“${w.uz}” — write it in English`, part: pG });
    const alt = [];
    if (/colour/.test(w.en)) alt.push(w.en.replace("colour", "color"));
    if (/^color$/.test(w.en)) alt.push("colour");
    if (/grey/.test(w.en)) alt.push("gray");
    if (/practise/.test(w.en)) alt.push("practice");
    test.at(-1);
    key.push({ answer: w.en, accept: alt, explain: `“${w.uz}” — ${w.en}.` });
  }
  return { words: words.map((w) => ({ en: w.en, uz: w.uz })), test, testParts: parts, key, cats: cats.map(catUz) };
}

/* ---------- joylash ---------- */
const built = units.map((u) => ({ unit: u.unit, ...buildUnit(u) }));
for (const b of built) console.log(`Unit ${String(b.unit).padStart(2)}: ${String(b.words.length).padStart(3)} so‘z · ${String(b.test.length).padStart(3)} savol · ${b.cats.join(" + ")}`);
console.log(`Jami: ${built.reduce((t, b) => t + b.test.length, 0)} savol.`);
// Sifat nazorati: to'g'ri javob variantlar ichida, variantlar takrorlanmaydi, kalit soni = savol soni.
for (const b of built) {
  if (b.test.length !== b.key.length) throw new Error(`Unit ${b.unit}: kalit soni mos emas`);
  b.test.forEach((q, i) => {
    if (q.type !== "mc") return;
    if (!q.options.includes(b.key[i].answer)) throw new Error(`Unit ${b.unit} #${i + 1}: javob variantlarda yo'q`);
    if (new Set(q.options).size !== q.options.length) throw new Error(`Unit ${b.unit} #${i + 1}: takroriy variant`);
  });
}
console.log("✓ Sifat nazorati o'tdi (barcha unitlar).");
if (DRY) {
  fs.writeFileSync("materiallar/kids/vocab-preview.json", JSON.stringify(built.slice(0, 1), null, 1));
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
        kind: "vocab",
        unit: b.unit,
        code: `KV${b.unit}`,
        title: `Unit ${b.unit} · ${b.cats.length > 1 ? b.cats.join(" + ") : b.cats[0]}`,
        title_uz: `${b.unit}-unit so‘zlari (${b.words.length} ta) · ${b.test.length} ta test`,
        sort_order: 100 + b.unit,
        content: { words: b.words, test: b.test, testParts: b.testParts },
      },
      { onConflict: "course_id,kind,code" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`Unit ${b.unit}: ${error.message}`);
  const { error: kErr } = await admin.from("practice_keys").upsert({ topic_id: data.id, key: { test: b.key } });
  if (kErr) throw new Error(`Unit ${b.unit} kalit: ${kErr.message}`);
}
console.log(`✓ ${built.length} ta unit “${COURSE}” kursiga joylandi.`);
