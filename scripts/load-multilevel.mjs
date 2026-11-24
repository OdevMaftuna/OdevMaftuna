/**
 * PRE-INTERMEDIATE KUNLIK UY VAZIFASI — Multilevel Master Reading + Listening kitoblaridan.
 *
 *   node --env-file=.env.local scripts/load-multilevel.mjs [--start YYYY-MM-DD] [--dry] [--remove]
 *
 * Har kuni: 3 ta reading (Part 1 Ex 10 dan boshlab, ketma-ket) + 3 ta listening (Part 2 dan, audiosi bor
 * mashqlar). Kunlar soni — listening tugaguncha (audio qo'shilganda qayta ishga tushiriladi: yangi kunlar qo'shiladi).
 * O'quvchiga kitob sahifasidan qirqilgan mashq rasmi va audio ko'rsatiladi; javob maydonlari kitob kalitidan.
 * Darslar ertasi kundan 07:00 (Toshkent) dan ochiladi, muddati — keyingi kun 07:00.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const flags = process.argv.slice(2);
const dry = flags.includes("--dry");
const remove = flags.includes("--remove");
// Fayllar allaqachon yuklangan bo'lsa — faqat dars mazmuni va kalitlarni (izohlar bilan) yangilash.
const keysOnly = flags.includes("--keys-only");
const start = flags.includes("--start") ? flags[flags.indexOf("--start") + 1] : "2026-11-20";
const COURSE = "Pre-Intermediate";
const PER_DAY = 3;
const ML = "materiallar/preint/multilevel";
const BUCKET = "lesson-audio";
const TITLE_PREFIX = "Multilevel";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const fail = (msg, err) => {
  console.error(`Xato: ${msg}${err ? ` — ${err.message ?? err}` : ""}`);
  process.exit(1);
};

const { data: course } = await admin.from("courses").select("id").eq("name", COURSE).single();
if (!course) fail("kurs topilmadi");

if (remove) {
  const { data: rows } = await admin.from("assignments").select("id").eq("course_id", course.id).like("title", `${TITLE_PREFIX}%`);
  if (rows?.length) await admin.from("assignments").delete().in("id", rows.map((r) => r.id));
  console.log(`O'chirildi: ${rows?.length ?? 0} ta dars`);
  process.exit(0);
}

// ---------------------------------------------------------------- kalitlar va rasmlar
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
/** Qirqilgan rasmlar; sarlavhasi topilmagan mashq — oldingi mashq rasmida (ikkalasi birga). */
const imagesOf = (book, part, n) => {
  for (let k = n; k >= 1; k--) if (crops[book][`${part}-${k}`]) return crops[book][`${part}-${k}`];
  return [];
};

const LETTERS = "ABCDEFGHIJ";
const range = (to) => [...LETTERS.slice(0, LETTERS.indexOf(to) + 1)].map((letter) => ({ letter, text: "" }));

/** "(the) monkey" → ["monkey","the monkey"]; "15/fifteen" → ikkalasi; "L-O-M-B-A-R-D-I-O" → "Lombardio" ham. */
function accepted(raw) {
  const out = new Set();
  for (const alt of String(raw).split("/").map((s) => s.trim()).filter(Boolean)) {
    out.add(alt.replace(/[()]/g, "").replace(/\s+/g, " ").trim());
    if (/\(.*\)/.test(alt)) out.add(alt.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim());
    if (/^([A-Za-z]-)+[A-Za-z]$/.test(alt)) out.add(alt.replace(/-/g, ""));
  }
  return [...out].filter(Boolean);
}

/** Kalitdan savollar: qism turiga qarab — so'z (gap) yoki harf (choice). */
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

// ---------------------------------------------------------------- mashqlar ketma-ketligi
const readingSeq = [];
for (let n = 10; n <= 100; n++) readingSeq.push([1, n]);
for (const [part, max] of [[2, 55], [3, 50], [4, 30], [5, 30]]) for (let n = 1; n <= max; n++) readingSeq.push([part, n]);

const listeningSeq = [];
for (const part of [2, 3, 4, 5, 6]) {
  for (let n = 1; n <= 50; n++) {
    const audio = path.join(ML, "audio", `p${part}`, `e${n}.mp3`);
    if (fs.existsSync(audio) && keys.listening[`${part}-${n}`]) listeningSeq.push([part, n, audio]);
  }
}
const days = Math.ceil(listeningSeq.length / PER_DAY);
console.log(`Reading: ${readingSeq.length} ta mashq · Listening (audio + kalit bor): ${listeningSeq.length} ta · ${days} kun`);

// ---------------------------------------------------------------- yuklash
const uploaded = new Set();
async function upload(local, remote, type) {
  if (uploaded.has(remote) || dry || keysOnly) return remote;
  const { error } = await admin.storage.from(BUCKET).upload(remote, fs.readFileSync(local), { contentType: type, upsert: true });
  if (error) fail(`yuklash: ${remote}`, error);
  uploaded.add(remote);
  return remote;
}
const encDir = path.join(ML, "audio-enc");
fs.mkdirSync(encDir, { recursive: true });
function encode(src, part, n) {
  const out = path.join(encDir, `p${part}e${n}.mp3`);
  if (!fs.existsSync(out)) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "24000", "-b:a", "40k", out]);
  return out;
}

