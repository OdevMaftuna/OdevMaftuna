import type { Lesson, LessonAnswers, LessonResult } from "@/lib/lesson/types";

export type SubmissionType = "text" | "image" | "both";

export type Assignment = {
  id: string;
  title: string;
  instructions: string;
  submission_type: SubmissionType;
  rubric: string;
  max_score: number;
  publish_at: string;
  due_at: string;
  late_allowed: boolean;
  late_penalty_percent: number;
  course_id: string;
  /** Interaktiv dars mazmuni (oddiy vazifada null). */
  lesson?: Lesson | null;
  /** Ro'yxatlarda butun dars o'rniga faqat turi olinadi ("reading" | "review" | "final"). */
  lesson_kind?: string | null;
  created_at: string;
};

/**
 * Ro'yxat sahifalari uchun ustunlar: og'ir `lesson` (dars mazmuni) yuklanmaydi,
 * faqat uning turi `lesson_kind` sifatida olinadi.
 */
export const ASSIGNMENT_LIST_COLUMNS =
  "id, title, instructions, submission_type, rubric, max_score, publish_at, due_at, late_allowed, late_penalty_percent, course_id, created_at, lesson_kind:lesson->>kind";

export const SUBMISSION_TYPE_LABELS_EN: Record<SubmissionType, string> = {
  text: "Text",
  image: "Photo",
  both: "Text and photo",
};

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  text: "Matn",
  image: "Rasm",
  both: "Matn va rasm",
};

/** Server action'lar qaytaradigan umumiy natija. */
export type ActionState = {
  error?: string;
  /** Xato chiqqanda forma qiymatlari yo'qolmasligi uchun. */
  values?: Record<string, string>;
} | null;

/** student_submissions view qatori (o'quvchi ko'radigan ko'rinish). */
export type StudentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  text_content: string | null;
  image_paths: string[];
  submitted_at: string;
  is_late: boolean;
  ai_status: "pending" | "done" | "error";
  ai_feedback: unknown;
  ai_score: number | null;
  teacher_score: number | null;
  teacher_comment: string | null;
  reviewed_at: string | null;
  /** O'qituvchi bali bo'lsa o'sha, bo'lmasa (ko'rsatishga ruxsat bo'lsa) AI bali. */
  final_score: number | null;
  score_visible: boolean;
  answers: LessonAnswers | null;
  lesson_result: LessonResult | null;
};
