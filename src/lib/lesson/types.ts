/**
 * Interaktiv dars (assignments.lesson) — tuzilma. Bu yerda JAVOBLAR YO'Q:
 * javoblar kaliti alohida, yopiq `assignment_keys` jadvalida saqlanadi.
 */

export type VocabItem = { en: string; uz: string };

export type ReadingContent = {
  id: string;
  unit: number;
  unitTitle: string;
  num: number;
  title: string;
  text: string[];
  vocab: VocabItem[];
  tf: { q: string }[];
  mc: { q: string; options: string[] }[];
  fill: { box: string[]; items: { q: string }[] };
  /** O'zbekchadan inglizchaga so'z tarjimasi (kitobdagi D mashqi). */
  wordTr: { uz: string }[];
  vocabQuiz: { q: string; options: string[] }[];
  /** Inglizchadan o'zbekchaga gap tarjimasi (AI tekshiradi). */
  translate: { en: string }[];
  /** Shu so'zlar bilan o'z gapini tuzish (AI tekshiradi). */
  sentences: VocabItem[];
  /** Matn audiosi (lesson-audio bucketida); bo'lmasa brauzer ovozi. */
  audio?: string | null;
  /** [sarlavha, 1-xatboshi, ...] vaqtlari (soniya). */
  segments?: [number, number][] | null;
};

export type ReviewContent = {
  units: number[];
  vocabQuiz: { q: string; options: string[] }[];
  wordTr: { uz: string }[];
  sentences: VocabItem[];
  writing: string | null;
};

/** Speaking: bitta mavzu bo'yicha ovozli javoblar + mavzu lug'ati bilan gap tuzish. */
export type SpeakingContent = {
  topic: number;
  title: string;
  uzTitle: string;
  grammar: string;
  questions: string[];
  vocab: VocabItem[];
  phrases: VocabItem[];
  /** Namuna javob; **so'z** — mavzu lug'ati. */
  sample: string;
  /** lesson-audio bucketidagi yo'l (bo'lmasa brauzer ovozi). */
  sampleAudio?: string | null;
  /** Shu so'zlar bilan yozma gap tuziladi (AI tekshiradi). */
  sentenceWords: VocabItem[];
  /** Nechta ovozli javob kerak va har biri kamida necha soniya. */
  required: number;
  minSeconds: number;
};

/** Listening: ikki kishilik dialog va savollar. Matn (transcript) topshirilgandan keyin ko'rinadi. */
export type ListeningContent = {
  title: string;
  setting: string;
  speakers: string[];
  audio?: string | null;
  /** Har bir qatorning [boshi, oxiri] soniyada — qatorni alohida qayta eshitish uchun (matnsiz). */
  segments?: [number, number][] | null;
  /** Faqat audio hali tayyor bo'lmaganda (brauzer ovozida o'qish uchun). */
  lines?: { speaker: string; text: string }[];
  tf: { q: string }[];
  mc: { q: string; options: string[] }[];
  gaps: { q: string }[];
};

type LessonExtras = { speaking?: SpeakingContent; listening?: ListeningContent };

/**
 * MULTILEVEL (Multilevel Master Reading / Listening kitoblari): har bir blok — bitta kitob mashqi.
 * Savol turlari: "gap" — so'z yoziladi; "choice" — harf tanlanadi (A/B/C…, True/False/Not Given ham).
 */
export type MlOption = { letter: string; text: string };
export type MlQuestion = {
  type: "gap" | "choice";
  /** Kitobdagi raqami. */
  n: number;
  /** Savol matni (gap uchun bo'sh bo'lishi mumkin — bo'shliq matn ichida). */
  q?: string;
  /** Savolning o'z variantlari (bo'lmasa — blokning umumiy ro'yxati "bank"). */
  options?: MlOption[];
};
export type MlBlock = {
  book: "reading" | "listening";
  part: number;
  exercise: number;
  instructions: string;
  title?: string;
  /** Matn (Markdown kabi: "### sarlavha", "(3) ________" bo'shliqlar). */
  passage?: string;
  /** Umumiy variantlar (A–J): sarlavhalar, odamlar, xaritadagi joylar. */
  bank?: MlOption[];
  bankTitle?: string;
  /** Kitob sahifasidan qirqilgan mashq rasmlari (lesson-audio bucketidagi yo'llar). */
  images?: string[];
  /** Listening audiosi (lesson-audio bucketidagi yo'l). */
  audio?: string | null;
  questions: MlQuestion[];
};
export type MultilevelLesson = { kind: "multilevel"; day: number; blocks: MlBlock[] };

