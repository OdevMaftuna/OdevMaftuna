"use client";

import { StoryButton, type StoryId } from "@/components/stories";

/**
 * Bo'lim qo'llanmasi. Avval uzun matnli blok edi — endi kichik tugma: bosilsa shu bo'limning
 * story-qo'llanmasi (rangli slaydlar, animatsiya) ochiladi.
 */

export type GuideTopic = "home" | "course" | "homework" | "lesson" | "vocab" | "grammar" | "phrasal" | "history";
/** Darsning qaysi qismida ekani (eski API bilan moslik uchun). */
export type LessonStep = "reading" | "listening" | "speaking" | "submit";

const MAP: Record<GuideTopic, StoryId> = {
  home: "start",
  course: "practice",
  homework: "homework",
  lesson: "homework",
  vocab: "practice",
  grammar: "practice",
  phrasal: "practice",
  history: "results",
};

export function StudyGuide({ topic }: { topic: GuideTopic; active?: LessonStep; recordings?: number; minutes?: number }) {
  return <StoryButton id={MAP[topic]} />;
}
