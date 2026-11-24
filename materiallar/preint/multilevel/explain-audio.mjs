// Listening audiolarini AI eshitib: to'liq matn (script) + har bir savolga o'zbekcha izoh.
//   node --env-file=.env.local materiallar/preint/multilevel/explain-audio.mjs [p2e1 p2e2 ...]
// Natija: explain/listening/p<part>e<n>.json = { script, items: [{ n, quote, uz }] }
// Tayyorlari qayta ishlanmaydi; kunlik limit tugasa to'xtaydi (ertaga davom ettiriladi).
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const outDir = path.join(here, "explain", "listening");
fs.mkdirSync(outDir, { recursive: true });
const MODELS = ["gemini-3-flash-preview", "gemini-3.5-flash"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Kalitlar
const keys = {};
for (const f of fs.readdirSync(path.join(here, "keys", "listening")).filter((x) => x.endsWith(".json"))) {
  for (const e of JSON.parse(fs.readFileSync(path.join(here, "keys", "listening", f), "utf8")).exercises ?? []) keys[`${e.part}-${e.exercise}`] = e.answers;
}
const crops = JSON.parse(fs.readFileSync(path.join(here, "crops", "listening", "index.json"), "utf8"));

const TYPE = {
  2: "notes/form completion: each answer is ONE word and/or a number heard in the recording",
  3: "matching: five speakers (1–5) are matched to statements A–F/H printed on the page",
  4: "map labelling: places 1–n are matched to letters on a map",
  5: "multiple choice A/B/C about three extracts",
  6: "lecture notes completion: ONE word per gap",
};

const schema = {
  type: "object",
  properties: {
    script: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { n: { type: "integer" }, quote: { type: "string" }, uz: { type: "string" } },
        required: ["n", "quote", "uz"],
      },
    },
  },
  required: ["script", "items"],
};

const todo = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(here, "audio-enc")).filter((f) => f.endsWith(".mp3")).map((f) => f.replace(".mp3", ""));

// Kuniga ko'pi bilan 10 ta — qolgan Gemini limiti o'quvchilarning uy vazifasini tekshirishga qoladi.
const LIMIT = Number(process.env.EXPLAIN_LIMIT || 10);
let made = 0;
for (const id of todo) {
  const out = path.join(outDir, `${id}.json`);
  if (fs.existsSync(out)) continue;
  if (made >= LIMIT) break;
  const [, part, n] = id.match(/^p(\d)e(\d+)$/).map(Number);
  const answers = keys[`${part}-${n}`];
  if (!answers) continue;
  const audio = fs.readFileSync(path.join(here, "audio-enc", `${id}.mp3`)).toString("base64");
  const images = (crops[`${part}-${n}`] ?? []).map((f) => ({
    inlineData: { mimeType: "image/jpeg", data: fs.readFileSync(path.join(here, "crops", "listening", f)).toString("base64") },
  }));
  const prompt = `You are helping Uzbek English learners (Pre-Intermediate) check a Multilevel listening exercise (Part ${part}: ${TYPE[part]}).
The attached image(s) show the exercise from the book; the audio is its recording.
Correct answers from the book's key: ${Object.entries(answers).map(([q, a]) => `${q}) ${a}`).join("; ")}.
Return JSON:
- "script": a clean transcript of the recording in English, with speaker labels if there are several speakers (e.g. "Man:", "Woman:", "Speaker 1:").
- "items": for EVERY question number in the key: "quote" = the exact short phrase from the recording that gives the answer; "uz" = a short explanation in Uzbek (Latin script, 1–2 sentences) of why this is the answer and, if useful, which tempting wrong option/word the listener might confuse it with. Do not invent anything that is not in the recording.`;
  let json = null;
  for (let round = 0; round < 6 && !json; round++) {
    for (const model of MODELS) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, ...images, { inlineData: { mimeType: "audio/mpeg", data: audio } }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema },
        }),
        signal: AbortSignal.timeout(180_000),
      }).catch(() => null);
      const body = res ? await res.json().catch(() => ({})) : {};
      const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (res?.ok && text) {
        try {
          json = JSON.parse(text);
          break;
        } catch {}
      }
      const msg = String(body.error?.message ?? body.candidates?.[0]?.finishReason ?? res?.status ?? "timeout");
      console.log(`  ${id} ${model}: ${res?.status ?? "-"} ${msg.slice(0, 70)}`);
      if (res?.status === 429 && /day/i.test(msg) && model === MODELS.at(-1)) {
        console.log("Kunlik limit tugadi — to'xtadi");
        process.exit(0);
      }
    }
    if (!json) await sleep(20_000);
  }
  if (!json) continue;
  fs.writeFileSync(out, JSON.stringify(json, null, 1));
  made++;
  console.log(`${id}: ✓ (${json.items.length} izoh)`);
  await sleep(4000);
}
console.log("tugadi");
