/**
 * SINOV: o'qituvchi o'quvchi sifatida darsni sinab ko'rishi uchun.
 *   node --env-file=.env.local scripts/sinov.mjs          — sinov o'quvchi + hozir ochiq 1-kun darsi (Elementary kursida)
 *   node --env-file=.env.local scripts/sinov.mjs remove   — hammasini o'chiradi
 * Haqiqiy o'quvchilar (Beginner) bu darsni ko'rmaydi.
 */
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const EMAIL = "sinov@nsp.test";
const TITLE = "[SINOV] 1-kun · Unit 1: Hello! My Name Is Aziz / In the Café";
const FILE = "SINOV-HISOB.txt";

async function findUser() {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return data.users.find((u) => u.email === EMAIL);
}

if (process.argv[2] === "remove") {
  const { data: rows } = await admin.from("assignments").select("id").eq("title", TITLE);
  if (rows?.length) await admin.from("assignments").delete().in("id", rows.map((r) => r.id));
  const u = await findUser();
  if (u) {
    const { data: files } = await admin.storage.from("speaking").list(u.id, { limit: 100 });
    for (const f of files ?? []) {
      const { data: inner } = await admin.storage.from("speaking").list(`${u.id}/${f.name}`, { limit: 100 });
      const paths = (inner ?? []).map((x) => `${u.id}/${f.name}/${x.name}`);
      if (paths.length) await admin.storage.from("speaking").remove(paths);
    }
    await admin.auth.admin.deleteUser(u.id);
  }
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
  console.log(`o'chirildi: ${rows?.length ?? 0} dars, ${u ? 1 : 0} hisob`);
  process.exit(0);
}

const { data: course } = await admin.from("courses").select("id").eq("name", "Elementary").single();
const { data: beginner } = await admin.from("courses").select("id").eq("name", "Beginner").single();

let user = await findUser();
const password = "Sinov-" + randomBytes(4).toString("hex");
if (user) {
  await admin.auth.admin.updateUserById(user.id, { password });
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL, password, email_confirm: true, user_metadata: { full_name: "Sinov O'quvchi" },
  });
  if (error) throw error;
  user = data.user;
}
await admin.from("profiles").update({ course_id: course.id, full_name: "Sinov O'quvchi" }).eq("id", user.id);

const { data: old } = await admin.from("assignments").select("id").eq("title", TITLE);
if (old?.length) await admin.from("assignments").delete().in("id", old.map((r) => r.id));

const { data: src } = await admin.from("assignments").select("*").like("title", "1-kun ·%").eq("course_id", beginner.id).single();
const { data: key } = await admin.from("assignment_keys").select("key").eq("assignment_id", src.id).single();
const now = Date.now();
const { data: a, error: e } = await admin.from("assignments").insert({
  course_id: course.id, title: TITLE, instructions: src.instructions, submission_type: "text", rubric: "",
  max_score: 100, publish_at: new Date(now - 60_000).toISOString(), due_at: new Date(now + 2 * 86400e3).toISOString(),
  late_allowed: true, late_penalty_percent: 20, lesson: src.lesson,
}).select("id").single();
if (e) throw e;
await admin.from("assignment_keys").insert({ assignment_id: a.id, key: key.key });

fs.writeFileSync(
  FILE,
  `SINOV O'QUVCHI HISOBI (faqat sinash uchun)\n\nSayt:   https://nsp-language-center.vercel.app\nE-pochta: ${EMAIL}\nParol:  ${password}\n\nSinovdan keyin o'chirish:  node --env-file=.env.local scripts/sinov.mjs remove\n`,
);
console.log("tayyor: sinov o'quvchi + 1-kun darsi (Elementary), muddat 2 kun. Hisob ma'lumotlari:", FILE);