async function block(book, part, n, audioSrc) {
  const k = keys[book][`${part}-${n}`];
  if (!k) fail(`${book} ${part}-${n}: kalit yo'q`);
  const { questions, key } = questionsFor(book, part, k.answers);
  const images = [];
  for (const f of imagesOf(book, part, n)) images.push(await upload(path.join(ML, "crops", book, f), `ml/${book}/${f}`, "image/jpeg"));
  const audio = audioSrc ? await upload(encode(audioSrc, part, n), `ml/listening/audio/p${part}e${n}.mp3`, "audio/mpeg") : null;
  // AI izohlari (bo'lsa): audio matni + har bir savolga «dalil» — o'zbekcha tushuntirish.
  const exFile = path.join(ML, "explain", book, `p${part}e${n}.json`);
  let info = {};
  if (fs.existsSync(exFile)) {
    const ex = JSON.parse(fs.readFileSync(exFile, "utf8"));
    const byN = new Map((ex.items ?? []).map((it) => [Number(it.n), it]));
    info = {
      script: ex.script ?? "",
      explain: questions.map((q) => {
        const it = byN.get(q.n);
        return it ? `«${it.quote}» — ${it.uz}` : "";
      }),
    };
  }
  return { block: { book, part, exercise: n, instructions: "", images, audio, questions }, key, info };
}

const rows = [];
const keyList = [];
const startMs = Date.parse(`${start}T02:00:00Z`); // 07:00 Toshkent
for (let d = 0; d < days; d++) {
  const blocks = [];
  const mlKey = [];
  const mlInfo = [];
  const r = readingSeq.slice(d * PER_DAY, d * PER_DAY + PER_DAY);
  const l = listeningSeq.slice(d * PER_DAY, d * PER_DAY + PER_DAY);
  for (const [part, n] of r) {
    const b = await block("reading", part, n);
    blocks.push(b.block);
    mlKey.push(b.key);
    mlInfo.push(b.info);
  }
  for (const [part, n, audio] of l) {
    const b = await block("listening", part, n, audio);
    blocks.push(b.block);
    mlKey.push(b.key);
    mlInfo.push(b.info);
  }
  const desc = [
    r.length ? `Reading: Part ${r[0][0]} · Ex ${r.map((x) => x[1]).join(", ")}` : null,
    l.length ? `Listening: Part ${l[0][0]} · Ex ${l.map((x) => x[1]).join(", ")}` : null,
  ].filter(Boolean);
  rows.push({
    course_id: course.id,
    title: `${TITLE_PREFIX} ${d + 1}-kun · ${desc.join(" | ")}`,
    instructions: `Bugungi dars (Multilevel Master). ${desc.join(". ")}.`,
    submission_type: "text",
    rubric: "",
    max_score: 100,
    publish_at: new Date(startMs + d * 86_400_000).toISOString(),
    due_at: new Date(startMs + (d + 1) * 86_400_000).toISOString(),
    late_allowed: true,
    late_penalty_percent: 20,
    lesson: { kind: "multilevel", day: d + 1, blocks },
  });
  keyList.push({ ml: mlKey, mlInfo });
  if ((d + 1) % 5 === 0) console.log(`  ${d + 1}/${days} kun tayyor (yuklangan fayllar: ${uploaded.size})`);
}

if (dry) {
  console.log(JSON.stringify(rows[0].lesson.blocks.map((b) => [b.book, b.part, b.exercise, b.images.length, b.questions.length]), null, 0));
  console.log(rows[0].title, "→", rows.at(-1).title);
  process.exit(0);
}

// Mavjud Multilevel darslari bo'lsa — sarlavha bo'yicha yangilanadi (o'quvchi javoblari saqlanadi).
const { data: existing } = await admin.from("assignments").select("id, title").eq("course_id", course.id).like("title", `${TITLE_PREFIX}%`);
const byDay = new Map((existing ?? []).map((a) => [Number(a.title.match(/(\d+)-kun/)?.[1]), a.id]));
let added = 0;
let updated = 0;
for (const [i, row] of rows.entries()) {
  const id = byDay.get(i + 1);
  if (id) {
    const { error } = await admin.from("assignments").update(row).eq("id", id);
    if (error) fail(`yangilash ${row.title}`, error);
    await admin.from("assignment_keys").upsert({ assignment_id: id, key: keyList[i] });
    updated++;
  } else {
    const { data, error } = await admin.from("assignments").insert(row).select("id").single();
    if (error) fail(`qo'shish ${row.title}`, error);
    const { error: kErr } = await admin.from("assignment_keys").insert({ assignment_id: data.id, key: keyList[i] });
    if (kErr) fail(`kalit ${row.title}`, kErr);
    added++;
  }
}
console.log(`${COURSE}: ${added} ta yangi, ${updated} ta yangilangan dars. Fayllar: ${uploaded.size}.`);
console.log(`Birinchisi: ${rows[0].title} — ${rows[0].publish_at}`);
console.log(`Oxirgisi:   ${rows.at(-1).title} — ${rows.at(-1).publish_at}`);
