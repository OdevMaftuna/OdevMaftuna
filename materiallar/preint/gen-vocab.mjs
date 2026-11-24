// Pre-Intermediate lug'at mashqlari: har bir unitga 100 ta (Solutions progress test 4–6 mashqlari uslubida).
//   A) 40 ta "vaziyat → so'z"   (4-mashq: situatsiyaga mos so'zni qutidan tanlash)
//   B) 30 ta "gapdagi bo'shliq" (5-mashq: gapni qutidagi so'z bilan to'ldirish)
//   C) 30 ta "birinchi harf"    (6-mashq: b _ _ _ — so'zni birinchi harfiga qarab yozish)
// Usage: node --env-file=.env.local materiallar/preint/gen-vocab.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const dir = "materiallar/preint";
const outDir = path.join(dir, "vocab-out");
fs.mkdirSync(outDir, { recursive: true });
const units = JSON.parse(fs.readFileSync(path.join(dir, "vocab.json"), "utf8"));
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(prompt, schema) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.8 } }),
          signal: AbortSignal.timeout(240000),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          if (/per ?day/i.test(JSON.stringify(body.error ?? ""))) { console.log(`  ${model}: kunlik limit`); break; }
          console.log(`  ${model}: 429, 40s`); await sleep(40000); continue;
        }
        if (res.status >= 500) { console.log(`  ${model}: ${res.status}, 15s`); await sleep(15000); continue; }
        if (!res.ok) { console.log(`  ${model}: HTTP ${res.status} ${(body.error?.message ?? "").slice(0, 120)}`); break; }
        const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
        return JSON.parse(text);
      } catch (e) {
        console.log(`  ${model}: ${e.name} ${String(e.message).slice(0, 80)}`);
      }
    }
  }
  return null;
}

const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
const mcSchema = (n) => ({
  type: "object",
  properties: {
    items: {
      type: "array", minItems: n, maxItems: n,
      items: {
        type: "object",
        properties: { q: { type: "string" }, options: { type: "array", items: { type: "string" } }, answer: { type: "string" }, explain: { type: "string" } },
        required: ["q", "options", "answer", "explain"],
      },
    },
  },
  required: ["items"],
});
const letterSchema = {
  type: "object",
  properties: {
    items: {
      type: "array", minItems: 30, maxItems: 30,
      items: {
        type: "object",
        properties: { q: { type: "string" }, answer: { type: "string" }, base: { type: "string" }, explain: { type: "string" } },
        required: ["q", "answer", "base", "explain"],
      },
    },
  },
  required: ["items"],
};

const COMMON = `You write vocabulary exercises for Uzbek teenagers learning English at PRE-INTERMEDIATE (A2–B1) level, in the style of "Solutions Pre-Intermediate" progress tests.
Use simple, natural, everyday English. Sentences 8–22 words. Varied situations (school, family, friends, sport, travel, Uzbekistan is fine). No repeated sentences or situations.
"explain" is IN UZBEK (Latin script), max 14 words: the word and its meaning, e.g. "anxious — xavotirli: bobosi qaytmagani uchun xavotirda".`;

function promptA(u, words) {
  return `${COMMON}
TASK A — "Look at the situations. How did the person feel / which word matches? Choose the word from the box." (like: "I won a competition to spend the day with my favourite band!" → delighted)
Write exactly 40 items. Each item:
- "q": a short situation in 1–2 sentences (first person or about someone) that clearly matches ONE target word. Do NOT write the target word (or its forms) in the situation.
- "options": exactly 4 words from the word list below, one of them the answer, the other 3 from the SAME group (e.g. all feelings adjectives, all injuries, all school subjects) so the choice is real but only one fits.
- "answer": the target word exactly as written in the list.
Use as many DIFFERENT target words as possible (each word at most twice).
WORD LIST (Unit ${u.unit}): ${words.map((w) => `${w.en} (${w.pos})`).join("; ")}`;
}
function promptB(u, words) {
  return `${COMMON}
TASK B — "Complete the sentences with the words in the box." (like: "My favourite TV programme is on tonight so I'm ______ excited.")
Write exactly 30 items. Each item:
- "q": one sentence with exactly one gap written as ______ (six underscores) where the target word goes. The sentence context must make only ONE option correct.
- "options": exactly 4 words from the word list (one is the answer, 3 plausible but wrong in this sentence).
- "answer": the word exactly as in the list.
Use DIFFERENT target words from task A where possible; each word at most twice.
WORD LIST (Unit ${u.unit}): ${words.map((w) => `${w.en} (${w.pos})`).join("; ")}`;
}
function promptC(u, words) {
  return `${COMMON}
TASK C — "Complete the sentences with the correct words. The first letter of each word has been given." (like: "Look at this! I cut my leg and b___ all over my trousers." → bled)
Write exactly 30 items. Each item:
- "q": one sentence with exactly one gap written as ______ (six underscores). The answer is ONE English word (no spaces) — a word from the list, or its correct grammatical form (plural, past tense, -ing, 3rd person -s).
- "answer": the exact word that fits the gap (lowercase unless a proper noun).
- "base": the word as written in the list.
Choose single-word entries only. Each word at most once.
WORD LIST (Unit ${u.unit}): ${words.map((w) => `${w.en} (${w.pos})`).join("; ")}`;
}

