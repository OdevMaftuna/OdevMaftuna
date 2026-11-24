// Parse the Beginner Reading Book (positions dump) into structured readings + answer keys.
import fs from "node:fs";

const items = JSON.parse(fs.readFileSync(new URL("./items.json", import.meta.url)));
const near = (a, b, tol = 4) => Math.abs(a - b) <= tol;
const clean = (s) => s.replace(/\s+/g, " ").replace(/ /g, " ").trim();

// ---------- 1. Lines (per page, sorted top-down), without header/footer ----------
const lines = [];
const pages = [...new Set(items.map((i) => i.p))];
for (const p of pages) {
  const its = items
    .filter((i) => i.p === p)
    .filter((i) => !(i.y < 35 && i.s.startsWith("Beginner Reading Book")))
    .filter((i) => !/^Page \d+ of \d+$/.test(i.s.trim()))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  let cur = null;
  for (const it of its) {
    if (cur && Math.abs(it.y - cur.y) <= 2) cur.items.push(it);
    else {
      cur = { p, y: it.y, items: [it] };
      lines.push(cur);
    }
  }
}
for (const l of lines) {
  l.items.sort((a, b) => a.x - b.x);
  l.text = clean(l.items.map((i) => i.s).join(" "));
  l.x = l.items[0].x;
}

// ---------- 2. Split into the book body and the answer keys ----------
const keyIdx = lines.findIndex((l) => l.text.startsWith("Answer Key (Javoblar)"));
const extraIdx = lines.findIndex((l) => l.text.startsWith("Answer Key: Extra Readings"));
const body = lines.slice(0, keyIdx);
const key1 = lines.slice(keyIdx + 1, extraIdx);
const key2 = lines.slice(extraIdx + 1);

// ---------- 3. Vocabulary tables (position based) ----------
let COLS = { en1: 62.2, uz1: 165.5, en2: 329.5, uz2: 426.8 };
const colOf = (x) => Object.entries(COLS).find(([, cx]) => near(x, cx, 5))?.[0];
const isTableHeader = (l) => /English\s+O'zbekcha/.test(l.text);
const isTableRowStart = (l) =>
  l.items.some((i) => near(i.x, COLS.uz1, 5) || near(i.x, COLS.uz2, 5)) &&
  l.items.every((i) => colOf(i.x));
const isTableWrap = (l, prev) =>
  prev && prev.p === l.p && l.y - prev.y < 20 && l.items.every((i) => colOf(i.x) && !near(i.x, 54, 3));

// mark table lines
let inTable = false;
let prevTable = null;
for (const l of body) {
  if (isTableHeader(l)) {
    l.kind = "tableHeader";
    const hx = l.items.map((i) => i.x);
    if (hx.length === 4) COLS = { en1: hx[0], uz1: hx[1], en2: hx[2], uz2: hx[3] };
    l.cols = COLS;
    inTable = true;
    prevTable = null;
    continue;
  }
  if (inTable) {
    if (isTableRowStart(l) && (!prevTable || l.p !== prevTable.p || l.y - prevTable.y >= 20)) {
      l.kind = "tableRow";
      l.cols = COLS;
      prevTable = l;
      continue;
    }
    if (isTableWrap(l, prevTable)) {
      l.kind = "tableWrap";
      l.cols = COLS;
      prevTable = l;
      continue;
    }
    // table may continue on the next page
    if (prevTable && l.p === prevTable.p + 1 && isTableRowStart(l)) {
      l.kind = "tableRow";
      l.cols = COLS;
      prevTable = l;
      continue;
    }
    inTable = false;
  }
}

function tableRows(tlines) {
  const rows = [];
  let row = null;
  for (const l of tlines) {
    if (l.kind === "tableRow") {
      row = { en1: [], uz1: [], en2: [], uz2: [] };
      rows.push(row);
    }
    COLS = l.cols;
    for (const it of l.items) row[colOf(it.x)].push(it.s);
  }
  const pairs = [];
  for (const r of rows) {
    for (const [e, u] of [["en1", "uz1"], ["en2", "uz2"]]) {
      const en = clean(r[e].join(" "));
      const uz = clean(r[u].join(" "));
      if (en || uz) pairs.push({ en, uz });
    }
  }
  return pairs;
}

// ---------- 4. Walk the body: units, readings, sections ----------
const units = [];
let unit = null;
let reading = null;
let section = null; // "text" | "tf" | "mc" | "fill" | "tr"
let lastItem = null;
let tableBuf = [];
let lastBodyLine = null;

