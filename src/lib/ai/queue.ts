import "server-only";
import { SPEAKING_BUCKET, SUBMISSIONS_BUCKET } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { lessonRawScore, speakingTaskForAi, writtenTaskForAi, writtenText } from "@/lib/lesson/grade";
import type { Lesson, LessonAnswers, LessonResult } from "@/lib/lesson/types";
import type { Assignment } from "@/lib/types";
import type { Feedback } from "./feedback";
import {
  InvalidOutputError,
  ModelBusyError,
  RateLimitError,
  geminiModels,
  gradeWithGemini,
  type GeminiImage,
  type GradeInput,
} from "./gemini";

/**
 * AI NAVBATI
 * ai_status = 'pending' bo'lgan javoblar bazaning o'zida navbat bo'lib turadi.
 * runAiQueue() ularni BITTALAB oladi (claim_next_ai_job) va Gemini'ga yuboradi.
 * Bir vaqtda faqat bitta javob tekshiriladi — bepul kvotaga urilmaslik uchun.
 *
 * Interaktiv dars: 1) yozma qism, 2) speaking — tasodifiy 2 ta ovoz. Har bosqich natijasi darhol
 * saqlanadi, shuning uchun vaqt yetmasa keyingi safar qolgan joyidan davom etadi.
 * Speaking tekshirilgach, o'quvchining shu darsdagi barcha ovozlari o'chiriladi.
 *
 * Natijani faqat server (service role) yoza oladi: o'quvchi o'z balini o'zgartira olmaydi.
 */

type Admin = ReturnType<typeof createAdminClient>;

type Job = {
  id: string;
  assignment_id: string;
  student_id?: string;
  text_content: string | null;
  image_paths: string[];
  submitted_at: string;
  is_late: boolean;
  ai_attempts: number;
  /** Interaktiv dars javoblari (oddiy vazifada null). */
  answers: LessonAnswers | null;
  lesson_result: LessonResult | null;
};

/** Bitta chaqiruvda navbatga ajratiladigan vaqt (funksiya limiti 60 soniya). */
const DEFAULT_BUDGET_MS = 45_000;
const MAX_ATTEMPTS = 5;
const DEFAULT_RATE_LIMIT_WAIT_MS = 15_000;
/** Bitta Gemini so'roviga ajratiladigan eng ko'p vaqt. Oshsa, model "band" hisoblanadi. */
const PER_CALL_TIMEOUT_MS = 25_000;
const AUDIO_CALL_TIMEOUT_MS = 40_000;
/** Speaking: AI nechta tasodifiy ovozni tinglaydi. */
const SPEAKING_CLIPS = 2;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const round1 = (n: number) => Math.round(n * 10) / 10;

async function loadImages(admin: Admin, paths: string[]): Promise<GeminiImage[]> {
  const images: GeminiImage[] = [];
  for (const path of paths) {
    const { data, error } = await admin.storage.from(SUBMISSIONS_BUCKET).download(path);
    if (error || !data) throw new Error(`Rasmni o'qib bo'lmadi: ${path}`);
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    images.push({
      data: Buffer.from(await data.arrayBuffer()).toString("base64"),
      mimeType: MIME_BY_EXT[ext] ?? "image/jpeg",
    });
  }
  return images;
}

// Quyidagi yozuvlarda shart bir xil: javob hali o'sha nusxa va hali 'pending' bo'lsa.
// O'quvchi shu orada javobni yangilagan bo'lsa, eski natija yozilmaydi.
async function markError(admin: Admin, job: Job, reason: string) {
  await admin
    .from("submissions")
    .update({ ai_status: "error", ai_error: reason.slice(0, 500), ai_locked_at: null })
    .eq("id", job.id)
    .eq("submitted_at", job.submitted_at)
    .eq("ai_status", "pending");
}

/** Ishni navbatga qaytaradi (keyingi chaqiruvda qayta olinadi). */
async function release(admin: Admin, job: Job, reason: string) {
  await admin
    .from("submissions")
    .update({ ai_locked_at: null, ai_error: reason.slice(0, 500) })
    .eq("id", job.id)
    .eq("submitted_at", job.submitted_at)
    .eq("ai_status", "pending");
}

