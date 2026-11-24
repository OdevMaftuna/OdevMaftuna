"use server";

import { z } from "zod";
import { hasCourseAccess } from "@/lib/course-access";
import { checkTranslationsWithAi } from "@/lib/ai/translation-check";
import { requireStudent } from "@/lib/auth";
import { matchesAny, matchesWord } from "@/lib/practice/normalize";
import {
  isGrammar,
  sectionLength,
  type CheckedPracticeItem,
  type PracticeContent,
  type PracticeKey,
  type PracticeResult,
  type Section,
} from "@/lib/practice/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Muddatsiz mashqlar. Yozish faqat shu yerda (service role) — o'quvchi o'z natijasini soxtalashtira olmaydi.
 * Javoblar har o'zgarishda saqlanadi, "Tekshirish" esa natija va eng yaxshi ballni yozadi.
 */

const sectionSchema = z.enum(["translate", "test"]);
const answersSchema = z.array(z.string().max(500).nullable()).max(150);

async function loadTopic(topicId: string) {
  if (!z.uuid().safeParse(topicId).success) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("practice_topics").select("id, course_id, title, content").eq("id", topicId).maybeSingle();
  return data as { id: string; course_id: string; title: string; content: PracticeContent } | null;
}

export async function savePracticeDraft(
  topicId: string,
  section: Section,
  answers: (string | null)[],
): Promise<{ ok: boolean }> {
  const profile = await requireStudent();
  if (!sectionSchema.safeParse(section).success || !answersSchema.safeParse(answers).success) return { ok: false };
  const topic = await loadTopic(topicId);
  if (!topic || answers.length !== sectionLength(topic.content, section)) return { ok: false };
  if (!(await hasCourseAccess(profile.id, topic.course_id))) return { ok: false };

  const { error } = await createAdminClient()
    .from("practice_attempts")
    .upsert(
      { topic_id: topicId, student_id: profile.id, section, answers, updated_at: new Date().toISOString() },
      { onConflict: "topic_id,student_id,section" },
    );
  return { ok: !error };
}

export async function checkPractice(
  topicId: string,
  section: Section,
  answers: (string | null)[],
): Promise<{ ok: true; result: PracticeResult; best: number } | { ok: false; error: string }> {
  const profile = await requireStudent();
  if (!sectionSchema.safeParse(section).success || !answersSchema.safeParse(answers).success) {
    return { ok: false, error: "Couldn’t read your answers." };
  }
  const topic = await loadTopic(topicId);
  if (!topic) return { ok: false, error: "Topic not found." };
  if (!(await hasCourseAccess(profile.id, topic.course_id))) return { ok: false, error: "This course is locked. Unlock it on the course page." };
  const content = topic.content;
  if (answers.length !== sectionLength(content, section)) return { ok: false, error: "Refresh the page and try again." };

  const admin = createAdminClient();
  const { data: keyRow } = await admin.from("practice_keys").select("key").eq("topic_id", topicId).maybeSingle();
  const key = keyRow?.key as PracticeKey | undefined;
  if (!key) return { ok: false, error: "Answer key not found." };

  let items: CheckedPracticeItem[];
  let aiUnavailable = false;

  if (section === "test") {
    items = content.test.map((q, i) => {
      const k = key.test[i];
      const given = answers[i];
      const ok =
        q.type === "mc"
          ? given === k.answer
          : q.type === "write"
            ? matchesWord(given, [k.answer, ...(k.accept ?? [])])
            : matchesAny(given, [k.answer, ...(k.accept ?? [])]);
      // Noto'g'ri variant tanlangan bo'lsa — o'sha variant nega mos emasligini ham qo'shamiz.
      const note = !ok && typeof given === "string" ? k.wrong?.[given] : undefined;
      return { ok, correct: k.answer, explain: note ? `${k.explain}
❌ Siz tanlagan javob: ${note}` : k.explain };
    });
  } else {
    if (!isGrammar(content) || !key.translations) return { ok: false, error: "This topic has no translation part." };
    const tr = key.translations;
    items = content.translations.map((_, i) => {
      const ok = matchesAny(answers[i], tr[i].en);
      return { ok, correct: tr[i].en[0], explain: tr[i].rule };
    });
    // Namunaga aynan mos kelmagan (lekin bo'sh bo'lmagan) javoblarni AI tekshiradi.
    const toCheck = items
      .map((it, i) => ({ it, i }))
      .filter(({ it, i }) => !it.ok && (answers[i] ?? "").trim())
      .map(({ i }) => ({ n: i, uz: content.translations[i].uz, student: answers[i] ?? "", reference: tr[i].en, rule: tr[i].rule }));
    if (toCheck.length) {
      const verdicts = await checkTranslationsWithAi(topic.title, toCheck);
      if (!verdicts) {
        aiUnavailable = true;
      } else {
        for (const v of verdicts) {
          const it = items[v.n];
          if (!it || !toCheck.some((c) => c.n === v.n)) continue;
          items[v.n] = {
            ok: v.ok,
            correct: v.ok ? (answers[v.n] ?? it.correct) : v.correction || it.correct,
            explain: v.ok ? it.explain : v.explain || it.explain,
            ai: true,
          };
        }
      }
    }
  }

  const score = items.filter((i) => i.ok).length;
  const result: PracticeResult = { items, score, total: items.length, ...(aiUnavailable ? { aiUnavailable } : {}) };

  const { data: prev } = await admin
    .from("practice_attempts")
    .select("best_score, checked_count, history")
    .eq("topic_id", topicId)
    .eq("student_id", profile.id)
    .eq("section", section)
    .maybeSingle();
  const best = Math.max(prev?.best_score ?? 0, score);
  const now = new Date().toISOString();
  // O'qituvchi uchun: har bir tekshiruv tarixi (oxirgi 50 tasi) va oxirgi tekshirilgan javoblar.
  const prevHistory = Array.isArray(prev?.history) ? (prev.history as unknown[]) : [];
  const history = [...prevHistory, { at: now, score, total: items.length }].slice(-50);

  const { error } = await admin.from("practice_attempts").upsert(
    {
      topic_id: topicId,
      student_id: profile.id,
      section,
      answers,
      result,
      score,
      total: items.length,
      best_score: best,
      checked_count: (prev?.checked_count ?? 0) + 1,
      checked_at: now,
      updated_at: now,
      last_checked: { answers, result },
      history,
    },
    { onConflict: "topic_id,student_id,section" },
  );
  if (error) return { ok: false, error: "Couldn’t save the result. Please try again." };
  return { ok: true, result, best };
}

/** Qayta ishlash: javoblar va oxirgi natija tozalanadi, eng yaxshi ball qoladi. */
export async function resetPractice(topicId: string, section: Section): Promise<{ ok: boolean }> {
  const profile = await requireStudent();
  if (!sectionSchema.safeParse(section).success || !z.uuid().safeParse(topicId).success) return { ok: false };
  const { error } = await createAdminClient()
    .from("practice_attempts")
    .update({ answers: [], result: null, score: null, updated_at: new Date().toISOString() })
    .eq("topic_id", topicId)
    .eq("student_id", profile.id)
    .eq("section", section);
  return { ok: !error };
}
