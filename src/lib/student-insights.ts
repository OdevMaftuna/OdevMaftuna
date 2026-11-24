import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TestAnswer, TestContent, TestResult } from "@/lib/paid-tests";
import type { PracticeContent, PracticeResult } from "@/lib/practice/types";

/**
 * O'qituvchi uchun bitta o'quvchining batafsil natijalari:
 *  - muddatsiz mashqlar (lug'at, grammatika, iboralar): eng yaxshi / oxirgi natija, urinishlar soni, xatolar;
 *  - pullik testlar: 100 dan ball va xatolar.
 */

export type Mistake = { q: string; given: string; correct: string; explain?: string };

export type PracticeInsight = {
  topicId: string;
  kind: string;
  code: string;
  title: string;
  course: string;
  section: "test" | "translate";
  /** Eng yaxshi natija, %. */
  best: number | null;
  /** Oxirgi tekshiruv, %. */
  last: number | null;
  total: number;
  attempts: number;
  checkedAt: string | null;
  /** Har bir urinish natijasi, % (eskidan yangiga). */
  history: number[];
  /** Oxirgi tekshiruvdagi xatolar. */
  mistakes: Mistake[];
};

export type TestInsight = {
  testId: string;
  title: string;
  course: string;
  score: number;
  correct: number;
  total: number;
  submittedAt: string;
  mistakes: Mistake[];
};

const KIND_LABEL: Record<string, string> = { vocab: "Lug‘at", grammar: "Grammatika", phrasal: "Iboralar" };
export const kindLabel = (k: string) => KIND_LABEL[k] ?? k;

const pct = (a: number | null | undefined, t: number | null | undefined) =>
  a === null || a === undefined || !t ? null : Math.round((a / t) * 100);
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "— (javob yo‘q)" : String(v));

type AttemptRow = {
  topic_id: string;
  section: "test" | "translate";
  answers: unknown[] | null;
  result: PracticeResult | null;
  score: number | null;
  total: number | null;
  best_score: number | null;
  checked_count: number;
  checked_at: string | null;
  last_checked: { answers: unknown[] | null; result: PracticeResult | null } | null;
  history: { score: number; total: number }[] | null;
  practice_topics: {
    kind: string;
    code: string;
    title: string;
    sort_order: number;
    content: PracticeContent;
    courses: { name: string } | null;
  } | null;
};

export async function loadPracticeInsights(studentId: string): Promise<PracticeInsight[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select(
      "topic_id, section, answers, result, score, total, best_score, checked_count, checked_at, last_checked, history, practice_topics(kind, code, title, sort_order, content, courses(name))",
    )
    .eq("student_id", studentId)
    .gt("checked_count", 0);
  const rows = (data ?? []) as unknown as AttemptRow[];

  return rows
    .filter((r) => r.practice_topics)
    .map((r) => {
      const t = r.practice_topics!;
      const content = t.content;
      // "Try again" bosilganda result tozalanadi — shuning uchun oxirgi tekshirilgan nusxadan olamiz.
      const checked = r.last_checked ?? { answers: r.answers, result: r.result };
      const answers = checked.answers ?? [];
      const questions =
        r.section === "translate" && "translations" in content
          ? content.translations.map((x) => x.uz)
          : content.test.map((x) => x.q);
      const mistakes: Mistake[] = (checked.result?.items ?? []).flatMap((it, i) =>
        it.ok ? [] : [{ q: questions[i] ?? `${i + 1}-savol`, given: show(answers[i]), correct: it.correct, explain: it.explain }],
      );
      return {
        topicId: r.topic_id,
        kind: t.kind,
        code: t.code,
        title: t.title,
        course: t.courses?.name ?? "",
        section: r.section,
        best: pct(r.best_score, r.total),
        last: checked.result ? pct(checked.result.score, checked.result.total) : pct(r.score, r.total),
        history: (r.history ?? []).map((h) => pct(h.score, h.total) ?? 0),
        total: r.total ?? 0,
        attempts: r.checked_count,
        checkedAt: r.checked_at,
        mistakes,
        sort: t.sort_order,
      };
    })
    .sort((a, b) => a.course.localeCompare(b.course) || a.sort - b.sort)
    .map(({ sort, ...rest }) => (void sort, rest));
}

type TestRow = {
  test_id: string;
  answers: Record<string, TestAnswer> | TestAnswer[] | null;
  result: TestResult | null;
  score: number | null;
  submitted_at: string;
  paid_tests: { title: string; course: string; sort: number } | null;
};

export async function loadTestInsights(studentId: string): Promise<TestInsight[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_attempts")
    .select("test_id, answers, result, score, submitted_at, paid_tests(title, course, sort)")
    .eq("student_id", studentId)
    .not("submitted_at", "is", null);
  const rows = (data ?? []) as unknown as TestRow[];
  if (!rows.length) return [];

  const { data: contents } = await supabase
    .from("paid_test_content")
    .select("test_id, content")
    .in("test_id", rows.map((r) => r.test_id));
  const byTest = new Map((contents ?? []).map((c) => [c.test_id as string, c.content as TestContent]));

  return rows
    .map((r) => {
      const items = (byTest.get(r.test_id)?.sections ?? []).flatMap((s) => s.items);
      const answers = r.answers ?? [];
      const given = (i: number) => {
        const v = Array.isArray(answers) ? answers[i] : answers[String(i)];
        const item = items[i];
        if (typeof v === "number" && item?.t === "mc") return item.o[v] ?? String(v);
        if (typeof v === "boolean") return v ? "True" : "False";
        return show(v);
      };
      const mistakes: Mistake[] = (r.result?.items ?? []).flatMap((it, i) =>
        it.ok ? [] : [{ q: items[i]?.q ?? `${i + 1}-savol`, given: given(i), correct: it.correct }],
      );
      return {
        testId: r.test_id,
        title: r.paid_tests?.title ?? "Test",
        course: r.paid_tests?.course ?? "",
        score: Number(r.score ?? 0),
        correct: r.result?.correct ?? 0,
        total: r.result?.total ?? items.length,
        submittedAt: r.submitted_at,
        mistakes,
        sort: r.paid_tests?.sort ?? 0,
      };
    })
    .sort((a, b) => a.course.localeCompare(b.course) || a.sort - b.sort)
    .map(({ sort, ...rest }) => (void sort, rest));
}
