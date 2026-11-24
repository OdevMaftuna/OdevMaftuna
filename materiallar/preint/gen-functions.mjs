// Pre-Intermediate "Useful phrases" (Functions Bank, Units 1–5):
//   guide  — har bir mavzu bo'yicha: iboraning ma'nosi, qachon ishlatiladi, gapda misol, tuzilishi;
//   50 ta mashq — progress testlarning "Use of English" (6–7) mashqlari uslubida, unitning deyarli
//   hamma iboralari ishlatiladi; har biriga o'zbekcha izoh, xato variantlar uchun ham izoh. AI tekshiruvi bilan.
// Natija: materiallar/preint/functions-out/u<N>.json
// Usage: node --env-file=.env.local materiallar/preint/gen-functions.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const outDir = "materiallar/preint/functions-out";
fs.mkdirSync(outDir, { recursive: true });
const DATA = JSON.parse(fs.readFileSync("materiallar/preint/functions.json", "utf8"));
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s ?? "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:"“”]/g, " ").replace(/\s+/g, " ").trim();

const KINDS = {
  // Faqat progress testlarning 6-mashqi ("Use of English") turlari.
  abc: "READ THE DIALOGUE AND CHOOSE A, B OR C — 2–3 short dialogue lines between two named people (\"Sam: …  Helen: …\") with ONE gap ______ inside a USEFUL PHRASE; exactly 3 \"options\" (A, B, C — single words or short chunks); only one is correct.",
  abctext: "READ THE TEXT AND CHOOSE A, B OR C — 2–3 sentences of a short text (a photo description, a talk, an opinion, a message) with ONE gap ______ inside a USEFUL PHRASE; exactly 3 \"options\"; only one is correct.",
  word: "COMPLETE THE DIALOGUE WITH ONE WORD IN EACH GAP — 2–3 short dialogue lines between two named people with ONE gap ______ for exactly ONE missing word of a useful phrase; the student types it. No options.",
  rewrite: "REWRITE THE SENTENCES WITH THE WORD IN BRACKETS — two short sentences, then '→' and the beginning of the new sentence ending with ONE gap ______ ; the student writes the rest (2–8 words) using the word in \"hint\" (although / even though / however / nevertheless).",
};
const PLAN = {
  1: [["abc", 20, "Likes/dislikes (1A), asking for and giving advice (1C), reacting and showing interest (1G)"], ["word", 15, "Any phrase of the unit (You're kidding!, What a relief!, Why don't you …?)"], ["abctext", 15, "Any phrase of the unit in short texts / messages"]],
  2: [["abctext", 20, "Describing and speculating about a photo (2G): shows, looks, seems, foreground, background, centre, corner, Judging by, I'd say, probably, must be / can't be"], ["word", 15, "Making suggestions (2H) and photo phrases"], ["abc", 15, "Making suggestions (2H): Shall we, Let's, Do you fancy, How/What about, It would be nice to, We could always, Why don't we"]],
  3: [["abc", 20, "Likes and dislikes, preference, reaching an agreement (3G)"], ["word", 15, "Any phrase of the unit (fancy, keen on, fan of, rather, prefer, settle on, agreed)"], ["abctext", 15, "Any phrase of the unit in short texts / messages"]],
  4: [["abc", 20, "Expressing opinions, agreeing and disagreeing (4E)"], ["abctext", 15, "Comparing and contrasting photos (4G): both, common theme, whereas, unlike, in contrast to, one obvious difference"], ["word", 15, "Any phrase of the unit"]],
  5: [["rewrite", 20, "Making contrasts (5G): join two sentences with although / even though / however / nevertheless"], ["abctext", 15, "Making contrasts phrases (5G) and related verbs/nouns (achievement, completion, failure, exploration, attempt, experience…) in short texts"], ["word", 15, "Making contrasts phrases and related nouns (one word in each gap)"]],
};

