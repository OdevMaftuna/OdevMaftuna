"use client";

import { useState } from "react";
import { Notice, btn } from "@/components/ui";
import { MAX_ML_ATTEMPTS, type Lesson, type LessonAnswers, type LessonResult } from "@/lib/lesson/types";
import { LessonResultView } from "./lesson-result";
import { LessonView } from "./lesson-view";

/**
 * Beginner darsi natijasi + qayta ishlash. 2-urinishda faqat testlar (reading/takrorlash testi, listening)
 * qayta tekshiriladi; yozma va speaking — 1-urinishdan. Rasmiy ball — 1-urinish.
 */
export function LessonAttempts({
  lesson,
  answers,
  result,
  audioUrls,
  assignmentId,
  userId,
}: {
  lesson: Lesson;
  answers: LessonAnswers;
  result: LessonResult | null;
  audioUrls: Record<string, string>;
  assignmentId: string;
  userId: string;
}) {
  const retries = result?.retries ?? [];
  const attempts = [
    { answers, result },
    ...retries.map((r) => ({
      // Testlar — yangi urinishdan; yozma qism va speaking — birinchi urinishdan.
      answers: { ...answers, readings: r.answers.readings, review: r.answers.review ? { ...answers.review!, vocabQuiz: r.answers.review.vocabQuiz, wordTr: r.answers.review.wordTr } : answers.review, listening: r.answers.listening },
      result: result
        ? { ...result, auto: r.result.auto, readings: r.result.readings, review: r.result.review, listening: r.result.listening, retries: undefined }
        : r.result,
    })),
  ];
  const [active, setActive] = useState(attempts.length - 1);
  const [retrying, setRetrying] = useState(false);
  const canRetry = attempts.length < MAX_ML_ATTEMPTS;
  const label = (r: LessonResult | null) => {
    if (!r) return "—";
    const c = r.auto.correct + (r.listening?.correct ?? 0);
    const t = r.auto.total + (r.listening?.total ?? 0);
    return `${c}/${t}`;
  };

  if (retrying) {
    return (
      <div className="space-y-3">
        <Notice tone="info">
          {attempts.length + 1}-urinish: test savollari (reading, lug‘at, listening) qayta tekshiriladi. Writing va speaking — 1-urinishdan. Ball oxirgi urinish bo‘yicha qo‘yiladi, 1-urinish natijasi ham ko‘rinib turadi.
        </Notice>
        <LessonView assignmentId={assignmentId} lesson={lesson} canSubmit isLateWindow={false} penalty={0} userId={userId} audioUrls={audioUrls} retry />
        <button type="button" className={`${btn.secondary} w-full`} onClick={() => setRetrying(false)}>
          ← Natijalarga qaytish
        </button>
      </div>
    );
  }

  const cur = attempts[Math.min(active, attempts.length - 1)];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {attempts.map((a, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              k === active ? "border-brand-500 bg-brand-700 text-white" : "border-neutral-200 hover:border-brand-300"
            }`}
          >
            {k + 1}-urinish · {label(a.result)} test{attempts.length > 1 && k === attempts.length - 1 ? " ✓ hisobga olinadi" : ""}
          </button>
        ))}
        {canRetry ? (
          <button type="button" onClick={() => setRetrying(true)} className={`${btn.primary} ml-auto`}>
            ↻ Qayta ishlash
          </button>
        ) : null}
      </div>
      <LessonResultView lesson={lesson} answers={cur.answers as LessonAnswers} result={cur.result} audioUrls={audioUrls} />
    </div>
  );
}
