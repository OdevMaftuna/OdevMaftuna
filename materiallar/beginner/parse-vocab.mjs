// "Beginner Vocabulary 1-14" (docx matni) → vocab.json: [{ unit, words: [{ en, uz }] }]
import fs from "node:fs";

const raw = fs
  .readFileSync("materiallar/beginner/vocab-raw.txt", "utf8")
  .replace(/вЂ™|вЂ˜|’|‘|`/g, "'")
  .replace(/вЂњ|вЂќ|“|”/g, '"')
  .replace(/вЂ"|вЂ”|–|—/g, "-");

const parts = raw.split(/Unit\s*-\s*(\d+)/).slice(1);
const units = [];
const clean = (s) => s.replace(/\s+/g, " ").trim();

for (let i = 0; i < parts.length; i += 2) {
  const unit = Number(parts[i]);
  const lines = parts[i + 1].split(/\r?\n/).map((l) => l.replace(/\t/g, " ")).map(clean).filter(Boolean);
  const words = [];
  let pendingEn = null;
  for (const line of lines) {
    // "word - tarjima" bitta qatorda
    const m = line.match(/^(.+?)\s*-\s+(.+)$/) ?? line.match(/^([A-Za-z][^-]*?)-\s*(.+)$/);
    if (m && /[a-z]/i.test(m[1]) && !pendingEn) {
      words.push({ en: clean(m[1]), uz: clean(m[2]) });
      continue;
    }
    if (pendingEn === null) {
      pendingEn = line;
    } else {
      words.push({ en: pendingEn, uz: line });
      pendingEn = null;
    }
  }
  const seen = new Set();
  const uniq = words
    .map((w) => ({ en: w.en.replace(/[!.]$/, (x) => (w.en.length > 12 ? x : "")).trim(), uz: w.uz.replace(/^[-–]\s*/, "").trim() }))
    .filter((w) => w.en && w.uz && w.en.length < 60 && w.uz.length < 80)
    .filter((w) => !seen.has(w.en.toLowerCase()) && seen.add(w.en.toLowerCase()));
  units.push({ unit, words: uniq });
}

fs.writeFileSync("materiallar/beginner/vocab.json", JSON.stringify(units, null, 1));
for (const u of units) console.log(`Unit ${u.unit}: ${u.words.length} so'z — ${u.words.slice(0, 4).map((w) => `${w.en}=${w.uz}`).join(", ")}`);
