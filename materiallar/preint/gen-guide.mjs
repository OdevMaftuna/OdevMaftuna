// Pre-Intermediate grammatika: har bir MAVZU uchun batafsil qo'llanma (testlardan oldin o'qiladi):
//   usage (qo'llanilishi), structure (+ / − / ? tuzilishi), signals (signal so'zlar), tip (eslatma).
// Natija: materiallar/preint/grammar-out/u<N>.guide.json
// Usage: node --env-file=.env.local materiallar/preint/gen-guide.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const DIR = "materiallar/preint/grammar-out";
const src = fs.readFileSync("materiallar/preint/gen-grammar.mjs", "utf8");
const PLAN = eval(src.match(/const PLAN = (\[[\s\S]*?\n\]);/)[1]);
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const S = (type, extra = {}) => ({ type, ...extra });
const arr = (items) => ({ type: "array", items });
const obj = (properties, required = Object.keys(properties)) => ({ type: "object", properties, required });
const ex = obj({ en: S("string"), uz: S("string") });
const schema = obj({
  topics: arr(
    obj({
      name: S("string"),
      name_uz: S("string"),
      summary: S("string"),
      usage: arr(obj({ text: S("string"), example: ex })),
      structure: arr(obj({ type: S("string", { enum: ["+", "-", "?", "short"] }), formula: S("string"), example: ex })),
      signals: arr(obj({ en: S("string"), uz: S("string") })),
      tip: S("string"),
    }),
  ),
});

async function ask(prompt) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.5 } }),
          signal: AbortSignal.timeout(240000),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) { if (/per ?day/i.test(JSON.stringify(body.error ?? ""))) break; await sleep(40000); continue; }
        if (res.status >= 500) { await sleep(15000); continue; }
        if (!res.ok) { console.log(`  ${model}: HTTP ${res.status}`); break; }
        return JSON.parse(body.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "");
      } catch (e) {
        console.log(`  ${model}: ${e.name}`);
      }
    }
  }
  return null;
}

for (const u of PLAN) {
  if (only.length && !only.includes(u.unit)) continue;
  const file = path.join(DIR, `u${u.unit}.guide.json`);
  if (fs.existsSync(file)) { console.log(`Unit ${u.unit}: bor`); continue; }
  const prompt = `You write a grammar GUIDE for Uzbek teenagers at PRE-INTERMEDIATE (A2–B1) level ("Solutions Pre-Intermediate"), read BEFORE they do exercises.
Unit ${u.unit}. Write one guide block for EACH of these topics, in this order: ${u.topics.map((t, i) => `(${i + 1}) ${t}`).join("; ")}.
All explanations IN UZBEK (Latin script), simple and clear; English examples in English with Uzbek translation.
For each topic:
- "name": short English name (e.g. "Past simple"); "name_uz": Uzbek name.
- "summary": 1–2 sentences — what it is and why we use it.
- "usage": 3–5 uses ("Qo'llanilishi"): each a short Uzbek explanation + one example (en/uz).
- "structure": the forms as a table: type "+" (affirmative), "-" (negative), "?" (question), and "short" (short answers) when relevant. "formula" in English grammar notation (e.g. "Subject + was/were + V-ing"). One example each (en/uz).
- "signals": 4–10 signal words/phrases that show this form is needed (en + uz). If a topic has no real signal words (e.g. modal verbs), give typical trigger phrases/situations.
- "tip": one short "Eslatma" in Uzbek — the most important thing to remember or a typical trap.`;
  const r = await ask(prompt);
  if (!r?.topics?.length) { console.log(`Unit ${u.unit}: ✗`); continue; }
  fs.writeFileSync(file, JSON.stringify(r.topics, null, 1));
  console.log(`Unit ${u.unit}: ${r.topics.length} ta mavzu qo‘llanmasi`);
}
