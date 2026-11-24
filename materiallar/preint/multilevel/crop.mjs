// Kitob sahifalaridan har bir mashqni qirqib olish ("Exercise N" sarlavhasidan keyingisigacha).
//   node materiallar/preint/multilevel/crop.mjs <reading|listening> <boshlang'ich part>
// Kirish: hi/<kitob>/pNNN.jpg (sahifa rasmlari), lines/<kitob>/pNNN.txt (Windows OCR: y`th`tx`tmatn).
// Natija: crops/<kitob>/p<part>e<n>-<k>.jpg va crops/<kitob>/index.json = { "1-10": ["p1e10-1.jpg", ...] }
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [book, startPartArg] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const imgDir = path.join(here, "hi", book);
const lineDir = path.join(here, "lines", book);
const outDir = path.join(here, "crops", book);
fs.mkdirSync(outDir, { recursive: true });

// Sahifa o'lchami birinchi rasmdan olinadi (kitoblar har xil o'lchamda).
const first = fs.readdirSync(imgDir).find((f) => f.endsWith(".jpg"));
const [W, H] = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(imgDir, first)])
  .toString()
  .trim()
  .split(",")
  .map(Number);
const TOP = Math.round(H * 0.0745); // sarlavha (sahifa raqami, "Part N") ostidan
const BOTTOM = H - Math.round(H * 0.055); // pastki yozuv (mytests.uz) ustidan

// 1) Barcha sahifalardagi "Exercise N" va "PART N" sarlavhalarini yig'ish.
const pages = fs.readdirSync(lineDir).filter((f) => f.endsWith(".txt")).sort();
const marks = []; // { page, y, kind: "ex"|"part", n }
for (const f of pages) {
  const page = Number(f.match(/\d+/)[0]);
  const rows = fs
    .readFileSync(path.join(lineDir, f), "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const [y, h, x, ...t] = l.split("`t");
      return { y: Number(y), h: Number(h), x: Number(x), text: t.join(" ").trim() };
    });
  for (const r of rows) {
    if (r.y < TOP - 20 || r.y > BOTTOM) continue;
    // OCR xatolari: oldida 1–2 ortiqcha belgi ("Z Exercise 30"), raqam o'rnida harf ("li"=11, "TO"=10, "4B"=48).
    const ex = r.text.match(/^.{0,3}?[EÉ]x[ec]rc[il1]se\s*([0-9A-Za-z|!]{1,3})\s*$/);
    if (ex) {
      const digits = ex[1].replace(/[IlLi|!T]/g, "1").replace(/[Oo]/g, "0").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2");
      marks.push({ page, y: r.y, kind: "ex", n: /^\d+$/.test(digits) ? Number(digits) : NaN });
    }
    const part = r.text.match(/^PART\s*([1-6])$/);
    if (part) marks.push({ page, y: r.y, kind: "part", n: Number(part[1]) });
  }
}
marks.sort((a, b) => a.page - b.page || a.y - b.y);

// 2) Part raqamini kuzatish: "PART N" sarlavhasi yoki mashq raqami kamaysa — keyingi part.
let part = Number(startPartArg || 1);
let prevN = 0;
const exercises = []; // { part, n, page, y }
for (const m of marks) {
  if (m.kind === "part") {
    if (m.n > part || (m.n === part && prevN > 1)) part = m.n;
    prevN = 0;
    continue;
  }
  // Raqam o'qilmagan yoki ketma-ketlikka to'g'ri kelmasa — oldingisidan keyingisi deb olinadi.
  let n = m.n;
  if (prevN > 0 && (!Number.isFinite(n) || (n !== prevN + 1 && n !== prevN + 2 && !(n <= 2 && prevN > 5)))) n = prevN + 1;
  if (n < prevN && n <= 2) part++;
  prevN = n;
  exercises.push({ part, n, page: m.page, y: m.y });
}

// 3) Qirqish: mashq boshidan keyingi mashq (yoki part sarlavhasi) boshigacha.
const stops = marks.map((m) => ({ page: m.page, y: m.y }));
const index = {};
const crop = (page, y0, y1, out) => {
  const src = path.join(imgDir, `p${String(page).padStart(3, "0")}.jpg`);
  const h = Math.max(1, y1 - y0);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `crop=${W}:${h}:0:${y0}`, "-q:v", "4", out]);
};
for (const e of exercises) {
  const after = stops.find((s) => s.page > e.page || (s.page === e.page && s.y > e.y));
  const endPage = after ? after.page : e.page;
  const endY = after ? after.y - Math.round(H * 0.018) : BOTTOM;
  const files = [];
  for (let p = e.page; p <= endPage; p++) {
    const y0 = p === e.page ? Math.max(TOP, e.y - Math.round(H * 0.018)) : TOP;
    const y1 = p === endPage ? Math.min(BOTTOM, endY) : BOTTOM;
    if (y1 - y0 < 40) continue; // juda kichik bo'lak (bo'sh joy)
    const name = `p${e.part}e${e.n}-${files.length + 1}.jpg`;
    crop(p, y0, y1, path.join(outDir, name));
    files.push(name);
  }
  index[`${e.part}-${e.n}`] = files;
}
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 1));

const byPart = {};
for (const e of exercises) (byPart[e.part] ??= []).push(e.n);
for (const [p, list] of Object.entries(byPart)) {
  const max = Math.max(...list);
  const miss = [];
  for (let i = list[0]; i <= max; i++) if (!list.includes(i)) miss.push(i);
  console.log(`Part ${p}: ${list.length} ta mashq (${list[0]}–${max})${miss.length ? ` · topilmadi: ${miss.join(",")}` : ""}`);
}
