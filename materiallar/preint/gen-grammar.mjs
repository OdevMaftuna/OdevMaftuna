// Pre-Intermediate grammatika: har bir unitga qoida (o'zbekcha) + 100 ta mashq,
// Solutions progress testlarining 1–3 (Grammar) mashqlari uslubida. Har bir mashqqa o'zbekcha izoh,
// test variantlari uchun esa "nega bu variant noto'g'ri" izohi ham yoziladi. Ikkinchi AI tekshiruvi
// ikki ma'noli yoki kalitga mos kelmaydigan savollarni olib tashlaydi.
// Usage: node --env-file=.env.local materiallar/preint/gen-grammar.mjs [unit...]
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const outDir = "materiallar/preint/grammar-out";
fs.mkdirSync(outDir, { recursive: true });
const only = process.argv.slice(2).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- unit plan (mavzular ro'yxati + testlardagi 1–3 mashq turlari)
const KINDS = {
  verb: "VERB IN BRACKETS — sentence with ONE gap ______ ; the base verb/adjective is given in \"hint\" (e.g. \"go\" or \"you / go\" or \"big\"). The student writes the correct form (1–4 words). If the answer has several words (\"did you go\", \"was raining\", \"would buy\", \"has never been\"), it is still ONE gap ______ in q.",
  choose: "CIRCLE THE CORRECT WORD — sentence with ONE gap ______ and 2–4 \"options\"; only one is correct.",
  rewrite: "REWRITE — give the original sentence(s), then '→' and the BEGINNING of the new sentence ending with ONE gap ______ ; the student writes the rest (2–8 words). \"hint\" = the word to use if any (e.g. \"after\", \"too\") or empty.",
  correct: "FIND THE MISTAKE — q = \"Which sentence is correct?\"; 3 \"options\" = 3 versions of one sentence, only one is grammatically correct (the other two contain a typical learner mistake: unnecessary word, missing word or wrong form).",
};
const PLAN = [
  { unit: 1, code: "1", title: "Past simple; should", uz: "O‘tgan oddiy zamon; should (maslahat)", topics: ["Past simple (affirmative, negative, questions, irregular verbs)", "should / shouldn't for advice"],
    parts: [["verb", 40, "Past simple: affirmative, negative and questions (\"(you / go)\")"], ["choose", 30, "should / shouldn't for advice, and past simple vs base form"], ["verb", 30, "Past simple questions with question words: ONE gap for the auxiliary + subject + verb, e.g. q \"Where ______ on holiday last summer?\" hint \"you / go\" answer \"did you go\""]] },
  { unit: 2, code: "2", title: "Past continuous", uz: "O‘tgan davomiy zamon", topics: ["Past continuous", "Past simple vs past continuous; when / while"],
    parts: [["verb", 40, "Past simple or past continuous (two-gap ideas split into one gap each; hint = verb)"], ["correct", 30, "Mistakes with past continuous / past simple / when-while"], ["choose", 30, "when / while; was/were + -ing vs past simple"]] },
  { unit: 3, code: "3", title: "must, mustn't, needn't, don't have to", uz: "must, mustn't, needn't, don't have to", topics: ["must / mustn't (obligation, prohibition)", "needn't / don't have to (no obligation)", "have to"],
    parts: [["choose", 40, "must / mustn't / needn't / don't have to / have to"], ["rewrite", 30, "Rewrite rules/advice using must, mustn't, needn't or don't have to (e.g. 'You are not allowed to talk.' → You ______)"], ["correct", 30, "Mistakes with modal verbs of obligation (to after must, has to, etc.)"]] },
  { unit: 4, code: "4", title: "Comparatives, superlatives; too & enough", uz: "Qiyosiy va orttirma daraja; too va enough", topics: ["Comparative adjectives (+ than, much)", "Superlative adjectives (the ... -est / most)", "too + adjective; adjective + enough; enough + noun"],
    parts: [["verb", 40, "Comparative or superlative form of the adjective in brackets (include 'than' / 'the' when needed inside the answer)"], ["choose", 30, "too / enough / too much / too many / not ... enough, comparative vs superlative"], ["rewrite", 30, "Answer/rewrite using too or enough and the word in brackets (hint = the adjective)"]] },
  { unit: 5, code: "5", title: "will & going to; first conditional", uz: "will va going to; birinchi shart gap", topics: ["will (predictions, promises, instant decisions)", "be going to (plans, evidence)", "First conditional (If + present, will)"],
    parts: [["choose", 40, "will / going to (plans, promises, predictions with evidence)"], ["verb", 30, "First conditional: correct form of the verb in brackets (present simple or will/won't)"], ["correct", 30, "Mistakes with will / going to / first conditional (e.g. 'If it will rain')"]] },
  { unit: 6, code: "6", title: "Present perfect", uz: "Hozirgi tugallangan zamon", topics: ["Present perfect (experience, ever/never, just/already/yet)", "for / since, How long", "Present perfect vs past simple; been vs gone"],
    parts: [["verb", 40, "Past simple or present perfect form of the verb in brackets"], ["choose", 30, "been/gone, ever/never, for/since, How long/When, just/already/yet"], ["correct", 30, "Mistakes with present perfect vs past simple"]] },
  { unit: 7, code: "7", title: "Second conditional; past perfect", uz: "Ikkinchi shart gap; o‘tgan tugallangan zamon", topics: ["Second conditional (If + past, would)", "Past perfect (had + V3)", "after / before / because with past perfect"],
    parts: [["verb", 40, "Second conditional: correct form of the verb in brackets (past simple or would/wouldn't)"], ["rewrite", 30, "Join two sentences into one using the word in brackets (after/because/but/when) and the past perfect"], ["choose", 30, "Second conditional vs first conditional; past perfect vs past simple"]] },
  { unit: 8, code: "8", title: "Reported speech", uz: "O‘zlashtirma gap", topics: ["Reported statements (tense backshift)", "say / tell", "pronoun and time-word changes"],
    parts: [["rewrite", 40, "Rewrite direct speech as reported speech (‘I am tired,’ she said. → She said that ______)"], ["verb", 30, "Correct reported form of the verb in brackets (She said she ______ (can) swim.)"], ["choose", 30, "said / told, tense backshift, pronouns, here→there, now→then, tomorrow→the next day"]] },
  { unit: 9, code: "9", title: "The passive (present & past simple)", uz: "Majhul nisbat (hozirgi va o‘tgan oddiy zamon)", topics: ["Present simple passive (am/is/are + V3)", "Past simple passive (was/were + V3)", "by + agent; passive questions"],
    parts: [["rewrite", 40, "Rewrite in the passive without the agent (People speak English here. → English ______)"], ["verb", 30, "Correct passive form of the verb in brackets (present or past simple)"], ["choose", 30, "active vs passive, is/are/was/were, V3 forms"]] },
];

// ---- Gemini
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
        if (res.status === 429) {
          if (/per ?day/i.test(JSON.stringify(body.error ?? ""))) break;
          await sleep(40000); continue;
        }
        if (res.status >= 500) { await sleep(15000); continue; }
        if (!res.ok) { console.log(`  ${model}: HTTP ${res.status} ${(body.error?.message ?? "").slice(0, 100)}`); break; }
        return JSON.parse(body.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "");
      } catch (e) {
        console.log(`  ${model}: ${e.name} ${String(e.message).slice(0, 60)}`);
      }
    }
  }
  return null;
}