const flushTable = () => {
  if (tableBuf.length && reading) reading.vocab.push(...tableRows(tableBuf));
  tableBuf = [];
};
const newReading = (num, title) => {
  flushTable();
  reading = { unit: unit.num, num, title: clean(title), paras: [], vocab: [], tf: [], mc: [], fill: { box: [], items: [] }, tr: [] };
  unit.readings.push(reading);
  section = "text";
  lastItem = null;
  lastBodyLine = null;
};

for (const l of body) {
  if (l.kind === "tableHeader") continue;
  if (l.kind === "tableRow" || l.kind === "tableWrap") {
    tableBuf.push(l);
    continue;
  }
  flushTable();
  const t = l.text;
  let m;
  if ((m = t.match(/^Unit (\d+)\. (.+)$/))) {
    unit = { num: Number(m[1]), title: clean(m[2]), readings: [] };
    units.push(unit);
    newReading(1, m[2]);
    continue;
  }
  if ((m = t.match(/^Unit (\d+) · Reading (\d+)\. (.+)$/))) {
    newReading(Number(m[2]), m[3]);
    continue;
  }
  if (!reading) continue;
  if (/^(Reading|Vocabulary|Exercises)$/.test(t)) continue;
  if (/^A\. True or False/.test(t)) { section = "tf"; lastItem = null; continue; }
  if (/^B\. Choose/.test(t)) { section = "mc"; lastItem = null; continue; }
  if (/^C\. Complete/.test(t)) { section = "fillbox"; lastItem = null; continue; }
  if (/^D\. Translate/.test(t)) { section = "tr"; lastItem = null; continue; }

  if (section === "text") {
    // new paragraph if vertical gap is larger than a normal line step, or page changed and line starts a sentence
    const gap = lastBodyLine && lastBodyLine.p === l.p ? l.y - lastBodyLine.y : null;
    if (!reading.paras.length || (gap !== null && gap > 24)) reading.paras.push(t);
    else reading.paras[reading.paras.length - 1] += " " + t;
    lastBodyLine = l;
    continue;
  }
  if (section === "fillbox") {
    reading.fill.box = t.split("·").map(clean).filter(Boolean);
    section = "fill";
    continue;
  }
  const num = t.match(/^(\d+)\.\s+(.*)$/);
  const target = { tf: reading.tf, mc: reading.mc, fill: reading.fill.items, tr: reading.tr }[section];
  if (!target) continue;
  if (num) {
    lastItem = { n: Number(num[1]), raw: num[2] };
    target.push(lastItem);
  } else if (lastItem) {
    lastItem.raw += " " + t; // wrapped line
  }
}
flushTable();

// post-process items
for (const u of units)
  for (const r of u.readings) {
    r.tf = r.tf.map((i) => ({ n: i.n, q: clean(i.raw) }));
    r.mc = r.mc.map((i) => {
      const s = clean(i.raw);
      const mm = s.match(/^(.*?)\s+—\s+A\s+(.*?)\s+\/\s+B\s+(.*?)\s+\/\s+C\s+(.*)$/);
      return mm ? { n: i.n, q: mm[1], options: [mm[2], mm[3], mm[4]] } : { n: i.n, q: s, options: null };
    });
    r.fill.items = r.fill.items.map((i) => ({ n: i.n, q: clean(i.raw) }));
    r.tr = r.tr.map((i) => {
      const s = clean(i.raw);
      return { n: i.n, uz: s.replace(/\s+—\s+_+\s*$/, "").trim() };
    });
    r.text = r.paras;
    delete r.paras;
  }

// ---------- 5. Answer keys ----------
function keyTable(klines, cols) {
  // cols: [{name, x}] — row starts when the first column has a number
  const rows = [];
  let row = null;
  for (const l of klines) {
    // ichki sarlavha qatorlari (sahifada jadval ikkiga bo'linganda takrorlanadi)
    if (/^(Reading|Unit)\b/.test(l.text) && !/^\d/.test(l.text)) { row = null; continue; }
    const first = l.items.find((i) => near(i.x, cols[0].x, 5));
    if (first && /^\d+$/.test(first.s.trim())) {
      row = { id: Number(first.s), cells: Object.fromEntries(cols.slice(1).map((c) => [c.name, []])) };
      rows.push(row);
    }
    if (!row) continue;
    for (const it of l.items) {
      const c = cols.slice(1).find((c) => near(it.x, c.x, 6));
      if (c) row.cells[c.name].push(it.s);
    }
  }
  return rows.map((r) => ({ id: r.id, ...Object.fromEntries(Object.entries(r.cells).map(([k, v]) => [k, clean(v.join(" "))])) }));
}
const splitList = (s) => s.split(",").map(clean).filter(Boolean);