class Deferred extends Error {}

/**
 * Bitta baholash so'rovi: model band bo'lsa zaxira modelga o'tadi, 429 da kutadi,
 * noto'g'ri javobda 1 marta qayta urinadi. Vaqt yetmasa — Deferred.
 */
async function callModel(input: GradeInput, deadline: number, timeoutMs: number): Promise<Feedback> {
  const models = geminiModels();
  let modelIndex = 0;
  let failures = 0;
  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) throw new Deferred("Vaqt yetmadi, keyinroq davom etadi.");
    try {
      return await gradeWithGemini(input, Math.min(timeoutMs, remaining), models[modelIndex]);
    } catch (error) {
      if (error instanceof ModelBusyError) {
        if (modelIndex + 1 < models.length) {
          modelIndex += 1;
          continue;
        }
        throw new Deferred(`Gemini band, keyinroq qayta uriniladi. (${error.message})`);
      }
      if (error instanceof RateLimitError) {
        const wait = error.retryAfterMs ?? DEFAULT_RATE_LIMIT_WAIT_MS;
        if (Date.now() + wait + 5_000 > deadline) {
          throw new Deferred("Gemini kvotasi band (429), keyinroq qayta uriniladi.");
        }
        await sleep(wait);
        continue;
      }
      failures += 1;
      if (failures >= 2) throw error;
      if (!(error instanceof InvalidOutputError)) await sleep(1_000);
    }
  }
}

function speakingFolder(job: Job) {
  return `${job.student_id}/${job.assignment_id}`;
}

