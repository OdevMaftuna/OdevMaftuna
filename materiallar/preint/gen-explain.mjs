// Pre-Intermediate lug'at mashqlari uchun batafsil o'zbekcha izohlar:
//   why   — nega aynan shu javob to'g'ri (gapdagi qaysi ishora shunga olib keladi);
//   wrong — test variantlari uchun: nega o'sha noto'g'ri variant bu gapga mos emas.
// Natija: materiallar/preint/vocab-out/u<N>.explain.json  (qayta ishga tushirsa, borini saqlaydi)
// Usage: node --env-file=.env.local materiallar/preint/gen-explain.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const dir = "materiallar/preint/vocab-out";
const units = JSON.parse(fs.readFileSync("materiallar/preint/vocab.json", "utf8"));
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH = 20;

async function ask(prompt, schema) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.4 } }),
          signal: AbortSignal.timeout(240000),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          if (/per ?day/i.test(JSON.stringify(body.error ?? ""))) break;
          await sleep(40000); continue;
        }
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

const schema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          i: { type: "integer" },
          why: { type: "string" },
          wrong: { type: "array", items: { type: "object", properties: { option: { type: "string" }, note: { type: "string" } }, required: ["option", "note"] } },
        },
        required: ["i", "why", "wrong"],
      },
    },
  },
  required: ["items"],
};

const RULES = `You are a kind English teacher explaining a vocabulary test to an Uzbek PRE-INTERMEDIATE student who made a mistake.
Write ALL explanations IN UZBEK (Latin script), simple and clear. English words stay in English inside «guillemets».
For each item:
- "why": 1–2 short sentences (max 30 words). Say what the correct word means in Uzbek AND which clue in the sentence/situation shows it (quote the clue in English). For a word-form answer (past tense, plural, -ing, -s) also say why that form is needed.
  Example: "«proud» — faxrlanmoq. Gapda «won a gold medal» bor: g‘alaba qozongan odam o‘zi bilan faxrlanadi."
- "wrong": for EACH wrong option given, one short sentence (max 18 words): its Uzbek meaning and why it does not fit here.
  Example: {"option":"cross","note":"«cross» — jahli chiqqan; bu yerda gap g‘azab haqida emas, quvonch haqida."}
  For items without options return "wrong": [].
Never say the student is stupid; be encouraging and precise.`;

for (const u of units) {
  if (only.length && !only.includes(u.unit)) continue;
  const src = JSON.parse(fs.readFileSync(path.join(dir, `u${u.unit}.json`), "utf8"));
  const items = [
    ...src.a.map((x) => ({ q: x.q, options: x.options, answer: x.answer })),
    ...src.b.map((x) => ({ q: x.q, options: x.options, answer: x.answer })),
    ...src.c.map((x) => ({ q: x.q, options: [], answer: x.answer, base: x.base })),
  ];
  const file = path.join(dir, `u${u.unit}.explain.json`);
  const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  for (let from = 0; from < items.length; from += BATCH) {
    const idx = [...Array(Math.min(BATCH, items.length - from)).keys()].map((k) => from + k);
    for (let tries = 0; tries < 3 && idx.some((i) => !out[i]); tries++) {
      const todo = idx.filter((i) => !out[i]);
      const prompt = `${RULES}\n\nITEMS:\n${todo
        .map((i) => {
          const it = items[i];
          const wrongs = it.options.filter((o) => o !== it.answer);
          return `[${i}] ${it.q}\n   CORRECT: ${it.answer}${it.base ? ` (from «${it.base}»)` : ""}${wrongs.length ? `\n   WRONG OPTIONS: ${wrongs.join(" | ")}` : ""}`;
        })
        .join("\n")}`;
      const r = await ask(prompt, schema);
      if (!r) break;
      for (const x of r.items ?? []) {
        const it = items[x.i];
        if (!it || out[x.i] || !x.why?.trim()) continue;
        const wrongs = it.options.filter((o) => o !== it.answer);
        const notes = Object.fromEntries((x.wrong ?? []).filter((w) => wrongs.includes(w.option)).map((w) => [w.option, w.note.trim()]));
        if (wrongs.length && Object.keys(notes).length < wrongs.length) continue; // to'liq bo'lmasa, qayta so'raymiz
        out[x.i] = { why: x.why.trim(), wrong: notes };
      }
      fs.writeFileSync(file, JSON.stringify(out, null, 1));
    }
  }
  console.log(`Unit ${u.unit}: ${out.filter(Boolean).length}/${items.length} izoh`);
}
