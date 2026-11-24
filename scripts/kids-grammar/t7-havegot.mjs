// 7. THE VERB "HAVE GOT" — egalik: I have got / she has got.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// [ega, olmosh]
const SUBJ = [
  ["I", "I"], ["you", "you"], ["we", "we"], ["they", "they"], ["he", "he"], ["she", "she"], ["it", "it"],
  ["my brother", "he"], ["Ali", "he"], ["my father", "he"], ["Mr Brown", "he"], ["the boy", "he"], ["my uncle", "he"],
  ["my sister", "she"], ["Malika", "she"], ["my mother", "she"], ["Mrs Smith", "she"], ["the girl", "she"], ["my aunt", "she"],
  ["the cat", "it"], ["our house", "it"], ["the elephant", "it"], ["my friends", "they"], ["the children", "they"], ["my parents", "they"],
  ["Ali and Vali", "they"], ["my brother and I", "we"], ["Laylo and I", "we"], ["you and your sister", "you"],
];
// [narsa, o'zbekcha] — kimga mos: "p" odam, "a" hayvon/narsa, "*" hammasi
const OBJ = [
  ["a new bike", "yangi velosiped", "p"], ["two sisters", "ikkita opa-singil", "p"], ["a big family", "katta oila", "p"], ["blue eyes", "ko‘k ko‘zlar", "*"],
  ["long hair", "uzun soch", "p"], ["a pet dog", "uy iti", "p"], ["many toys", "ko‘p o‘yinchoqlar", "p"], ["a cold", "shamollash", "p"], ["a lot of friends", "ko‘p do‘stlar", "p"],
  ["a red pencil case", "qizil qalamdon", "p"], ["three brothers", "uchta aka-uka", "p"], ["a computer", "kompyuter", "p"], ["a new phone", "yangi telefon", "p"],
  ["English today", "bugun ingliz tili darsi", "p"], ["a headache", "bosh og‘rig‘i", "p"], ["a beautiful garden", "chiroyli bog‘", "*"], ["a long tail", "uzun dum", "a"],
  ["four legs", "to‘rtta oyoq", "a"], ["big ears", "katta quloqlar", "a"], ["a lot of rooms", "ko‘p xonalar", "h"], ["a big window", "katta deraza", "h"],
];
const isThird = (p) => p === "he" || p === "she" || p === "it";
const HAVE = (p) => (isThird(p) ? "has" : "have");
const objFor = (s, p, r) => {
  const kind = s === "our house" ? "h" : p === "it" ? "a" : "p";
  const list = OBJ.filter((o) => o[2] === kind || (o[2] === "*" && kind !== "h"));
  return pick(list, r);
};
const reason = (s, p) => (isThird(p) ? `“${s}” — he / she / it → has got.` : `“${s}” — I / you / we / they → have got.`);

