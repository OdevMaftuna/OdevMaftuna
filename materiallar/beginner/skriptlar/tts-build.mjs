/**
 * Kurs uchun audiolarni yaratish (Gemini TTS, amerikacha erkak ovozi) va MP3 ga siqish.
 * Doimiy nusxa: materiallar/beginner/audio/... ; ro'yxat: materiallar/beginner/audio.json
 *
 *   node --env-file=.env.local materiallar/beginner/skriptlar/tts-build.mjs [faqat: reading|vocab|listening|sample] [parallel=2]
 *
 * Qayta ishga tushirilsa, tayyor fayllar o'tkazib yuboriladi (davom ettiradi).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lamejs = require("C:/Users/user/AppData/Local/Temp/claude/c683c4e604fcfe81/68ba55ec-a606-40dd-8c3c-75b53471a65f/scratchpad/pdftool/node_modules/@breezystack/lamejs/dist/lamejs.js");

const ROOT = "materiallar/beginner";
const AUDIO = path.join(ROOT, "audio");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-preview-tts";
const MAIN_VOICE = "Charon";
const SECOND_VOICE = "Orus";
const only = process.argv[2] && !/^\d+$/.test(process.argv[2]) ? process.argv[2] : null;
const PARALLEL = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 2);

const STYLE =
  "Read this aloud for beginner learners of English, in a clear, warm, standard General American accent. Speak slowly and clearly, with natural pauses between sentences:";

const { days } = JSON.parse(fs.readFileSync(path.join(ROOT, "lessons.json"), "utf8"));
const speaking = JSON.parse(fs.readFileSync(path.join(ROOT, "speaking.json"), "utf8"));
const listening = fs.existsSync(path.join(ROOT, "listening.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "listening.json"), "utf8"))
  : {};
const manifestPath = path.join(ROOT, "audio.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { reading: {}, words: {}, listening: {}, sample: {} };
const saveManifest = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

// ---------------------------------------------------------------- audio helpers
function toMp3(pcm, rate) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const enc = new lamejs.Mp3Encoder(1, rate, 40);
  const chunks = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const b = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (b.length) chunks.push(Buffer.from(b));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

/** Trim leading/trailing silence and pad 0.15 s. */
function trim(samples, rate) {
  const thr = 600;
  let a = 0, b = samples.length - 1;
  while (a < b && Math.abs(samples[a]) < thr) a++;
  while (b > a && Math.abs(samples[b]) < thr) b--;
  const pad = Math.round(rate * 0.15);
  return samples.subarray(Math.max(0, a - pad), Math.min(samples.length, b + pad));
}

/** Split a word-list recording at long silences; returns `expected` segments or null. */
function splitWords(pcm, rate, expected) {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const frame = Math.round(rate * 0.02);
  const energy = [];
  for (let i = 0; i < s.length; i += frame) {
    let sum = 0;
    for (let j = i; j < Math.min(s.length, i + frame); j++) sum += Math.abs(s[j]);
    energy.push(sum / frame);
  }
  const loud = energy.map((e) => e > 350);
  // find silent runs; try decreasing minimum gap lengths until we get the expected count
  for (const minGap of [40, 32, 25, 20, 16, 12]) {
    const segs = [];
    let start = null, silent = 0;
    for (let k = 0; k < loud.length; k++) {
      if (loud[k]) {
        if (start === null) start = k;
        silent = 0;
      } else if (start !== null) {
        silent++;
        if (silent >= minGap) {
          segs.push([start, k - silent + 1]);
          start = null;
          silent = 0;
        }
      }
    }
    if (start !== null) segs.push([start, loud.length]);
    const real = segs.filter(([a, b]) => b - a >= 6); // ignore clicks < 120 ms
    if (real.length === expected) return real.map(([a, b]) => trim(s.subarray(a * frame, b * frame), rate));
  }
  return null;
}

// ---------------------------------------------------------------- Gemini TTS
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function tts(text, voices) {
  const speechConfig = Array.isArray(voices)
    ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: voices.map(([speaker, voiceName]) => ({ speaker, voiceConfig: { prebuiltVoiceConfig: { voiceName } } })) } }
    : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voices } } };
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig } }),
        signal: AbortSignal.timeout(180000),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429 || res.status >= 500) {
        const retry = body?.error?.details?.find((d) => d.retryDelay)?.retryDelay;
        const wait = retry ? Math.ceil(parseFloat(retry) * 1000) + 1000 : 15000 * (attempt + 1);
        const quota = JSON.stringify(body?.error?.details?.find((d) => d.violations)?.violations ?? "").slice(0, 200);
        console.log(`    ${res.status}, ${Math.round(wait / 1000)}s kutiladi ${quota}`);
        if (/per ?day/i.test(quota)) throw new Error("KUNLIK LIMIT: " + quota);
        await sleep(wait);
        continue;
      }
      const data = body?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
      if (!res.ok || !data) throw new Error(`HTTP ${res.status} ${JSON.stringify(body.error ?? body).slice(0, 160)}`);
      return { pcm: Buffer.from(data.data, "base64"), rate: Number(data.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000) };
    } catch (e) {
      if (String(e.message).startsWith("KUNLIK LIMIT")) throw e;
      console.log(`    xato (${attempt + 1}): ${e.message}`);
      await sleep(5000 * (attempt + 1));
    }
  }
  throw new Error("TTS bajarilmadi");
}

