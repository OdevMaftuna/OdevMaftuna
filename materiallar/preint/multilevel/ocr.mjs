// Multilevel Master kitoblarini sahifama-sahifa matnga o'girish (Gemini vision).
//   node --env-file=.env.local materiallar/preint/multilevel/ocr.mjs <reading|listening> <from> <to>
// Natija: materiallar/preint/multilevel/ocr/<kitob>/pNNN.md — tayyor sahifalar qayta ishlanmaydi,
// kunlik limit tugasa to'xtaydi; qayta ishga tushirilsa, qolgan joyidan davom etadi.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BOOKS = {
  reading: "C:/Users/user/OneDrive/Desktop/english/MULTILEVEL READING.pdf",
  listening: "C:/Users/user/OneDrive/Desktop/english/MULTILEVEL MASTER LISTENING.pdf",
};
const RENDER = "C:/Users/user/AppData/Local/Temp/claude/26bf84818ab67635/7767e513-6420-49e7-9f33-976769f95446/scratchpad/pdf/render.mjs";
const MODELS = ["gemini-3-flash-preview", "gemini-3.5-flash"];
const KEY = process.env.GEMINI_API_KEY;

const [book, fromArg, toArg] = process.argv.slice(2);
if (!BOOKS[book]) throw new Error("reading yoki listening");
const from = Number(fromArg);
const to = Number(toArg);
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const imgDir = path.join(here, "pages", book);
const outDir = path.join(here, "ocr", book);
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(3, "0");

const PROMPT = `This is a scanned page of an English exam-practice book (Multilevel Master ${book === "reading" ? "Reading" : "Listening"}).
Transcribe EVERYTHING on the page faithfully as Markdown, in reading order. Rules:
- Skip only the running page header (page number, book title, "Part N") and the footer ("Darajangizni aniqlash uchun mytests.uz", "Scanned with ...").
- Keep exercise headings exactly, e.g. "## Exercise 12".
- Keep instructions as a bold paragraph.
- Keep text titles as "### Title".
- Keep every numbered gap exactly as it appears, written as "(7) ________" (the number, then underscores).
- Keep lists of options/statements/headings on separate lines exactly with their letters, e.g. "A ...", "B ...".
- Keep question numbers ("1 ...", "2 ...") and answer choices ("A ...", "B ...", "C ...") on separate lines.
- For a map or picture, write "[MAP: short description with all labels and letters/numbers you can see]".
- If two columns, transcribe the left column fully, then the right column.
- Do not add answers, comments or explanations. Uzbek text: transcribe it as is.`;

function render(n) {
  const img = path.join(imgDir, `p${pad(n)}.jpg`);
  if (!fs.existsSync(img)) execFileSync("node", [RENDER, BOOKS[book], imgDir, "1.15", `${n}-${Math.min(to, n + 9)}`], { stdio: "ignore" });
  return img;
}

async function ocr(img) {
  const data = fs.readFileSync(img).toString("base64");
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: "image/jpeg", data } }] }],
          generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: AbortSignal.timeout(90_000),
      }).catch((e) => (console.log(`   ${model}: ${e.name}`), null));
      if (!res) { await sleep(10000); continue; }
      const body = await res.json().catch(() => ({}));
      const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (res.ok && text) return text;
      const msg = String(body.error?.message ?? res.status);
      console.log(`   ${model} ${res.status}: ${msg.slice(0, 100)}`);
      if (res.status === 429 && /per ?day|quota/i.test(msg)) break; // shu model limiti tugadi — keyingisi
      if (res.status === 400 && /thinking/i.test(msg)) {
        // ba'zi modellar thinkingBudget qabul qilmaydi
        return await ocrPlain(model, data);
      }
      await sleep(res.status === 429 ? 30000 : 8000);
    }
  }
  return null;
}

async function ocrPlain(model, data) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: "image/jpeg", data } }] }], generationConfig: { temperature: 0 } }),
  });
  const body = await res.json().catch(() => ({}));
  return body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") || null;
}

let done = 0;
for (let n = from; n <= to; n++) {
  const out = path.join(outDir, `p${pad(n)}.md`);
  if (fs.existsSync(out)) continue;
  const text = await ocr(render(n));
  if (!text) {
    console.log(`p${pad(n)}: limit yoki xato — to'xtadi (${done} ta tayyor)`);
    process.exit(0);
  }
  fs.writeFileSync(out, text);
  done++;
  if (done % 20 === 0) console.log(`${book}: ${done} sahifa (oxirgisi p${pad(n)})`);
  await sleep(1500);
}
console.log(`${book} ${from}-${to}: tugadi (${done} ta yangi)`);
