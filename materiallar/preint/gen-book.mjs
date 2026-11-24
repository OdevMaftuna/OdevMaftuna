// Kitobdagi har bir unit boshidagi (1A, 2A … 9A) so'zlar bo'yicha qo'shimcha mashqlar:
// 10 ta vaziyat + 10 ta gapdagi bo'shliq, izohlar (why + har bir xato variant) bilan, AI tekshiruvidan o'tgan.
// Natija: materiallar/preint/vocab-out/u<N>.book.json
// Usage: node --env-file=.env.local materiallar/preint/gen-book.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const units = JSON.parse(fs.readFileSync("materiallar/preint/vocab.json", "utf8"));
const openers = JSON.parse(fs.readFileSync("materiallar/preint/book-openers.json", "utf8"));
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s ?? "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

async function ask(prompt, schema, temperature = 0.7) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature } }),
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

const S = (type, extra = {}) => ({ type, ...extra });
const arr = (items) => ({ type: "array", items });
const obj = (properties, required = Object.keys(properties)) => ({ type: "object", properties, required });
const schema = obj({
  items: arr(obj({ kind: S("string", { enum: ["situation", "gap"] }), q: S("string"), options: arr(S("string")), answer: S("string"), why: S("string"), wrong: arr(obj({ option: S("string"), note: S("string") })) })),
});
const verifySchema = obj({ items: arr(obj({ i: S("integer"), answer: S("string"), also_correct: arr(S("string")) })) });

for (const u of units) {
  if (only.length && !only.includes(u.unit)) continue;
  const file = path.join("materiallar/preint/vocab-out", `u${u.unit}.book.json`);
  const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const list = new Map(u.words.map((w) => [norm(w.en), w.en]));
  const targets = openers[String(u.unit)].filter((w) => list.has(norm(w)));
  for (let tries = 0; tries < 5 && out.length < 20; tries++) {
    const used = new Set(out.map((x) => norm(x.answer)));
    const fresh = targets.filter((w) => !used.has(norm(w)));
    const prompt = `You write vocabulary exercises for Uzbek teenagers at PRE-INTERMEDIATE (A2–B1) level ("Solutions Pre-Intermediate"), Unit ${u.unit}.
These are the KEY WORDS from the first page of the unit: ${fresh.concat(targets).slice(0, 60).join(", ")}.
Write ${Math.min(24, (20 - out.length) + 6)} items, half "situation" (1–2 sentence situation that clearly matches the target word, WITHOUT using the word) and half "gap" (one sentence with ONE gap ______ for the target word).
Each item: "answer" = one KEY WORD (each key word at most once, prefer words not yet used: ${fresh.slice(0, 30).join(", ")}); "options" = exactly 4 words from this unit list (answer + 3 from the same group, so only ONE fits): ${u.words.map((w) => w.en).join("; ")}.
"why": IN UZBEK, max 30 words — the word's meaning and which clue in the sentence shows it (quote the clue in English with «»).
"wrong": for EACH wrong option, one note IN UZBEK (max 18 words) — its meaning and why it does not fit.
Simple natural English, varied situations; Uzbekistan is fine.`;
    const r = await ask(prompt, schema);
    if (!r) break;
    let good = (r.items ?? []).filter((it) => {
      const opts = [...new Set((it.options ?? []).map((o) => o.trim()))];
      if (opts.length !== 4 || !opts.some((o) => norm(o) === norm(it.answer))) return false;
      if (!opts.every((o) => list.has(norm(o)))) return false;
      if (it.kind === "gap" && (it.q.match(/_{3,}/g) ?? []).length !== 1) return false;
      if (it.kind === "situation" && norm(it.q).includes(norm(it.answer))) return false;
      if (used.has(norm(it.answer))) return false;
      return Boolean(it.why);
    });
    // Ikkinchi AI tekshiruvi.
    const v = await ask(
      `You are a strict English teacher. For each item choose the ONE option that fits best; in "also_correct" list any OTHER option that would ALSO be acceptable.\n${good.map((it, i) => `[${i}] ${it.q}  OPTIONS: ${it.options.join(" | ")}`).join("\n")}`,
      verifySchema,
      0.2,
    );
    if (v) {
      const byI = new Map(v.items.map((x) => [x.i, x]));
      good = good.filter((it, i) => {
        const x = byI.get(i);
        return x && norm(x.answer) === norm(it.answer) && !(x.also_correct ?? []).some((o) => norm(o) !== norm(it.answer));
      });
    }
    for (const it of good) {
      if (out.length >= 20 || out.some((x) => norm(x.answer) === norm(it.answer))) continue;
      const opts = [...new Set(it.options.map((o) => o.trim()))];
      out.push({
        kind: it.kind,
        q: it.q.trim().replace(/_{3,}/, "______"),
        options: opts,
        answer: opts.find((o) => norm(o) === norm(it.answer)),
        why: it.why.trim(),
        wrong: Object.fromEntries((it.wrong ?? []).filter((w) => opts.includes(w.option?.trim()) && norm(w.option) !== norm(it.answer)).map((w) => [w.option.trim(), w.note.trim()])),
      });
    }
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
  }
  console.log(`Unit ${u.unit}: ${out.length}/20 kitob so‘zlari mashqi`);
}
