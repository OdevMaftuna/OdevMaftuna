// Lug'at matnini unit bo'yicha toza juftlarga ajratish (Gemini, so'zlarni o'zgartirmasdan).
// node --env-file=.env.local materiallar/beginner/clean-vocab.mjs  →  materiallar/beginner/vocab.json
import fs from "node:fs";

const raw = fs
  .readFileSync("materiallar/beginner/vocab-raw.txt", "utf8")
  .replace(/вЂ™|вЂ˜|’|‘|`/g, "'")
  .replace(/вЂњ|вЂќ|“|”/g, '"')
  .replace(/[ \t]+/g, " ")
  .replace(/\n\s*\n+/g, "\n");
const chunks = raw.split(/(?=Unit\s*-\s*\d+)/).filter((c) => /Unit\s*-\s*\d+/.test(c));
const MODELS = ["gemini-3.5-flash-lite", "gemini-3-flash-preview"];
const schema = {
  type: "array",
  items: { type: "object", properties: { en: { type: "string" }, uz: { type: "string" } }, required: ["en", "uz"] },
};

async function clean(text) {
  for (const model of MODELS) {
    for (let a = 0; a < 3; a++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Below is a teacher's English–Uzbek vocabulary list for one unit, copied from a Word file. The format is messy: sometimes "word - translation" on one line, sometimes the word and the translation on separate lines, sometimes numbered, sometimes one entry is broken across lines (e.g. "Ice" / "skating" / "muzda uchish" = "Ice skating" — "muzda uchish").
Return every entry as {"en", "uz"} in the original order.
Rules: do NOT add, remove or translate entries yourself; keep the teacher's Uzbek translation (you may only fix obvious typos and spacing, and write Uzbek in Latin script with ' for o' and g'). Remove numbering. Remove exact duplicates. Keep English capitalisation natural (lowercase except names, countries, languages, "I").

${text}` }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
        }),
        signal: AbortSignal.timeout(120000),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) return JSON.parse(body.candidates[0].content.parts.map((p) => p.text).join(""));
      console.log(`  ${model}: ${res.status}`);
      await new Promise((r) => setTimeout(r, res.status === 429 ? 30000 : 5000));
      if (res.status === 429 && /day/i.test(JSON.stringify(body))) break;
    }
  }
  throw new Error("bajarilmadi");
}

const out = [];
for (const c of chunks) {
  const unit = Number(c.match(/Unit\s*-\s*(\d+)/)[1]);
  const words = await clean(c.replace(/Unit\s*-\s*\d+/, "").trim());
  out.push({ unit, words: words.filter((w) => w.en.trim() && w.uz.trim()) });
  console.log(`Unit ${unit}: ${words.length} — ${words.slice(0, 5).map((w) => `${w.en}=${w.uz}`).join(", ")}`);
}
fs.writeFileSync("materiallar/beginner/vocab.json", JSON.stringify(out, null, 1));
