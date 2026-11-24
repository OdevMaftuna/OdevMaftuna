// Loads the paid tests (materiallar/beginner/tests/*.json) into Supabase.
// Questions go to paid_test_content (no answers); answers go to paid_test_keys (server only).
// Usage: node --env-file=.env.local scripts/load-paid-tests.mjs [beginner|preint]
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const which = process.argv[2] ?? "beginner";
const dir = path.join(process.cwd(), `materiallar/${which}/tests`);
const COURSE = { beginner: "Beginner", preint: "Pre-Intermediate" }[which];
if (!COURSE) throw new Error("beginner yoki preint");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function validate(file, t) {
  const errors = [];
  if (!t.code || !t.title || !Array.isArray(t.sections)) errors.push("missing code/title/sections");
  t.sections.forEach((s, si) => {
    s.items.forEach((it, ii) => {
      const where = `${file} §${si + 1}#${ii + 1}`;
      if (it.t === "mc") {
        if (!Array.isArray(it.o) || it.o.length < 2) errors.push(`${where}: options`);
        if (!Number.isInteger(it.a) || it.a < 0 || it.a >= it.o.length) errors.push(`${where}: answer index`);
      } else if (it.t === "text") {
        if (!Array.isArray(it.a) || !it.a.length) errors.push(`${where}: answers`);
      } else if (it.t === "tf") {
        if (typeof it.a !== "boolean") errors.push(`${where}: tf answer`);
      } else errors.push(`${where}: type ${it.t}`);
    });
  });
  return errors;
}

let total = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const t = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const errors = validate(file, t);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  const content = {
    sections: t.sections.map((s) => ({
      title: s.title,
      ...(s.passage ? { passage: s.passage } : {}),
      ...(s.box ? { box: s.box } : {}),
      // Listening: faqat audio fayl yo'li (matni o'quvchiga berilmaydi).
      ...(s.audio ? { audio: s.audio } : {}),
      items: s.items.map((it) => ({ t: it.t, q: it.q, ...(it.o ? { o: it.o } : {}), ...(it.hint ? { hint: it.hint } : {}) })),
    })),
  };
  const answers = t.sections.flatMap((s) => s.items.map((it) => it.a));
  const count = answers.length;

  const { data: row, error } = await admin
    .from("paid_tests")
    .upsert(
      {
        code: t.code,
        kind: t.kind,
        unit: t.unit ?? null,
        title: t.title,
        subtitle: t.subtitle ?? "",
        price: t.price,
        course: t.course ?? COURSE,
        sort: t.sort ?? (t.kind === "level" ? 100 : t.unit),
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const r1 = await admin.from("paid_test_content").upsert({ test_id: row.id, content });
  if (r1.error) throw r1.error;
  // Listening audiosini yopiq bucketga yuklash; matni faqat kalit bilan (o'qituvchi uchun).
  const scripts = [];
  for (const [si, s] of t.sections.entries()) {
    if (!s.audio) continue;
    const file = path.join(dir, "audio", path.basename(s.audio));
    if (!fs.existsSync(file)) throw new Error(`${t.code}: audio yo'q — ${file}`);
    const up = await admin.storage.from("test-audio").upload(s.audio, fs.readFileSync(file), { contentType: "audio/mpeg", upsert: true });
    if (up.error) throw up.error;
    scripts.push({ section: si, text: s.script ?? "" });
  }
  const r2 = await admin.from("paid_test_keys").upsert({ test_id: row.id, answers, scripts });
  if (r2.error) throw r2.error;
  total += count;
  console.log(`${t.code.padEnd(6)} ${String(count).padStart(3)} savol · ${t.price} so‘m`);
}
console.log(`Jami: ${total} savol`);
