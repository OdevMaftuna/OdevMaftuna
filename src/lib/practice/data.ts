import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Attempt, PracticeContent, Section } from "./types";

export type TopicKind = "grammar" | "vocab" | "phrasal" | "reading";

export type TopicRow = {
  id: string;
  course_id: string;
  kind: TopicKind;
  unit: number;
  code: string;
  title: string;
  title_uz: string;
  sort_order: number;
};

export type TopicProgress = Partial<Record<Section, { best: number | null; total: number | null; checked: number; started: boolean }>>;

/** Bo'limlar haqida qisqa ma'lumot (bosh sahifa kartalari). */
export const LEVEL_INFO: Record<string, { level: string; text: string; en: string }> = {
  Beginner: { level: "A1", text: "Noldan boshlovchilar uchun", en: "For complete beginners" },
  Elementary: { level: "A1–A2", text: "Asoslarni mustahkamlash", en: "Build strong basics" },
  "Pre-Intermediate": { level: "A2–B1", text: "Erkinroq gapirish va yozish", en: "Speak and write more freely" },
  CEFR: { level: "B1–C1", text: "Milliy sertifikat (CEFR) imtihoniga tayyorlov", en: "Prepare for the national CEFR exam" },
  IELTS: { level: "5.0–7.5", text: "IELTS imtihoniga tayyorlov", en: "Prepare for the IELTS exam" },
};

export const KIND_PATH: Record<TopicKind, string> = { grammar: "mavzular", vocab: "lugat", phrasal: "phrasal", reading: "reading" };

export async function loadMyCourseId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("course_id").eq("id", userId).maybeSingle();
  return (data?.course_id as string | null) ?? null;
}

const TOPIC_COLUMNS = "id, course_id, kind, unit, code, title, title_uz, sort_order";

export async function loadTopics(filter: { courseId?: string; kind?: TopicKind } = {}): Promise<TopicRow[]> {
  const supabase = await createClient();
  let q = supabase.from("practice_topics").select(TOPIC_COLUMNS);
  if (filter.courseId) q = q.eq("course_id", filter.courseId);
  if (filter.kind) q = q.eq("kind", filter.kind);
  const { data } = await q.order("sort_order", { ascending: true });
  return (data ?? []) as TopicRow[];
}

/** O'quvchining mavzular bo'yicha natijalari (eng yaxshi ball). */
export async function loadMyProgress(studentId: string): Promise<Map<string, TopicProgress>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select("topic_id, section, best_score, total, checked_count, answers")
    .eq("student_id", studentId);
  const map = new Map<string, TopicProgress>();
  for (const r of data ?? []) {
    const p = map.get(r.topic_id as string) ?? {};
    p[r.section as Section] = {
      best: r.best_score as number | null,
      total: r.total as number | null,
      checked: r.checked_count as number,
      started: Array.isArray(r.answers) && (r.answers as unknown[]).some((a) => typeof a === "string" && a.trim() !== ""),
    };
    map.set(r.topic_id as string, p);
  }
  return map;
}

export async function loadTopic(topicId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_topics")
    .select(`${TOPIC_COLUMNS}, content, courses(name)`)
    .eq("id", topicId)
    .maybeSingle();
  if (!data) return null;
  return data as unknown as TopicRow & { content: PracticeContent; courses: { name: string } | null };
}

export async function loadMyAttempts(topicId: string, studentId: string): Promise<Partial<Record<Section, Attempt>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select("section, answers, result, score, total, best_score, checked_count")
    .eq("topic_id", topicId)
    .eq("student_id", studentId);
  const out: Partial<Record<Section, Attempt>> = {};
  for (const r of data ?? []) out[r.section as Section] = r as unknown as Attempt;
  return out;
}

export function groupByUnit<T extends { unit: number }>(rows: T[]): { unit: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const r of rows) map.set(r.unit, [...(map.get(r.unit) ?? []), r]);
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([unit, items]) => ({ unit, items }));
}
