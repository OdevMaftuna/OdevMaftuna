/**
 * Beginner grammatika mavzulari uchun kontent: tushuntirish (o'qituvchi kitobchasi uslubida),
 * 100 ta o'zbekcha → inglizcha tarjima va 30 ta test (izohlari bilan). Gemini (JSON schema).
 *
 *   node --env-file=.env.local materiallar/beginner/grammar/gen-grammar.mjs [kod ...]
 *
 * Natija: materiallar/beginner/grammar/out/<kod>.json. Tayyorlari o'tkaziladi (davom ettiradi).
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "materiallar/beginner/grammar";
const OUT = path.join(DIR, "out");
fs.mkdirSync(OUT, { recursive: true });
const topics = JSON.parse(fs.readFileSync(path.join(DIR, "topics.json"), "utf8"));
const notes = fs.readFileSync(path.join(DIR, "narrative.txt"), "utf8").replace(/===== PAGE \d+ =====/g, "");
const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.GEN_MODELS ?? "gemini-3-flash-preview,gemini-3.5-flash-lite").split(",");
const only = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- schemas
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
const testSchema = arr(
  obj(
    {
      type: S("string", { enum: ["fill", "mc"] }),
      q: S("string"),
      hint: S("string"),
      options: arr(S("string")),
      answer: S("string"),
      accept: arr(S("string")),
      explain: S("string"),
    },
    ["type", "q", "answer", "explain"],
  ),
);
const trSchema = arr(obj({ part: S("integer"), uz: S("string"), en: arr(S("string")), rule: S("string") }));

// ---------------------------------------------------------------- prompts
const known = (t) =>
  topics
    .filter((x) => x.unit < t.unit || (x.unit === t.unit && x.code <= t.code))
    .map((x) => x.title)
    .join("; ");

const vocab = JSON.parse(fs.readFileSync("materiallar/beginner/vocab.json", "utf8"));
const words = (t) =>
  vocab
    .filter((u) => u.unit <= t.unit)
    .flatMap((u) => u.words.map((w) => w.en))
    .join(", ");

const common = (t) => `You create practice material for Uzbek teenagers and adults learning English at BEGINNER (A1) level, following the course book "Headway Beginner".
Topic: Unit ${t.unit}, ${t.code} "${t.title}" (Uzbek: "${t.uz}").
Focus of this topic: ${t.focus}
Grammar the learners already know (use ONLY this grammar in English sentences): ${known(t)}.
VOCABULARY — very important: the learners are beginners. Build the sentences mainly from THEIR word list (units 1–${t.unit} of the class vocabulary):
${words(t)}
Besides these you may use only the most basic everyday words every beginner knows (numbers, colours, family members, I/you/he..., man, woman, boy, girl, friend, school, teacher, student, room, table, chair, door, window, home, water, bread, apple, cat, dog, big, small, good, today, and simple names like Ali, Aziz, Malika, Tom, Anna; places Tashkent, Samarkand, Uzbekistan). No difficult or rare words. Keep sentences short and easy to understand.
Uzbek must be natural, correct Uzbek in LATIN script (o', g', sh, ch, ng; use the apostrophe ' ), the way a teacher in Uzbekistan writes. No Russian words. Every Uzbek translation must match its English sentence exactly (same objects and places).`;

const introPrompt = (t) => `${common(t)}

The teacher has her own short notes (her style: formulas like "(+) [ S + TOBE + OB ]", usage cases, signal words, Uzbek explanations). Here are ALL her notes for the course — use the part about this topic as the base, keep her terms, formulas and style, and make it clearer and complete for this topic:
<<<NOTES
${notes}
NOTES>>>

Return JSON with:
- "intro": an explanation of the topic IN UZBEK for beginners:
  * "what": 1–2 sentences — what this grammar is and its meaning in Uzbek.
  * "when": 2–5 usage cases (Uzbek), each one short.
  * "structures": the formulas, e.g. label "(+)", "(-)", "(?)", "Wh-", "Qisqa javob"; formula in the teacher's style (S, V1, OB, am/is/are ...), one English example with Uzbek translation each.
  * "rules": 2–5 short rules (title + Uzbek text + 2 examples each with Uzbek translation): spelling, exceptions, contractions, word order.
  * "signal_words": 0–8 signal words (en + uz) if relevant to the topic, else empty.
  * "mistakes": 3–5 typical mistakes of Uzbek learners: "wrong" (incorrect English), "right" (correct), "why" (Uzbek, one sentence).
- "test": EXACTLY 30 questions testing ONLY this topic, mixing:
  * 20 of type "fill": "q" is an English sentence with ONE gap written as "______"; "answer" the exact text for the gap; "accept" other fully correct forms (contraction / full form, e.g. ["is not"] for "isn't"), may be empty.
    "hint" (shown in brackets after the sentence) must make the learner THINK — it must NEVER be the answer itself:
      - give the BASE form or the word the learner must change: "be" (answer: am / is / are / was), "not + be" (answer: isn't), "I" (answer: my / me / mine), "he" (answer: his / him), "have" (answer: has), "live" (answer: lives / lived / living), "child" (answer: children), "go" (answer: went), "quick" (answer: quickly), "there + be" (answer: There are);
      - or a CHOICE that includes the answer and 1–2 wrong options: "a / an", "this / these", "some / any", "in / on / under", "what / where / how", "can / can't".
    BAD (forbidden): q "I ______ Ben." hint "am". GOOD: hint "be". BAD: hint "my" for answer "my". GOOD: hint "I".
  * 10 of type "mc": "q" an English sentence with "______" (or a question), "options" EXACTLY 3 short options, "answer" = the correct option text exactly as in options. Put the correct option in different positions.
  * "explain": IN UZBEK, 1–2 sentences: why this is the answer, referring to the rule from the intro (e.g. "He/she/it bilan Present Simple'da fe'lga -s qo'shiladi: works."). The student sees it when they make a mistake.
  * Questions must be unambiguous: exactly one correct answer. Vary subjects, situations and sentence types (positive, negative, question) as the topic allows. Order from easier to harder.`;

const trPrompt = (t, from, to) => `${common(t)}

Write Uzbek sentences for the learner to translate INTO ENGLISH, practising this topic — like a worksheet "${t.title} — 100 ta tarjima mashqi".
The worksheet has 3 parts: ${t.parts.map((p, i) => `part ${i} = "${p}"`).join(", ")}. Items 1–40 are part 0, 41–70 part 1, 71–100 part 2.
Now write items ${from}–${to} ONLY (exactly ${to - from + 1} items), in order, each with the correct "part".
Each item:
- "uz": one short natural Uzbek sentence (3–9 words) whose English translation MUST use this topic's grammar.
- "en": 1–3 correct English translations (the most natural first). Use full sentences with capital letter and final punctuation. Include common equivalent wordings (e.g. "table"/"desk" only when the Uzbek allows both). Do not list contraction variants — they are accepted automatically.
- "rule": IN UZBEK, max 12 words — the key point for this sentence (e.g. "Ko'plik: There are + ko'plikdagi ot").
No repeated sentences. Vary vocabulary and situations. Only grammar the learners know.`;

// ---------------------------------------------------------------- Gemini
async function ask(prompt, schema) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(180000),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const msg = JSON.stringify(body.error ?? "");
          if (/per ?day/i.test(msg)) { console.log(`  ${model}: kunlik limit`); break; }
          console.log(`  ${model}: 429, 40s`); await sleep(40000); continue;
        }
        if (res.status >= 500) { console.log(`  ${model}: ${res.status}, 15s`); await sleep(15000); continue; }
        if (!res.ok) { console.log(`  ${model}: HTTP ${res.status} ${(body.error?.message ?? "").slice(0, 120)}`); break; }
        const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
        return { model, data: JSON.parse(text) };
      } catch (e) {
        console.log(`  ${model}: ${e.name} ${String(e.message).slice(0, 80)}`);
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------- validation
const GAP = /_{3,}/;
const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ").trim();
/** Ishora (hint) javobning o'zi bo'lsa — yaroqsiz. Tanlov ("a / an") bo'lsa — mumkin. */
function hintGivesAway(q) {
  if (/\/|\+/.test(q.hint ?? "")) return false;
  const h = norm(q.hint);
  return [q.answer, ...(q.accept ?? [])].some((a) => norm(a) === h);
}
function checkIntroTest(d) {
  const p = [];
  const i = d.intro;
  if (!i?.what || !i.structures?.length || !i.rules?.length) p.push("intro to'liq emas");
  if (!Array.isArray(d.test) || d.test.length !== 30) p.push(`test ${d.test?.length}`);
  const giveaway = (d.test ?? []).filter((q) => q.type === "fill" && hintGivesAway(q));
  if (giveaway.length > 1) p.push(`${giveaway.length} ta ishora javobni aytib qo'yadi (${giveaway[0].hint})`);
  for (const [n, q] of (d.test ?? []).entries()) {
    if (!q.explain?.trim()) p.push(`test ${n + 1}: izoh yo'q`);
    if (q.type === "fill" && (!GAP.test(q.q) || !q.answer?.trim())) p.push(`test ${n + 1}: fill shakli`);
    if (q.type === "mc" && (q.options?.length !== 3 || !q.options.includes(q.answer))) p.push(`test ${n + 1}: mc shakli`);
  }
  return p;
}
function checkTr(items, from, to) {
  const p = [];
  if (!Array.isArray(items) || items.length !== to - from + 1) p.push(`tarjima ${items?.length} (kerak ${to - from + 1})`);
  for (const [n, it] of (items ?? []).entries()) {
    if (!it.uz?.trim() || !it.en?.length || it.en.some((e) => !e.trim())) p.push(`tarjima ${from + n}: bo'sh`);
  }
  return p;
}