const S = (type, extra = {}) => ({ type, ...extra });
const arr = (items) => ({ type: "array", items });
const obj = (properties, required = Object.keys(properties)) => ({ type: "object", properties, required });
const introSchema = obj({
  what: S("string"),
  when: arr(S("string")),
  structures: arr(obj({ label: S("string"), formula: S("string"), example_en: S("string"), example_uz: S("string") })),
  rules: arr(obj({ title: S("string"), text: S("string"), examples: arr(obj({ en: S("string"), uz: S("string") })) })),
  signal_words: arr(obj({ en: S("string"), uz: S("string") })),
  mistakes: arr(obj({ wrong: S("string"), right: S("string"), why: S("string") })),
});
const itemsSchema = obj({
  items: arr(
    obj(
      {
        q: S("string"),
        hint: S("string"),
        options: arr(S("string")),
        answer: S("string"),
        accept: arr(S("string")),
        explain: S("string"),
        wrong: arr(obj({ option: S("string"), note: S("string") })),
      },
      ["q", "answer", "explain"],
    ),
  ),
});

const norm = (s) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,!?;:"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const LEVEL = `Learners: Uzbek teenagers at PRE-INTERMEDIATE (A2–B1) level, using "Solutions Pre-Intermediate". Simple, natural, everyday English, varied situations (school, family, travel, sport, Uzbekistan is fine). Every sentence different.`;

