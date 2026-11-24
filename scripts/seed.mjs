/**
 * NAMUNA MA'LUMOT (sinov uchun)
 *
 *   npm run seed            — 5 ta namuna o'quvchi, 6 ta vazifa va bir nechta javob qo'shadi
 *   npm run seed -- --remove — faqat shu skript qo'shgan narsalarni o'chiradi
 *
 * Skript .env.local dagi NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni ishlatadi.
 * Namuna yozuvlar belgisi: vazifa sarlavhasi "[Namuna]" bilan boshlanadi,
 * o'quvchi e-pochtasi "@uyga-vazifa.test" bilan tugaydi. O'chirishda faqat shular o'chadi.
 */
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const TITLE_PREFIX = "[Namuna] ";
const EMAIL_DOMAIN = "@uyga-vazifa.test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Xato: .env.local da NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY bo'lishi kerak.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const fail = (step, error) => {
  console.error(`Xato (${step}): ${error?.message ?? error}`);
  process.exit(1);
};

async function listSeedUsers() {
  const users = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("foydalanuvchilar ro'yxati", error);
    users.push(...data.users.filter((u) => u.email?.endsWith(EMAIL_DOMAIN)));
    if (data.users.length < 200) break;
  }
  return users;
}

async function remove() {
  const { error, count } = await admin
    .from("assignments")
    .delete({ count: "exact" })
    .like("title", `${TITLE_PREFIX}%`);
  if (error) fail("vazifalarni o'chirish", error);

  const users = await listSeedUsers();
  for (const user of users) {
    // Rasmlar papkasi (bo'lsa) ham tozalanadi.
    const { data: folders } = await admin.storage.from("submissions").list(user.id);
    for (const folder of folders ?? []) {
      const { data: files } = await admin.storage.from("submissions").list(`${user.id}/${folder.name}`);
      const paths = (files ?? []).map((f) => `${user.id}/${folder.name}/${f.name}`);
      if (paths.length > 0) await admin.storage.from("submissions").remove(paths);
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) fail(`${user.email} ni o'chirish`, deleteError);
  }
  console.log(`O'chirildi: ${count ?? 0} ta namuna vazifa, ${users.length} ta namuna o'quvchi.`);
}

const HOUR = 3600_000;
const at = (hours) => new Date(Date.now() + hours * HOUR).toISOString();

const feedback = (score, mistakes) => ({
  score,
  summary:
    mistakes.length === 0
      ? "Juda yaxshi! Matn aniq va xatosiz yozilgan."
      : "Yaxshi ish! Fikr tushunarli, lekin bir nechta xatoni tuzatish kerak.",
  mistakes,
  strengths: ["Gaplar mavzuga mos.", "Fikrlar tartib bilan yozilgan."],
  suggestions: ["Fe’l zamonlarini takrorlang.", "Yozib bo‘lgach, matnni bir marta qayta o‘qing."],
});

const MISTAKES = [
  { original: "My mother cook dinner", correction: "My mother cooks dinner", explanation: "He/she/it bilan fe’lga -s qo‘shiladi.", type: "grammar" },
  { original: "beatiful", correction: "beautiful", explanation: "So‘zning to‘g‘ri yozilishi: beautiful.", type: "spelling" },
  { original: "I have two brother", correction: "I have two brothers", explanation: "Ko‘plikda otga -s qo‘shiladi.", type: "grammar" },
];

