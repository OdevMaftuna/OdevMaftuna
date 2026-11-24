// Telegram'dan yuklangan treklarni (Downloads/*.tmp) davomiylik bo'yicha mashqlarga moslab joylashtiradi.
//   node materiallar/preint/multilevel/take-audio.mjs '<[{"part":2,"n":1,"sec":259}, ...]>'
// Fayllar tugashini kutadi (hajmi o'zgarmay qolguncha), keyin audio/p<part>/e<n>.mp3 ga ko'chiradi.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DL = "C:/Users/user/Downloads";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "audio");
// Argument: JSON ro'yxat yoki "<from> <to>" — audio-targets.json dagi oraliq.
const items = process.argv[3]
  ? JSON.parse(fs.readFileSync(path.join(OUT, "..", "audio-targets.json"), "utf8"))
      .slice(Number(process.argv[2]), Number(process.argv[3]))
      .map(([part, n, sec]) => ({ part, n, sec }))
  : JSON.parse(process.argv[2]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dur = (f) => {
  try {
    return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
  } catch {
    return NaN;
  }
};

// Hamma fayllar tushib, hajmi barqaror bo'lguncha kutish (ko'pi bilan ~4 daqiqa).
let files = [];
for (let t = 0; t < 80; t++) {
  const now = fs.readdirSync(DL).filter((f) => f.endsWith(".tmp") || /^Exercise\s*\d+( \(\d+\))?\.mp3$/i.test(f)).map((f) => path.join(DL, f));
  const sizes = now.map((f) => fs.statSync(f).size);
  await sleep(3000);
  const stable = now.every((f, i) => fs.existsSync(f) && fs.statSync(f).size === sizes[i]);
  files = now;
  if (stable && (now.length >= items.length || t > 5)) break;
}

const left = [...items];
let moved = 0;
// Yuklanish tartibida (bir xil davomiylik bo'lsa — avval bosilgan, ya'ni kichik raqamli mashqqa).
files.sort((x, y) => fs.statSync(x).mtimeMs - fs.statSync(y).mtimeMs);
for (const f of files) {
  const d = dur(f);
  if (!Number.isFinite(d)) continue;
  // Nomida raqam bo'lsa — o'sha mashq (davomiyligi mos kelsa); bo'lmasa eng yaqin davomiylik (±3 s).
  const num = Number(path.basename(f).match(/^Exercise\s*(\d+)/i)?.[1]);
  const byName = left.findIndex((it) => it.n === num && Math.abs(it.sec - d) < 4);
  let best = byName;
  let diff = byName >= 0 ? -1 : 4;
  left.forEach((it, i) => {
    const x = Math.abs(it.sec - d);
    if (x < diff - 0.5) {
      diff = x;
      best = i;
    }
  });
  if (best < 0) {
    console.log(`? ${path.basename(f)} ${d.toFixed(1)} s — mos mashq topilmadi`);
    continue;
  }
  const it = left.splice(best, 1)[0];
  const dir = path.join(OUT, `p${it.part}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(f, path.join(dir, `e${it.n}.mp3`));
  moved++;
}
console.log(`${moved}/${items.length} joylandi` + (left.length ? ` · qolgan: ${left.map((x) => `p${x.part}e${x.n}`).join(", ")}` : ""));