function introPrompt(u) {
  return `${LEVEL}
Write the grammar explanation for Unit ${u.unit}: ${u.title}. Topics: ${u.topics.join("; ")}.
ALL explanation text IN UZBEK (Latin script); English examples in English. Clear and short, for a pre-intermediate student.
- "what": 2–3 sentences: what these structures are for.
- "when": 3–6 short uses.
- "structures": 3–6 formulas (affirmative/negative/question or each structure), each with an English example and its Uzbek translation.
- "rules": 3–6 rules, each with a title, 1–3 sentence explanation and 2 examples (en + uz).
- "signal_words": 4–10 typical words/phrases with Uzbek meaning.
- "mistakes": 4–6 typical mistakes Uzbek learners make (wrong → right, why in Uzbek).`;
}

function partPrompt(u, kind, n, focus, avoid) {
  return `${LEVEL}
Unit ${u.unit} grammar: ${u.topics.join("; ")}.
Write exactly ${n} exercise items of this type:
${KINDS[kind]}
FOCUS: ${focus}
Rules for every item:
- Exactly ONE correct answer. Make the context clear so the answer is unambiguous.
- "answer": the correct answer (for gap items: exactly what goes in the gap; for "Which sentence is correct?" items: the correct option, copied exactly).
- "accept": other fully correct variants of the answer (contractions are accepted automatically, do not list them). Empty array if none.
- "explain": IN UZBEK, 1–2 sentences (max 30 words): WHY this answer is correct — name the rule and the clue in the sentence (quote it in English).
  Example: "Gapda «last night» bor — bu o‘tgan zamon belgisi, shuning uchun Past Simple: stayed."
${kind === "choose" || kind === "correct" ? `- "options": ${kind === "correct" ? "3" : "2–4"} options; the answer is one of them.
- "wrong": for EACH wrong option one note IN UZBEK (max 18 words) — why it is wrong here.` : `- "options": [] and "wrong": [].`}
${kind === "verb" || kind === "rewrite" ? `- "hint": ${kind === "verb" ? "the word(s) in brackets — base form (e.g. \"go\", \"you / go\", \"not see\", \"big\")" : "the word to use (or empty string)"}. Do NOT put the hint in brackets inside q; the app shows it.` : `- "hint": "".`}
- q contains exactly one gap written as ______ (six underscores)${kind === "correct" ? " — EXCEPT 'Which sentence is correct?' items, which have no gap" : ""}.
${avoid.length ? `Do not repeat these sentences: ${avoid.slice(-40).join(" | ")}` : ""}`;
}

const verifySchema = obj({ items: arr(obj({ i: S("integer"), answer: S("string"), also_correct: arr(S("string")) }, ["i", "answer", "also_correct"])) });
async function verify(items, kind) {
  if (!items.length) return items;
  const typed = kind === "verb" || kind === "rewrite";
  const prompt = `You are a strict English teacher checking a pre-intermediate grammar test.
${typed ? "For each item write exactly what goes in the gap ______ (the hint, if given, is the word in brackets to use). In \"also_correct\" list any OTHER correct answers." : "For each item choose the ONE correct option. In \"also_correct\" list any OTHER option that would also be grammatically correct and natural."}
${items.map((it, i) => `[${i}] ${it.q}${it.hint ? `  (${it.hint})` : ""}${it.options?.length ? `  OPTIONS: ${it.options.join(" | ")}` : ""}`).join("\n")}`;
  const r = await ask(prompt, verifySchema, 0.2);
  if (!r) return items;
  const byI = new Map(r.items.map((x) => [x.i, x]));
  return items.filter((it, i) => {
    const v = byI.get(i);
    if (process.env.DEBUG && (!v || !(it.accept ?? []).concat(it.answer).map(norm).includes(norm(v?.answer)))) console.log("   ✗", it.q.slice(0, 60), "| key:", it.answer, "| solver:", v?.answer, "| also:", (v?.also_correct ?? []).join(" ; "));
    if (!v) return false;
    const ok = [it.answer, ...(it.accept ?? [])].map(norm);
    if (!ok.includes(norm(v.answer))) return false;
    if (!typed) return !(v.also_correct ?? []).some((o) => norm(o) !== norm(it.answer));
    // Typed: accept the solver's extra correct variants.
    it.accept = [...new Set([...(it.accept ?? []), ...(v.also_correct ?? []).filter((x) => x && x.length < 80)])];
    return true;
  });
}

