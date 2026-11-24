/**
 * Muddatsiz mashqlar (practice_topics). Mazmunda JAVOBLAR YO'Q — ular practice_keys da.
 *  - grammar: qoida (intro) + 100 tarjima + 30 test
 *  - vocab:   so'zlar ro'yxati + 100 mashq
 */

/** Bitta mavzu bo'yicha batafsil qo'llanma (qo'llanilishi, tuzilishi, signal so'zlar). */
export type GuideTopic = {
  name: string;
  name_uz: string;
  summary: string;
  usage: { text: string; example: { en: string; uz: string } }[];
  structure: { type: "+" | "-" | "?" | "short"; formula: string; example: { en: string; uz: string } }[];
  signals: { en: string; uz: string }[];
  tip: string;
};

export type IntroContent = {
  /** Bo'lsa — har bir mavzu uchun batafsil qo'llanma ko'rsatiladi. */
  topics?: GuideTopic[];
  what: string;
  when: string[];
  structures: { label: string; formula: string; example_en: string; example_uz: string }[];
  rules: { title: string; text: string; examples: { en: string; uz: string }[] }[];
  signal_words: { en: string; uz: string }[];
  mistakes: { wrong: string; right: string; why: string }[];
};

export type TestItem =
  | { type: "fill"; q: string; hint?: string; part?: number }
  | { type: "mc"; q: string; options: string[]; part?: number }
  /** Lug'at: o'zbekcha so'z → inglizchasini yozish. */
  | { type: "write"; q: string };

export type GrammarContent = {
  intro: IntroContent;
  parts: string[];
  translations: { part: number; uz: string }[];
  test: TestItem[];
  testParts?: string[];
};

export type VocabContent = {
  words: { en: string; uz: string }[];
  test: TestItem[];
  /** Mashq bo'limlari sarlavhalari (test elementidagi "part" shu ro'yxatga ishora qiladi). */
  testParts?: string[];
};

/** Reading: bitta yoki bir nechta matn + savollar. */
export type ReadingContent = {
  passages: { title: string; text: string; uz?: string }[];
  test: TestItem[];
  testParts?: string[];
};

export type PracticeContent = GrammarContent | VocabContent | ReadingContent;

export type PracticeKey = {
  translations?: { en: string[]; rule?: string }[];
  /** wrong — test variantlari uchun: o'quvchi shu noto'g'ri variantni tanlasa ko'rsatiladigan izoh. */
  test: { answer: string; accept?: string[]; explain: string; wrong?: Record<string, string> }[];
};

export type Section = "translate" | "test";

export type CheckedPracticeItem = {
  ok: boolean;
  /** To'g'ri javob (namuna). */
  correct: string;
  /** Nega shunday — o'zbekcha izoh (qoida bo'yicha). */
  explain?: string;
  /** Tarjimani AI tekshirgan bo'lsa. */
  ai?: boolean;
};

export type PracticeResult = {
  items: CheckedPracticeItem[];
  score: number;
  total: number;
  /** AI band bo'lgani uchun ba'zi tarjimalar faqat namuna bilan solishtirildi. */
  aiUnavailable?: boolean;
};

export type Attempt = {
  section: Section;
  answers: (string | null)[];
  result: PracticeResult | null;
  score: number | null;
  total: number | null;
  best_score: number | null;
  checked_count: number;
};

export function isGrammar(c: PracticeContent): c is GrammarContent {
  return "intro" in c;
}

export function isReading(c: PracticeContent): c is ReadingContent {
  return "passages" in c;
}

export function sectionLength(c: PracticeContent, section: Section): number {
  return section === "translate" ? (isGrammar(c) ? c.translations.length : 0) : c.test.length;
}