async function ask(prompt, schema, temperature = 0.7) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature } }),
          signal: AbortSignal.timeout(300000),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) { if (/per ?day/i.test(JSON.stringify(body.error ?? ""))) break; await sleep(40000); continue; }
        if (res.status >= 500) { await sleep(15000); continue; }
        if (!res.ok) { console.log(`  ${model}: HTTP ${res.status} ${(body.error?.message ?? "").slice(0, 100)}`); break; }
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
const ex = obj({ en: S("string"), uz: S("string") });
const guideSchema = obj({
  topics: arr(obj({
    name: S("string"), name_uz: S("string"), summary: S("string"),
    usage: arr(obj({ text: S("string"), example: ex })),
    structure: arr(obj({ type: S("string", { enum: ["+", "-", "?", "short"] }), formula: S("string"), example: ex })),
    signals: arr(obj({ en: S("string"), uz: S("string") })),
    tip: S("string"),
  })),
  mistakes: arr(obj({ wrong: S("string"), right: S("string"), why: S("string") })),
});
const itemsSchema = obj({
  items: arr(obj({ q: S("string"), hint: S("string"), options: arr(S("string")), answer: S("string"), accept: arr(S("string")), phrase: S("string"), explain: S("string"), wrong: arr(obj({ option: S("string"), note: S("string") })) }, ["q", "answer", "phrase", "explain"])),
});
const verifySchema = obj({ items: arr(obj({ i: S("integer"), answer: S("string"), also_correct: arr(S("string")) }, ["i", "answer", "also_correct"])) });

const LEVEL = `Learners: Uzbek teenagers at PRE-INTERMEDIATE (A2–B1) level ("Solutions Pre-Intermediate"). Natural everyday English, varied situations (friends, school, family, holidays, jobs, films; Uzbekistan is fine).`;

function guidePrompt(u) {
  return `${LEVEL}
Write a LEARNING GUIDE for the useful phrases of Unit ${u.unit}, read BEFORE the exercises. One topic block per phrase group below, in this order.
ALL explanations IN UZBEK (Latin script); English phrases/examples in English with Uzbek translation.
For each group:
- "name" = the group title (English), "name_uz" = Uzbek title, "summary" = 1–2 sentences: when we use these phrases.
- "usage": ONE entry PER PHRASE of the group (cover every phrase!): "text" = «the phrase» — its Uzbek meaning and when/how to use it (max 25 words); "example" = a natural example sentence/mini-dialogue line using it (en) + Uzbek translation.
- "structure": 2–5 patterns showing how the phrases are built, e.g. type "+" formula "I can't stand + noun / V-ing", type "?" formula "Shall we + verb …?", type "-" for negative forms; each with an example.
- "signals": 3–8 key words of these phrases with Uzbek meaning (e.g. "keen on — qiziqmoq").
- "tip": the most important thing to remember / a typical trap, in Uzbek.
Also "mistakes": 5–8 typical mistakes Uzbek learners make with these phrases (wrong → right, why in Uzbek).
GROUPS:
${u.sets.map((s) => `- ${s.title} (${s.lesson}): ${s.phrases.map((p) => p[0]).join(" | ")}`).join("\n")}`;
}

function partPrompt(u, kind, n, focus, unused, avoid) {
  return `${LEVEL}
Unit ${u.unit} useful phrases (Functions Bank):
${u.sets.map((s) => `- ${s.title}: ${s.phrases.map((p) => p[0]).join(" | ")}`).join("\n")}
Write exactly ${n} exercise items of this type (exactly like exercise 6 "Use of English" of the "Solutions" progress tests, but with new sentences):
${KINDS[kind]}
FOCUS: ${focus}
${unused.length ? `IMPORTANT: use these not-yet-practised phrases first: ${unused.join(" | ")}` : ""}
Rules for every item:
- Exactly ONE correct answer; the context must make it unambiguous.
- "phrase": the useful phrase from the list that the item practises (copy it exactly).
- "answer": what goes in the gap (or the correct option, copied exactly). "accept": other fully correct variants (or []).
- "explain": IN UZBEK, 1–2 sentences (max 30 words): which phrase it is, what it means and why it fits here (quote the clue in English with «»).
${["abc", "abctext"].includes(kind) ? `- "options": exactly 3 options including the answer. "wrong": for EACH wrong option a note IN UZBEK (max 18 words) — why it does not fit.` : `- "options": [] and "wrong": [].`}
- "hint": ${kind === "rewrite" ? "the word in brackets (although / even though / however / nevertheless)" : "empty string"}.
- q has exactly ONE gap ______ ${kind === "correct" ? "(except: correct items have no gap)" : ""}.
${avoid.length ? `Do not repeat: ${avoid.slice(-30).join(" | ")}` : ""}`;
}

