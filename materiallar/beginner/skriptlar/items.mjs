// Dump every text item with page, x, y, width so tables can be reconstructed by position.
import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const [input, output] = process.argv.slice(2);
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(input)), useSystemFonts: true }).promise;
const all = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const vp = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  for (const it of content.items) {
    if (!it.str || !it.str.trim()) continue;
    all.push({
      p,
      x: Math.round(it.transform[4] * 10) / 10,
      // top-down y for easier reading
      y: Math.round((vp.height - it.transform[5]) * 10) / 10,
      w: Math.round(it.width * 10) / 10,
      h: Math.round((it.height || Math.abs(it.transform[3])) * 10) / 10,
      font: it.fontName,
      s: it.str,
    });
  }
}
fs.writeFileSync(output, JSON.stringify(all));
console.log("items", all.length);
