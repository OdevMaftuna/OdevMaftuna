// Listening bo'limini har bir Pre-Int testiga qo'shadi (Reading oldidan, kitobdagi tartibda).
//   node materiallar/preint/tests/merge-listening.mjs
// Qayta ishga tushirilsa, eski Listening bo'limi almashtiriladi (ikki marta qo'shilmaydi).
import fs from "node:fs";
import path from "node:path";
import { LISTENING } from "./listening.mjs";

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const p = path.join(dir, file);
  const t = JSON.parse(fs.readFileSync(p, "utf8"));
  const L = LISTENING[t.code];
  if (!L) continue;
  t.sections = t.sections.filter((s) => !s.audio);
  // Audio hali yaratilmagan bo'lsa — listening qo'shilmaydi (keyinroq qayta ishga tushiriladi).
  if (!fs.existsSync(path.join(dir, "audio", `${t.code}.mp3`))) {
    fs.writeFileSync(p, JSON.stringify(t, null, 1));
    console.log(`${t.code}: audio hali yo'q — listeningsiz`);
    continue;
  }
  const section = {
    title: L.title,
    audio: `preint/${t.code}.mp3`,
    script: L.clips.map((c) => c.text).join("\n"),
    items: L.items,
  };
  t.sections.splice(t.sections.length - 1, 0, section);
  fs.writeFileSync(p, JSON.stringify(t, null, 1));
  console.log(`${t.code}: listening qo'shildi (${L.items.length} savol)`);
}