const PARTS = [
  "A. have got yoki has got?",
  "B. Inkor shakli · Negative",
  "C. So‘roq gap · Questions",
  "D. Qisqa javob · Short answers",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(707);
  const pool = [];

  for (const [s, p] of SUBJ)
    for (let k = 0; k < 3; k++) {
      const [o, ouz] = objFor(s, p, r);
      const h = HAVE(p);
      const other = h === "has" ? "have" : "has";
      // A
      pool.push(mc(0, `${cap(s)} ___ ${o}.`, `${h} got`, [[`${other} got`, reason(s, p)], ["is got", "“is got” degan shakl yo‘q — have / has got."], ["are got", "“are got” degan shakl yo‘q — have / has got."]], `${reason(s, p)} (${ouz})`));
      // B
      const neg = `${h}n’t got`;
      pool.push(mc(1, `${cap(s)} ___ ${o}. (−)`, neg, [[`${other}n’t got`, reason(s, p)], ["don’t got", "have got inkori — haven’t / hasn’t got (don’t emas)."], ["isn’t got", "“isn’t got” degan shakl yo‘q."]], `Inkor: ${h} + not + got → ${neg}.`));
      // C
      if (s !== "I")
        pool.push(mc(2, `___ ${s} got ${o}?`, cap(h), [[cap(other), reason(s, p)], ["Do", "have got bilan so‘roqda Do ishlatilmaydi — Have / Has oldinga chiqadi."], [isThird(p) ? "Does" : "Is", isThird(p) ? "have got bilan Does ishlatilmaydi." : "“Is … got” — xato."]], `So‘roq: ${cap(h)} + ${s} + got …?`));
      // E
      const right = `${cap(s)} ${h} got ${o}.`;
      pool.push(
        mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, [
          [`${cap(s)} ${other} got ${o}.`, reason(s, p)],
          [`${cap(s)} is got ${o}.`, "“is got” degan shakl yo‘q."],
          [`${cap(s)} ${h} get ${o}.`, "have got iborasida “got” bo‘ladi, “get” emas."],
        ], `${reason(s, p)}`),
      );
    }

  // D. Qisqa javob
  for (const [s, p] of SUBJ.filter((x) => !["I", "we", "you"].includes(x[0]) && x[1] !== "we")) {
    const [o] = objFor(s, p, r);
    const h = HAVE(p);
    const ap = p === "you" ? (s.includes(" and ") ? "we" : "I") : p;
    const ah = HAVE(ap);
    const q = `${cap(h)} ${s} got ${o}?`;
    {
      pool.push(
        mc(3, `${q} — Yes, ___ .`, `${ap} ${ah}`, [
          [`${ap} ${ah} got`, "Qisqa javobda “got” ishlatilmaydi: Yes, … has / have."],
          [`${ap} ${ah === "has" ? "have" : "has"}`, `${ap} bilan ${ah}.`],
          [`${ap} ${isThird(ap) ? "does" : "do"}`, "have got savoliga do / does bilan javob berilmaydi."],
        ], `Yes, ${ap} ${ah}.`),
      );
      pool.push(
        mc(3, `${q} — No, ___ .`, `${ap} ${ah}n’t`, [
          [`${ap} ${ah === "has" ? "haven’t" : "hasn’t"}`, `${ap} bilan ${ah}n’t.`],
          [`${ap} ${isThird(ap) ? "doesn’t" : "don’t"}`, "have got savoliga don’t / doesn’t bilan javob berilmaydi."],
          [`${ap} ${ah}n’t got`, "Qisqa javobda “got” ishlatilmaydi."],
        ], `No, ${ap} ${ah}n’t.`),
      );
    }
  }
  for (const [q, right, wrongs, ex] of [
    ["Have you got a pet? — Yes, ___ .", "I have", [["I have got", "Qisqa javobda got yo‘q."], ["you have", "“you” deb so‘rashsa — “I” bilan javob."], ["I has", "I bilan have."]], "Yes, I have."],
    ["Have you got a brother? — No, ___ .", "I haven’t", [["I hasn’t", "I bilan haven’t."], ["I don’t", "have got savoliga don’t bilan javob berilmaydi."], ["you haven’t", "Javobda I."]], "No, I haven’t."],
    ["Have you and Ali got bikes? — Yes, ___ .", "we have", [["we has", "we bilan have."], ["they have", "“you and Ali” → we."], ["we have got", "Qisqa javobda got yo‘q."]], "Yes, we have."],
    ["Have you got any sisters? — No, ___ .", "I haven’t", [["I haven’t got sisters", "Qisqa javob — I haven’t."], ["I hasn’t", "I bilan haven’t."], ["I amn’t", "Bunday shakl yo‘q."]], "No, I haven’t."],
  ])
    pool.push(mc(3, q, right, wrongs, ex));

  // E2. Qisqartmalar
  for (const [full, short, fakes] of [
    ["I have got", "I’ve got", ["I’s got", "Iv got", "I’ve get"]], ["she has got", "she’s got", ["she’ve got", "shes’ got", "she’s get"]], ["he has got", "he’s got", ["he’ve got", "his got", "he’s get"]],
    ["they have got", "they’ve got", ["they’s got", "their got", "theyv got"]], ["we have got", "we’ve got", ["we’s got", "were got", "weve’ got"]], ["it has got", "it’s got", ["its got", "it’ve got", "it’s get"]],
    ["has not got", "hasn’t got", ["hasnt’ got", "haven’t got", "has’nt got"]], ["have not got", "haven’t got", ["havent’ got", "hasn’t got", "have’nt got"]],
  ])
    pool.push(mc(4, `“${full}” = ?`, short, fakes.map((f) => [f, f.startsWith("has") || f.startsWith("have") ? `“${f}” — boshqa shakl yoki noto‘g‘ri yozilgan.` : `“${f}” noto‘g‘ri.`]), `${full} → ${short}.`));

  return {
    code: "KG7",
    unit: 7,
    title: "7. The Verb “Have got”",
    title_uz: "“Have got” — bor (egalik) · 200 ta test",
    seed: 7007,
    parts: PARTS,
    quotas: [[0, 50], [1, 35], [2, 35], [3, 30], [4, 50]],
    pool,
    intro: {
      what: "“have got” — “…ning … bor” degan ma’no beradi: I have got a cat — Mening mushugim bor.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "have got / has got (positive)",
          name_uz: "Darak gap",
          summary: "Egalik, oila a’zolari, tashqi ko‘rinish va kasallikni aytish uchun ishlatiladi. I, you, we, they bilan — have got; he, she, it bilan — has got.",
          usage: [
            { text: "Narsaga egalik.", example: { en: "I have got a new bike.", uz: "Mening yangi velosipedim bor." } },
            { text: "Oila a’zolari.", example: { en: "She has got two brothers.", uz: "Uning ikkita akasi bor." } },
            { text: "Tashqi ko‘rinish.", example: { en: "He has got blue eyes.", uz: "Uning ko‘zlari ko‘k." } },
            { text: "Kasallik.", example: { en: "I have got a cold.", uz: "Men shamollaganman." } },
          ],
          structure: [
            { type: "+", formula: "I / you / we / they + have got (’ve got)", example: { en: "We’ve got a big house.", uz: "Bizning katta uyimiz bor." } },
            { type: "+", formula: "he / she / it + has got (’s got)", example: { en: "The cat has got a long tail.", uz: "Mushukning uzun dumi bor." } },
          ],
          signals: [
            { en: "he, she, it, birlik ot", uz: "→ has got" },
            { en: "I, you, we, they, ko‘plik", uz: "→ have got" },
          ],
          tip: "“She’s got” — bu “She has got” (She is emas!). Gapda “got” bo‘lsa, ’s = has.",
        },
        {
          name: "Negative and questions",
          name_uz: "Inkor va so‘roq",
          summary: "Inkorda have / has dan keyin not qo‘shiladi. So‘roqda Have / Has gap boshiga chiqadi. Do / does ishlatilmaydi!",
          usage: [
            { text: "Inkor: haven’t got / hasn’t got.", example: { en: "He hasn’t got a sister.", uz: "Uning singlisi yo‘q." } },
            { text: "So‘roq: Have / Has + ega + got …?", example: { en: "Have you got a pen?", uz: "Sizda ruchka bormi?" } },
            { text: "Qisqa javobda got ishlatilmaydi.", example: { en: "Has she got a cat? — Yes, she has.", uz: "Uning mushugi bormi? — Ha." } },
          ],
          structure: [
            { type: "-", formula: "I / you / we / they + haven’t got", example: { en: "They haven’t got a car.", uz: "Ularning mashinasi yo‘q." } },
            { type: "-", formula: "he / she / it + hasn’t got", example: { en: "She hasn’t got a phone.", uz: "Uning telefoni yo‘q." } },
            { type: "?", formula: "Have / Has + subject + got …?", example: { en: "Has your brother got a bike?", uz: "Akangning velosipedi bormi?" } },
            { type: "short", formula: "Yes, I have. / No, she hasn’t.", example: { en: "Have you got a dog? — No, I haven’t.", uz: "Iting bormi? — Yo‘q." } },
          ],
          signals: [],
          tip: "“Do you have got…?” — XATO. “Have you got…?” — to‘g‘ri.",
        },
      ],
      mistakes: [
        { wrong: "She have got a cat.", right: "She has got a cat.", why: "she → has." },
        { wrong: "I has got a pen.", right: "I have got a pen.", why: "I → have." },
        { wrong: "He don’t have got a car.", right: "He hasn’t got a car.", why: "Inkor — hasn’t got." },
        { wrong: "Do you have got a pet?", right: "Have you got a pet?", why: "Do ishlatilmaydi." },
        { wrong: "Yes, I have got.", right: "Yes, I have.", why: "Qisqa javobda got yo‘q." },
      ],
    },
  };
}