async function verify(items, kind) {
  if (!items.length) return items;
  const typed = !["abc", "abctext"].includes(kind);
  const r = await ask(
    `You are a strict English teacher checking a pre-intermediate test on useful phrases.
${typed ? "For each item write exactly what goes in the gap ______ (use the hint). In \"also_correct\" list other correct answers." : "For each item choose the ONE correct option. In \"also_correct\" list any OTHER option that would also be correct and natural."}
${items.map((it, i) => `[${i}] ${it.q}${it.hint ? `  (${it.hint})` : ""}${it.options.length ? `  OPTIONS: ${it.options.join(" | ")}` : ""}`).join("\n")}`,
    verifySchema,
    0.2,
  );
  if (!r) return items;
  const byI = new Map(r.items.map((x) => [x.i, x]));
  return items.filter((it, i) => {
    const v = byI.get(i);
    if (!v || ![it.answer, ...it.accept].map(norm).includes(norm(v.answer))) return false;
    if (!typed) return !(v.also_correct ?? []).some((o) => norm(o) !== norm(it.answer));
    it.accept = [...new Set([...it.accept, ...(v.also_correct ?? []).filter((x) => x && x.length < 80)])];
    return true;
  });
}

function check(items, kind) {
  const mc = ["abc", "abctext"].includes(kind);
  const out = [];
  for (const it of items ?? []) {
    const q = (it.q ?? "").trim();
    const answer = (it.answer ?? "").trim();
    if (!q || !answer) continue;
    if (kind !== "correct" && (q.match(/_{3,}/g) ?? []).length !== 1) continue;
    const options = [...new Set((it.options ?? []).map((o) => o.trim()).filter(Boolean))];
    if (mc && (options.length < 3 || !options.some((o) => norm(o) === norm(answer)))) continue;
    out.push({
      kind,
      q: kind === "correct" ? q : q.replace(/_{3,}/, "______"),
      hint: (it.hint ?? "").trim(),
      options: mc ? options : [],
      answer: mc ? options.find((o) => norm(o) === norm(answer)) : answer,
      accept: mc ? [] : [...new Set((it.accept ?? []).map((a) => a.trim()).filter((a) => a && norm(a) !== norm(answer)))],
      phrase: (it.phrase ?? "").trim(),
      explain: (it.explain ?? "").trim(),
      wrong: Object.fromEntries((it.wrong ?? []).filter((w) => options.includes(w.option?.trim()) && norm(w.option) !== norm(answer)).map((w) => [w.option.trim(), w.note.trim()])),
    });
  }
  return out;
}

for (const u of DATA) {
  if (only.length && !only.includes(u.unit)) continue;
  const file = path.join(outDir, `u${u.unit}.json`);
  const plan = PLAN[u.unit];
  const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { unit: u.unit, parts: plan.map(() => []) };
  const save = () => fs.writeFileSync(file, JSON.stringify(cur, null, 1));
  if (!cur.guide) {
    const r = await ask(guidePrompt(u), guideSchema, 0.5);
    if (r?.topics?.length) { cur.guide = r; save(); }
  }
  const allPhrases = u.sets.flatMap((s) => s.phrases.map((p) => p[0]));
  for (const [p, [kind, need, focus]] of plan.entries()) {
    for (let tries = 0; tries < 6 && cur.parts[p].length < need; tries++) {
      const usedText = norm(cur.parts.flat().map((x) => x.phrase + " " + x.q + " " + x.answer).join(" | "));
      const unused = allPhrases.filter((ph) => !usedText.includes(norm(ph.replace(/\.\.\.|…/g, " ")).split(" ").slice(0, 3).join(" ")));
      const sig = (x) => norm(x.q) + "|" + norm(x.answer);
      const avoid = cur.parts.flat().map((x) => (x.kind === "correct" ? x.answer : x.q));
      const r = await ask(partPrompt(u, kind, Math.min(need - cur.parts[p].length + 6, 36), focus, unused, avoid), itemsSchema);
      if (!r) break;
      let got = check(r.items, kind);
      const before = got.length;
      got = await verify(got, kind);
      const seen = new Set(cur.parts.flat().map(sig));
      for (const g of got) if (cur.parts[p].length < need && !seen.has(sig(g))) { cur.parts[p].push(g); seen.add(sig(g)); }
      save();
      console.log(`  U${u.unit} ${p + 1}-qism (${kind}): ${cur.parts[p].length}/${need} [tekshiruv ${got.length}/${before}]`);
    }
  }
  const usedText = norm(cur.parts.flat().map((x) => x.phrase + " " + x.q + " " + x.answer).join(" | "));
  const covered = allPhrases.filter((ph) => usedText.includes(norm(ph.replace(/\.\.\.|…/g, " ")).split(" ").slice(0, 3).join(" "))).length;
  console.log(`Unit ${u.unit}: qo‘llanma ${cur.guide ? "✓" : "✗"} · ${cur.parts.reduce((t, x) => t + x.length, 0)}/50 mashq · iboralar ${covered}/${allPhrases.length}`);
}
