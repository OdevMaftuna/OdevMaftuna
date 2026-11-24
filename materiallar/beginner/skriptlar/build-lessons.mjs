// Build the Beginner course plan: 50 reading days (2 readings/day) + 12 review days.
// Output: lessons.json (content + answer keys, kept separate) and a schedule summary.
import fs from "node:fs";

const readings = JSON.parse(fs.readFileSync(new URL("./readings.json", import.meta.url)));

// ---- deterministic random (same output on every run) ----
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
const shuffle = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---- vocabulary pools ----
const unitVocab = new Map();
for (const r of readings) {
  const list = unitVocab.get(r.unit) ?? [];
  list.push(...r.vocab);
  unitVocab.set(r.unit, list);
}
const allVocab = readings.flatMap((r) => r.vocab);
const norm = (s) => s.toLowerCase().replace(/[!?.,]/g, "").trim();

/** Lug'at testi: inglizcha so'z → 4 ta o'zbekcha variantdan to'g'risini tanlash. */
function vocabQuiz(vocab, pool, count, rand) {
  const picked = shuffle(vocab, rand).slice(0, count);
  return picked.map((v) => {
    const distractors = shuffle(
      pool.filter((p) => norm(p.uz) !== norm(v.uz) && norm(p.en) !== norm(v.en)),
      rand,
    )
      .map((p) => p.uz)
      .filter((uz, i, a) => a.indexOf(uz) === i)
      .slice(0, 3);
    const options = shuffle([v.uz, ...distractors], rand);
    return { q: v.en, options, answer: options.indexOf(v.uz) };
  });
}

