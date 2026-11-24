/**
 * CEFR (MULTILEVEL) B2 — 22-noyabr … 15-dekabr KUNLIK PLAN (24 kun) "CEFR" kursiga.
 *
 *   node --env-file=.env.local scripts/load-cefr-plan.mjs [--start YYYY-MM-DD] [--dry] [--remove]
 *
 * Har kuni ikkita vazifa:
 *   1) "CEFR N-kun · Reading + Listening" — Multilevel Master kitobidan 3 ta reading (Part 1–5 navbat bilan)
 *      va 2 ta listening (Part 2, 3 — audiosi bor), avtomatik tekshiriladi. Ko'rsatmada kun maslahati va Speaking topshirig'i.
 *   2) "CEFR N-kun · Writing" — Task 1 (1.1 + 1.2) yoki Task 2, matn bilan topshiriladi, AI baholaydi.
 * Pre-Intermediate bilan to‘qnashmaslik uchun reading mashqlari kitob oxiridan (Part 1 — 92–100) olinadi.
 * Qayta ishga tushirsa — sarlavha bo'yicha yangilanadi (o'quvchi javoblari saqlanadi).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { FOCUS, SPEAKING, WRITING } from "./cefr/cefr-content.mjs";

const flags = process.argv.slice(2);
const dry = flags.includes("--dry");
const remove = flags.includes("--remove");
const start = flags.includes("--start") ? flags[flags.indexOf("--start") + 1] : "2026-11-22";
const COURSE = "CEFR";
const DAYS = 24;
const ML = "materiallar/preint/multilevel";
const BUCKET = "lesson-audio";
const PREFIX = "CEFR ";

const fail = (msg, err) => {
  console.error(`Xato: ${msg}${err ? ` — ${err.message ?? err}` : ""}`);
  process.exit(1);
};
if (FOCUS.length !== DAYS || SPEAKING.length !== DAYS || WRITING.length !== DAYS) fail(`mazmun ${DAYS} kunlik emas: ${FOCUS.length}/${SPEAKING.length}/${WRITING.length}`);

const admin = dry ? null : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
let course = { id: "dry" };
if (!dry) {
  const { data } = await admin.from("courses").select("id").eq("name", COURSE).single();
  if (!data) fail(`"${COURSE}" kursi topilmadi`);
  course = data;
}

if (remove) {
  const { data: rows } = await admin.from("assignments").select("id").eq("course_id", course.id).like("title", `${PREFIX}%-kun%`);
  if (rows?.length) await admin.from("assignments").delete().in("id", rows.map((r) => r.id));
  console.log(`O'chirildi: ${rows?.length ?? 0} ta vazifa`);
  process.exit(0);
}

// ---------------------------------------------------------------- kalitlar va rasmlar (load-multilevel.mjs bilan bir xil)
const readKeys = (book) => {
  const all = {};
  const dir = path.join(ML, "keys", book);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    for (const e of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).exercises ?? []) all[`${e.part}-${e.exercise}`] = e;
  }
  return all;
};
const keys = { reading: readKeys("reading"), listening: readKeys("listening") };
const crops = {
  reading: JSON.parse(fs.readFileSync(path.join(ML, "crops/reading/index.json"), "utf8")),
  listening: JSON.parse(fs.readFileSync(path.join(ML, "crops/listening/index.json"), "utf8")),
};
const imagesOf = (book, part, n) => {
  for (let k = n; k >= 1; k--) if (crops[book][`${part}-${k}`]) return crops[book][`${part}-${k}`];
  return [];
};
const LETTERS = "ABCDEFGHIJ";
const range = (to) => [...LETTERS.slice(0, LETTERS.indexOf(to) + 1)].map((letter) => ({ letter, text: "" }));
function accepted(raw) {
  const out = new Set();
  for (const alt of String(raw).split("/").map((s) => s.trim()).filter(Boolean)) {
    out.add(alt.replace(/[()]/g, "").replace(/\s+/g, " ").trim());
    if (/\(.*\)/.test(alt)) out.add(alt.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim());
    if (/^([A-Za-z]-)+[A-Za-z]$/.test(alt)) out.add(alt.replace(/-/g, ""));
  }
  return [...out].filter(Boolean);
}
function questionsFor(book, part, answers) {
  const nums = Object.keys(answers).map(Number).sort((a, b) => a - b);
  const letters = Object.values(answers).filter((a) => /^[A-J]$/.test(String(a).trim()));
  const maxLetter = letters.sort().at(-1) ?? "D";
  const qs = [];
  const key = [];
  for (const n of nums) {
    const a = String(answers[n]).trim();
    const isLetter = /^[A-J]$/.test(a);
    let type = "gap";
    let options;
    if (book === "reading") {
      if (part === 2) [type, options] = ["choice", range("J")];
      else if (part === 3) [type, options] = ["choice", range(maxLetter > "H" ? maxLetter : "H")];
      else if (part === 4) [type, options] = ["choice", range("D")];
      else if (part === 5 && isLetter) [type, options] = ["choice", range("D")];
    } else {
      if (part === 1 || part === 5) [type, options] = ["choice", range("C")];
      else if (part === 3) [type, options] = ["choice", range(maxLetter > "F" ? maxLetter : "F")];
      else if (part === 4) [type, options] = ["choice", range(maxLetter > "I" ? maxLetter : "I")];
    }
    const q = book === "listening" && part === 3 ? `Speaker ${n}` : book === "reading" && part === 2 ? `Text ${n}` : undefined;
    qs.push({ type, n, ...(q ? { q } : {}), ...(type === "choice" ? { options } : {}) });
    key.push(type === "choice" ? [a] : accepted(a));
  }
  return { questions: qs, key };
}

// ---------------------------------------------------------------- mashqlarni tanlash
const has = (book, part, n) => Boolean(keys[book][`${part}-${n}`]) && imagesOf(book, part, n).length > 0;
const down = (book, part, from, count) => {
  const out = [];
  for (let n = from; n >= 1 && out.length < count; n--) if (has(book, part, n)) out.push([part, n]);
  return out;
};
const interleave = (a, b) => {
  const out = [];
  for (let i = 0; out.length < a.length + b.length; i++) {
    if (i < b.length) out.push(b[i]);
    if (i < a.length) out.push(a[i]);
  }
  return out;
};
// Har kuni 3 ta reading: [Part 1 yoki 2] + [Part 3] + [Part 4 yoki 5].
const r12 = interleave(down("reading", 1, 100, 9), down("reading", 2, 55, DAYS - 9));
const r3 = down("reading", 3, 50, DAYS);
const r45 = interleave(down("reading", 4, 30, DAYS / 2), down("reading", 5, 30, DAYS / 2));
// Har kuni 2 ta listening: Part 2 + Part 3 (faqat audiosi bor mashqlar), kitob oxiridan.
const withAudio = (part, from, count) => {
  const out = [];
  for (let n = from; n >= 1 && out.length < count; n--) {
    const audio = path.join(ML, "audio", `p${part}`, `e${n}.mp3`);
    if (fs.existsSync(audio) && keys.listening[`${part}-${n}`]) out.push([part, n, audio]);
  }
  return out;
};
const l2 = withAudio(2, 50, DAYS);
const l3 = withAudio(3, 50, DAYS);
for (const [name, arr] of Object.entries({ r12, r3, r45, l2, l3 })) if (arr.length < DAYS - 1) fail(`${name}: ${arr.length} ta mashq topildi, ${DAYS} kerak`);
console.log(`Reading: ${r12.length + r3.length + r45.length} · Listening: ${l2.length + l3.length} mashq tanlandi.`);

// ---------------------------------------------------------------- yuklash
const uploaded = new Set();
async function upload(local, remote, type) {
  if (uploaded.has(remote) || dry) return remote;
  const { error } = await admin.storage.from(BUCKET).upload(remote, fs.readFileSync(local), { contentType: type, upsert: true });
  if (error) fail(`yuklash: ${remote}`, error);
  uploaded.add(remote);
  return remote;
}
const encDir = path.join(ML, "audio-enc");
fs.mkdirSync(encDir, { recursive: true });
function encode(src, part, n) {
  const out = path.join(encDir, `p${part}e${n}.mp3`);
  if (!fs.existsSync(out) && !dry) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "24000", "-b:a", "40k", out]);
  return out;
}
async function block(book, part, n, audioSrc) {
  const k = keys[book][`${part}-${n}`];
  const { questions, key } = questionsFor(book, part, k.answers);
  const images = [];
  for (const f of imagesOf(book, part, n)) images.push(await upload(path.join(ML, "crops", book, f), `ml/${book}/${f}`, "image/jpeg"));
  const audio = audioSrc ? await upload(encode(audioSrc, part, n), `ml/listening/audio/p${part}e${n}.mp3`, "audio/mpeg") : null;
  const exFile = path.join(ML, "explain", book, `p${part}e${n}.json`);
  let info = {};
  if (fs.existsSync(exFile)) {
    const ex = JSON.parse(fs.readFileSync(exFile, "utf8"));
    const byN = new Map((ex.items ?? []).map((it) => [Number(it.n), it]));
    info = { script: ex.script ?? "", explain: questions.map((q) => (byN.get(q.n) ? `«${byN.get(q.n).quote}» — ${byN.get(q.n).uz}` : "")) };
  }
  return { block: { book, part, exercise: n, instructions: "", images, audio, questions }, key, info };
}

// ---------------------------------------------------------------- writing matni va baholash mezoni
const RUBRIC = [
  "Multilevel (CEFR) Writing, target level B2. Assess like an official Multilevel examiner.",
  "Criteria (equal weight): 1) Task achievement — all points covered, correct register (informal / formal), required length; 2) Coherence & cohesion — clear paragraphs, varied linking words; 3) Lexical resource — topic vocabulary, collocations, spelling; 4) Grammar range & accuracy — complex sentences (conditionals, passive, relative clauses) with few errors.",
  "Word counts: Task 1.1 informal ≈ 50 words; Task 1.2 formal 120–150 words; Task 2 essay 180–200 words. Clearly too short → lower Task achievement.",
  "Score out of 100 where 58+ ≈ B2 and 80+ ≈ C1. In the summary (in Uzbek) say the estimated level (B1 / B2 / C1) and the 2–3 most important things to fix to reach B2.",
].join("\n");
function writingText(w, day) {
  if (w.kind === "t1")
    return {
      title: "Writing · Task 1 (1.1 + 1.2)",
      text: [
        `✍️ WRITING — Task 1 (vaqt: 25 daqiqa)`,
        w.context,
        `“${w.letter}”`,
        `Task 1.1 (informal, ~50 words): ${w.t11}`,
        `Task 1.2 (formal, 120–150 words): ${w.t12}`,
        `Javobni shu yerga yozing: avval Task 1.1, keyin Task 1.2 (sarlavha bilan). AI B2 mezonlari bo‘yicha baholaydi.`,
      ].join("\n\n"),
    };
  if (w.kind === "t2")
    return {
      title: "Writing · Task 2 (essay)",
      text: [`✍️ WRITING — Task 2 (vaqt: 35 daqiqa, 180–200 words)`, w.topic, `Reja: kirish (fikringiz) → 2 ta asosiy xatboshi (sabab + misol) → xulosa. AI B2 mezonlari bo‘yicha baholaydi.`].join("\n\n"),
    };
  if (w.kind === "mock") {
    return {
      title: "Writing · MOCK (Task 1 + Task 2, 60 daqiqa)",
      text: [
        `✍️ WRITING MOCK — to‘liq 60 daqiqa, soat qo‘yib yozing.`,
        `TASK 1: You are a member of a sports club. You received this email from the club: “Dear members, we are planning to change our opening hours and raise the monthly fee by 15%. We would like to hear your opinion before we make a final decision.”`,
        `Task 1.1 (informal, ~50 words): Write a message to your friend who is also a member. Tell them about the email and how you feel.`,
        `Task 1.2 (formal, 120–150 words): Write a letter to the club manager. Explain how these changes would affect you and suggest alternatives.`,
        `TASK 2 (180–200 words): Some people think that young people should live with their parents until they get married. Others believe they should live independently. Discuss both views and give your opinion.`,
      ].join("\n\n"),
    };
  }
  return null;
}

// ---------------------------------------------------------------- kunlar
const startMs = Date.parse(`${start}T02:00:00Z`); // 07:00 Toshkent
const dateUz = (ms) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long" }).format(new Date(ms));
const plan = [];
for (let d = 0; d < DAYS; d++) {
  // Oxirgi kun — yengil: 1 ta reading + 1 ta listening.
  const last = d === DAYS - 1;
  const reading = (last ? [r3[d]] : [r12[d], r3[d], r45[d]]).filter(Boolean);
  const listening = (last ? [l2[d]] : [l2[d], l3[d]]).filter(Boolean);
  const blocks = [];
  const mlKey = [];
  const mlInfo = [];
  for (const [part, n] of reading) {
    const b = await block("reading", part, n);
    blocks.push(b.block);
    mlKey.push(b.key);
    mlInfo.push(b.info);
  }
  for (const [part, n, audio] of listening) {
    const b = await block("listening", part, n, audio);
    blocks.push(b.block);
    mlKey.push(b.key);
    mlInfo.push(b.info);
  }
  const publish = new Date(startMs + d * 86_400_000).toISOString();
  const due = new Date(startMs + (d + 1) * 86_400_000).toISOString();
  const rTxt = reading.map(([p, n]) => `R${p}·${n}`).join(", ");
  const lTxt = listening.map(([p, n]) => `L${p}·${n}`).join(", ");
  const sp = SPEAKING[d];
  const rl = {
    course_id: course.id,
    title: `${PREFIX}${d + 1}-kun · Reading + Listening (${rTxt} | ${lTxt})`,
    instructions: [
      `📅 ${d + 1}-kun / ${DAYS} · Maqsad: B2`,
      `💡 Bugungi maslahat: ${FOCUS[d]}`,
      `📖 Reading: ${reading.length} ta mashq (Part ${reading.map((x) => x[0]).join(", ")}) · 🎧 Listening: ${listening.length} ta mashq (Part ${listening.map((x) => x[0]).join(", ")}). Javoblar avtomatik tekshiriladi.`,
      `🗣 SPEAKING — ${sp.part} (ovoz chiqarib, telefon diktofoniga yozib gapiring va qayta eshiting):\n${sp.text}`,
      `✍️ Writing — bugungi alohida vazifada (CEFR ${d + 1}-kun · Writing).`,
    ].join("\n\n"),
    submission_type: "text",
    rubric: "",
    max_score: 100,
    publish_at: publish,
    due_at: due,
    late_allowed: true,
    late_penalty_percent: 20,
    lesson: { kind: "multilevel", day: d + 1, blocks },
  };
  const w = writingText(WRITING[d], d);
  const wr = w
    ? {
        course_id: course.id,
        title: `${PREFIX}${d + 1}-kun · ${w.title}`,
        instructions: w.text,
        submission_type: "text",
        rubric: RUBRIC,
        max_score: 100,
        publish_at: publish,
        due_at: due,
        late_allowed: true,
        late_penalty_percent: 20,
      }
    : null;
  plan.push({ day: d + 1, date: dateUz(startMs + d * 86_400_000), rl, key: { ml: mlKey, mlInfo }, wr });
}

if (dry) {
  for (const p of plan) console.log(`${p.date.padEnd(12)} ${p.rl.title}\n${" ".repeat(13)}${SPEAKING[p.day - 1].part} · ${p.wr ? p.wr.title : "— (dam olish)"}`);
  fs.writeFileSync("materiallar/cefr-plan-preview.json", JSON.stringify(plan.map((p) => ({ day: p.day, date: p.date, rl: { ...p.rl, lesson: { blocks: p.rl.lesson.blocks.length } }, wr: p.wr })), null, 1));
  console.log("Namuna: materiallar/cefr-plan-preview.json");
  process.exit(0);
}

const { data: existing } = await admin.from("assignments").select("id, title").eq("course_id", course.id).like("title", `${PREFIX}%-kun%`);
const find = (day, kind) => (existing ?? []).find((a) => a.title.startsWith(`${PREFIX}${day}-kun · ${kind}`))?.id;
let added = 0;
let updated = 0;
async function save(row, kind, day, key) {
  const id = find(day, kind);
  if (id) {
    const { error } = await admin.from("assignments").update(row).eq("id", id);
    if (error) fail(`yangilash ${row.title}`, error);
    if (key) await admin.from("assignment_keys").upsert({ assignment_id: id, key });
    updated++;
  } else {
    const { data, error } = await admin.from("assignments").insert(row).select("id").single();
    if (error) fail(`qo'shish ${row.title}`, error);
    if (key) {
      const { error: kErr } = await admin.from("assignment_keys").insert({ assignment_id: data.id, key });
      if (kErr) fail(`kalit ${row.title}`, kErr);
    }
    added++;
  }
}
for (const p of plan) {
  await save(p.rl, "Reading", p.day, p.key);
  if (p.wr) await save(p.wr, "Writing", p.day, null);
  if (p.day % 6 === 0) console.log(`  ${p.day}/${DAYS} kun tayyor`);
}
console.log(`✓ ${COURSE}: ${added} ta yangi, ${updated} ta yangilangan vazifa. Fayllar: ${uploaded.size}.`);
console.log(`  Birinchi kun: ${plan[0].date} · oxirgi kun: ${plan.at(-1).date}`);