function checkMc(items, words, n, label) {
  const list = new Set(words.map((w) => norm(w.en)));
  const good = [];
  for (const it of items ?? []) {
    const opts = [...new Set((it.options ?? []).map((o) => o.trim()))];
    const ans = it.answer?.trim();
    if (opts.length !== 4 || !ans || !opts.some((o) => norm(o) === norm(ans))) continue;
    if (!list.has(norm(ans))) continue;
    if (opts.filter((o) => list.has(norm(o))).length < 4) continue;
    if (label === "B" && !/_{3,}/.test(it.q)) continue;
    if (label === "A" && norm(it.q).includes(norm(ans))) continue;
    good.push({ q: it.q.trim().replace(/_{3,}/, "______"), options: opts, answer: opts.find((o) => norm(o) === norm(ans)), explain: it.explain.trim() });
  }
  return good.slice(0, n);
}
function checkLetters(items, words) {
  const list = new Set(words.map((w) => norm(w.en)));
  const seen = new Set();
  const good = [];
  for (const it of items ?? []) {
    const ans = (it.answer ?? "").trim();
    if (!/^[A-Za-z]+$/.test(ans) || ans.length < 3 || !/_{3,}/.test(it.q)) continue;
    if (!list.has(norm(it.base ?? ""))) continue;
    if (norm(it.q).includes(norm(ans))) continue;
    // The answer must be a form of the base word (bleed → bled, run → running).
    const b = norm(it.base).replace(/[^a-z]/g, "");
    if (!b || norm(ans).slice(0, 3) !== b.slice(0, 3)) continue;
    if (seen.has(norm(ans))) continue;
    seen.add(norm(ans));
    good.push({ q: it.q.trim().replace(/_{3,}/, "______"), answer: ans, base: it.base.trim(), explain: it.explain.trim() });
  }
  return good.slice(0, 30);
}

// Second AI pass: solve each item without the key; drop it if the solver disagrees or sees 2 answers.
const verifySchema = { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, answer: { type: "string" }, also_correct: { type: "array", items: { type: "string" } } }, required: ["i", "answer", "also_correct"] } } }, required: ["items"] };
async function verify(items) {
  if (!items.length) return items;
  const prompt = `You are a strict English teacher checking a vocabulary test for pre-intermediate learners.
For each item choose the ONE option that fits best. In "also_correct" list every OTHER option that would ALSO be acceptable in natural English (empty array if none).
${items.map((it, i) => `[${i}] ${it.q}  OPTIONS: ${it.options.join(" | ")}`).join("\n")}`;
  const r = await ask(prompt, verifySchema);
  if (!r) return items;
  const byI = new Map(r.items.map((x) => [x.i, x]));
  return items.filter((it, i) => {
    const v = byI.get(i);
    return v && norm(v.answer) === norm(it.answer) && !(v.also_correct ?? []).some((o) => norm(o) !== norm(it.answer));
  });
}

for (const u of units) {
  if (only.length && !only.includes(u.unit)) continue;
  const file = path.join(outDir, `u${u.unit}.json`);
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { a: [], b: [], c: [] };
  const words = u.words;
  const t0 = Date.now();
  for (const [key, need, make, check, verifyIt] of [
    ["a", 40, promptA, (x) => checkMc(x, words, 40, "A"), true],
    ["b", 30, promptB, (x) => checkMc(x, words, 30, "B"), true],
    ["c", 30, promptC, (x) => checkLetters(x, words)],
  ]) {
    let tries = 0;
    while (prev[key].length < need && tries < 6) {
      tries++;
      const r = await ask(make(u, words), key === "c" ? letterSchema : mcSchema(key === "a" ? 40 : 30));
      if (!r) break;
      let got = check(r.items);
      if (verifyIt) { const before = got.length; got = await verify(got); console.log(`  U${u.unit}${key.toUpperCase()}: tekshiruv ${got.length}/${before}`); }
      const have = new Set(prev[key].map((x) => norm(x.q)));
      for (const g of got) if (prev[key].length < need && !have.has(norm(g.q))) { prev[key].push(g); have.add(norm(g.q)); }
      fs.writeFileSync(file, JSON.stringify(prev, null, 1));
      console.log(`  U${u.unit}${key.toUpperCase()}: ${prev[key].length}/${need}`);
    }
  }
  const total = prev.a.length + prev.b.length + prev.c.length;
  console.log(`Unit ${u.unit}: ${total}/100 (${Math.round((Date.now() - t0) / 1000)}s)`);
}
