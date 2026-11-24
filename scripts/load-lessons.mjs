/**
 * INTERAKTIV DARSLARNI KURSGA JOYLASH
 *
 *   npm run load-lessons -- materiallar/beginner Beginner                      — 62 kunni joylaydi
 *   npm run load-lessons -- materiallar/beginner Beginner --start 2027-02-01   — yangi guruh: boshqa sanadan
 *   npm run load-lessons -- materiallar/beginner Beginner --refresh            — yangi audiolarni qo'shadi
 *                                                    (darslar va o'quvchi javoblari o'chmaydi)
 *   npm run load-lessons -- materiallar/beginner Beginner --remove             — shu darslarni o'chiradi
 *
 * Papkada: lessons.json + keys.json (reading/takrorlash), speaking.json (60 mavzu),
 * listening.json (60 dialog), audio.json + audio/ (TTS audiolar — ixtiyoriy).
 * Mazmun assignments.lesson ga, kalit esa yopiq assignment_keys jadvaliga yoziladi.
 * Audiolar yopiq "lesson-audio" bucketiga yuklanadi. Hamma material doimiy — keyingi
 * guruhlar uchun shu buyruqni --start bilan qayta ishlatish kifoya.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [dir, courseName, ...flags] = process.argv.slice(2);
const flag = (name) => flags.includes(name);
const remove = flag("--remove");
const force = flag("--force");
const refresh = flag("--refresh");
const startArg = flags[flags.indexOf("--start") + 1];
const start = flags.includes("--start") ? startArg : null;
if (!dir || !courseName || (start && !/^\d{4}-\d{2}-\d{2}$/.test(start))) {
  console.error("Foydalanish: npm run load-lessons -- <papka> <kurs nomi> [--start YYYY-MM-DD] [--refresh] [--remove]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Xato: .env.local da NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY bo'lishi kerak.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const fail = (msg, err) => {
  console.error(`Xato: ${msg}${err ? ` — ${err.message ?? err}` : ""}`);
  process.exit(1);
};
const readJson = (name, fallback) => {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
};

const { data: course, error: courseError } = await admin
  .from("courses")
  .select("id, name")
  .eq("name", courseName)
  .maybeSingle();
if (courseError || !course) fail(`"${courseName}" kursi topilmadi`, courseError);

// Shu kursdagi interaktiv darslar (lesson ustuni to'la)
const { data: existing, error: existingError } = await admin
  .from("assignments")
  .select("id, title, publish_at")
  .eq("course_id", course.id)
  .not("lesson", "is", null);
if (existingError) fail("mavjud darslarni o'qish", existingError);

if (remove) {
  const ids = existing.map((a) => a.id);
  if (ids.length === 0) {
    console.log(`${course.name}: o'chiriladigan dars yo'q.`);
    process.exit(0);
  }
  const { count } = await admin.from("submissions").select("id", { count: "exact", head: true }).in("assignment_id", ids);
  if (count && !force) {
    fail(`${count} ta o'quvchi javobi bor. Baribir o'chirish uchun --force qo'shing (javoblar ham o'chadi).`);
  }
  const { error } = await admin.from("assignments").delete().in("id", ids);
  if (error) fail("o'chirish", error);
  console.log(`${course.name}: ${ids.length} ta dars o'chirildi.`);
  process.exit(0);
}

if (existing.length > 0 && !refresh) {
  fail(`${course.name} kursida allaqachon ${existing.length} ta interaktiv dars bor. Avval --remove bilan o'chiring yoki --refresh ishlating.`);
}

// ---------------------------------------------------------------- materiallar
const { days } = readJson("lessons.json", { days: [] });
const keys = readJson("keys.json", []);
const speaking = readJson("speaking.json", []);
const listening = readJson("listening.json", {});
const manifest = readJson("audio.json", { reading: {}, listening: {}, sample: {} });
if (days.length !== keys.length) fail("lessons.json va keys.json mos emas");

// ---------------------------------------------------------------- audiolar
const courseSlug = course.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const uploaded = new Set();
async function audioPath(entry) {
  const rel = typeof entry === "string" ? entry : entry?.file;
  if (!rel) return null;
  const local = path.join(dir, "audio", rel);
  if (!fs.existsSync(local)) return null;
  const remote = `${courseSlug}/${rel}`;
  if (!uploaded.has(remote)) {
    const { error } = await admin.storage
      .from("lesson-audio")
      .upload(remote, fs.readFileSync(local), { contentType: "audio/mpeg", upsert: true });
    if (error) fail(`audio yuklash: ${remote}`, error);
    uploaded.add(remote);
  }
  return remote;
}

// ---------------------------------------------------------------- sanalar
const DAY_MS = 86_400_000;
const shiftMs = start ? Date.parse(`${start}T00:00:00Z`) - Date.parse(`${days[0].date}T00:00:00Z`) : 0;
const shift = (iso) => new Date(Date.parse(iso) + shiftMs).toISOString();
if (start) console.log(`Boshlanish sanasi: ${start} (${Math.round(shiftMs / DAY_MS)} kunga surildi)`);

// ---------------------------------------------------------------- darslar
// Har kuni bitta mavzu: N-mavzu → N-kun (kitobdagi "kun" raqami kuniga 2 mavzu — bu yerda ishlatilmaydi).
const topicByDay = new Map(speaking.map((t) => [t.topic, t]));
const rows = [];
const keyList = [];
for (const [i, d] of days.entries()) {
  const k = keys[i];
  if (k.day !== d.day) fail(`kalit tartibi mos emas (${d.day})`);

  const lesson =
    d.kind === "reading"
      ? {
          kind: "reading",
          day: d.day,
          readings: await Promise.all(
            d.readings.map(async (r) => ({
              ...r,
              audio: await audioPath(manifest.reading?.[r.id]),
              segments: manifest.reading?.[r.id]?.segments ?? null,
            })),
          ),
        }
      : { kind: d.kind, day: d.day, review: d.review };
  const lessonKey = k.readings ? { readings: k.readings } : { review: k.review };

  const t = topicByDay.get(d.day);
  if (t) {
    lesson.speaking = {
      topic: t.topic,
      title: t.title,
      uzTitle: t.uzTitle,
      grammar: t.grammar,
      questions: t.questions,
      vocab: t.vocab,
      phrases: t.phrases,
      sample: t.sample,
      sampleAudio: await audioPath(manifest.sample?.[t.topic]),
      sentenceWords: [0, 2, 4, 6].map((j) => t.vocab[j]).filter(Boolean),
      required: 20,
      minSeconds: 60,
    };
    const l = listening[t.topic];
    if (l?.ok) {
      // Variantlar aralashtiriladi (to'g'ri javob doim bir harfda bo'lmasin); har safar bir xil natija.
      const ld = {
        ...l.data,
        mc: l.data.mc.map((q, j) => {
          const order = q.options.map((_, x) => x);
          let seed = t.topic * 31 + j * 7 + 3;
          for (let x = order.length - 1; x > 0; x--) {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            const y = seed % (x + 1);
            [order[x], order[y]] = [order[y], order[x]];
          }
          return { q: q.q, options: order.map((x) => q.options[x]), answer: order.indexOf(q.answer) };
        }),
      };
      const audio = await audioPath(manifest.listening?.[t.topic]);
      lesson.listening = {
        title: ld.title,
        setting: ld.setting,
        speakers: ld.speakers,
        audio,
        // Qatorlar vaqti (matnsiz): o'quvchi har bir qatorni alohida qayta eshita oladi.
        segments: audio ? (manifest.listening?.[t.topic]?.segments ?? null) : null,
        ...(audio ? {} : { lines: ld.lines }),
        tf: ld.tf.map((q) => ({ q: q.q })),
        mc: ld.mc.map((q) => ({ q: q.q, options: q.options })),
        gaps: ld.gaps.map((q) => ({ q: q.q })),
      };
      lessonKey.listening = {
        tf: ld.tf.map((q) => q.answer),
        mc: ld.mc.map((q) => q.answer),
        gaps: ld.gaps.map((q) => q.answer),
        lines: ld.lines,
      };
    }
  }

  const parts = [
    d.kind === "reading"
      ? `Reading: ${d.readings.map((r) => `“${r.title}”`).join(" va ")}`
      : `${d.kind === "final" ? "Yakuniy test" : "Takrorlash"}: ${d.title.split("· ")[1] ?? ""}`,
    lesson.listening ? `Listening: “${lesson.listening.title}”` : null,
    lesson.speaking ? `Speaking: “${lesson.speaking.title}” — ${lesson.speaking.required} ta ovozli javob` : null,
  ].filter(Boolean);

  rows.push({
    course_id: course.id,
    title: d.title,
    instructions: `Bugungi dars. ${parts.join(". ")}.`,
    submission_type: "text",
    rubric: "",
    max_score: 100,
    publish_at: shift(d.publish_at),
    due_at: shift(d.due_at),
    late_allowed: true,
    late_penalty_percent: 20,
    lesson,
  });
  keyList.push(lessonKey);
}
console.log(`Audio fayllar: ${uploaded.size} ta yuklandi.`);

// ---------------------------------------------------------------- --refresh: mavjudlarni yangilash
if (refresh) {
  const byTitle = new Map(existing.map((a) => [a.title, a.id]));
  let updated = 0;
  for (const [i, row] of rows.entries()) {
    const id = byTitle.get(row.title);
    if (!id) continue;
    const { error } = await admin.from("assignments").update({ lesson: row.lesson, instructions: row.instructions }).eq("id", id);
    if (error) fail(`yangilash: ${row.title}`, error);
    const { error: kErr } = await admin.from("assignment_keys").upsert({ assignment_id: id, key: keyList[i] });
    if (kErr) fail(`kalit: ${row.title}`, kErr);
    updated++;
  }
  console.log(`${course.name}: ${updated} ta dars yangilandi (sanalar va javoblar o'zgarmadi).`);
  process.exit(0);
}

const { data: inserted, error: insertError } = await admin.from("assignments").insert(rows).select("id, title");
if (insertError) fail("darslarni qo'shish", insertError);

const byTitle = new Map(inserted.map((a) => [a.title, a.id]));
const keyRows = rows.map((r, i) => ({ assignment_id: byTitle.get(r.title), key: keyList[i] }));
const { error: keyError } = await admin.from("assignment_keys").insert(keyRows);
if (keyError) {
  await admin.from("assignments").delete().in("id", inserted.map((a) => a.id));
  fail("javoblar kalitini yozish (darslar qaytarib o'chirildi)", keyError);
}

const withSpeaking = rows.filter((r) => r.lesson.speaking).length;
const withListening = rows.filter((r) => r.lesson.listening).length;
console.log(`${course.name}: ${inserted.length} ta dars joylandi (speaking: ${withSpeaking}, listening: ${withListening}).`);
console.log(`Birinchisi: ${rows[0].title} — ${rows[0].publish_at}`);
console.log(`Oxirgisi:   ${rows.at(-1).title} — ${rows.at(-1).publish_at}`);