export type Lesson =
  | ((
      | { kind: "reading"; day: number; readings: ReadingContent[] }
      | { kind: "review" | "final"; day: number; review: ReviewContent }
    ) &
      LessonExtras)
  | (MultilevelLesson & LessonExtras);

// ---- O'quvchi javoblari ----
export type ReadingAnswers = {
  tf: (boolean | null)[];
  mc: (number | null)[];
  fill: (string | null)[];
  wordTr: string[];
  vocabQuiz: (number | null)[];
  translate: string[];
  sentences: string[];
};

export type ReviewAnswers = {
  vocabQuiz: (number | null)[];
  wordTr: string[];
  sentences: string[];
  writing: string;
};

export type ListeningAnswers = {
  tf: (boolean | null)[];
  mc: (number | null)[];
  gaps: string[];
};

/** Yozilgan ovoz: speaking/<o'quvchi>/<dars>/<n>.mp3 */
export type Recording = { n: number; seconds: number; bytes: number };

export type SpeakingAnswers = {
  sentences: string[];
  /** Brauzer yuborgani; topshirishda server Storage'dagi haqiqiy fayllar bilan almashtiradi. */
  recordings: Recording[];
};

export type LessonAnswers = {
  /** Multilevel: har bir blok uchun javoblar (gap — so'z, choice — harf). */
  ml?: string[][];
  readings?: ReadingAnswers[];
  review?: ReviewAnswers;
  listening?: ListeningAnswers;
  speaking?: SpeakingAnswers;
};

// ---- Javoblar kaliti (faqat serverda) ----
export type ReadingKey = {
  tf: boolean[];
  mc: number[];
  fill: string[];
  wordTr: string[];
  vocabQuiz: number[];
};
export type ReviewKey = { vocabQuiz: number[]; wordTr: string[] };
export type ListeningKey = {
  tf: boolean[];
  mc: number[];
  gaps: string[];
  lines: { speaker: string; text: string }[];
};
export type LessonKey = {
  readings?: ReadingKey[];
  review?: ReviewKey;
  listening?: ListeningKey;
  /** Multilevel: [blok][savol] → qabul qilinadigan javoblar (birinchisi ko'rsatiladi). */
  ml?: string[][][];
  /** Multilevel: har bir blok uchun audio matni va savollar izohi (topshirilgandan keyin ko'rsatiladi). */
  mlInfo?: MlInfo[];
};
export type MlInfo = { script?: string; explain?: string[] };
/** Multilevel darsni necha marta ishlash mumkin (1-urinish rasmiy, qolganlari — mashq). */
export const MAX_ML_ATTEMPTS = 2;

// ---- Avtomatik tekshiruv natijasi (o'quvchiga topshirgandan keyin ko'rinadi) ----
export type CheckedItem = { ok: boolean; correct: string };
export type ReadingResult = {
  tf: CheckedItem[];
  mc: CheckedItem[];
  fill: CheckedItem[];
  wordTr: CheckedItem[];
  vocabQuiz: CheckedItem[];
};
export type ReviewResult = { vocabQuiz: CheckedItem[]; wordTr: CheckedItem[] };

export type ScorePart = { score: number; max: number; correct: number; total: number };

/** AI izohi (ai/feedback.ts dagi Feedback bilan bir xil shakl). */
export type SpeakingFeedback = {
  score: number;
  summary: string;
  mistakes: { original: string; correction: string; explanation: string; type: string }[];
  strengths: string[];
  suggestions: string[];
  recordings?: { heard: string; speakers: number; english: boolean; own_answer: boolean }[];
};

export type LessonResult = {
  /** Reading/takrorlash test qismlari (Multilevel'da — hamma bloklar). */
  auto: ScorePart;
  /** Multilevel: [blok][savol]. */
  ml?: CheckedItem[][];
  /** Multilevel: audio matni va izohlar (sahifada kalitdan qo'shiladi). */
  mlInfo?: MlInfo[];
  /** Multilevel: qayta ishlashlar (2-urinish…). Rasmiy ball — birinchi urinish. */
  retries?: { answers: LessonAnswers; result: LessonResult; at: string }[];
  readings?: ReadingResult[];
  review?: ReviewResult;
  /** AI yozma qismni baholagandan keyin to'ldiriladi. */
  ai?: { score: number; max: number };
  listening?: ScorePart & {
    tf: CheckedItem[];
    mc: CheckedItem[];
    gaps: CheckedItem[];
    lines: { speaker: string; text: string }[];
  };
  speaking?: {
    /** Talabga javob bergan ovozlar soni. */
    count: number;
    required: number;
    /** Bajarilganlik balli. */
    score: number;
    max: number;
    recordings: Recording[];
    /** AI tasodifiy tanlangan ovozlarni tinglagandan keyin. */
    ai?: { score: number; max: number; checked: number[]; feedback: SpeakingFeedback | null };
    /** Ovozlar o'chirildi (ball va izoh qoladi). */
    deleted?: boolean;
  };
};

