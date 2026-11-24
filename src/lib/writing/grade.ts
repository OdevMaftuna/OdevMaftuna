import "server-only";
import { geminiModels, gradeWithGemini, RateLimitError } from "@/lib/ai/gemini";
import type { Feedback } from "@/lib/ai/feedback";
import { createAdminClient } from "@/lib/supabase/admin";
import { TONE_LABEL, WORDS, findCard } from "./data";
import { findMlTask, mlInstructions } from "./multilevel";

/**
 * WRITING AI TEKSHIRUVI (server). Tugma bosilganda ham, fondagi qayta urinishda ham shu ishlatiladi.
 * AI band yoki limit bo'lsa — ish "failed" holatida qoladi va retryFailedWriting() uni keyinroq o'zi tekshiradi.
 */

function rubric(tone: string, points: string[]) {
  return [
    "Score from 0 to 10 for a Pre-Intermediate (A2–B1) learner writing a letter/email for the CEFR (SEFR) exam. Be fair and encouraging, but honest.",
    `- Task achievement (0–4): did the student cover ALL three points? ${points.map((p, i) => `(${i + 1}) ${p}`).join(" ")} Give about 1.3 points per point fully covered with some detail.`,
    `- Format & tone (0–2): the expected tone is ${tone}. Correct greeting, a clear purpose sentence ("I am writing to..."), suitable closing and sign-off for this tone (e.g. formal → Dear Sir/Madam … Yours faithfully; semi-formal → Dear Mr Brown … Kind regards; friendly → Dear Ali … Best wishes).`,
    "- Organisation (0–2): paragraphs, logical order, linking words (Firstly, However, In addition, Finally...).",
    "- Language (0–2): grammar, vocabulary, spelling and punctuation for this level. Do not punish small slips heavily.",
    `- Length: about ${WORDS.min}–${WORDS.max} words is expected. Under ${Math.round(WORDS.min * 0.6)} words: score at most 4. Not a letter at all / off-topic / copied task text: score at most 2.`,
    'In "summary" (Uzbek) start with the total like "7/10" then one sentence per criterion, e.g. "Vazifa: 3/4 — ...; Format: 2/2 — ...; Tuzilma: 1/2 — ...; Til: 1/2 — ...". In "suggestions" give 1–3 concrete phrases the student could use next time.',
  ].join("\n");
}

/** Multilevel (SEFR) Task 1.1 / 1.2 baholash mezonlari — 20 ball (4 mezon × 5). */
function mlRubric(register: string, words: [number, number]) {
  return [
    "This is the CEFR (SEFR) Multilevel writing exam, Task 1. The learner is about B1 level. Score from 0 to 20 = four criteria, each 0–5, like a real Multilevel examiner. Be fair and encouraging, but honest.",
    "- Task achievement (0–5): every part of the task is answered with relevant detail; the purpose is clear; the reader would understand what the writer wants.",
    `- Register & coherence (0–5): the register must be ${register} (greeting, tone and sign-off match it); logical paragraphs; varied linking words.`,
    "- Vocabulary (0–5): topic collocations, accurate word choice, little repetition, correct spelling.",
    "- Grammar (0–5): range of structures (conditionals, perfect tenses, relative clauses, passive, modals) and their accuracy.",
    `- Length: ${words[0]}–${words[1]} words. Clearly under ${Math.round(words[0] * 0.75)} words: task achievement at most 2. Far over the limit: lower coherence by 1. Off-topic or not a message/letter: total at most 4.`,
    'In "summary" (Uzbek) start with the total like "14/20 (taxminan B2)" then one short line per criterion, e.g. "Vazifa: 4/5 — ...; Uslub va izchillik: 3/5 — ...; So‘z boyligi: 3/5 — ...; Grammatika: 4/5 — ...". Level guide: 17–20 ≈ C1, 13–16 ≈ B2, 9–12 ≈ B1, 0–8 ≈ B1 dan past. In "suggestions" give 1–3 concrete higher-level phrases the learner could use next time.',
  ].join("\n");
}

type Resolved = { title: string; instructions: string; rubric: string; maxScore: number; minWords: number };

/** card_id → AI uchun topshiriq: oddiy letter cue card yoki Multilevel task. */
export function resolveTask(cardId: string): Resolved | null {
  const ml = findMlTask(cardId);
  if (ml) {
    const reg = ml.task.register === "informal" ? "informal (to a friend)" : "formal (to an official / manager)";
    return {
      title: `SEFR Multilevel · Mock ${ml.mock.no} · ${ml.task.label} — ${ml.task.kind}`,
      instructions: mlInstructions(ml.mock, ml.task),
      rubric: mlRubric(reg, ml.task.words),
      maxScore: 20,
      minWords: Math.max(15, Math.round(ml.task.words[0] * 0.4)),
    };
  }
  const found = findCard(cardId);
  if (!found) return null;
  const { type, card } = found;
  return {
    title: `${type.title} — Cue card ${card.n}`,
    instructions: `${card.task}\nYou should include:\n${card.points.map((p) => `• ${p}`).join("\n")}\nWrite a ${TONE_LABEL[type.tone].toLowerCase()} letter/email of about ${WORDS.min}–${WORDS.max} words.`,
    rubric: rubric(TONE_LABEL[type.tone], card.points),
    maxScore: 10,
    minWords: 20,
  };
}

