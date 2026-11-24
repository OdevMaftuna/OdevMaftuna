// 15. THERE IS / THERE ARE / THERE WAS / THERE WERE. SOME, ANY, NO.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// [birlik (a/an bilan), ko'plik, o'zbekcha]
const N = [
  ["a cat", "cats", "mushuk"], ["an apple", "apples", "olma"], ["a book", "books", "kitob"], ["a chair", "chairs", "stul"], ["a picture", "pictures", "rasm"],
  ["a bird", "birds", "qush"], ["an egg", "eggs", "tuxum"], ["a computer", "computers", "kompyuter"], ["a ball", "balls", "to‘p"], ["a lamp", "lamps", "chiroq"],
  ["a boy", "boys", "bola"], ["a tree", "trees", "daraxt"], ["a car", "cars", "mashina"], ["an orange", "oranges", "apelsin"], ["a pen", "pens", "ruchka"],
  ["a dog", "dogs", "it"], ["a cup", "cups", "piyola"], ["a window", "windows", "deraza"], ["a flower", "flowers", "gul"], ["a student", "students", "o‘quvchi"],
];
const U = [["milk", "sut"], ["water", "suv"], ["bread", "non"], ["juice", "sharbat"], ["cheese", "pishloq"], ["sugar", "shakar"], ["rice", "guruch"], ["money", "pul"], ["tea", "choy"], ["butter", "sariyog‘"]];
const PLACES = ["on the table", "in the room", "in the garden", "in the box", "near the school", "in the kitchen", "in our street", "in the park"];
const PAST = ["yesterday", "last year", "two days ago", "last night", "in the past"];
const PARTS = [
  "A. There is yoki There are?",
  "B. There was yoki There were?",
  "C. some yoki any?",
  "D. no / any · Inkor va so‘roq",
  "E. Savol va qisqa javob · Is there …? Are there …?",
];

