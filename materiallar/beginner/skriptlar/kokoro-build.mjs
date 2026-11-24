/**
 * Kurs audiolari — BEPUL, kompyuterning o'zida (Kokoro, ochiq kodli ovoz modeli, Apache-2.0).
 * Limit yo'q, internet faqat birinchi marta modelni yuklab olish uchun kerak.
 *
 *   node materiallar/beginner/skriptlar/kokoro-build.mjs [listening|reading|sample] [--from N --to M]
 *
 * Natija: materiallar/beginner/audio/... (MP3) va audio.json (fayl + qatorlar vaqti).
 * Qayta ishga tushirilsa, tayyorlari o'tkazib yuboriladi. Darslar sanasi tartibida yaratiladi.
 * Ovozlar: KOKORO_VOICE (asosiy) va KOKORO_VOICE2 (dialogdagi ikkinchi kishi).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const TOOLS = "C:/Users/user/AppData/Local/Temp/claude/c683c4e604fcfe81/68ba55ec-a606-40dd-8c3c-75b53471a65f/scratchpad";
const require = createRequire(`${TOOLS}/kokoro/package.json`);
const { KokoroTTS } = await import(pathToFileURL(require.resolve("kokoro-js")).href);
const lamejs = require(`${TOOLS}/pdftool/node_modules/@breezystack/lamejs/dist/lamejs.js`);

const ROOT = "materiallar/beginner";
const AUDIO = path.join(ROOT, "audio");
const VOICE = process.env.KOKORO_VOICE ?? "am_michael";
const VOICE2 = process.env.KOKORO_VOICE2 ?? "am_adam";
const SPEED = 0.9;
const args = process.argv.slice(2);
const only = args.find((a) => /^(listening|reading|sample)$/.test(a)) ?? null;
const num = (name, def) => (args.includes(name) ? Number(args[args.indexOf(name) + 1]) : def);
const FROM = num("--from", 1), TO = num("--to", 999);

const { days } = JSON.parse(fs.readFileSync(path.join(ROOT, "lessons.json"), "utf8"));
const speaking = JSON.parse(fs.readFileSync(path.join(ROOT, "speaking.json"), "utf8"));
const listening = JSON.parse(fs.readFileSync(path.join(ROOT, "listening.json"), "utf8"));
const manifestPath = path.join(ROOT, "audio.json");
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
// Faqat Kokoro yozuvlari saqlanadi (eski Gemini yozuvlari bir xil ovoz bo'lishi uchun almashtiriladi).
const manifest = old.engine === "kokoro" ? old : { engine: "kokoro", voices: [VOICE, VOICE2], reading: {}, listening: {}, sample: {} };
const save = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

// ---------------------------------------------------------------- audio
function toMp3(float32, rate) {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const enc = new lamejs.Mp3Encoder(1, rate, 48);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) chunks.push(Buffer.from(b));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

/** Bo'laklarni pauza bilan ulaydi; har bo'lakning boshlanish/tugash vaqti (soniya) qaytadi. */
function join(parts, rate, pause) {
  const gap = Math.round(rate * pause);
  const lead = Math.round(rate * 0.3);
  const total = lead + parts.reduce((t, p) => t + p.length + gap, 0);
  const out = new Float32Array(total);
  const segments = [];
  let pos = lead;
  for (const p of parts) {
    out.set(p, pos);
    segments.push([Math.round((pos / rate) * 100) / 100, Math.round(((pos + p.length) / rate) * 100) / 100]);
    pos += p.length + gap;
  }
  return { audio: out, segments };
}

const write = (rel, float32, rate) => {
  const file = path.join(AUDIO, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, toMp3(float32, rate));
  return rel;
};

// ---------------------------------------------------------------- jobs (dars kunlari tartibida)
console.log(`Model yuklanmoqda… (ovozlar: ${VOICE}, ${VOICE2})`);
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
const say = async (text, voice = VOICE) => {
  const a = await tts.generate(text, { voice, speed: SPEED });
  return { data: a.audio, rate: a.sampling_rate };
};

const jobs = [];
for (const d of days) {
  if (d.day < FROM || d.day > TO) continue;
  const t = speaking.find((x) => x.topic === d.day);
  const l = t ? listening[t.topic] : null;

  if ((!only || only === "listening") && l?.ok && !manifest.listening[t.topic]) {
    jobs.push({
      name: `${d.day}-kun listening`,
      run: async () => {
        const ld = l.data;
        const parts = [];
        let rate = 24000;
        for (const line of ld.lines) {
          const r = await say(line.text, ld.speakers.indexOf(line.speaker) === 1 ? VOICE2 : VOICE);
          parts.push(r.data);
          rate = r.rate;
        }
        const { audio, segments } = join(parts, rate, 0.55);
        const file = write(`listening/topic-${String(t.topic).padStart(2, "0")}.mp3`, audio, rate);
        manifest.listening[t.topic] = { file, segments };
      },
    });
  }

  if (!only || only === "reading")
    for (const r of d.readings ?? []) {
      if (manifest.reading[r.id]) continue;
      jobs.push({
        name: `${d.day}-kun reading ${r.id}`,
        run: async () => {
          const parts = [];
          let rate = 24000;
          for (const p of [`${r.title}.`, ...r.text]) {
            const x = await say(p);
            parts.push(x.data);
            rate = x.rate;
          }
          const { audio, segments } = join(parts, rate, 0.7);
          const file = write(`reading/${r.id}.mp3`, audio, rate);
          manifest.reading[r.id] = { file, segments };
        },
      });
    }

  if ((!only || only === "sample") && t && !manifest.sample[t.topic]) {
    jobs.push({
      name: `${d.day}-kun namuna`,
      run: async () => {
        const x = await say(t.sample.replace(/\*\*/g, ""));
        const { audio } = join([x.data], x.rate, 0.3);
        manifest.sample[t.topic] = { file: write(`speaking/sample-${String(t.topic).padStart(2, "0")}.mp3`, audio, x.rate) };
      },
    });
  }
}

console.log(`vazifalar: ${jobs.length}`);
const t0 = Date.now();
let done = 0;
for (const job of jobs) {
  try {
    await job.run();
    done++;
    save();
    console.log(`[${done}/${jobs.length}] ${job.name} ✓ (${Math.round((Date.now() - t0) / 1000)}s)`);
  } catch (e) {
    console.log(`[${done}/${jobs.length}] ${job.name} ✗ ${e.message}`);
  }
}
save();
console.log(`tugadi: ${done}/${jobs.length}, ${Math.round((Date.now() - t0) / 60000)} daqiqa`);