function check(items, kind) {
  const good = [];
  for (const it of items ?? []) {
    const q = (it.q ?? "").trim();
    const answer = (it.answer ?? "").trim();
    if (!q || !answer) continue;
    const isWhich = kind === "correct";
    if (!isWhich && (q.match(/_{3,}/g) ?? []).length !== 1) continue;
    const options = [...new Set((it.options ?? []).map((o) => o.trim()).filter(Boolean))];
    if (kind === "choose" || kind === "correct") {
      if (options.length < 2 || !options.some((o) => norm(o) === norm(answer))) continue;
    }
    if ((kind === "verb" || kind === "rewrite") && answer.split(" ").length > 10) continue;
    const wrong = Object.fromEntries((it.wrong ?? []).filter((w) => options.includes(w.option?.trim())).map((w) => [w.option.trim(), w.note.trim()]));
    good.push({
      kind,
      q: isWhich ? q : q.replace(/_{3,}/, "______"),
      hint: (it.hint ?? "").trim(),
      options: kind === "choose" || kind === "correct" ? options : [],
      answer: options.find((o) => norm(o) === norm(answer)) ?? answer,
      accept: [...new Set((it.accept ?? []).map((a) => a.trim()).filter((a) => a && norm(a) !== norm(answer)))],
      explain: (it.explain ?? "").trim(),
      wrong,
    });
  }
  return good;
}

for (const u of PLAN) {
  if (only.length && !only.includes(u.unit)) continue;
  const file = path.join(outDir, `u${u.unit}.json`);
  const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { unit: u.unit, parts: u.parts.map(() => []) };
  const save = () => fs.writeFileSync(file, JSON.stringify(cur, null, 1));
  const t0 = Date.now();
  if (!cur.intro) {
    const r = await ask(introPrompt(u), obj({ intro: introSchema }));
    if (r?.intro?.what) { cur.intro = r.intro; save(); }
  }
  for (const [p, [kind, need, focus]] of u.parts.entries()) {
    for (let tries = 0; tries < 6 && cur.parts[p].length < need; tries++) {
      const avoid = cur.parts.flat().map((x) => (x.kind === "correct" ? x.answer : x.q));
      const want = Math.min(need - cur.parts[p].length + 6, 40);
      const r = await ask(partPrompt(u, kind, want, focus, avoid), itemsSchema);
      if (!r) break;
      let got = check(r.items, kind);
      const before = got.length;
      got = await verify(got, kind);
      // "Which sentence is correct?" savollari bir xil matnli — ularni javobi bo'yicha ajratamiz.
      const sig = (x) => norm(x.q) + "|" + norm(x.answer);
      const seen = new Set(cur.parts.flat().map(sig));
      for (const g of got) if (cur.parts[p].length < need && !seen.has(sig(g))) { cur.parts[p].push(g); seen.add(sig(g)); }
      save();
      console.log(`  U${u.unit} ${p + 1}-qism (${kind}): ${cur.parts[p].length}/${need}  [tekshiruv ${got.length}/${before}]`);
    }
  }
  const total = cur.parts.reduce((t, x) => t + x.length, 0);
  console.log(`Unit ${u.unit}: qoida ${cur.intro ? "✓" : "✗"} · ${total}/100 mashq (${Math.round((Date.now() - t0) / 1000)}s)`);
}
fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(PLAN, null, 1));
