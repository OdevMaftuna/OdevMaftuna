import { z } from "zod";
import { WORD_SYNONYMS } from "./synonyms";
import {
  lessonWeights,
  type CheckedItem,
  type Lesson,
  type LessonAnswers,
  type LessonKey,
  type LessonResult,
  type ScorePart,
} from "./types";

/** "A cup of tea!" → "cup of tea"; harf katta-kichikligi, tinish belgilari va artikl e'tiborga olinmaydi. */
export function normalizeWord(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[.!?,;:"“”()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the|to)\s+/, "");
}

/** Kalitda "second / third" yoki "flat, apartment" kabi muqobillar bo'lsa, istalgani qabul qilinadi. */
export function wordMatches(answer: string, key: string): boolean {
  const a = normalizeWord(answer);
  if (!a) return false;
  if (a === normalizeWord(key)) return true;
  return key
    .split(/[/,]/)
    .map(normalizeWord)
    .filter(Boolean)
    .some((alt) => alt === a);
}

/** So'z tarjimasi: kalit yoki uning sinonimlaridan biri (masalan uy → house / home). */
export function wordTrMatches(answer: string, key: string): boolean {
  if (wordMatches(answer, key)) return true;
  const alts = WORD_SYNONYMS[normalizeWord(key)] ?? [];
  return alts.some((alt) => wordMatches(answer, alt));
}

/** Natijada ko'rsatiladigan to'g'ri javob: asosiy so'z va muqobillari. */
function withSynonyms(key: string): string {
  const alts = WORD_SYNONYMS[normalizeWord(key)] ?? [];
  return alts.length ? [key, ...alts].join(" / ") : key;
}

const str = (max: number) => z.string().max(max);

function extrasSchema(lesson: Lesson) {
  const l = lesson.listening;
  const s = lesson.speaking;
  return {
    listening: l
      ? z.object({
          tf: z.array(z.boolean().nullable()).length(l.tf.length),
          mc: z.array(z.number().int().min(0).max(3).nullable()).length(l.mc.length),
          gaps: z.array(str(80)).length(l.gaps.length),
        })
      : z.undefined(),
    speaking: s
      ? z.object({
          sentences: z.array(str(500)).length(s.sentenceWords.length),
          // Brauzer ma'lumoti — server baribir Storage'dan qayta hisoblaydi.
          recordings: z
            .array(z.object({ n: z.number().int(), seconds: z.number(), bytes: z.number() }))
            .max(100),
        })
      : z.undefined(),
  };
}

/** Javoblar shakli darsga mos ekanini tekshiradigan zod sxemasi. */
export function answersSchema(lesson: Lesson) {
  if (lesson.kind === "multilevel") {
    return z.object({
      ml: z.tuple(
        lesson.blocks.map((b) => z.array(str(80)).length(b.questions.length)) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]],
      ),
    });
  }
  const extras = extrasSchema(lesson);
  if (lesson.kind === "reading") {
    return z.object({
      ...extras,
      readings: z.tuple(
        lesson.readings.map((r) =>
          z.object({
            tf: z.array(z.boolean().nullable()).length(r.tf.length),
            mc: z.array(z.number().int().min(0).max(2).nullable()).length(r.mc.length),
            fill: z.array(str(80).nullable()).length(r.fill.items.length),
            wordTr: z.array(str(80)).length(r.wordTr.length),
            vocabQuiz: z.array(z.number().int().min(0).max(3).nullable()).length(r.vocabQuiz.length),
            translate: z.array(str(1000)).length(r.translate.length),
            sentences: z.array(str(500)).length(r.sentences.length),
          }),
        ) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]],
      ),
    });
  }
  const v = lesson.review;
  return z.object({
    ...extras,
    review: z.object({
      vocabQuiz: z.array(z.number().int().min(0).max(3).nullable()).length(v.vocabQuiz.length),
      wordTr: z.array(str(80)).length(v.wordTr.length),
      sentences: z.array(str(500)).length(v.sentences.length),
      writing: str(4000),
    }),
  });
}

