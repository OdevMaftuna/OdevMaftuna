// 13. PAST SIMPLE (I did) and USED TO.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { SUBJ, VERBS, lower, uw } from "./verbs.mjs";

const PAST_T = ["yesterday", "last week", "last Sunday", "two days ago", "last summer", "in 2020", "an hour ago", "last night"];
const regWrong = (v) => (v.b.endsWith("e") ? `${v.b}d` : `${v.b}ed`);
// Bolalikdagi odatlar (used to)
const HABITS = [
  ["play with toys", "o‘yinchoq o‘ynash"], ["drink a lot of milk", "ko‘p sut ichish"], ["watch cartoons", "multfilm ko‘rish"], ["sleep in the afternoon", "kunduzi uxlash"],
  ["live in a village", "qishloqda yashash"], ["have long hair", "uzun soch qo‘yish"], ["cry a lot", "ko‘p yig‘lash"], ["ride a small bike", "kichik velosiped minish"],
  ["eat a lot of sweets", "ko‘p shirinlik yeyish"], ["go to the kindergarten", "bog‘chaga borish"], ["be afraid of dogs", "itlardan qo‘rqish"], ["climb trees", "daraxtga chiqish"],
  ["walk to school", "maktabga piyoda borish"], ["read comics", "komiks o‘qish"], ["swim in the river", "daryoda suzish"],
];
const PARTS = [
  "A. Fe’lning 2-shakli · Past forms (V2)",
  "B. Gapni to‘ldiring · Complete the sentence",
  "C. Inkor va so‘roq · didn’t / Did …?",
  "D. used to · Odat (o‘tmishda)",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1313);
  const pool = [];

  // A. V2
  for (const v of VERBS) {
    const ws = [];
    if (v.irr) ws.push([regWrong(v), `“${v.b}” — noto‘g‘ri fe’l: 2-shakli ${v.p} (-ed qo‘shilmaydi).`]);
    else if (/ied$/.test(v.p)) ws.push([`${v.b}ed`, `Undosh + y → ied: ${v.p}.`]);
    else if (/pped$/.test(v.p)) ws.push([`${v.b}ed`, `Qisqa unli + undosh → undosh ikkilanadi: ${v.p}.`]);
    else ws.push([v.b.endsWith("e") ? `${v.b}ed` : `${v.b}d`, v.b.endsWith("e") ? `“${v.b}” e bilan tugaydi — faqat -d qo‘shiladi: ${v.p}.` : `“${v.b}” ga -ed qo‘shiladi: ${v.p}.`]);
    if (v.pp !== v.p) ws.push([v.pp, `${v.pp} — 3-shakl (Present Perfect uchun). 2-shakl: ${v.p}.`]);
    ws.push([v.ing, "-ing shakl o‘tgan zamon emas."], [v.s, "Bu hozirgi zamon (3-shaxs) shakli."]);
    if (v.irr) ws.push([`${v.p}ed`, "Bunday shakl yo‘q."]);
    ws.push([`did ${v.b}`, "Darak gapda did ishlatilmaydi: faqat V2."]);
    pool.push(mc(0, `${v.b} (${v.uz}) → Past Simple: ___`, v.p, uw(v.p, ws), `${v.b} → ${v.p}${v.irr ? " (noto‘g‘ri fe’l)" : ""}.`));
    const t = pick(PAST_T, r);
    pool.push(mc(0, `I ___ ${v.o} ${t}. (${v.b})`, v.p, uw(v.p, ws), `“${t}” → Past Simple: ${v.p}.`));
  }

  // B. Gapda
  for (const v of VERBS) {
    for (const s of shuffle(SUBJ, r).slice(0, 2)) {
      const t = pick(PAST_T, r);
      pool.push(mc(1, `${s[0]} ___ ${v.o} ${t}.`, v.p, uw(v.p, [
        [s[1] ? v.s : v.b, `“${t}” — o‘tgan zamon → Past Simple: ${v.p}.`],
        [`${s[2] === 2 ? "were" : "was"} ${v.b}`, "Past Simple’da was / were + fe’l ishlatilmaydi."],
        [v.irr ? regWrong(v) : `did ${v.p}`, v.irr ? `Noto‘g‘ri fe’l: ${v.b} → ${v.p}.` : "Darak gapda did ishlatilmaydi."],
        [v.ing, "-ing — davomli zamon."],
      ]), `${t} → ${s[0]} ${v.p}.`));
    }
  }

  // C. Inkor va so'roq
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(PAST_T, r);
    pool.push(mc(2, `${s[0]} didn’t ___ ${v.o} ${t}.`, v.b, uw(v.b, [
      [v.p, `didn’t dan keyin fe’l ASL shaklda: didn’t ${v.b}.`], [v.s, "didn’t + asl shakl (-s yo‘q)."], [v.ing, "didn’t + asl shakl."],
    ]), `Inkor: didn’t + ${v.b}.`));
    const s2 = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    pool.push(mc(2, `___ ${lower(s2[0])} ${v.b} ${v.o} ${t}?`, "Did", uw("Did", [
      [s2[1] ? "Does" : "Do", `“${t}” — o‘tgan zamon → Did.`], [s2[2] === 2 ? "Were" : "Was", "Fe’l asl shaklda → Did."], ["Have", "Past Simple so‘rog‘i — Did."],
    ]), `So‘roq: Did + ega + asl fe’l?`));
    pool.push(mc(2, `Did ${lower(s2[0])} ___ ${v.o} ${t}?`, v.b, uw(v.b, [
      [v.p, `Did dan keyin fe’l asl shaklda: ${v.b}.`], [v.s, "Did + asl shakl."], [v.ing, "Did + asl shakl."],
    ]), `Did + ${v.b}.`));
  }

  // D. used to
  for (const [h, uz] of HABITS) {
    for (const s of shuffle(SUBJ, r).slice(0, 3)) {
      const right = `used to ${h.split(" ")[0]}`;
      const rest = h.split(" ").slice(1).join(" ");
      pool.push(mc(3, `When ${s[0] === "I" ? "I was" : `${lower(s[0])} ${s[2] === 2 ? "were" : "was"}`} little, ${s[0] === "I" ? "I" : lower(s[0])} ___ ${rest}. (${uz} — endi yo‘q)`, right, uw(right, [
        [`use to ${h.split(" ")[0]}`, "Darak gapda “used to” (d bilan)."], [`used to ${h.split(" ")[0] === "be" ? "being" : `${h.split(" ")[0]}ing`.replace(/eing$/, "ing")}`, "used to + fe’lning asl shakli."],
        [`uses to ${h.split(" ")[0]}`, "used to — hamma ega bilan bir xil, -s olmaydi."],
      ]), `O‘tmishdagi odat (hozir yo‘q) → used to + asl fe’l.`));
    }
    const s = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    pool.push(mc(3, `Did ${lower(s[0])} ___ ${h} as a child?`, "use to", uw("use to", [
      ["used to", "So‘roqda Did bor — shuning uchun “use to” (d siz)."], ["uses to", "Bunday shakl yo‘q."], ["using to", "Bunday shakl yo‘q."],
    ]), "Did … use to …? (so‘roqda d yo‘q)"));
    pool.push(mc(3, `${s[0]} didn’t ___ ${h}.`, "use to", uw("use to", [
      ["used to", "didn’t dan keyin “use to” (d siz)."], ["uses to", "Bunday shakl yo‘q."], ["using to", "Bunday shakl yo‘q."],
    ]), "Inkor: didn’t use to + asl fe’l."));
  }

  // E. To'g'ri gap
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(PAST_T, r);
    const right = `${s[0]} ${v.p} ${v.o} ${t}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`${s[0]} didn’t ${v.p} ${v.o} ${t}.`.replace("didn’t ", "did "), "Darak gapda “did” qo‘yilmaydi."],
      [`${s[0]} ${s[1] ? v.s : v.b} ${v.o} ${t}.`, `“${t}” → o‘tgan zamon: ${v.p}.`],
      [`${s[0]} ${s[2] === 2 ? "were" : "was"} ${v.b} ${v.o} ${t}.`, "was / were + fe’l — xato."],
      [`${s[0]} ${v.irr ? regWrong(v) : v.ing} ${v.o} ${t}.`, v.irr ? `${v.b} → ${v.p} (noto‘g‘ri fe’l).` : "-ing — xato."],
    ]), `Past Simple: ${right}`));
  }

  return {
    code: "KG13",
    unit: 13,
    title: "13. Past Simple (I did) and Used to",
    title_uz: "Oddiy o‘tgan zamon va used to · 200 ta test",
    seed: 13013,
    parts: PARTS,
    quotas: [[0, 45], [1, 45], [2, 40], [3, 40], [4, 30]],
    pool,
    intro: {
      what: "Past Simple — o‘tmishda boshlanib, tugagan ish: I visited my grandma yesterday. Used to — o‘tmishdagi odat, hozir yo‘q.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Past Simple: positive",
          name_uz: "Darak gap",
          summary: "To‘g‘ri fe’llarga -ed qo‘shiladi (play → played). Noto‘g‘ri fe’llarning 2-shaklini yodlash kerak (go → went). Hamma ega bilan shakl bir xil.",
          usage: [
            { text: "O‘tmishda tugagan ish.", example: { en: "We played football yesterday.", uz: "Kecha biz futbol o‘ynadik." } },
            { text: "Ketma-ket ishlar.", example: { en: "I got up, washed my face and went to school.", uz: "Turdim, yuzimni yuvdim va maktabga bordim." } },
          ],
          structure: [
            { type: "+", formula: "subject + V2 (verb-ed / irregular)", example: { en: "She went to Samarkand last summer.", uz: "U o‘tgan yozda Samarqandga bordi." } },
          ],
          signals: [
            { en: "yesterday", uz: "kecha" },
            { en: "last week / last year", uz: "o‘tgan hafta / yil" },
            { en: "two days ago", uz: "ikki kun oldin" },
            { en: "in 2020", uz: "2020-yilda" },
          ],
          tip: "-ed imlosi: dance → danced, study → studied, stop → stopped.",
        },
        {
          name: "Negative and questions",
          name_uz: "Inkor va so‘roq",
          summary: "Inkor va so‘roqda did ishlatiladi. Did o‘tgan zamonni o‘zi ko‘rsatadi — asosiy fe’l ASL shaklga qaytadi!",
          usage: [
            { text: "Inkor: didn’t + asl fe’l.", example: { en: "I didn’t see him.", uz: "Men uni ko‘rmadim." } },
            { text: "So‘roq: Did + ega + asl fe’l?", example: { en: "Did you go to the park?", uz: "Parkka bordingmi?" } },
          ],
          structure: [
            { type: "-", formula: "subject + didn’t + verb", example: { en: "He didn’t eat breakfast.", uz: "U nonushta qilmadi." } },
            { type: "?", formula: "Did + subject + verb?", example: { en: "Did she win?", uz: "U yutdimi?" } },
            { type: "short", formula: "Yes, I did. / No, I didn’t.", example: { en: "Did you like it? — Yes, I did.", uz: "Yoqdimi? — Ha." } },
          ],
          signals: [],
          tip: "“I didn’t went”, “Did you saw?” — XATO. didn’t / Did + asl fe’l.",
        },
        {
          name: "Used to",
          name_uz: "O‘tmishdagi odat",
          summary: "used to + asl fe’l — o‘tmishda doim qilardim, hozir qilmayman.",
          usage: [
            { text: "Eski odat.", example: { en: "I used to play with dolls.", uz: "Men qo‘g‘irchoq o‘ynardim (endi yo‘q)." } },
            { text: "Eski holat.", example: { en: "We used to live in Bukhara.", uz: "Biz Buxoroda yashardik." } },
          ],
          structure: [
            { type: "+", formula: "subject + used to + verb", example: { en: "He used to have long hair.", uz: "Uning sochi uzun edi." } },
            { type: "-", formula: "subject + didn’t use to + verb", example: { en: "I didn’t use to like fish.", uz: "Oldin baliqni yoqtirmasdim." } },
            { type: "?", formula: "Did + subject + use to + verb?", example: { en: "Did you use to cry?", uz: "Oldin yig‘larmiding?" } },
          ],
          signals: [],
          tip: "Did / didn’t bo‘lsa — “use to” (d siz). Darak gapda — “used to”.",
        },
      ],
      mistakes: [
        { wrong: "I goed to school.", right: "I went to school.", why: "go — noto‘g‘ri fe’l." },
        { wrong: "She didn’t came.", right: "She didn’t come.", why: "didn’t + asl fe’l." },
        { wrong: "Did you saw it?", right: "Did you see it?", why: "Did + asl fe’l." },
        { wrong: "I use to play chess.", right: "I used to play chess.", why: "Darak gapda used to." },
        { wrong: "He used to playing.", right: "He used to play.", why: "used to + asl fe’l." },
      ],
    },
  };
}