/** O'quvchining shu darsdagi barcha ovozlarini o'chiradi. */
async function deleteRecordings(admin: Admin, job: Job) {
  if (!job.student_id) return;
  const folder = speakingFolder(job);
  const { data } = await admin.storage.from(SPEAKING_BUCKET).list(folder, { limit: 200 });
  const paths = (data ?? []).map((f) => `${folder}/${f.name}`);
  if (paths.length) await admin.storage.from(SPEAKING_BUCKET).remove(paths);
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

async function saveProgress(admin: Admin, job: Job, result: LessonResult) {
  job.lesson_result = result;
  await admin
    .from("submissions")
    .update({ lesson_result: result })
    .eq("id", job.id)
    .eq("submitted_at", job.submitted_at)
    .eq("ai_status", "pending");
}

async function processLesson(
  admin: Admin,
  job: Job,
  a: Assignment,
  lesson: Lesson,
  language: "uz" | "en",
  deadline: number,
): Promise<{ result: LessonResult; feedback: Feedback }> {
  if (!job.answers || !job.lesson_result) throw new Error("Dars javoblari topilmadi");
  let result = job.lesson_result;

  // Multilevel: hamma savollar kitob kaliti bilan tekshirilgan — AI kerak emas.
  if (lesson.kind === "multilevel") {
    const blocks = lesson.blocks.map((b, i) => {
      const items = result.ml?.[i] ?? [];
      return `${b.book === "reading" ? "Reading" : "Listening"} (Part ${b.part}): ${items.filter((x) => x.ok).length}/${items.length}`;
    });
    const wrong = result.auto.total - result.auto.correct;
    return {
      result,
      feedback: {
        score: result.auto.score,
        summary: `${blocks.join(" · ")}. To‘g‘ri javoblar: ${result.auto.correct}/${result.auto.total}.`,
        mistakes: [],
        strengths: result.auto.correct > 0 ? [`${result.auto.correct} ta savolga to‘g‘ri javob berdingiz.`] : [],
        suggestions: wrong > 0 ? ["Xato qilgan savollaringizni pastda ko‘ring: to‘g‘ri javob har bir savol ostida yozilgan. Matnni qayta o‘qib/tinglab, nega shunday ekanini toping."] : [],
      },
    };
  }
  let writtenFeedback = (result as LessonResult & { writtenFeedback?: Feedback }).writtenFeedback ?? null;

  // 1) Yozma qism
  if (!result.ai || !writtenFeedback) {
    const task = writtenTaskForAi(lesson);
    const feedback = await callModel(
      {
        title: a.title,
        instructions: task.instructions,
        rubric: task.rubric,
        maxScore: task.maxScore,
        text: writtenText(lesson, job.answers),
        images: [],
        language,
        itemized: true,
      },
      deadline,
      PER_CALL_TIMEOUT_MS,
    );
    const score = round1(Math.min(task.maxScore, Math.max(0, feedback.score)));
    writtenFeedback = { ...feedback, score };
    result = { ...result, ai: { score, max: task.maxScore }, writtenFeedback } as LessonResult;
    await saveProgress(admin, job, result);
  }

  // 2) Speaking: tasodifiy ovozlarni AI tinglaydi, keyin hammasi o'chiriladi.
  const sp = result.speaking;
  if (lesson.speaking && sp && !sp.ai) {
    const task = speakingTaskForAi(lesson, Math.min(SPEAKING_CLIPS, sp.recordings.length));
    let ai: NonNullable<NonNullable<LessonResult["speaking"]>["ai"]>;
    if (sp.recordings.length === 0 || !job.student_id) {
      ai = { score: 0, max: task.maxScore, checked: [], feedback: null };
    } else {
      const chosen = pickRandom(sp.recordings, SPEAKING_CLIPS).sort((x, y) => x.n - y.n);
      const audios: GeminiImage[] = [];
      for (const r of chosen) {
        const { data, error } = await admin.storage
          .from(SPEAKING_BUCKET)
          .download(`${speakingFolder(job)}/${r.n}.mp3`);
        if (error || !data) continue;
        audios.push({ data: Buffer.from(await data.arrayBuffer()).toString("base64"), mimeType: "audio/mpeg" });
      }
      if (audios.length === 0) {
        ai = { score: 0, max: task.maxScore, checked: [], feedback: null };
      } else {
        const feedback = await callModel(
          {
            title: `${a.title} — Speaking`,
            instructions: task.instructions,
            rubric: task.rubric,
            maxScore: task.maxScore,
            text: null,
            images: [],
            audios,
            language,
          },
          deadline,
          AUDIO_CALL_TIMEOUT_MS,
        );
        // Haqiqiylik kod bilan tekshiriladi: bitta ovoz, inglizcha, o'zi haqida gapirgan yozuvlargina hisoblanadi.
        const checks = feedback.recordings ?? [];
        const valid = audios.filter((_, i) => {
          const c = checks[i];
          return c ? c.speakers <= 1 && c.english && c.own_answer : true;
        }).length;
        let score = round1(Math.min(task.maxScore, Math.max(0, feedback.score)) * (valid / audios.length));
        let summary = feedback.summary;
        if (valid < audios.length) {
          const note =
            language === "uz"
              ? `Diqqat: tekshirilgan ${audios.length} ta ovozdan ${audios.length - valid} tasi o‘quvchining o‘z javobi emas (bir necha kishi, boshqa yozuv yoki ingliz tilida emas) — ular uchun ball berilmadi.`
              : `Note: ${audios.length - valid} of the ${audios.length} checked recordings are not the student's own answer (several voices, another recording, or not English) — they got no points.`;
          summary = `${note} ${summary}`;
          if (valid === 0) score = 0;
        }
        ai = {
          score,
          max: task.maxScore,
          checked: chosen.map((r) => r.n),
          feedback: { ...feedback, score, summary },
        };
      }
    }
    result = { ...result, speaking: { ...sp, ai } };
    await saveProgress(admin, job, result);
  }

  if (lesson.speaking && result.speaking && !result.speaking.deleted) {
    await deleteRecordings(admin, job);
    result = { ...result, speaking: { ...result.speaking, deleted: true } };
  }

  return { result, feedback: writtenFeedback! };
}

async function processJob(admin: Admin, job: Job, deadline: number): Promise<"done" | "error" | "deferred"> {
  if (job.ai_attempts > MAX_ATTEMPTS) {
    await markError(admin, job, "Juda ko'p urinish (kvota tugagan bo'lishi mumkin).");
    return "error";
  }

  try {
    const [{ data: assignment }, { data: settings }, { data: owner }] = await Promise.all([
      admin.from("assignments").select("*").eq("id", job.assignment_id).maybeSingle(),
      admin.from("app_settings").select("feedback_language").maybeSingle(),
      job.student_id
        ? Promise.resolve({ data: { student_id: job.student_id } })
        : admin.from("submissions").select("student_id").eq("id", job.id).maybeSingle(),
    ]);
    if (!assignment) throw new Error("Vazifa topilmadi");
    job.student_id = owner?.student_id ?? undefined;
    const a = assignment as Assignment & { lesson: Lesson | null };
    const language = settings?.feedback_language === "en" ? ("en" as const) : ("uz" as const);
    const penalty = job.is_late ? a.late_penalty_percent : 0;

    let rawScore: number;
    let feedback: Feedback;
    let lessonResult: LessonResult | undefined;

    if (a.lesson) {
      const out = await processLesson(admin, job, a, a.lesson, language, deadline);
      lessonResult = out.result;
      feedback = out.feedback;
      rawScore = Math.min(a.max_score, lessonRawScore(lessonResult));
    } else {
      feedback = await callModel(
        {
          title: a.title,
          instructions: a.instructions,
          rubric: a.rubric,
          maxScore: a.max_score,
          text: job.text_content,
          images: await loadImages(admin, job.image_paths),
          language,
        },
        deadline,
        PER_CALL_TIMEOUT_MS,
      );
      rawScore = Math.min(a.max_score, Math.max(0, feedback.score));
    }
    const finalScore = Math.round(rawScore * (100 - penalty)) / 100;

    await admin
      .from("submissions")
      .update({
        ai_status: "done",
        ai_feedback: { ...feedback, score: rawScore },
        ai_score: finalScore,
        ai_error: null,
        ai_locked_at: null,
        ...(lessonResult ? { lesson_result: lessonResult } : {}),
      })
      .eq("id", job.id)
      .eq("submitted_at", job.submitted_at)
      .eq("ai_status", "pending");
    return "done";
  } catch (error) {
    if (error instanceof Deferred) {
      await release(admin, job, error.message);
      return "deferred";
    }
    await markError(admin, job, error instanceof Error ? error.message : "Noma'lum xato");
    return "error";
  }
}

/** 3 kundan eski speaking ovozlarini o'chiradi (topshirilmagan yoki tekshirilmay qolganlar). */
async function cleanupSpeaking(admin: Admin) {
  const { data } = await admin.rpc("speaking_expired_objects");
  const names = (Array.isArray(data) ? data : []) as string[];
  for (let i = 0; i < names.length; i += 100) {
    await admin.storage.from(SPEAKING_BUCKET).remove(names.slice(i, i + 100));
  }
}

/**
 * Navbatni vaqt byudjeti tugaguncha ketma-ket ishlaydi. Xavfsiz: bir vaqtda bir nechta
 * joydan chaqirilsa ham, baza faqat bittasiga ish beradi.
 */
export async function runAiQueue(budgetMs: number = DEFAULT_BUDGET_MS): Promise<void> {
  const deadline = Date.now() + budgetMs;
  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    return; // Sozlamalar yo'q — javoblar 'pending' holatida kutadi.
  }

  try {
    await cleanupSpeaking(admin);
  } catch {
    // tozalash keyingi safar
  }

  while (Date.now() + 8_000 < deadline) {
    const { data, error } = await admin.rpc("claim_next_ai_job");
    const job = (Array.isArray(data) ? data[0] : data) as Job | null | undefined;
    if (error || !job) return;

    const outcome = await processJob(admin, job, deadline);
    if (outcome === "deferred") return;
  }
}