const writeMp3 = (rel, pcm, rate) => {
  const file = path.join(AUDIO, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, toMp3(pcm, rate));
  return rel.replace(/\\/g, "/");
};
const stripBold = (s) => s.replace(/\*\*/g, "");

// ---------------------------------------------------------------- jobs
const jobs = [];
const readings = days.flatMap((d) => d.readings ?? []);

if (!only || only === "listening")
  for (const [topic, item] of Object.entries(listening)) {
    if (!item.ok || manifest.listening[topic]) continue;
    const d = item.data;
    jobs.push({
      name: `listening ${topic}`,
      run: async () => {
        const script = d.lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
        const text = `Read this conversation between ${d.speakers[0]} and ${d.speakers[1]} for beginner learners, in clear standard General American English, slowly and naturally, with a short pause between turns:\n\n${script}`;
        const { pcm, rate } = await tts(text, [[d.speakers[0], MAIN_VOICE], [d.speakers[1], SECOND_VOICE]]);
        manifest.listening[topic] = writeMp3(`listening/topic-${String(topic).padStart(2, "0")}.mp3`, pcm, rate);
      },
    });
  }

if (!only || only === "sample")
  for (const t of speaking) {
    if (manifest.sample[t.topic]) continue;
    jobs.push({
      name: `sample ${t.topic}`,
      run: async () => {
        const { pcm, rate } = await tts(`${STYLE}\n\n${stripBold(t.sample)}`, MAIN_VOICE);
        manifest.sample[t.topic] = writeMp3(`speaking/sample-${String(t.topic).padStart(2, "0")}.mp3`, pcm, rate);
      },
    });
  }

if (!only || only === "reading")
  for (const r of readings) {
    if (manifest.reading[r.id]) continue;
    jobs.push({
      name: `reading ${r.id}`,
      run: async () => {
        const { pcm, rate } = await tts(`${STYLE}\n\n${r.title}.\n\n${r.text.join("\n\n")}`, MAIN_VOICE);
        manifest.reading[r.id] = writeMp3(`reading/${r.id}.mp3`, pcm, rate);
      },
    });
  }

if (!only || only === "vocab") {
  const sets = [
    ...readings.map((r) => ({ id: r.id, words: r.vocab.map((v) => v.en) })),
    ...speaking.map((t) => ({ id: `T${t.topic}`, words: t.vocab.map((v) => v.en) })),
  ];
  for (const set of sets) {
    const todo = [...new Set(set.words)].filter((w) => !manifest.words[w.toLowerCase()]);
    if (!todo.length) continue;
    jobs.push({
      name: `vocab ${set.id} (${todo.length})`,
      run: async () => {
        const list = todo.map((w) => w.replace(/\s*\/\s*/g, " or ")).join("\n...\n");
        const text = `Read each of these English words or phrases once, in a clear General American accent, slowly. After each one, stay completely silent for two full seconds. Do not say anything else:\n\n${list}`;
        const { pcm, rate } = await tts(text, MAIN_VOICE);
        const parts = splitWords(pcm, rate, todo.length);
        if (!parts) {
          console.log(`    ${set.id}: so'zlarga ajratib bo'lmadi, o'tkazildi`);
          return;
        }
        todo.forEach((w, i) => {
          const slug = w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "w";
          const buf = Buffer.from(parts[i].buffer, parts[i].byteOffset, parts[i].byteLength);
          manifest.words[w.toLowerCase()] = writeMp3(`words/${slug}.mp3`, buf, rate);
        });
      },
    });
  }
}

console.log(`vazifalar: ${jobs.length} (parallel ${PARALLEL})`);
let next = 0, done = 0, failed = 0;
const t0 = Date.now();
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    try {
      await job.run();
      done++;
      saveManifest();
      console.log(`[${done + failed}/${jobs.length}] ${job.name} ✓ (${Math.round((Date.now() - t0) / 1000)}s)`);
    } catch (e) {
      failed++;
      console.log(`[${done + failed}/${jobs.length}] ${job.name} ✗ ${e.message}`);
      if (String(e.message).startsWith("KUNLIK LIMIT")) { next = jobs.length; }
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
saveManifest();
console.log(`tugadi: ${done} ok, ${failed} xato, ${Math.round((Date.now() - t0) / 1000)}s`);