/**
 * Writing uchun modellar zanjiri: asosiy model → gemini-3.1-flash-lite (alohida bepul limit, tez) → zaxira.
 * Sabab: bepul tarifda bir model band (503) yoki kunlik limiti (429, 20 so‘rov) tugashi mumkin.
 */
const EXTRA_MODEL = "gemini-3.1-flash-lite";
function writingModels(): string[] {
  const [main, ...rest] = geminiModels();
  return [...new Set([main, EXTRA_MODEL, ...rest].filter(Boolean))];
}

export type GradeResult =
  | { ok: true; score: number; feedback: Feedback; checks: number }
  | { ok: false; limited: boolean };

/** Bitta ishni AI bilan baholab, natijani bazaga yozadi. deadline — shu vaqtgacha tugashi kerak (ms). */
export async function gradeAndStore(studentId: string, cardId: string, text: string, deadline: number): Promise<GradeResult> {
  const task = resolveTask(cardId);
  if (!task) return { ok: false, limited: false };
  const words = text.trim() ? (text.trim().match(/[A-Za-z0-9'’-]+/g) ?? []).length : 0;
  const admin = createAdminClient();
  const { data: prev } = await admin.from("writing_attempts").select("history, checked_count").eq("student_id", studentId).eq("card_id", cardId).maybeSingle();
  await admin.from("writing_attempts").upsert(
    { student_id: studentId, card_id: cardId, text, words, status: "checking", updated_at: new Date().toISOString() },
    { onConflict: "student_id,card_id" },
  );

  let feedback: Feedback | null = null;
  let limited = false;
  for (const model of writingModels()) {
    const left = deadline - Date.now();
    if (left < 8_000) break;
    try {
      feedback = await gradeWithGemini(
        { title: task.title, instructions: task.instructions, rubric: task.rubric, maxScore: task.maxScore, text, images: [], language: "uz" },
        Math.min(45_000, left - 2_000),
        model,
      );
      break;
    } catch (e) {
      if (e instanceof RateLimitError) limited = true;
      console.error(`writing check [${model}] ${cardId}:`, e instanceof Error ? e.message : e);
    }
  }

  if (!feedback) {
    await admin.from("writing_attempts").update({ status: "failed", updated_at: new Date().toISOString() }).eq("student_id", studentId).eq("card_id", cardId);
    return { ok: false, limited };
  }

  const score = Math.max(0, Math.min(task.maxScore, Math.round(feedback.score * 2) / 2));
  const now = new Date().toISOString();
  const history = [...(Array.isArray(prev?.history) ? (prev.history as unknown[]) : []), { at: now, score, words }].slice(-30);
  const checks = (prev?.checked_count ?? 0) + 1;
  await admin
    .from("writing_attempts")
    .update({ status: "checked", score, feedback: { ...feedback, score }, history, checked_count: checks, checked_at: now, updated_at: now })
    .eq("student_id", studentId)
    .eq("card_id", cardId);
  return { ok: true, score, feedback: { ...feedback, score }, checks };
}

/**
 * NAVBAT: tekshirilmay qolgan ishlarni ("failed" yoki 3 daqiqadan ko'p "checking"da qotib qolgan) qayta tekshiradi.
 * Sahifalar after() orqali chaqiradi — foydalanuvchi kutmaydi. Budjet ichida bittadan, eng eskisi birinchi.
 */
export async function retryFailedWriting(opts: { studentId?: string; budgetMs?: number; limit?: number } = {}): Promise<number> {
  const deadline = Date.now() + (opts.budgetMs ?? 50_000);
  const admin = createAdminClient();
  const stale = new Date(Date.now() - 3 * 60_000).toISOString();
  let q = admin
    .from("writing_attempts")
    .select("student_id, card_id, text, status, updated_at")
    .or(`status.eq.failed,and(status.eq.checking,updated_at.lt.${stale})`)
    .order("updated_at", { ascending: true })
    .limit(opts.limit ?? 3);
  if (opts.studentId) q = q.eq("student_id", opts.studentId);
  const { data } = await q;
  let done = 0;
  for (const row of (data ?? []) as { student_id: string; card_id: string; text: string }[]) {
    if (deadline - Date.now() < 15_000) break;
    const task = resolveTask(row.card_id);
    if (!task || (row.text.match(/[A-Za-z0-9'’-]+/g) ?? []).length < task.minWords) continue;
    const r = await gradeAndStore(row.student_id, row.card_id, row.text, deadline);
    if (r.ok) done++;
    else if (r.limited) break; // limit — keyingi safar
  }
  return done;
}
