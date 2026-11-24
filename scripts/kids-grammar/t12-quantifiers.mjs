// 12. QUANTIFIERS — a lot of, much, many, (a) little, (a) few.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// Sanaladigan (ko'plikda) [ot, o'zbekcha]
const C = [
  ["apples", "olmalar"], ["books", "kitoblar"], ["friends", "do‘stlar"], ["students", "o‘quvchilar"], ["eggs", "tuxumlar"], ["cars", "mashinalar"],
  ["toys", "o‘yinchoqlar"], ["pencils", "qalamlar"], ["chairs", "stullar"], ["birds", "qushlar"], ["children", "bolalar"], ["people", "odamlar"],
  ["cups", "piyolalar"], ["bananas", "bananlar"], ["questions", "savollar"], ["pictures", "rasmlar"], ["tomatoes", "pomidorlar"], ["trees", "daraxtlar"],
  ["houses", "uylar"], ["sweets", "konfetlar"],
];
// Sanalmaydigan [ot, o'zbekcha]
const U = [
  ["water", "suv"], ["milk", "sut"], ["money", "pul"], ["time", "vaqt"], ["sugar", "shakar"], ["bread", "non"], ["juice", "sharbat"],
  ["homework", "uy vazifasi"], ["rice", "guruch"], ["information", "ma’lumot"], ["cheese", "pishloq"], ["tea", "choy"], ["snow", "qor"],
  ["salt", "tuz"], ["butter", "sariyog‘"], ["furniture", "mebel"], ["news", "yangilik"], ["advice", "maslahat"], ["meat", "go‘sht"], ["paper", "qog‘oz"],
];
const PARTS = [
  "A. much yoki many? · Questions and negatives",
  "B. a lot of · Positive sentences",
  "C. a little yoki a few?",
  "D. little / few — salbiy ma’no · (a) little or (a) few?",
  "E. How much yoki How many?",
];