class Counter {
  correct = 0;
  total = 0;
  mark = (ok: boolean, shown: string): CheckedItem => {
    this.total += 1;
    if (ok) this.correct += 1;
    return { ok, correct: shown };
  };
  summary(max: number): ScorePart {
    const score = this.total === 0 ? max : Math.round((this.correct / this.total) * max * 10) / 10;
    return { score, max, correct: this.correct, total: this.total };
  }
}

/**
 * Avtomatik qismlarni kalit bilan solishtiradi: reading/takrorlash testi va listening.
 * Speaking bajarilganligi alohida (Storage'dagi fayllar bo'yicha) qo'shiladi.
 */
export function gradeLesson(lesson: Lesson, key: LessonKey, answers: LessonAnswers): LessonResult {
  const w = lessonWeights(lesson);
  const c = new Counter();
  let result: LessonResult;

  if (lesson.kind === "multilevel") {
    // Harf — aynan mos kelishi kerak; so'z — kitob kalitidagi variantlardan biri (katta-kichik harf, artikl farqi yo'q).
    const ml = lesson.blocks.map((b, i) =>
      b.questions.map((q, j) => {
        const accepted = key.ml?.[i]?.[j] ?? [];
        const given = (answers.ml?.[i]?.[j] ?? "").trim();
        const ok =
          q.type === "choice"
            ? accepted.some((x) => x.trim().toUpperCase() === given.toUpperCase())
            : accepted.some((x) => wordMatches(given, x));
        const opt = q.type === "choice" ? (q.options ?? b.bank ?? []).find((o) => o.letter === accepted[0]) : undefined;
        return c.mark(ok, opt ? `${opt.letter}) ${opt.text}` : (accepted[0] ?? ""));
      }),
    );
    return { auto: c.summary(w.auto), ml };
  }

  if (lesson.kind === "reading") {
    const readings = lesson.readings.map((r, i) => {
      const k = key.readings?.[i];
      const a = answers.readings?.[i];
      if (!k || !a) throw new Error("Kalit yoki javob topilmadi");
      return {
        tf: k.tf.map((ans, j) => c.mark(a.tf[j] === ans, ans ? "True" : "False")),
        mc: k.mc.map((ans, j) => c.mark(a.mc[j] === ans, `${"ABC"[ans]}) ${r.mc[j]?.options[ans] ?? ""}`)),
        fill: k.fill.map((ans, j) => c.mark(wordMatches(a.fill[j] ?? "", ans), ans)),
        wordTr: k.wordTr.map((ans, j) => c.mark(wordTrMatches(a.wordTr[j] ?? "", ans), withSynonyms(ans))),
        vocabQuiz: k.vocabQuiz.map((ans, j) => c.mark(a.vocabQuiz[j] === ans, r.vocabQuiz[j]?.options[ans] ?? "")),
      };
    });
    result = { auto: c.summary(w.auto), readings };
  } else {
    const k = key.review;
    const a = answers.review;
    if (!k || !a) throw new Error("Kalit yoki javob topilmadi");
    const review = {
      vocabQuiz: k.vocabQuiz.map((ans, j) => c.mark(a.vocabQuiz[j] === ans, lesson.review.vocabQuiz[j]?.options[ans] ?? "")),
      wordTr: k.wordTr.map((ans, j) => c.mark(wordTrMatches(a.wordTr[j] ?? "", ans), withSynonyms(ans))),
    };
    result = { auto: c.summary(w.auto), review };
  }

  if (lesson.listening && key.listening) {
    const l = lesson.listening;
    const k = key.listening;
    const a = answers.listening ?? { tf: [], mc: [], gaps: [] };
    const lc = new Counter();
    const tf = k.tf.map((ans, j) => lc.mark(a.tf[j] === ans, ans ? "True" : "False"));
    const mc = k.mc.map((ans, j) => lc.mark(a.mc[j] === ans, `${"ABC"[ans]}) ${l.mc[j]?.options[ans] ?? ""}`));
    const gaps = k.gaps.map((ans, j) => lc.mark(wordMatches(a.gaps[j] ?? "", ans), ans));
    result.listening = { ...lc.summary(w.listening), tf, mc, gaps, lines: k.lines };
  }
  return result;
}

