import { z } from "zod";

/** Gemini qaytaradigan va ai_feedback ustunida saqlanadigan javob shakli. */

export const MISTAKE_TYPES = [
  "grammar",
  "vocabulary",
  "spelling",
  "punctuation",
  "other",
] as const;

export const MISTAKE_TYPE_LABELS: Record<(typeof MISTAKE_TYPES)[number], string> = {
  grammar: "Grammatika",
  vocabulary: "So‘z tanlash",
  spelling: "Imlo",
  punctuation: "Tinish belgisi",
  other: "Boshqa",
};

export const feedbackSchema = z.object({
  score: z.number(),
  summary: z.string(),
  mistakes: z.array(
    z.object({
      original: z.string(),
      correction: z.string(),
      explanation: z.string(),
      type: z.enum(MISTAKE_TYPES),
    }),
  ),
  strengths: z.array(z.string()),
  suggestions: z.array(z.string()),
  /** Yozma dars: har bir raqamlangan javob (#1, #2, …) bo'yicha alohida hukm. */
  items: z
    .array(
      z.object({
        n: z.number(),
        verdict: z.enum(["correct", "partly", "wrong", "empty"]),
        correct: z.string(),
        explain: z.string(),
      }),
    )
    .optional(),
  /** Faqat speaking: har bir ovoz bo'yicha AI nimani eshitgani (ballni kod tekshiradi). */
  recordings: z
    .array(
      z.object({
        heard: z.string(),
        speakers: z.number(),
        english: z.boolean(),
        own_answer: z.boolean(),
      }),
    )
    .optional(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

/**
 * Ko'rsatish uchun: "AI balini darhol ko'rsatish" o'chirilgan bo'lsa,
 * baza o'quvchiga `score` maydonisiz qaytaradi.
 */
export const storedFeedbackSchema = feedbackSchema.extend({
  score: z.number().optional(),
});

export type StoredFeedback = z.infer<typeof storedFeedbackSchema>;

/** Gemini'ga beriladigan JSON Schema (structured output). */
export const FEEDBACK_JSON_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    summary: { type: "string" },
    mistakes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          correction: { type: "string" },
          explanation: { type: "string" },
          type: { type: "string", enum: [...MISTAKE_TYPES] },
        },
        required: ["original", "correction", "explanation", "type"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["score", "summary", "mistakes", "strengths", "suggestions"],
} as const;

/** Yozma dars uchun: umumiy baho + har bir raqamlangan javobga alohida hukm. */
export const ITEMS_FEEDBACK_JSON_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      description:
        "One entry for EVERY numbered answer #1, #2, … in order. verdict: correct (meaning/use is right — accept synonyms, different word order and small spelling slips), partly (mostly right, one real mistake), wrong (meaning lost or grammar badly broken), empty (no answer). correct: one good model answer (for a translation — a natural Uzbek translation; for an own sentence — the student's sentence corrected, or an example if empty). explain: 1 short sentence in the feedback language saying why (for correct ones — a short positive note).",
      items: {
        type: "object",
        properties: {
          n: { type: "integer" },
          verdict: { type: "string", enum: ["correct", "partly", "wrong", "empty"] },
          correct: { type: "string" },
          explain: { type: "string" },
        },
        required: ["n", "verdict", "correct", "explain"],
      },
    },
    ...FEEDBACK_JSON_SCHEMA.properties,
  },
  required: ["items", ...FEEDBACK_JSON_SCHEMA.required],
} as const;

/** Speaking uchun: avval har bir ovozda nima eshitilganini yozadi, keyin baholaydi. */
export const AUDIO_FEEDBACK_JSON_SCHEMA = {
  type: "object",
  properties: {
    recordings: {
      type: "array",
      description:
        "One entry per attached recording, in order. heard: short transcript of the first sentences you actually hear (prefix each line with a speaker label if more than one person talks). speakers: number of distinct human voices. english: mostly English speech. own_answer: one learner answering the homework questions about themselves in their own voice (false for dialogues, videos, songs, TTS/synthetic voices, reading someone else's text, silence or noise).",
      items: {
        type: "object",
        properties: {
          heard: { type: "string" },
          speakers: { type: "integer" },
          english: { type: "boolean" },
          own_answer: { type: "boolean" },
        },
        required: ["heard", "speakers", "english", "own_answer"],
      },
    },
    ...FEEDBACK_JSON_SCHEMA.properties,
  },
  required: ["recordings", ...FEEDBACK_JSON_SCHEMA.required],
} as const;