export type Weights = {
  auto: number;
  written: number;
  speakingDone: number;
  speakingAi: number;
  listening: number;
};

/**
 * Ballar taqsimoti (jami 100):
 *  - speaking + listening bor kun: Reading test 30 + yozma 20, Speaking 20 (bajarish) + 10 (AI), Listening 20.
 *  - faqat reading/takrorlash: test 60 + yozma 40.
 */
export function lessonWeights(lesson: Pick<Lesson, "speaking" | "listening" | "kind">): Weights {
  // Multilevel: hamma savollar kitob kaliti bilan avtomatik tekshiriladi — 100 ball.
  if (lesson.kind === "multilevel") return { auto: 100, written: 0, speakingDone: 0, speakingAi: 0, listening: 0 };
  const s = lesson.speaking ? { speakingDone: 20, speakingAi: 10 } : { speakingDone: 0, speakingAi: 0 };
  const listening = lesson.listening ? 20 : 0;
  const rest = 100 - s.speakingDone - s.speakingAi - listening;
  const written = Math.round(rest * 0.4);
  return { auto: rest - written, written, ...s, listening };
}

/** Speaking yozuvi: MP3, 32 kbit/s (4000 bayt/soniya), mono 16 kHz. */
export const SPEAKING_BYTES_PER_SECOND = 4000;
export const SPEAKING_MAX_SECONDS = 180;

export function emptyAnswers(lesson: Lesson): LessonAnswers {
  if (lesson.kind === "multilevel") return { ml: lesson.blocks.map((b) => b.questions.map(() => "")) };
  const extras: Pick<LessonAnswers, "listening" | "speaking"> = {};
  if (lesson.listening) {
    extras.listening = {
      tf: lesson.listening.tf.map(() => null),
      mc: lesson.listening.mc.map(() => null),
      gaps: lesson.listening.gaps.map(() => ""),
    };
  }
  if (lesson.speaking) {
    extras.speaking = { sentences: lesson.speaking.sentenceWords.map(() => ""), recordings: [] };
  }
  if (lesson.kind === "reading") {
    return {
      ...extras,
      readings: lesson.readings.map((r) => ({
        tf: r.tf.map(() => null),
        mc: r.mc.map(() => null),
        fill: r.fill.items.map(() => null),
        wordTr: r.wordTr.map(() => ""),
        vocabQuiz: r.vocabQuiz.map(() => null),
        translate: r.translate.map(() => ""),
        sentences: r.sentences.map(() => ""),
      })),
    };
  }
  const v = lesson.review;
  return {
    ...extras,
    review: {
      vocabQuiz: v.vocabQuiz.map(() => null),
      wordTr: v.wordTr.map(() => ""),
      sentences: v.sentences.map(() => ""),
      writing: "",
    },
  };
}

/** Javob berilgan / jami savollar soni (yozma qismlar ham kiradi). */
export function progress(lesson: Lesson, a: LessonAnswers): { done: number; total: number } {
  const filled = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : v !== null && v !== undefined);
  let done = 0;
  let total = 0;
  const count = (arr: unknown[]) => {
    total += arr.length;
    done += arr.filter(filled).length;
  };
  if (lesson.kind === "multilevel") {
    for (const b of a.ml ?? []) count(b);
    return { done, total };
  }
  if (lesson.kind === "reading") {
    for (const r of a.readings ?? []) {
      count(r.tf); count(r.mc); count(r.fill); count(r.wordTr); count(r.vocabQuiz); count(r.translate); count(r.sentences);
    }
  } else if (a.review) {
    count(a.review.vocabQuiz); count(a.review.wordTr); count(a.review.sentences);
    if (lesson.review.writing) count([a.review.writing]);
  }
  if (a.listening) {
    count(a.listening.tf); count(a.listening.mc); count(a.listening.gaps);
  }
  if (a.speaking && lesson.speaking) {
    count(a.speaking.sentences);
    total += lesson.speaking.required;
    done += Math.min(lesson.speaking.required, a.speaking.recordings.length);
  }
  return { done, total };
}