export function build() {
  const r = rng(1515);
  const pool = [];

  // A
  for (const [sg, pl, uz] of N) {
    const p = pick(PLACES, r);
    pool.push(mc(0, `There ___ ${sg} ${p}.`, "is", uw("is", [["are", `“${sg}” — birlik → There is.`], ["am", "There am — bunday shakl yo‘q."], ["be", "There is / are."]]), `Birlik (${sg}) → There is.`));
    const n = pick(["two", "three", "five", "a lot of", "many", "some"], r);
    pool.push(mc(0, `There ___ ${n} ${pl} ${pick(PLACES, r)}.`, "are", uw("are", [["is", `“${n} ${pl}” — ko‘plik → There are.`], ["am", "There am — bunday shakl yo‘q."], ["be", "There is / are."]]), `Ko‘plik (${pl}) → There are.`));
  }
  for (const [u, uz] of U) {
    pool.push(mc(0, `There ___ some ${u} ${pick(["on the table", "in the kitchen", "in the box", "in the room"], r)}.`, "is", uw("is", [["are", `“${u}” (${uz}) sanalmaydi → There is.`], ["am", "Bunday shakl yo‘q."], ["be", "There is."]]), "Sanalmaydigan ot → There is."));
  }

  // B
  for (const [sg, pl] of N) {
    const t = pick(PAST, r);
    pool.push(mc(1, `There ___ ${sg} ${pick(PLACES, r)} ${t}.`, "was", uw("was", [["were", `Birlik → There was.`], ["is", `“${t}” — o‘tgan zamon → was.`], ["are", "O‘tgan zamon, birlik → was."]]), `O‘tgan zamon + birlik → There was.`));
    pool.push(mc(1, `There ___ a lot of ${pl} ${pick(PLACES, r)} ${pick(PAST, r)}.`, "were", uw("were", [["was", "Ko‘plik → There were."], ["are", "O‘tgan zamon → were."], ["is", "O‘tgan zamon, ko‘plik → were."]]), `O‘tgan zamon + ko‘plik → There were.`));
  }
  for (const [u] of U) pool.push(mc(1, `There ___ a lot of ${u} here ${pick(PAST, r)}.`, "was", uw("was", [["were", `“${u}” sanalmaydi → was.`], ["is", "O‘tgan zamon → was."], ["are", "O‘tgan zamon, sanalmaydigan → was."]]), "Sanalmaydigan + o‘tgan zamon → There was."));

  // C. some / any
  for (const [, pl, uz] of N) {
    pool.push(mc(2, `There are ___ ${pl} ${pick(PLACES, r)}.`, "some", uw("some", [["any", "Darak gapda → some."], ["a", `“${pl}” ko‘plikda — a ishlatilmaydi.`], ["an", "an — birlik, unli bilan boshlangan so‘z oldidan."]]), "Darak gap → some."));
    pool.push(mc(2, `There aren’t ___ ${pl} ${pick(PLACES, r)}.`, "any", uw("any", [["some", "Inkor gapda → any."], ["a", "Ko‘plik oldidan a kelmaydi."], ["no", "aren’t + no — ikki inkor bo‘lib qoladi."]]), "Inkor gap → any."));
    pool.push(mc(2, `Are there ___ ${pl} ${pick(PLACES, r)}?`, "any", uw("any", [["some", "So‘roq gapda → any."], ["a", "Ko‘plik oldidan a kelmaydi."], ["no", "So‘roqda → any."]]), "So‘roq gap → any."));
  }
  for (const [u, uz] of U) {
    pool.push(mc(2, `Is there ___ ${u} ${pick(["in the fridge", "in the bottle", "in the kitchen"], r)}?`, "any", uw("any", [["some", "So‘roq → any."], ["a", `“${u}” (${uz}) sanalmaydi — a ishlatilmaydi.`], ["many", "many — sanaladigan otlar bilan."]]), "So‘roq gap → any."));
    pool.push(mc(2, `I’d like ___ ${u}, please.`, "some", uw("some", [["any", "Iltimos / taklif (I’d like, Would you like) → some."], ["a", `“${u}” sanalmaydi.`], ["many", "many — sanaladigan otlar bilan."]]), "I’d like … / Would you like …? → some."));
  }

  // D. no = not any
  for (const [, pl] of N) {
    pool.push(mc(3, `There are ___ ${pl} ${pick(PLACES, r)}. (= There aren’t any.)`, "no", uw("no", [["any", "“are” inkor emas — any bilan bo‘lmaydi. are + no = aren’t + any."], ["some", "Ma’no inkor: “yo‘q” → no."], ["not", "not + ot bu yerda ishlatilmaydi; → no."]]), "There are no … = There aren’t any …"));
    pool.push(mc(3, `There aren’t ___ ${pl} ${pick(PLACES, r)}. (= There are no ${pl}.)`, "any", uw("any", [["no", "aren’t allaqachon inkor — ikkinchi inkor (no) kerak emas."], ["some", "Inkor → any."], ["a", "Ko‘plik oldidan a kelmaydi."]]), "aren’t + any."));
  }
  for (const [u] of U) pool.push(mc(3, `There is ___ ${u} in the fridge. (yo‘q)`, "no", uw("no", [["any", "is (inkor emas) + any bo‘lmaydi → no."], ["some", "Ma’no “yo‘q” → no."], ["not", "is no = isn’t any."]]), "There is no … = There isn’t any …"));

  // E. Savol + qisqa javob
  for (const [sg, pl] of N) {
    pool.push(mc(4, `___ ${sg} ${pick(PLACES, r)}? — Yes, there is.`, "Is there", uw("Is there", [["Are there", `Birlik (${sg}) → Is there?`], ["There is", "So‘roqda is oldinga chiqadi: Is there?"], ["Is it", "“Bor mi?” → Is there?"]]), "Birlik so‘roq → Is there …?"));
    pool.push(mc(4, `Are there any ${pl} ${pick(PLACES, r)}? — No, ___ .`, "there aren’t", uw("there aren’t", [["there isn’t", "Ko‘plik → there aren’t."], ["they aren’t", "Javob ham “there” bilan: No, there aren’t."], ["there are", "Inkor javob → there aren’t."]]), "Qisqa javob: No, there aren’t."));
    pool.push(mc(4, `Was there ${sg} ${pick(PLACES, r)}? — Yes, ___ .`, "there was", uw("there was", [["there were", "Birlik → there was."], ["it was", "Javob “there” bilan."], ["there is", "O‘tgan zamon → was."]]), "Qisqa javob: Yes, there was."));
  }

  return {
    code: "KG15",
    unit: 15,
    title: "15. There is / There are / There was / There were. Some, any, no",
    title_uz: "Bor / bor edi, some, any, no · 200 ta test",
    seed: 15015,
    parts: PARTS,
    quotas: [[0, 45], [1, 35], [2, 45], [3, 35], [4, 40]],
    pool,
    intro: {
      what: "There is / There are — biror joyda nimadir “bor” deyish uchun. O‘tgan zamonda — There was / There were. some, any, no — miqdor.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "There is / There are",
          name_uz: "…da … bor",
          summary: "Birlik va sanalmaydigan ot → There is. Ko‘plik → There are. O‘tgan zamonda: was / were.",
          usage: [
            { text: "Birlik.", example: { en: "There is a cat on the sofa.", uz: "Divanda mushuk bor." } },
            { text: "Ko‘plik.", example: { en: "There are three books in my bag.", uz: "Sumkamda uchta kitob bor." } },
            { text: "O‘tgan zamon.", example: { en: "There were a lot of people at the party.", uz: "Bazmda ko‘p odam bor edi." } },
          ],
          structure: [
            { type: "+", formula: "There is / was + singular / uncountable", example: { en: "There is some milk.", uz: "Ozgina sut bor." } },
            { type: "+", formula: "There are / were + plural", example: { en: "There were two dogs.", uz: "Ikkita it bor edi." } },
            { type: "-", formula: "There isn’t / aren’t …", example: { en: "There aren’t any chairs.", uz: "Stul yo‘q." } },
            { type: "?", formula: "Is there …? / Are there …?", example: { en: "Is there a bank near here?", uz: "Yaqinda bank bormi?" } },
            { type: "short", formula: "Yes, there is. / No, there aren’t.", example: { en: "Are there any eggs? — No, there aren’t.", uz: "Tuxum bormi? — Yo‘q." } },
          ],
          signals: [],
          tip: "There is two cats — XATO. Ko‘plik → There are two cats.",
        },
        {
          name: "some, any, no",
          name_uz: "Biroz, hech, yo‘q",
          summary: "some — darak gapda; any — inkor va so‘roqda; no = not any (fe’l inkor bo‘lmaydi).",
          usage: [
            { text: "some — darak gap, iltimos va taklif.", example: { en: "Would you like some tea?", uz: "Choy ichasizmi?" } },
            { text: "any — inkor va so‘roq.", example: { en: "Have you got any brothers?", uz: "Aka-ukang bormi?" } },
            { text: "no — “yo‘q” (fe’l darak shaklida qoladi).", example: { en: "There is no milk.", uz: "Sut yo‘q." } },
          ],
          structure: [
            { type: "-", formula: "There aren’t any … = There are no …", example: { en: "There are no shops here.", uz: "Bu yerda do‘kon yo‘q." } },
          ],
          signals: [],
          tip: "“There aren’t no” — XATO (ikki inkor). aren’t any yoki are no.",
        },
      ],
      mistakes: [
        { wrong: "There is many people.", right: "There are many people.", why: "Ko‘plik → are." },
        { wrong: "There was a lot of cars.", right: "There were a lot of cars.", why: "cars — ko‘plik." },
        { wrong: "There aren’t some apples.", right: "There aren’t any apples.", why: "Inkor → any." },
        { wrong: "There isn’t no water.", right: "There isn’t any water. / There is no water.", why: "Ikki inkor bo‘lmaydi." },
        { wrong: "Is there any apples?", right: "Are there any apples?", why: "Ko‘plik → Are there." },
      ],
    },
  };
}