async function seed() {
  if ((await listSeedUsers()).length > 0) {
    console.error("Namuna ma'lumot allaqachon bor. Avval o'chiring: npm run seed -- --remove");
    process.exit(1);
  }

  // ---- kurs: namuna ma'lumot birinchi kursga (Beginner) qo'shiladi
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, name")
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (courseError || !course) fail("kursni topish (0005_courses.sql ishga tushirilganmi?)", courseError ?? "kurs yo'q");

  // ---- o'quvchilar
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const password = `${Array.from({ length: 8 }, () => letters[randomInt(letters.length)]).join("")}-${randomInt(10, 99)}`;
  const names = ["Ali Valiyev", "Madina Karimova", "Sardor Aliyev", "Dilnoza Rashidova", "Jasur Toshmatov"];
  const students = [];
  for (const [index, full_name] of names.entries()) {
    const email = `namuna${index + 1}${EMAIL_DOMAIN}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error) fail(`${email} ni yaratish`, error);
    students.push({ id: data.user.id, email, full_name });
  }
  // Birinchisi "ilk kirish"ni sinash uchun parolni almashtirishi shart; qolganlari darhol kira oladi.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false, course_id: course.id })
    .in("id", students.slice(1).map((s) => s.id));
  if (profileError) fail("profillarni yangilash", profileError);
  await admin.from("profiles").update({ course_id: course.id }).eq("id", students[0].id);

  // ---- vazifalar
  const base = { course_id: course.id, rubric: "Grammatika 40, so‘z boyligi 30, mazmun 30", max_score: 100, late_allowed: false, late_penalty_percent: 0 };
  const { data: assignments, error: assignmentError } = await admin
    .from("assignments")
    .insert([
      { ...base, title: `${TITLE_PREFIX}My daily routine`, instructions: "Write 6-8 sentences about your daily routine. Use Present Simple.", submission_type: "text", publish_at: at(-24), due_at: at(48) },
      { ...base, title: `${TITLE_PREFIX}Workbook page 24`, instructions: "Do exercises 1-3 in your notebook and upload a photo.", submission_type: "image", rubric: "Har bir mashq 10 ball", max_score: 30, publish_at: at(-2), due_at: at(24) },
      { ...base, title: `${TITLE_PREFIX}My best friend`, instructions: "Describe your best friend in 5-7 sentences. You can type or upload a photo of your notebook.", submission_type: "both", publish_at: at(-72), due_at: at(-1), late_allowed: true, late_penalty_percent: 20 },
      { ...base, title: `${TITLE_PREFIX}About my family`, instructions: "Write 6-8 sentences about your family.", submission_type: "text", publish_at: at(-144), due_at: at(-72) },
      { ...base, title: `${TITLE_PREFIX}My hobby`, instructions: "Write 5-6 sentences about your hobby.", submission_type: "text", publish_at: at(-216), due_at: at(-144) },
      { ...base, title: `${TITLE_PREFIX}My school (kelajakdagi vazifa)`, instructions: "Write about your school.", submission_type: "text", publish_at: at(72), due_at: at(120) },
    ])
    .select("id, title");
  if (assignmentError) fail("vazifalarni qo'shish", assignmentError);
  const [routine, , , family, hobby] = assignments;

  // ---- javoblar
  const done = (assignment, student, hoursAgo, score, mistakes, extra = {}) => ({
    assignment_id: assignment.id,
    student_id: student.id,
    text_content: "I have a big family. My mother cook dinner every day. I have two brother. Our house is beatiful.",
    submitted_at: at(-hoursAgo),
    is_late: false,
    ai_status: "done",
    ai_feedback: feedback(score, mistakes),
    ai_score: score,
    ...extra,
  });
  const { error: submissionError } = await admin.from("submissions").insert([
    done(family, students[0], 80, 72, MISTAKES),
    done(family, students[1], 78, 95, []),
    done(family, students[2], 75, 60, MISTAKES),
    done(hobby, students[0], 150, 80, MISTAKES.slice(0, 2), {
      teacher_score: 85,
      teacher_comment: "Yaxshi ish! Keyingi safar ko‘proq misol yozing.",
      reviewed_at: at(-140),
    }),
    done(hobby, students[1], 149, 88, MISTAKES.slice(1, 2)),
    {
      assignment_id: hobby.id,
      student_id: students[2].id,
      text_content: "My hobby is football. I play it every day.",
      submitted_at: at(-148),
      is_late: false,
      ai_status: "error",
      ai_error: "Namuna: AI xatosi holatini ko‘rsatish uchun.",
    },
    // Navbatda turgan javob: GEMINI_API_KEY sozlangan bo'lsa, o'qituvchi Kuzatuvni ochganda haqiqiy AI tekshiradi.
    {
      assignment_id: routine.id,
      student_id: students[1].id,
      text_content: "I wake up at 7 o'clock. I goes to school by bus. After school I do my homeworks and watching TV.",
      submitted_at: at(-1),
      is_late: false,
      ai_status: "pending",
    },
  ]);
  if (submissionError) fail("javoblarni qo'shish", submissionError);

  console.log("Namuna ma'lumot qo'shildi.\n");
  console.log("O'quvchilar (hammasining paroli bir xil):");
  for (const s of students) console.log(`  ${s.full_name.padEnd(20)} ${s.email}`);
  console.log(`\n  Parol: ${password}`);
  console.log("  namuna1 birinchi kirishda parolni almashtirishi kerak; qolganlari darhol kiradi.\n");
  console.log(`Vazifalar: ${assignments.length} ta ("${TITLE_PREFIX.trim()}" bilan boshlanadi), shundan bittasi kelajakda e'lon qilinadi.`);
  console.log("O'chirish: npm run seed -- --remove");
}

await (process.argv.includes("--remove") ? remove() : seed());