/** Tarjima uchun matndan 3 ta o'rtacha uzunlikdagi gap (iloji boricha tirnoqsiz). */
function translationSentences(text, count, rand) {
  const sentences = text
    .join(" ")
    .split(/(?<=[.!?])\s+(?=[“"A-Z])/)
    .map((s) => s.trim())
    .filter((s) => {
      const w = s.split(/\s+/).length;
      return w >= 6 && w <= 15 && !/[“”"]/.test(s);
    });
  if (sentences.length <= count) return sentences;
  // matn bo'ylab teng taqsimlab tanlash
  const step = sentences.length / count;
  const offset = Math.floor(rand() * step);
  return Array.from({ length: count }, (_, i) => sentences[Math.min(sentences.length - 1, Math.floor(i * step) + offset)]);
}

/** Gap tuzish uchun 3 ta so'z (qisqa, ibora emas). */
function sentenceWords(vocab, count, rand) {
  const good = vocab.filter((v) => v.en.split(/\s+/).length <= 2 && !/[!?/]/.test(v.en) && !/^the\b/i.test(v.en));
  return shuffle(good.length >= count ? good : vocab, rand).slice(0, count).map((v) => ({ en: v.en, uz: v.uz }));
}

/** Bitta matndan dars bo'limi: ochiq qism (o'quvchiga) va javoblar (alohida). */
function readingLesson(r, rand) {
  const id = `U${r.unit}R${r.num}`;
  const quiz = vocabQuiz(r.vocab, unitVocab.get(r.unit).length >= 12 ? unitVocab.get(r.unit) : allVocab, Math.min(5, r.vocab.length), rand);
  const content = {
    id,
    unit: r.unit,
    unitTitle: r.unitTitle,
    num: r.num,
    title: r.title,
    text: r.text,
    vocab: r.vocab,
    tf: r.tf.map((q) => ({ q: q.q })),
    mc: r.mc.map((q) => ({ q: q.q, options: q.options })),
    fill: { box: r.fill.box, items: r.fill.items.map((q) => ({ q: q.q })) },
    wordTr: r.tr.map((q) => ({ uz: q.uz })),
    vocabQuiz: quiz.map((q) => ({ q: q.q, options: q.options })),
    translate: translationSentences(r.text, 3, rand).map((en) => ({ en })),
    sentences: sentenceWords(r.vocab, 3, rand),
  };
  const key = {
    id,
    tf: r.tf.map((q) => q.answer),
    mc: r.mc.map((q) => q.answer),
    fill: r.fill.items.map((q) => q.answer),
    wordTr: r.tr.map((q) => q.answer),
    vocabQuiz: quiz.map((q) => q.answer),
  };
  return { content, key };
}

// ---- schedule (Asia/Tashkent): open 07:00, due next day 03:00 ----
const START = { y: 2026, m: 11, d: 20 };
const dayDate = (i) => new Date(Date.UTC(START.y, START.m - 1, START.d + i));
const ymd = (dt) => dt.toISOString().slice(0, 10);
const tashkentIso = (dt, hh) => {
  // Toshkent = UTC+5
  const t = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), hh - 5, 0, 0));
  return t.toISOString();
};
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const uzDate = (dt) => `${dt.getUTCDate()}-${UZ_MONTHS[dt.getUTCMonth()]}`;

const days = [];
const keys = [];
const rand = rng(20261120);

// 50 reading days
for (let i = 0; i < 50; i++) {
  const pair = readings.slice(i * 2, i * 2 + 2);
  const parts = pair.map((r) => readingLesson(r, rand));
  const dt = dayDate(i);
  const units = [...new Set(pair.map((r) => r.unit))];
  days.push({
    day: i + 1,
    kind: "reading",
    date: ymd(dt),
    weekday: UZ_DAYS[dt.getUTCDay()],
    publish_at: tashkentIso(dt, 7),
    due_at: tashkentIso(dayDate(i + 1), 3),
    title: `${i + 1}-kun · Unit ${units.join("–")}: ${pair.map((r) => r.title).join(" / ")}`,
    readings: parts.map((p) => p.content),
  });
  keys.push({ day: i + 1, readings: parts.map((p) => p.key) });
}

// 12 review days
const reviewPlan = [
  { units: [1, 2] }, { units: [3, 4] }, { units: [5, 6] }, { units: [7, 8] }, { units: [9, 10] },
  { units: [11, 12] }, { units: [13, 14] },
  { units: [1, 2, 3, 4], mixed: true }, { units: [5, 6, 7, 8], mixed: true }, { units: [9, 10, 11], mixed: true },
  { units: [12, 13, 14], mixed: true }, { units: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], final: true },
];
reviewPlan.forEach((plan, k) => {
  const i = 50 + k;
  const dt = dayDate(i);
  const vocab = plan.units.flatMap((u) => unitVocab.get(u));
  const quizCount = plan.final ? 20 : 15;
  const quiz = vocabQuiz(vocab, vocab, quizCount, rand);
  // o'zbekchadan inglizchaga so'z tarjimasi (yozib javob beriladi)
  const trWords = shuffle(
    vocab.filter((v) => v.en.split(/\s+/).length <= 2 && !/[/!?]/.test(v.en)),
    rand,
  ).filter((v) => !quiz.some((q) => q.q === v.en)).slice(0, plan.final ? 10 : 8);
  const label = plan.final
    ? "Yakuniy test (1–14 unit)"
    : `${plan.mixed ? "Aralash takrorlash" : "Takrorlash"}: Unit ${plan.units[0]}–${plan.units.at(-1)}`;
  days.push({
    day: i + 1,
    kind: plan.final ? "final" : "review",
    date: ymd(dt),
    weekday: UZ_DAYS[dt.getUTCDay()],
    publish_at: tashkentIso(dt, 7),
    due_at: tashkentIso(dayDate(i + 1), 3),
    title: `${i + 1}-kun · ${label}`,
    review: {
      units: plan.units,
      vocabQuiz: quiz.map((q) => ({ q: q.q, options: q.options })),
      wordTr: trWords.map((v) => ({ uz: v.uz })),
      sentences: sentenceWords(vocab, plan.final ? 5 : 5, rand),
      writing: plan.final
        ? "Write 8–10 sentences about yourself: your family, your day, your town and your plans for the future."
        : null,
    },
  });
  keys.push({ day: i + 1, review: { vocabQuiz: quiz.map((q) => q.answer), wordTr: trWords.map((v) => v.en) } });
});

fs.writeFileSync(new URL("./lessons.json", import.meta.url), JSON.stringify({ days }, null, 1));
fs.writeFileSync(new URL("./keys.json", import.meta.url), JSON.stringify(keys, null, 1));

// ---- summary ----
const first = days[0], last = days.at(-1);
console.log(`kunlar: ${days.length} (${first.date} → ${last.date}), reading kunlari: ${days.filter((d) => d.kind === "reading").length}`);
console.log(`1-kun ochiladi (UTC): ${first.publish_at}, yopiladi: ${first.due_at}`);
const used = days.flatMap((d) => d.readings ?? []).map((r) => r.id);
console.log(`matnlar ishlatildi: ${used.length}, takrorsiz: ${new Set(used).size}`);
const q = days.flatMap((d) => d.readings ?? []);
console.log(`har matnda: lug'at testi ${Math.min(...q.map((r) => r.vocabQuiz.length))}-${Math.max(...q.map((r) => r.vocabQuiz.length))}, tarjima gaplari ${Math.min(...q.map((r) => r.translate.length))}-${Math.max(...q.map((r) => r.translate.length))}, gap tuzish ${Math.min(...q.map((r) => r.sentences.length))}`);
const badQuiz = q.filter((r) => r.vocabQuiz.some((x) => x.options.length < 4));
console.log(`4 variantdan kam testlar: ${badQuiz.length}`);
for (const d of days.filter((d, i) => i < 3 || i >= 49)) console.log(`  ${d.date} ${d.weekday.padEnd(10)} ${d.title}`);
