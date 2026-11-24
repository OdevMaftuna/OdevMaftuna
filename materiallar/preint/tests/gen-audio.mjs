// Listening audiolarini yaratish (Gemini TTS) → materiallar/preint/tests/audio/<KOD>.mp3
//   node --env-file=.env.local materiallar/preint/tests/gen-audio.mjs [KOD ...]
// Bo'laklar audio/clips/ da saqlanadi — qayta ishga tushirilsa, tayyorlari qayta yaratilmaydi.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { LISTENING } from "./listening.mjs";

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const out = path.join(dir, "audio");
const clipsDir = path.join(out, "clips");
fs.mkdirSync(clipsDir, { recursive: true });
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-preview-tts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(clip) {
  const names = Object.keys(clip.speakers);
  const speechConfig =
    names.length === 2
      ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: names.map((n) => ({ speaker: n, voiceConfig: { prebuiltVoiceConfig: { voiceName: clip.speakers[n] } } })),
          },
        }
      : { voiceConfig: { prebuiltVoiceConfig: { voiceName: clip.speakers[names[0]] } } };
  const text =
    names.length === 2
      ? `Read this conversation between ${names[0]} and ${names[1]} naturally, at a calm speed for English learners:\n${clip.text}`
      : `Read this naturally, at a calm speed for English learners: ${clip.text}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig } }),
    });
    const body = await res.json().catch(() => ({}));
    const data = body.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (data) return Buffer.from(data, "base64");
    const msg = body.error?.message ?? res.status;
    console.log(`   TTS ${res.status}: ${String(msg).slice(0, 90)}`);
    if (res.status === 429 && /per ?day/i.test(String(msg))) throw new Error("Kunlik limit tugadi");
    await sleep(res.status === 429 ? 30000 : 8000);
  }
  throw new Error("TTS ishlamadi");
}

const codes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LISTENING);
for (const code of codes) {
  const L = LISTENING[code];
  const final = path.join(out, `${code}.mp3`);
  if (fs.existsSync(final)) {
    console.log(`${code}: tayyor`);
    continue;
  }
  const wavs = [];
  for (const [i, clip] of L.clips.entries()) {
    const wav = path.join(clipsDir, `${code}-${i}.wav`);
    if (!fs.existsSync(wav)) {
      const pcm = await tts(clip);
      const raw = path.join(clipsDir, `${code}-${i}.pcm`);
      fs.writeFileSync(raw, pcm);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
      fs.rmSync(raw);
      await sleep(4000);
    }
    wavs.push(wav);
  }
  // Bo'laklar orasiga 0.8 s jimlik; boshida 1 s.
  const silence = path.join(clipsDir, "silence.wav");
  if (!fs.existsSync(silence)) execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.8", silence]);
  const list = path.join(clipsDir, `${code}.txt`);
  fs.writeFileSync(list, [silence, ...wavs.flatMap((w) => [w, silence])].map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-ac", "1", "-b:a", "64k", final]);
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]).toString().trim();
  console.log(`${code}: ✓ ${Math.round(Number(dur))} s`);
}