/** Speaking bajarilganlik balli: har bir talabga mos ovoz uchun teng ulush. */
export function speakingCompletion(lesson: Lesson, count: number) {
  const s = lesson.speaking;
  const max = lessonWeights(lesson).speakingDone;
  if (!s) return { score: 0, max: 0 };
  return { score: Math.round((Math.min(count, s.required) / s.required) * max * 10) / 10, max };
}

/** Avtomatik + AI qismlar yig'indisi (jarimasiz). Qayta ishlangan bo'lsa — oxirgi urinishning testlari. */
export function lessonRawScore(r: LessonResult): number {
  // Qayta ishlangan bo'lsa — test qismlari OXIRGI urinishdan (yozma va speaking — 1-urinishdan).
  const last = r.retries?.at(-1)?.result;
  const auto = last?.auto ?? r.auto;
  const listening = last ? last.listening : r.listening;
  const sum =
    auto.score +
    (r.ai?.score ?? 0) +
    (listening?.score ?? 0) +
    (r.speaking?.score ?? 0) +
    (r.speaking?.ai?.score ?? 0);
  return Math.round(Math.min(100, Math.max(0, sum)) * 10) / 10;
}

/**
 * Yozma qism (AI tekshiradigan) — bitta matnga yig'iladi. Bu matn submissions.text_content'ga ham
 * yoziladi, shuning uchun o'qituvchi uni oddiy ko'rinishda ham o'qiy oladi.
 */
export function writtenText(lesson: Lesson, answers: LessonAnswers): string {
  const out: string[] = [];
  if (lesson.kind === "multilevel") {
    // O'qituvchi uchun oddiy ko'rinish: har bir mashq bo'yicha javoblar.
    lesson.blocks.forEach((b, i) => {
      out.push(`${b.book.toUpperCase()} · Part ${b.part} · Exercise ${b.exercise}`);
      out.push(b.questions.map((q, j) => `${q.n}) ${answers.ml?.[i]?.[j] || "—"}`).join("   "));
    });
    return out.join("\n");
  }
  const val = (s: string | undefined) => (s && s.trim() ? s.trim() : "(javob yo'q)");
  // Har bir javob raqamlanadi (#1, #2, …) — AI har biriga alohida hukm beradi, natija sahifasi shu tartibda ko'rsatadi.
  let k = 0;
  const no = () => `#${++k}`;
  if (lesson.kind === "reading") {
    lesson.readings.forEach((r, i) => {
      const a = answers.readings?.[i];
      out.push(`READING ${i + 1}: ${r.title}`);
      out.push("Translate into Uzbek:");
      r.translate.forEach((t, j) => out.push(`  ${no()} (translation ${j + 1}) "${t.en}" → ${val(a?.translate[j])}`));
      out.push("Make your own sentence with the word:");
      r.sentences.forEach((s, j) => out.push(`  ${no()} (sentence ${j + 1}) ${s.en} (${s.uz}) → ${val(a?.sentences[j])}`));
      out.push("");
    });
  } else {
    const a = answers.review;
    out.push("Make your own sentence with the word:");
    lesson.review.sentences.forEach((s, j) => out.push(`  ${no()} (sentence ${j + 1}) ${s.en} (${s.uz}) → ${val(a?.sentences[j])}`));
    if (lesson.review.writing) {
      out.push("", `${no()} Writing task: ${lesson.review.writing}`, val(a?.writing));
    }
    out.push("");
  }
  if (lesson.speaking) {
    out.push(`SPEAKING TOPIC "${lesson.speaking.title}" — make your own sentence with the topic word:`);
    lesson.speaking.sentenceWords.forEach((s, j) =>
      out.push(`  ${no()} (sentence ${j + 1}) ${s.en} (${s.uz}) → ${val(answers.speaking?.sentences[j])}`),
    );
  }
  return out.join("\n").trim();
}

