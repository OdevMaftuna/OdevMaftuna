// 14. PAST CONTINUOUS — o'tmishda ma'lum paytda davom etayotgan ish.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { CONT as VERBS, SUBJ, WAS, lower, uw } from "./verbs.mjs";

const AT = ["at 8 o’clock yesterday", "at this time yesterday", "at 5 pm last Sunday", "all evening yesterday", "at noon yesterday"];
// Qisqa, to'satdan bo'lgan ish (Past Simple)
const EVENTS = [
  ["the phone rang", "telefon jiringladi"], ["my mum came home", "onam uyga keldi"], ["it started to rain", "yomg‘ir yog‘a boshladi"], ["the lights went out", "chiroq o‘chib qoldi"],
  ["I saw a big dog", "katta itni ko‘rdim"], ["the teacher came in", "o‘qituvchi kirdi"], ["my friend called me", "do‘stim qo‘ng‘iroq qildi"], ["the bus arrived", "avtobus keldi"],
  ["somebody knocked at the door", "kimdir eshik taqillatdi"], ["I heard a strange noise", "g‘alati ovoz eshitdim"],
];
const PARTS = [
  "A. was yoki were?",
  "B. Past Continuous yoki Past Simple?",
  "C. Inkor va so‘roq · wasn’t / weren’t, Was / Were …?",
  "D. when yoki while?",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1414);
  const pool = [];

  // A. was / were
  for (const v of VERBS) {
    for (const s of shuffle(SUBJ, r).slice(0, 2)) {
      const w = WAS(s[2]);
      const at = pick(AT, r);
      pool.push(mc(0, `${s[0]} ___ ${v.ing} ${v.o} ${at}.`, w, uw(w, [
        [w === "was" ? "were" : "was", w === "was" ? `${s[0]} — I / he / she / it → was.` : `${s[0]} — you / we / they → were.`],
        [s[2] === 0 ? "am" : s[2] === 1 ? "is" : "are", `“${at}” — o‘tgan zamon → was / were.`],
        ["did", "did + -ing bo‘lmaydi; Past Continuous: was / were + -ing."],
      ]), `Past Continuous: ${s[0]} ${w} + ${v.ing}.`));
    }
  }

  // B. Davomli (fon) + qisqa voqea
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const [e] = pick(EVENTS, r);
    const right = `${WAS(s[2])} ${v.ing}`;
    pool.push(mc(1, `${s[0]} ___ ${v.o} when ${e}.`, right, uw(right, [
      [v.p, "Uzoq davom etayotgan ish (fon) → was / were + -ing; qisqa voqea (when …) → Past Simple."],
      [`${s[2] === 0 ? "am" : s[2] === 1 ? "is" : "are"} ${v.ing}`, "Bu o‘tgan zamon — was / were."],
      [`${WAS(s[2]) === "was" ? "were" : "was"} ${v.ing}`, `${s[0]} bilan ${WAS(s[2])}.`],
      [`${WAS(s[2])} ${v.b}`, "was / were + -ing."],
    ]), `Fon ish → Past Continuous (${right}), to‘satdan voqea → Past Simple.`));
  }
  const EV2 = [
    ["the phone ___", "rang", "ring", "ringing"], ["my mum ___ home", "came", "come", "coming"], ["it ___ to rain", "started", "starts", "starting"],
    ["the lights ___ out", "went", "go", "going"], ["I ___ a big dog", "saw", "see", "seeing"], ["the teacher ___ in", "came", "comes", "coming"],
    ["my friend ___ me", "called", "calls", "calling"], ["the bus ___", "arrived", "arrives", "arriving"], ["I ___ a strange noise", "heard", "hear", "hearing"],
  ];
  for (const v of shuffle(VERBS, r).slice(0, 30)) {
    const s = pick(SUBJ, r);
    const [frame, past, base, ing] = pick(EV2, r);
    pool.push(mc(1, `While ${s[0] === "I" ? "I" : lower(s[0])} ${WAS(s[2])} ${v.ing} ${v.o}, ${frame}.`, past, uw(past, [
      [`${frame.startsWith("the lights") ? "were" : "was"} ${ing}`, "Qisqa, to‘satdan bo‘lgan ish → Past Simple."], [base, "O‘tgan zamon kerak."], [`${frame.startsWith("I ") ? "am" : "is"} ${ing}`, "O‘tgan zamon kerak."],
    ]), `while + davomli ish, to‘satdan voqea → Past Simple: ${past}.`));
  }

  // C. Inkor va so'roq
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const right = `${s[2] === 2 ? "weren’t" : "wasn’t"} ${v.ing}`;
    pool.push(mc(2, `${s[0]} ___ ${v.o} ${pick(AT, r)}. (−)`, right, uw(right, [
      [`didn’t ${v.ing}`, "Past Continuous inkori: wasn’t / weren’t + -ing."], [`${s[2] === 2 ? "wasn’t" : "weren’t"} ${v.ing}`, `${s[0]} bilan ${s[2] === 2 ? "weren’t" : "wasn’t"}.`],
      [`${s[2] === 2 ? "weren’t" : "wasn’t"} ${v.b}`, "wasn’t / weren’t + -ing."], [`didn’t ${v.b}`, "Bu Past Simple inkori; vaqt nuqtasi berilgan → Past Continuous."],
    ]), `Inkor: ${right}.`));
    const s2 = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const W = cap(WAS(s2[2]));
    pool.push(mc(2, `___ ${lower(s2[0])} ${v.ing} ${v.o} ${pick(AT, r)}?`, W, uw(W, [
      [W === "Was" ? "Were" : "Was", `${lower(s2[0])} bilan ${W}.`], ["Did", "-ing bilan Did ishlatilmaydi → Was / Were."], [s2[2] === 2 ? "Are" : "Is", "O‘tgan zamon → Was / Were."],
    ]), `So‘roq: ${W} + ega + -ing?`));
  }
  const SA = [
    ["Were you sleeping at 10 pm? — Yes, I ___ .", "was", [["were", "I bilan was."], ["did", "Were savoliga was / wasn’t bilan."], ["am", "O‘tgan zamon."]]],
    ["Was Ali reading? — No, he ___ .", "wasn’t", [["weren’t", "he bilan wasn’t."], ["didn’t", "Was savoliga wasn’t bilan."], ["isn’t", "O‘tgan zamon."]]],
    ["Were they playing? — Yes, they ___ .", "were", [["was", "they bilan were."], ["did", "Were savoliga were bilan."], ["are", "O‘tgan zamon."]]],
    ["Was your mum cooking? — Yes, she ___ .", "was", [["were", "she bilan was."], ["did", "Was savoliga was bilan."], ["is", "O‘tgan zamon."]]],
    ["Were you and Ali swimming? — No, we ___ .", "weren’t", [["wasn’t", "we bilan weren’t."], ["didn’t", "Were savoliga weren’t bilan."], ["aren’t", "O‘tgan zamon."]]],
  ];
  for (const [q, a, ws] of SA) pool.push(mc(2, q, a, ws, `Qisqa javob: ${a}.`));

  // D. when / while
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const [e] = pick(EVENTS, r);
    pool.push(mc(3, `___ ${s[0] === "I" ? "I" : lower(s[0])} ${WAS(s[2])} ${v.ing} ${v.o}, ${e}.`, "While", uw("While", [
      ["During", "during + ot (during the lesson); gap oldidan emas."], ["For", "for — muddat (for two hours)."], ["Ago", "ago — “oldin” (two days ago), gap boshida kelmaydi."],
    ]), "while + davomli ish (… was / were -ing)."));
    pool.push(mc(3, `${s[0]} ${WAS(s[2])} ${v.ing} ${v.o} ___ ${e}.`, "when", uw("when", [
      ["while", "Qisqa, to‘satdan voqea (Past Simple) oldidan when ishlatiladi."], ["during", "during + ot, gap emas."], ["since", "since — …dan beri (Present Perfect bilan)."],
    ]), "when + qisqa voqea (Past Simple)."));
  }

  // E. To'g'ri gap
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const [e] = pick(EVENTS, r);
    const right = `${s[0]} ${WAS(s[2])} ${v.ing} ${v.o} when ${e}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`${s[0]} ${WAS(s[2]) === "was" ? "were" : "was"} ${v.ing} ${v.o} when ${e}.`, `${s[0]} bilan ${WAS(s[2])}.`],
      [`${s[0]} ${WAS(s[2])} ${v.b} ${v.o} when ${e}.`, "was / were + -ing."],
      [`${s[0]} ${WAS(s[2])} ${v.ing} ${v.o} while ${e}.`, "Qisqa voqea oldidan when."],
      [`${s[0]} did ${v.ing} ${v.o} when ${e}.`, "did + -ing bo‘lmaydi."],
    ]), `Past Continuous + when + Past Simple.`));
  }

  return {
    code: "KG14",
    unit: 14,
    title: "14. Past Continuous Tense",
    title_uz: "O‘tgan davomli zamon · 200 ta test",
    seed: 14014,
    parts: PARTS,
    quotas: [[0, 50], [1, 40], [2, 40], [3, 40], [4, 30]],
    pool,
    intro: {
      what: "Past Continuous — o‘tmishda ma’lum bir paytda davom etayotgan ish: At 8 o’clock yesterday I was having dinner.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Past Continuous: form",
          name_uz: "Tuzilishi",
          summary: "was / were + fe’l-ing. I / he / she / it → was; you / we / they → were.",
          usage: [
            { text: "O‘tmishdagi aniq bir paytda davom etayotgan ish.", example: { en: "At 7 pm I was doing my homework.", uz: "Kechqurun soat 7 da uy vazifamni qilayotgan edim." } },
            { text: "Bir paytda davom etgan ikki ish (while).", example: { en: "Mum was cooking while Dad was reading.", uz: "Onam ovqat pishirayotgan edi, dadam esa o‘qiyotgan edi." } },
          ],
          structure: [
            { type: "+", formula: "I / he / she / it + was + verb-ing", example: { en: "She was sleeping.", uz: "U uxlayotgan edi." } },
            { type: "+", formula: "you / we / they + were + verb-ing", example: { en: "They were playing.", uz: "Ular o‘ynayotgan edi." } },
            { type: "-", formula: "wasn’t / weren’t + verb-ing", example: { en: "I wasn’t watching TV.", uz: "Men televizor ko‘rayotgan emasdim." } },
            { type: "?", formula: "Was / Were + subject + verb-ing?", example: { en: "Were you listening?", uz: "Tinglayotgan edingmi?" } },
          ],
          signals: [
            { en: "at 8 o’clock yesterday", uz: "kecha soat 8 da" },
            { en: "at this time yesterday", uz: "kecha shu paytda" },
            { en: "all evening", uz: "butun kechqurun" },
            { en: "while", uz: "…ayotganda" },
          ],
          tip: "“I were”, “they was” — XATO. I was, they were.",
        },
        {
          name: "Past Continuous + Past Simple",
          name_uz: "when va while",
          summary: "Uzoq davom etgan ish (fon) — Past Continuous; uni bo‘lgan qisqa voqea — Past Simple. when + qisqa voqea; while + davomli ish.",
          usage: [
            { text: "Davomli ish + to‘satdan voqea.", example: { en: "I was reading when the phone rang.", uz: "Telefon jiringlaganda men o‘qiyotgan edim." } },
            { text: "while + davomli ish.", example: { en: "While we were walking, it started to rain.", uz: "Biz sayr qilayotganimizda yomg‘ir yog‘a boshladi." } },
          ],
          structure: [
            { type: "+", formula: "Past Continuous + when + Past Simple", example: { en: "She was cooking when I came.", uz: "Men kelganimda u ovqat pishirayotgan edi." } },
            { type: "+", formula: "While + Past Continuous, Past Simple", example: { en: "While I was sleeping, the cat ate my fish.", uz: "Men uxlayotganimda mushuk baliqni yeb qo‘ydi." } },
          ],
          signals: [],
          tip: "Qisqa voqea (rang, came, saw) — doim Past Simple’da.",
        },
      ],
      mistakes: [
        { wrong: "I were watching TV.", right: "I was watching TV.", why: "I → was." },
        { wrong: "They was playing.", right: "They were playing.", why: "they → were." },
        { wrong: "I was read a book.", right: "I was reading a book.", why: "was + -ing." },
        { wrong: "Did you sleeping?", right: "Were you sleeping?", why: "So‘roq — Was / Were." },
        { wrong: "I was cooking while the phone rang.", right: "I was cooking when the phone rang.", why: "Qisqa voqea → when." },
      ],
    },
  };
}
