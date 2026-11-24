// 17. PRESENT PERFECT VERSUS PAST SIMPLE.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { SUBJ, VERBS, lower, uw } from "./verbs.mjs";

const HAVE = (s) => (s[1] ? "has" : "have");
const PAST_T = ["yesterday", "last week", "two days ago", "in 2019", "last summer", "an hour ago", "last night", "on Monday"];
const PERF_T = ["already", "just", "never", "ever"];
const PARTS = [
  "A. Qaysi zamon? · Present Perfect or Past Simple?",
  "B. Vaqt so‘zini tanlang · Time expressions",
  "C. So‘roq gaplar · Have you ever …? / When did …?",
  "D. Fe’lni to‘g‘ri shaklga qo‘ying · Put the verb in the correct form",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1717);
  const pool = [];

  // A. vaqt so'zi bo'yicha
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(PAST_T, r);
    pool.push(mc(0, `${s[0]} ___ ${v.o} ${t}.`, v.p, uw(v.p, [
      [`${HAVE(s)} ${v.pp}`, `“${t}” — aniq o‘tgan vaqt → Past Simple (Present Perfect emas).`],
      [`${HAVE(s) === "has" ? "have" : "has"} ${v.pp}`, `“${t}” → Past Simple: ${v.p}.`],
      [s[1] ? v.s : v.b, "O‘tgan zamon kerak."],
      [`did ${v.p}`, "Darak gapda did qo‘yilmaydi."],
    ]), `Aniq o‘tgan vaqt (${t}) → Past Simple: ${v.p}.`));
    const s2 = pick(SUBJ, r);
    const a = pick(["already", "just"], r);
    const right = `${HAVE(s2)} ${a} ${v.pp}`;
    pool.push(mc(0, `${s2[0]} ___ ${v.o}.`, right, uw(right, [
      [`${a} ${v.p}`.replace(/^(already|just) /, "$1 "), "already / just — Present Perfect belgisi (have / has + V3)."],
      [`${HAVE(s2) === "has" ? "have" : "has"} ${a} ${v.pp}`, `${s2[0]} bilan ${HAVE(s2)}.`],
      [`${HAVE(s2)} ${a} ${v.p}`, `have / has + V3: ${v.pp}${v.pp === v.p ? "" : ` (${v.p} emas)`}.`],
      [`did ${a} ${v.b}`, "already / just → Present Perfect."],
    ]), `${a} → Present Perfect: ${s2[0]} ${right}.`));
  }

  // B. vaqt so'zi
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(PAST_T, r);
    pool.push(mc(1, `${s[0]} ${v.p} ${v.o} ___ .`, t, uw(t, [
      ["yet", `“${v.p}” — Past Simple; yet — Present Perfect bilan.`], ["since 2019", "since — Present Perfect bilan."], ["already", "already — Present Perfect bilan (have / has + V3)."], ["for two years", "Past Simple bilan for mumkin, lekin bu yerda aniq vaqt kerak."],
    ]), `Past Simple + aniq o‘tgan vaqt (${t}).`));
    const s2 = pick(SUBJ, r);
    pool.push(mc(1, `${s2[0]} ${HAVE(s2)}n’t ${v.pp} ${v.o} ___ .`, "yet", uw("yet", [
      ["yesterday", "yesterday — Past Simple bilan (didn’t …)."], ["last week", "last week — Past Simple bilan."], ["ago", "ago — Past Simple bilan."],
    ]), "Present Perfect inkori + yet."));
  }

  // C. So'roqlar
  for (const v of VERBS) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const H = cap(HAVE(s));
    pool.push(mc(2, `___ ${lower(s[0])} ever ${v.pp} ${v.o}?`, H, uw(H, [
      ["Did", "ever + V3 → Present Perfect: Have / Has."], [H === "Has" ? "Have" : "Has", `${lower(s[0])} bilan ${H}.`], [s[1] ? "Does" : "Do", "Have / Has kerak."],
    ]), `Hayotiy tajriba → ${H} … ever + V3?`));
    pool.push(mc(2, `When ___ ${lower(s[0])} ${v.b} ${v.o}?`, "did", uw("did", [
      [HAVE(s), "When …? — aniq vaqt so‘raladi → Past Simple (did)."], [s[1] ? "does" : "do", "O‘tgan zamon haqida → did."], [s[2] === 2 ? "were" : "was", "Fe’l asl shaklda → did."],
    ]), "When …? → Past Simple: When did …?"));
  }
  const DIA = [
    ["Have you ever been to Samarkand? — Yes, I ___ there last year.", "went", [["have been", "last year → Past Simple."], ["have gone", "last year → Past Simple."], ["go", "O‘tgan zamon."]]],
    ["Have you seen this film? — Yes, I ___ it on Sunday.", "saw", [["have seen", "on Sunday → Past Simple."], ["seen", "seen yolg‘iz kelmaydi."], ["see", "O‘tgan zamon."]]],
    ["Has Ali done his homework? — Yes, he ___ it an hour ago.", "did", [["has done", "an hour ago → Past Simple."], ["does", "O‘tgan zamon."], ["done", "done yolg‘iz kelmaydi."]]],
    ["Have you met Malika? — Yes, I ___ her at the party.", "met", [["have met", "Aniq voqea (at the party) → Past Simple."], ["meet", "O‘tgan zamon."], ["meeted", "meet → met."]]],
    ["Where is Vali? — He ___ to the shop. (hali qaytmadi)", "has gone", [["went", "Natija hozir (hali qaytmadi) → Present Perfect."], ["has been", "has been — borib, qaytib kelgan."], ["goes", "Hozirgi odat emas."]]],
    ["I can’t open the door. I ___ my key! (hozir yo‘q)", "have lost", [["lost", "Natija hozir muhim → Present Perfect."], ["lose", "Zamon xato."], ["have lose", "have + V3 (lost)."]]],
    ["Look! Somebody ___ the window. (hozir sinik)", "has broken", [["broke", "Natija hozir ko‘rinib turibdi → Present Perfect."], ["has broke", "has + V3 (broken)."], ["breaks", "Zamon xato."]]],
    ["When ___ you start school? — In 2021.", "did", [["have", "When → Past Simple."], ["do", "O‘tgan zamon."], ["were", "Fe’l asl shaklda → did."]]],
  ];
  for (const [q, a, ws] of DIA) pool.push(mc(2, q, a, ws, a.includes(" ") ? "Natija hozir muhim → Present Perfect." : "Aniq vaqt / voqea → Past Simple."));

  // D. Qavsdagi fe'l
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const n = pick(["never", "ever"], r);
    const right = n === "never" ? `${HAVE(s)} never ${v.pp}` : `${HAVE(s)} ${v.pp}`;
    if (n === "never")
      pool.push(mc(3, `${s[0]} ___ ${v.o} in ${PRONOUN(s)} life. (never, ${v.b})`, right, uw(right, [
        [`never ${v.p}`, "“in my life” — hayot tajribasi, hozirgacha → Present Perfect."], [`${HAVE(s)} never ${v.p}`, `have / has + V3: ${v.pp}.`], [`didn’t never ${v.b}`, "Ikki inkor bo‘lmaydi."], [`${HAVE(s)} never ${v.ing}`, "have / has + V3 (-ing emas)."], [`${HAVE(s) === "has" ? "have" : "has"} never ${v.pp}`, `${s[0]} bilan ${HAVE(s)}.`],
      ]), `Hayot tajribasi → Present Perfect: ${right}.`));
    const t = pick(PAST_T, r);
    pool.push(mc(3, `${s[0]} ___ ${v.o} ${t}. (${v.b})`, v.p, uw(v.p, [
      [`${HAVE(s)} ${v.pp}`, `“${t}” → Past Simple.`], [v.pp === v.p ? `${v.b}ed` : v.pp, v.pp === v.p ? `${v.b} → ${v.p}.` : `${v.pp} — 3-shakl; Past Simple’da 2-shakl: ${v.p}.`], [s[1] ? v.s : v.b, "O‘tgan zamon kerak."], [v.ing, "-ing — xato, o‘tgan zamon kerak."],
    ]), `${t} → ${v.p}.`));
  }

  // E. To'g'ri gap
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(PAST_T, r);
    const right = `${s[0]} ${v.p} ${v.o} ${t}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`${s[0]} ${HAVE(s)} ${v.pp} ${v.o} ${t}.`, `“${t}” bilan Present Perfect ishlatilmaydi.`],
      [`${s[0]} ${HAVE(s)} ${v.p} ${v.o} ${t}.`.replace(`${HAVE(s)} ${v.pp}`, `${HAVE(s)} ${v.p}`), "Vaqt aniq → Past Simple, have / has kerak emas."],
      [`${s[0]} did ${v.b} ${v.o} ${t}.`, "Darak gapda did qo‘yilmaydi."],
      [`${s[0]} ${HAVE(s)} ${v.b} ${v.o} ${t}.`, "have + asl fe’l — xato."],
      [`${s[0]} ${s[2] === 2 ? "were" : "was"} ${v.b} ${v.o} ${t}.`, "was / were + asl fe’l — xato."],
    ]), `Aniq vaqt → Past Simple: ${right}`));
    const s2 = pick(SUBJ, r);
    const right2 = `${s2[0]} ${HAVE(s2)} already ${v.pp} ${v.o}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right2, uw(right2, [
      [`${s2[0]} ${HAVE(s2)} ${v.pp} ${v.o} yesterday.`, "yesterday bilan Present Perfect ishlatilmaydi."],
      [`${s2[0]} already ${v.pp} ${v.o}.`, "V3 yolg‘iz kelmaydi: have / has + V3."],
      [`${s2[0]} ${HAVE(s2) === "has" ? "have" : "has"} already ${v.pp} ${v.o}.`, `${s2[0]} bilan ${HAVE(s2)}.`],
      [`${s2[0]} ${HAVE(s2)} ${v.pp} ${v.o} already yet.`, "already va yet birga kelmaydi."],
    ]), `already → Present Perfect: ${right2}`));
  }

  return {
    code: "KG17",
    unit: 17,
    title: "17. Present Perfect versus Past Simple",
    title_uz: "Present Perfect va Past Simple farqi · 200 ta test",
    seed: 17017,
    parts: PARTS,
    quotas: [[0, 50], [1, 40], [2, 40], [3, 35], [4, 35]],
    pool,
    intro: {
      what: "Ikki zamonni farqlash: vaqti aniq aytilgan o‘tmish → Past Simple; vaqti aytilmagan, natijasi hozir muhim → Present Perfect.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Finished time or not?",
          name_uz: "Vaqt aniqmi?",
          summary: "yesterday, last week, ago, in 2019, When …? → Past Simple. already, just, yet, ever, never, since, for (hozirgacha) → Present Perfect.",
          usage: [
            { text: "Past Simple — aniq o‘tgan vaqt.", example: { en: "I saw this film last week.", uz: "Bu filmni o‘tgan hafta ko‘rdim." } },
            { text: "Present Perfect — vaqt aytilmagan, tajriba.", example: { en: "I have seen this film.", uz: "Bu filmni ko‘rganman." } },
            { text: "Suhbatda: avval Present Perfect, tafsilot — Past Simple.", example: { en: "Have you been to Bukhara? — Yes, I went there in May.", uz: "Buxoroda bo‘lganmisan? — Ha, mayda borganman." } },
          ],
          structure: [
            { type: "+", formula: "Past Simple: V2 + finished time", example: { en: "She called me an hour ago.", uz: "U bir soat oldin qo‘ng‘iroq qildi." } },
            { type: "+", formula: "Present Perfect: have / has + V3", example: { en: "She has just called me.", uz: "U hozirgina qo‘ng‘iroq qildi." } },
          ],
          signals: [
            { en: "yesterday / ago / last … / in 2019", uz: "→ Past Simple" },
            { en: "When …?", uz: "→ Past Simple" },
            { en: "already / just / yet / ever / never", uz: "→ Present Perfect" },
            { en: "for / since (hozirgacha)", uz: "→ Present Perfect" },
          ],
          tip: "“I have seen him yesterday” — XATO. yesterday → I saw him yesterday.",
        },
        {
          name: "gone or been?",
          name_uz: "has gone / has been",
          summary: "has gone — ketgan, hali qaytmagan. has been — borib, qaytib kelgan.",
          usage: [
            { text: "has gone", example: { en: "Ali has gone to the shop.", uz: "Ali do‘konga ketdi (hozir u yerda)." } },
            { text: "has been", example: { en: "Ali has been to London.", uz: "Ali Londonda bo‘lgan (qaytib kelgan)." } },
          ],
          structure: [],
          signals: [],
          tip: "Have you ever been to …? — “…da bo‘lganmisan?”",
        },
      ],
      mistakes: [
        { wrong: "I have visited Bukhara last year.", right: "I visited Bukhara last year.", why: "last year → Past Simple." },
        { wrong: "When have you arrived?", right: "When did you arrive?", why: "When → Past Simple." },
        { wrong: "Did you ever see a whale?", right: "Have you ever seen a whale?", why: "Tajriba → Present Perfect." },
        { wrong: "I didn’t finish yet.", right: "I haven’t finished yet.", why: "yet → Present Perfect." },
      ],
    },
  };
}
function PRONOUN(s) {
  if (s[0] === "I") return "my";
  if (s[0] === "You") return "your";
  if (s[1]) return /(mother|Malika|She)/.test(s[0]) ? "her" : "his";
  return /(We|I)$|^We/.test(s[0]) ? "our" : "their";
}