const k1 = keyTable(key1.filter((l) => !/^(Unit A\.|True\/False)/.test(l.text)), [
  { name: "unit", x: 62.2 }, { name: "A", x: 100.5 }, { name: "B", x: 176.4 }, { name: "C", x: 228.4 }, { name: "D", x: 395.8 },
]);
// extra readings: split by "Unit N" headings
const k2 = {};
let curUnit = null;
let buf = [];
const flushK2 = () => {
  if (curUnit !== null)
    k2[curUnit] = keyTable(buf, [{ name: "reading", x: 62.2 }, { name: "A", x: 121.0 }, { name: "B", x: 184.4 }, { name: "C", x: 234.6 }]);
  buf = [];
};
for (const l of key2) {
  const m = l.text.match(/^Unit (\d+)$/);
  if (m) { flushK2(); curUnit = Number(m[1]); continue; }
  buf.push(l);
}
flushK2();

if (process.env.DEBUG_KEY) { const i = key2.findIndex((l) => l.text === "Unit 9"); console.log(key2.slice(i, i + 12).map((l) => l.p + " " + l.y + " " + JSON.stringify(l.text)).join(" || ")); }
const problems = [];
for (const u of units) {
  for (const r of u.readings) {
    const k = r.num === 1 ? k1.find((x) => x.id === u.num) : (k2[u.num] ?? []).find((x) => x.id === r.num);
    if (!k) { problems.push(`U${u.num}R${r.num}: javob kaliti topilmadi`); continue; }
    const A = splitList(k.A).map((v) => v === "T");
    const B = splitList(k.B).map((v) => "ABC".indexOf(v));
    const C = splitList(k.C);
    const D = k.D ? splitList(k.D) : [];
    r.tf.forEach((it, i) => (it.answer = A[i]));
    r.mc.forEach((it, i) => (it.answer = B[i]));
    r.fill.items.forEach((it, i) => (it.answer = C[i]));
    r.tr.forEach((it, i) => (it.answer = D[i]));
    const id = `U${u.num}R${r.num}`;
    if (A.length !== r.tf.length) problems.push(`${id}: T/F ${r.tf.length} savol, ${A.length} javob`);
    if (B.length !== r.mc.length) problems.push(`${id}: MC ${r.mc.length} savol, ${B.length} javob`);
    if (C.length !== r.fill.items.length) problems.push(`${id}: fill ${r.fill.items.length} savol, ${C.length} javob`);
    if (r.tr.length && D.length !== r.tr.length) problems.push(`${id}: tr ${r.tr.length} savol, ${D.length} javob`);
    if (r.mc.some((q) => !q.options)) problems.push(`${id}: MC variantlari ajratilmadi`);
    if (r.mc.some((q) => !(q.answer >= 0 && q.answer <= 2))) problems.push(`${id}: MC javobi noto'g'ri: ${k.B}`);
    if (r.tf.some((q) => typeof q.answer !== 'boolean')) problems.push(`${id}: T/F javobi noto'g'ri`);
    const box = r.fill.box.map((w) => w.toLowerCase());
    if (r.fill.items.some((q) => !q.answer || !box.includes(q.answer.toLowerCase()))) problems.push(`${id}: fill javobi qutida yo'q: ${k.C} | quti: ${r.fill.box.join(', ')}`);
    if (r.tr.some((q) => !q.answer)) problems.push(`${id}: tarjima javobi yo'q`);
    if (!r.vocab.length) problems.push(`${id}: lug'at bo'sh`);
    if (r.vocab.some((v) => !v.en || !v.uz)) problems.push(`${id}: lug'atda bo'sh katak: ${JSON.stringify(r.vocab.filter((v) => !v.en || !v.uz))}`);
    if (!r.fill.box.length) problems.push(`${id}: C so'zlar qutisi yo'q`);
    const words = r.text.join(" ").split(/\s+/).length;
    if (words < 120) problems.push(`${id}: matn qisqa (${words} so'z)`);
  }
}

const readings = units.flatMap((u) => u.readings.map((r) => ({ ...r, unitTitle: u.title })));
fs.writeFileSync(new URL("./readings.json", import.meta.url), JSON.stringify(readings, null, 1));
console.log(`units: ${units.length}, readings: ${readings.length}`);
console.log("per unit:", units.map((u) => `${u.num}:${u.readings.length}`).join(" "));
console.log(`problems: ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log("  -", p);