/** AI uchun ko'rsatma va mezonlar (yozma qism). */
export function writtenTaskForAi(lesson: Lesson): { instructions: string; rubric: string; maxScore: number } {
  const max = lessonWeights(lesson).written;
  if (lesson.kind === "multilevel") return { maxScore: 0, instructions: "", rubric: "" };
  const topic = lesson.speaking ? " Also own sentences with the day's speaking-topic words." : "";
  if (lesson.kind === "reading") {
    const half = Math.round(max / 2);
    return {
      maxScore: max,
      instructions:
        "Beginner (A1) daily homework, written part only. For each reading the student (1) translated English sentences from the text into Uzbek and (2) wrote their own English sentence with each given word." +
        topic,
      rubric: `Total ${max} points. Translations into Uzbek: ${half} points — meaning is correct and complete (small wording differences are fine). Own sentences (all of them): ${max - half} points — the given word is used correctly, the sentence is grammatically acceptable for A1 and makes sense. Missing answers get 0 for that item. Be encouraging; this is a beginner. Be FAIR with translations: any Uzbek translation that keeps the meaning is correct (synonyms, different word order, informal spelling like "turubdi"/"turibdi", missing/extra "mening" are fine). Do not mark a correct answer as a mistake.`,
    };
  }
  if (lesson.review.writing) {
    const s = Math.round(max * 0.375);
    return {
      maxScore: max,
      instructions: "Beginner (A1) final test, written part: own sentences with given words and a short writing task." + topic,
      rubric: `Total ${max} points. Own sentences: ${s} points (correct use of the word, A1 grammar). Writing task: ${max - s} points (task completed, 8–10 sentences, A1 grammar and vocabulary, clear meaning).`,
    };
  }
  return {
    maxScore: max,
    instructions: "Beginner (A1) review homework, written part: own English sentences with given words." + topic,
    rubric: `Total ${max} points, shared equally between the sentences: the given word is used correctly, the sentence is grammatically acceptable for A1 and makes sense. Missing answers get 0.`,
  };
}

/** AI uchun speaking tekshiruvi ko'rsatmasi. */
export function speakingTaskForAi(lesson: Lesson, clips: number): { instructions: string; rubric: string; maxScore: number } {
  const s = lesson.speaking!;
  const max = lessonWeights(lesson).speakingAi;
  return {
    maxScore: max,
    instructions: [
      `Beginner (A1) speaking homework. Topic: "${s.title}". Grammar focus: ${s.grammar}.`,
      `Questions the student answers: ${s.questions.map((q, i) => `${i + 1}) ${q}`).join(" ")}`,
      `Topic words: ${s.vocab.map((v) => v.en).join(", ")}.`,
      `Each recording must be at least ${s.minSeconds} seconds of the student's own English speech on the topic.`,
      `${clips} randomly chosen recording(s) are attached. Listen to all of them.`,
      'In "mistakes", "original" is what the student SAID (write it down as you heard it) and "correction" is the corrected English.',
    ].join("\n"),
    rubric: [
      `Total ${max} points for the attached recordings together: relevance — the student answers the questions about THEMSELVES (3), fluency and enough real speech (3), grammar and topic vocabulary at A1 level (2), pronunciation and clarity (2).`,
      "Be strict about authenticity first: each recording must be ONE learner speaking in their own voice about themselves. Give 0 for a recording that is silence, noise or music; a conversation between two or more people; a video, film, song, synthetic/text-to-speech voice or any recording of someone else; not English; or clearly off-topic. Say so plainly in the summary.",
      "Only after that, judge the language kindly — this is a beginner.",
    ].join(" "),
  };
}
