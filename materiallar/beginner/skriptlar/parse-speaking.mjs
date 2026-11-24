// Parse the Beginner Speaking Book (positions dump) into 60 structured topics.
import fs from "node:fs";

const items = JSON.parse(fs.readFileSync(new URL("./sp-items.json", import.meta.url)));
const clean = (s) => s.replace(/\s+/g, " ").replace(/\s+([,!?]|\.(?!\.))/g, "$1").trim();
const near = (a, b, t = 6) => Math.abs(a - b) <= t;

const topics = [];
const problems = [];
const pages = [...new Set(items.map((i) => i.p))];

for (const p of pages) {
  const its = items.filter((i) => i.p === p).sort((a, b) => a.y - b.y || a.x - b.x);
  const topicItem = its.find((i) => /^Topic \d+:/.test(i.s));
  if (!topicItem) continue;

  const lines = [];
  for (const it of its) {
    const last = lines.at(-1);
    if (last && Math.abs(it.y - last.y) <= 2) last.items.push(it);
    else lines.push({ y: it.y, items: [it] });
  }
  const textOf = (l) => clean(l.items.map((i) => i.s).join(" "));
  const idx = (re) => lines.findIndex((l) => re.test(textOf(l)));

  const m = topicItem.s.match(/^Topic (\d+): (.+)$/);
  const dayLine = lines.find((l) => /KUN • DAY/.test(textOf(l)));
  const day = Number(textOf(dayLine).match(/(\d+)-KUN/)?.[1]);
  const topicLineIdx = lines.findIndex((l) => l.items.includes(topicItem));
  const uzTitle = textOf(lines[topicLineIdx + 1]);
  const grammar = textOf(lines[idx(/^Grammatika:/)]).replace(/^Grammatika:\s*/, "");

  const qStart = idx(/^Savollar/);
  const vStart = idx(/^Topic vocabulary/);
  const pStart = idx(/^Useful phrases/);
  const sStart = idx(/^Sample answer/);
  const aStart = idx(/^Mening javobim/);

  const questions = lines.slice(qStart + 1, vStart).map((l) => textOf(l).replace(/^\d+\.\s*/, ""));

  // vocab: 4 columns per row; columns found from the first row
  const vocab = [];
  const vRows = lines.slice(vStart + 1, pStart);
  const cols = vRows[0]?.items.map((i) => i.x) ?? [];
  // A line without a first-column word continues the previous row (wrapped cell).
  const merged = [];
  for (const row of vRows) {
    const hasFirst = row.items.some((i) => near(i.x, cols[0]));
    if (!hasFirst && merged.length) merged.at(-1).items.push(...row.items);
    else merged.push({ y: row.y, items: [...row.items] });
  }
  for (const row of merged) {
    const cell = (k) => clean(row.items.filter((i) => near(i.x, cols[k])).map((i) => i.s).join(" "));
    if (cols.length === 4) {
      vocab.push({ en: cell(0), uz: cell(1) });
      if (cell(2)) vocab.push({ en: cell(2), uz: cell(3) });
    }
  }

  // phrases: English line (two columns) followed by Uzbek line (two columns)
  const phrases = [];
  const pRows = lines.slice(pStart + 1, sStart);
  for (let k = 0; k + 1 < pRows.length; k += 2) {
    const en = pRows[k].items, uz = pRows[k + 1].items;
    const col = (arr, left) => clean(arr.filter((i) => (left ? i.x < 250 : i.x >= 250)).map((i) => i.s).join(" "));
    for (const left of [true, false]) {
      const e = col(en, left), u = col(uz, left);
      if (e) phrases.push({ en: e, uz: u });
    }
  }

  // sample answer: bold font marks vocabulary words → **word**
  const sampleLines = lines.slice(sStart + 1, aStart === -1 ? undefined : aStart);
  const boldFont = sampleLines.flatMap((l) => l.items).find((i) => vocab.some((v) => i.s.trim() === v.en))?.font;
  let sample = "";
  for (const l of sampleLines) {
    for (const it of l.items) {
      const piece = it.font === boldFont ? `**${it.s.trim()}**` : it.s.trim();
      sample += /^[.,!?;:)]/.test(piece) ? piece : " " + piece;
    }
    sample += " ";
  }
  sample = clean(sample);

  const t = { topic: Number(m[1]), day, title: clean(m[2]), uzTitle, grammar, questions, vocab, phrases, sample };
  topics.push(t);
  const id = `Topic ${t.topic}`;
  if (questions.length !== 3) problems.push(`${id}: ${questions.length} savol`);
  if (vocab.length !== 8) problems.push(`${id}: ${vocab.length} so'z`);
  if (phrases.length !== 4) problems.push(`${id}: ${phrases.length} ibora`);
  if (sample.split(/\s+/).length < 25) problems.push(`${id}: namuna qisqa`);
  if (vocab.some((v) => !v.en || !v.uz)) problems.push(`${id}: bo'sh lug'at`);
  if (phrases.some((v) => !v.uz)) problems.push(`${id}: iboraning tarjimasi yo'q`);
}

topics.sort((a, b) => a.topic - b.topic);
fs.writeFileSync(new URL("./speaking.json", import.meta.url), JSON.stringify(topics, null, 1));
console.log(`topics: ${topics.length}, problems: ${problems.length}`);
for (const p of problems.slice(0, 20)) console.log("  -", p);
const t = topics[1];
console.log(JSON.stringify(t, null, 1).slice(0, 1600));
