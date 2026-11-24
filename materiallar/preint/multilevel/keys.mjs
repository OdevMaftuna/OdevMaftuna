// Kitob oxiridagi javoblar kalitini (KEYS) o'qish: har bir sahifa → JSON.
//   node --env-file=.env.local materiallar/preint/multilevel/keys.mjs <rasmlar papkasi> <natija papkasi> <boshlang'ich part>
// Natija: <natija>/pNNN.json = { exercises: [{ part, exercise, answers: { "1": "...", ... } }] }
import fs from "node:fs";
import path from "node:path";

const [imgDir, outDir, startPartArg] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const MODELS = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.5-flash-lite"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROMPT = (part) => `This image is a page of an ANSWER KEY ("Keys") from an English exam-practice book.
Return JSON only: {"exercises":[{"part":number,"exercise":number,"answers":{"1":"...","2":"..."}}]}
- Copy every answer exactly as printed: a word/number (e.g. "summer", "13", "AD 650") or a letter (e.g. "D").
- Ignore stray marks, ticks and handwriting.
- Exercises belong to Part ${part} unless a "PART N" heading appears on the page — exercises after that heading belong to Part N.
- Include every exercise on the page, in order.`;

let part = Number(startPartArg || 1);
for (const f of fs.readdirSync(imgDir).filter((x) => x.endsWith(".jpg")).sort()) {
  const out = path.join(outDir, f.replace(".jpg", ".json"));
  if (fs.existsSync(out)) {
    const prev = JSON.parse(fs.readFileSync(out, "utf8"));
    part = prev.exercises.at(-1)?.part ?? part;
    continue;
  }
  const data = fs.readFileSync(path.join(imgDir, f)).toString("base64");
  let json = null;
  for (let round = 0; round < 12 && !json; round++) {
    for (const model of MODELS) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT(part) }, { inlineData: { mimeType: "image/jpeg", data } }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(120_000),
      }).catch(() => null);
      const body = res ? await res.json().catch(() => ({})) : {};
      const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (res?.ok && text) {
        try {
          json = JSON.parse(text);
          break;
        } catch {}
      }
      console.log(`  ${f} ${model}: ${res?.status ?? "timeout"} ${String(body.error?.message ?? body.candidates?.[0]?.finishReason ?? "").slice(0, 60)}`);
    }
    if (!json) await sleep(20_000);
  }
  if (!json) {
    console.log(`${f}: o'qilmadi — to'xtadi`);
    process.exit(1);
  }
  fs.writeFileSync(out, JSON.stringify(json, null, 1));
  part = json.exercises.at(-1)?.part ?? part;
  console.log(`${f}: ${json.exercises.length} ta mashq (part ${json.exercises[0]?.part}…${part})`);
}
console.log("kalitlar tayyor");