export function build() {
  const r = rng(1212);
  const pool = [];

  // A. much / many (inkor va so'roq)
  const negC = ["I haven’t got ___ {n}.", "There aren’t ___ {n} in the box.", "We don’t have ___ {n}.", "She didn’t buy ___ {n}."];
  const qC = ["Are there ___ {n} in the room?", "Have you got ___ {n}?", "Did you see ___ {n} there?"];
  const negU = ["I haven’t got ___ {n}.", "There isn’t ___ {n} here.", "We don’t have ___ {n}."];
  const qU = ["Is there ___ {n} here?", "Have you got ___ {n}?", "Do you need ___ {n}?"];
  for (const [n, uz] of C) {
    for (const t of [pick(negC, r), pick(qC, r)])
      pool.push(mc(0, t.replace("{n}", n), "many", uw("many", [
        ["much", `“${n}” (${uz}) — sanaladigan, ko‘plikda → many.`], ["a little", "a little — sanalmaydigan otlar bilan."], ["little", "little — sanalmaydigan otlar bilan."],
      ]), `Sanaladigan ot (${n}) + inkor / so‘roq → many.`));
  }
  for (const [n, uz] of U) {
    for (const t of [pick(negU, r), pick(qU, r)])
      pool.push(mc(0, t.replace("{n}", n), "much", uw("much", [
        ["many", `“${n}” (${uz}) — sanalmaydi → much.`], ["a few", "a few — sanaladigan otlar bilan."], ["few", "few — sanaladigan otlar bilan."],
      ]), `Sanalmaydigan ot (${n}) + inkor / so‘roq → much.`));
  }

  // B. a lot of (darak gap)
  const pos = ["We have ___ {n} at home.", "There are ___ {n} in our town.", "My grandma bought ___ {n}.", "I saw ___ {n} at the market."];
  const posU = ["We have ___ {n} at home.", "There is ___ {n} here.", "She has got ___ {n}."];
  for (const [n, uz] of C) {
    const t = pick(pos, r);
    pool.push(mc(1, t.replace("{n}", n), "a lot of", uw("a lot of", [
      ["much", "much darak gapda deyarli ishlatilmaydi va sanaladigan ot bilan kelmaydi."], ["a little", `a little — sanalmaydigan otlar bilan; “${n}” sanaladi.`], ["a lot", "Ot oldidan “a lot OF” bo‘ladi."],
    ]), `Darak gapda ko‘p miqdor → a lot of + ${n}.`));
  }
  for (const [n, uz] of U) {
    const t = n === "news" || n === "furniture" || n === "information" || n === "advice" ? "We got ___ {n} yesterday." : pick(posU, r);
    pool.push(mc(1, t.replace("{n}", n), "a lot of", uw("a lot of", [
      ["many", `“${n}” (${uz}) sanalmaydi — many bo‘lmaydi.`], ["a few", "a few — sanaladigan otlar bilan."], ["a lot", "Ot oldidan “a lot OF” bo‘ladi."],
    ]), `Darak gapda → a lot of (sanaladigan ham, sanalmaydigan ham).`));
  }

  // C. a little / a few
  for (const [n, uz] of C) {
    const t = pick(["I have got ___ {n}.", "There are ___ {n} in the bag.", "Can I have ___ {n}, please?", "We need ___ {n}."], r);
    pool.push(mc(2, t.replace("{n}", n), "a few", uw("a few", [
      ["a little", `“${n}” (${uz}) sanaladi → a few.`], ["much", "much — sanalmaydigan otlar bilan."], ["a lot", "“a lot of” bo‘lishi kerak edi; bu yerda “bir nechta” ma’nosi → a few."],
    ]), `Sanaladigan ot + “bir nechta” → a few ${n}.`));
  }
  for (const [n, uz] of U) {
    const t = pick(["I need ___ {n}.", "There is ___ {n} left.", "We have got ___ {n}."], r);
    pool.push(mc(2, t.replace("{n}", n), "a little", uw("a little", [
      ["a few", `“${n}” (${uz}) sanalmaydi → a little.`], ["many", "many — sanaladigan otlar bilan."], ["a lot", "Ot oldidan “a lot of”; bu yerda “ozgina” → a little."],
    ]), `Sanalmaydigan ot + “ozgina” → a little ${n}.`));
  }

  // D. few / little (salbiy) yoki a few / a little (ijobiy)
  for (const [n, uz] of C) {
    pool.push(mc(3, `He is sad. He has very ___ ${n}. (deyarli yo‘q)`, "few", uw("few", [
      ["a few", "a few — “bir nechta bor” (ijobiy). Bu yerda “deyarli yo‘q” → few."], ["little", `“${n}” sanaladi → few.`], ["much", "much — sanalmaydigan otlar bilan."],
    ]), "few = deyarli yo‘q (salbiy ma’no), sanaladigan ot bilan."));
    pool.push(mc(3, `Don’t worry, I have ___ ${n}. (bir nechta bor)`, "a few", uw("a few", [
      ["few", "few — “deyarli yo‘q” (salbiy). Bu yerda “bir nechta bor” → a few."], ["a little", `“${n}” sanaladi → a few.`], ["much", "much — sanalmaydigan otlar bilan."],
    ]), "a few = bir nechta bor (ijobiy ma’no)."));
  }
  for (const [n, uz] of U.filter((x) => !["furniture", "news", "advice", "information"].includes(x[0]))) {
    pool.push(mc(3, `Hurry up! There is very ___ ${n} left. (deyarli qolmadi)`, "little", uw("little", [
      ["a little", "a little — “ozgina bor” (ijobiy). Bu yerda “deyarli yo‘q” → little."], ["few", `“${n}” sanalmaydi → little.`], ["many", "many — sanaladigan otlar bilan."],
    ]), "little = deyarli yo‘q (salbiy), sanalmaydigan ot bilan."));
    pool.push(mc(3, `It’s OK, we still have ___ ${n}. (ozgina bor)`, "a little", uw("a little", [
      ["little", "little — “deyarli yo‘q”. Bu yerda “ozgina bor” → a little."], ["a few", `“${n}” sanalmaydi → a little.`], ["many", "many — sanaladigan otlar bilan."],
    ]), "a little = ozgina bor (ijobiy ma’no)."));
  }

  // E. How much / How many
  for (const [n, uz] of C) {
    const t = pick(["___ {n} are there?", "___ {n} have you got?", "___ {n} did you buy?"], r);
    pool.push(mc(4, t.replace("{n}", n), "How many", uw("How many", [
      ["How much", `“${n}” (${uz}) sanaladi → How many.`], ["How long", "How long — davomiylik (qancha vaqt)."], ["How often", "How often — qanchalik tez-tez."],
    ]), `Sanaladigan ot → How many ${n}?`));
  }
  for (const [n, uz] of U) {
    const t = pick(["___ {n} is there?", "___ {n} have you got?", "___ {n} do you need?"], r);
    pool.push(mc(4, t.replace("{n}", n), "How much", uw("How much", [
      ["How many", `“${n}” (${uz}) sanalmaydi → How much.`], ["How long", "How long — davomiylik."], ["How old", "How old — yosh."],
    ]), `Sanalmaydigan ot → How much ${n}?`));
  }
  for (const [q, a] of [["___ is this T-shirt? — It’s 50,000 so‘m.", "How much"], ["___ does the book cost? — 20,000 so‘m.", "How much"], ["___ is the ticket? — It’s 5 dollars.", "How much"]])
    pool.push(mc(4, q, a, uw(a, [["How many", "Narx so‘ralganda → How much."], ["How long", "How long — vaqt."], ["How old", "How old — yosh."]]), "Narx → How much?"));

  return {
    code: "KG12",
    unit: 12,
    title: "12. Quantifiers: a lot of, much, many, (a) little, (a) few",
    title_uz: "Miqdor so‘zlari · 200 ta test",
    seed: 12012,
    parts: PARTS,
    quotas: [[0, 50], [1, 35], [2, 35], [3, 45], [4, 35]],
    pool,
    intro: {
      what: "Miqdorni bildiruvchi so‘zlar: qaysi biri sanaladigan otlar bilan, qaysi biri sanalmaydiganlar bilan ishlatiladi.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "much, many, a lot of",
          name_uz: "Ko‘p",
          summary: "many — sanaladigan (books, apples); much — sanalmaydigan (water, money). Ikkalasi asosan inkor va so‘roqda. Darak gapda — a lot of (ikkalasi bilan ham).",
          usage: [
            { text: "many + sanaladigan ot (inkor / so‘roq).", example: { en: "There aren’t many students here.", uz: "Bu yerda o‘quvchilar ko‘p emas." } },
            { text: "much + sanalmaydigan ot (inkor / so‘roq).", example: { en: "Have you got much money?", uz: "Puling ko‘pmi?" } },
            { text: "a lot of — darak gapda, har ikkala ot bilan.", example: { en: "We have a lot of books and a lot of time.", uz: "Bizda ko‘p kitob va ko‘p vaqt bor." } },
          ],
          structure: [
            { type: "-", formula: "not + many + plural noun", example: { en: "I haven’t got many friends.", uz: "Mening do‘stlarim ko‘p emas." } },
            { type: "?", formula: "much + uncountable noun?", example: { en: "Is there much milk?", uz: "Sut ko‘pmi?" } },
            { type: "+", formula: "a lot of + any noun", example: { en: "She drinks a lot of water.", uz: "U ko‘p suv ichadi." } },
          ],
          signals: [
            { en: "How many …?", uz: "Nechta? (sanaladigan)" },
            { en: "How much …?", uz: "Qancha? (sanalmaydigan, narx)" },
          ],
          tip: "Sanalmaydigan otlar: water, milk, money, time, bread, homework, information, news, advice, furniture — ular ko‘plik olmaydi!",
        },
        {
          name: "a little, a few, little, few",
          name_uz: "Ozgina, bir nechta",
          summary: "a few — sanaladigan (bir nechta); a little — sanalmaydigan (ozgina). “a” siz — few / little — “deyarli yo‘q” degan salbiy ma’no beradi.",
          usage: [
            { text: "a few + sanaladigan — bir nechta (yetarli).", example: { en: "I have a few friends.", uz: "Mening bir nechta do‘stim bor." } },
            { text: "a little + sanalmaydigan — ozgina (yetarli).", example: { en: "Add a little salt.", uz: "Ozgina tuz qo‘sh." } },
            { text: "few / little — deyarli yo‘q (yetarli emas).", example: { en: "He has few friends. He is lonely.", uz: "Uning do‘sti deyarli yo‘q. U yolg‘iz." } },
          ],
          structure: [
            { type: "+", formula: "a few + plural noun / a little + uncountable noun", example: { en: "There are a few eggs and a little milk.", uz: "Bir nechta tuxum va ozgina sut bor." } },
          ],
          signals: [],
          tip: "“a” bor — ijobiy (bor), “a” yo‘q — salbiy (deyarli yo‘q).",
        },
      ],
      mistakes: [
        { wrong: "How many money have you got?", right: "How much money have you got?", why: "money sanalmaydi." },
        { wrong: "There isn’t many milk.", right: "There isn’t much milk.", why: "milk sanalmaydi." },
        { wrong: "I have a little friends.", right: "I have a few friends.", why: "friends sanaladi." },
        { wrong: "She has a lot friends.", right: "She has a lot of friends.", why: "a lot OF." },
        { wrong: "I have got many homeworks.", right: "I have got a lot of homework.", why: "homework sanalmaydi, ko‘plik olmaydi." },
      ],
    },
  };
}