async function generate(build, schema, check, label) {
  for (let tries = 0; tries < 3; tries++) {
    const r = await ask(build(), schema);
    if (!r) return null;
    const problems = check(r.data);
    if (!problems.length) return r;
    console.log(`  ${label} qayta: ${problems.slice(0, 4).join("; ")}`);
  }
  return null;
}

// ---------------------------------------------------------------- run
let ok = 0;
for (const t of topics) {
  if (only.length && !only.includes(t.code)) continue;
  const file = path.join(OUT, `${t.code}.json`);
  const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { code: t.code };
  const save = () => fs.writeFileSync(file, JSON.stringify(cur, null, 1));
  const t0 = Date.now();

  // Eski testda ishora javobni aytib qo'ygan bo'lsa — qaytadan yaratiladi.
  if (cur.test && cur.test.filter((q) => q.type === "fill" && hintGivesAway(q)).length > 1) {
    delete cur.intro;
    delete cur.test;
  }
  if (!cur.intro || !cur.test) {
    const r = await generate(
      () => introPrompt(t),
      obj({ intro: introSchema, test: testSchema }),
      checkIntroTest,
      `${t.code} intro/test`,
    );
    if (!r) { console.log(`${t.code}: intro/test ✗`); continue; }
    cur.intro = r.data.intro;
    cur.test = r.data.test;
    cur.model = r.model;
    save();
  }
  for (const [from, to] of [[1, 50], [51, 100]]) {
    const k = `tr${from}`;
    if (cur[k]) continue;
    const r = await generate(() => trPrompt(t, from, to), trSchema, (d) => checkTr(d, from, to), `${t.code} tarjima ${from}`);
    if (!r) { console.log(`${t.code}: tarjima ${from}-${to} ✗`); break; }
    cur[k] = r.data;
    save();
  }
  if (cur.tr1 && cur.tr51) {
    ok++;
    console.log(`${t.code} ✓ ${t.title} (${Math.round((Date.now() - t0) / 1000)}s, ${cur.model})`);
  }
}
console.log(`tugadi: ${ok} ta mavzu`);
