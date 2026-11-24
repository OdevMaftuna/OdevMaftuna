// 11. PRESENT CONTINUOUS OR PRESENT SIMPLE — hozir bo'layotgan ish yoki odat?
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { BE, CONT as VERBS, SUBJ, lower, pron, uw } from "./verbs.mjs";

const NOW = ["now", "right now", "at the moment", "at present"];
const HABIT = ["every day", "every morning", "on Sundays", "at weekends", "twice a week", "every evening"];
const FREQ = ["always", "usually", "often", "sometimes", "never"];
// Holat fe'llari (stative): -ing olmaydi. [asos, 3-shaxs, -ing, davomi, o'zbekcha]
const STATIVE = [
  ["like", "likes", "liking", "chocolate", "yoqtirmoq"], ["love", "loves", "loving", "my family", "sevmoq"], ["hate", "hates", "hating", "cold weather", "yomon ko‘rmoq"],
  ["want", "wants", "wanting", "a new bike", "xohlamoq"], ["need", "needs", "needing", "some help", "muhtoj bo‘lmoq"], ["know", "knows", "knowing", "the answer", "bilmoq"],
  ["understand", "understands", "understanding", "the rule", "tushunmoq"], ["remember", "remembers", "remembering", "his phone number", "eslamoq"],
  ["believe", "believes", "believing", "her story", "ishonmoq"], ["prefer", "prefers", "preferring", "tea to coffee", "afzal ko‘rmoq"],
  ["own", "owns", "owning", "a big house", "egalik qilmoq"], ["mean", "means", "meaning", "it", "anglatmoq"],
];
const isNot3 = (s) => s[1] === 0;
const pres = (s, v) => (s[1] ? v.s : v.b);
const prog = (s, v) => `${BE(s[2])} ${v.ing}`;
const PARTS = [
  "A. Hozir yoki odat? · Choose the right tense",
  "B. Holat fe’llari · Stative verbs",
  "C. So‘roq gaplar · Questions",
  "D. Inkor gaplar · Negatives",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1111);
  const pool = [];

  // A. Signal so'z bo'yicha zamon tanlash
  for (const v of VERBS) {
    for (const s of shuffle(SUBJ, r).slice(0, 2)) {
      const n = pick(NOW, r);
      const right = prog(s, v);
      pool.push(mc(0, `${s[0]} ___ ${v.o} ${n}.`, right, uw(right, [
        [pres(s, v), `“${n}” — hozir, shu daqiqada bo‘layotgan ish → Present Continuous: ${right}.`],
        [v.ing, `Present Continuous: am / is / are + -ing. Yordamchi fe’l tushib qolgan.`],
        [`${BE(s[2] === 1 ? 2 : 1)} ${v.ing}`, `${s[0]} bilan “${BE(s[2])}” ishlatiladi.`],
        [`${BE(s[2])} ${v.b}`, "am / is / are dan keyin fe’l -ing oladi."],
      ]), `“${n}” → Present Continuous: ${s[0]} ${right}.`));
      const h = pick(HABIT, r);
      const s2 = pick(SUBJ, r);
      const right2 = pres(s2, v);
      pool.push(mc(0, `${s2[0]} ${v.b === "go" ? "" : ""}___ ${v.o} ${h}.`.replace("  ", " "), right2, uw(right2, [
        [prog(s2, v), `“${h}” — takrorlanadigan ish (odat) → Present Simple.`],
        [s2[1] ? v.b : v.s, s2[1] ? `${s2[0]} — he / she → ${v.s}.` : `${s2[0]} bilan -s qo‘shilmaydi.`],
        [v.ing, "Present Simple’da -ing yo‘q."],
        [`${BE(s2[2])} ${v.b}`, "Present Simple’da am / is / are + fe’l ishlatilmaydi."],
      ]), `“${h}” → Present Simple: ${s2[0]} ${right2}.`));
    }
  }
  // Look! / Listen!
  for (const v of shuffle(VERBS, r).slice(0, 20)) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I" && x[0] !== "You"), r);
    const right = prog(s, v);
    pool.push(mc(0, `Look! ${s[0]} ___ ${v.o}.`, right, uw(right, [
      [pres(s, v), "“Look!” — hozir ko‘z oldimizda bo‘layotgan ish → Present Continuous."],
      [`${v.p}`, "Bu o‘tgan zamon emas — hozir bo‘lyapti."],
      [`${BE(s[2] === 1 ? 2 : 1)} ${v.ing}`, `${s[0]} bilan “${BE(s[2])}”.`],
      [v.ing, "am / is / are tushib qolgan."],
    ]), `Look! → Present Continuous: ${right}.`));
  }

  // B. Stative
  for (const [b, s3, ing, o, uz] of STATIVE) {
    for (const s of shuffle(SUBJ, r).slice(0, 4)) {
      const right = s[1] ? s3 : b;
      const n = pick(["now", "at the moment", "today", "right now"], r);
      pool.push(mc(1, `${s[0]} ___ ${o} ${n}.`, right, uw(right, [
        [`${BE(s[2])} ${ing}`, `“${b}” (${uz}) — holat fe’li: “${n}” bo‘lsa ham -ing olmaydi.`],
        [s[1] ? b : s3, s[1] ? `${s[0]} — he / she → ${s3}.` : `${s[0]} bilan -s qo‘shilmaydi.`],
        [ing, "Holat fe’li -ing olmaydi."],
        [`${BE(s[2])} ${b}`, "Bunday shakl yo‘q."],
      ]), `${b} — holat fe’li (stative): Present Continuous’da ishlatilmaydi → ${s[0]} ${right}.`));
    }
  }

  // C. Savollar
  for (const v of VERBS) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const subj = lower(s[0]);
    const be = cap(BE(s[2]));
    pool.push(mc(2, `___ ${subj} ${v.ing} ${v.o} now?`, be, uw(be, [
      [s[1] ? "Does" : "Do", "“now” + -ing → Present Continuous so‘rog‘i: Am / Is / Are."],
      [cap(BE(s[2] === 1 ? 2 : 1)), `${subj} bilan “${be}”.`],
      ["Did", "Bu o‘tgan zamon emas."],
      [s[1] ? "Do" : "Does", "Present Continuous so‘rog‘i — Is / Are bilan."],
    ]), `Present Continuous so‘rog‘i: ${be} + ${subj} + -ing?`));
    const s2 = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const subj2 = lower(s2[0]);
    const aux = s2[1] ? "Does" : "Do";
    pool.push(mc(2, `___ ${subj2} ${v.b} ${v.o} ${pick(HABIT, r)}?`, aux, uw(aux, [
      [s2[1] ? "Do" : "Does", s2[1] ? `${subj2} — he / she → Does.` : `${subj2} — you / we / they → Do.`],
      [cap(BE(s2[2])), "Fe’l asl shaklda va odat haqida → Do / Does."],
      ["Did", "Bu o‘tgan zamon emas."],
      [s2[1] ? "Are" : "Is", "Present Simple so‘rog‘i — Do / Does."],
    ]), `Odat → Present Simple so‘rog‘i: ${aux} + ${subj2} + fe’l?`));
  }

  // D. Inkor
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const neg = s[2] === 0 ? "’m not" : s[2] === 1 ? "isn’t" : "aren’t";
    const right = s[2] === 0 ? `am not ${v.ing}` : `${neg} ${v.ing}`;
    pool.push(mc(3, `${s[0]} ___ ${v.o} at the moment. (−)`, right, uw(right, [
      [`${s[1] ? "doesn’t" : "don’t"} ${v.b}`, "“at the moment” → Present Continuous inkori: am not / isn’t / aren’t + -ing."],
      [`${s[1] ? "doesn’t" : "don’t"} ${v.ing}`, "don’t / doesn’t dan keyin -ing kelmaydi."],
      [`not ${v.ing}`, "Yordamchi fe’l (am / is / are) kerak."],
      [`${s[2] === 1 ? "aren’t" : "isn’t"} ${v.ing}`, `${s[0]} bilan to‘g‘ri shakl: ${right}.`],
    ]), `Present Continuous inkori: ${s[0]} ${right}.`));
    const s2 = pick(SUBJ, r);
    const right2 = `${s2[1] ? "doesn’t" : "don’t"} ${v.b}`;
    pool.push(mc(3, `${s2[0]} ___ ${v.o} ${pick(HABIT, r)}. (−)`, right2, uw(right2, [
      [`${s2[1] ? "doesn’t" : "don’t"} ${v.s}`, "don’t / doesn’t dan keyin fe’l asl shaklda (-s yo‘q)."],
      [`${s2[1] ? "don’t" : "doesn’t"} ${v.b}`, s2[1] ? `${s2[0]} → doesn’t.` : `${s2[0]} → don’t.`],
      [`${s2[2] === 0 ? "am not" : s2[2] === 1 ? "isn’t" : "aren’t"} ${v.ing}`, "Odat (har kuni…) → Present Simple inkori."],
    ]), `Odat → Present Simple inkori: ${s2[0]} ${right2}.`));
  }

  // E. To'g'ri gap
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const f = pick(FREQ.filter((x) => x !== "never"), r);
    const n = pick(NOW, r);
    const right = `${s[0]} ${f} ${pres(s, v)} ${v.o}, but ${n} ${pron(s)} ${BE(s[2])} sleeping.`;
    const pr = right.match(/but .* (am|is|are) sleeping/)[0].replace(/^but /, "");
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`${s[0]} ${f} ${prog(s, v)} ${v.o}, but ${pr}.`, `“${f}” — odat → Present Simple: ${pres(s, v)}.`],
      [`${s[0]} ${f} ${pres(s, v)} ${v.o}, but ${pr.replace(/(am|is|are) sleeping/, (m) => m.split(" ")[0] === "am" ? "sleep" : m.split(" ")[0] === "is" ? "sleeps" : "sleep")}.`, `“${n}” — hozir → Present Continuous: … sleeping.`],
      [`${s[0]} ${pres(s, v)} ${f} ${v.o}, but ${pr}.`, `“${f}” fe’ldan OLDIN keladi.`],
    ]), `Odat → Present Simple (${f}), hozir → Present Continuous (${n}).`));
  }

  return {
    code: "KG11",
    unit: 11,
    title: "11. Present Continuous or Present Simple",
    title_uz: "Hozirgi davomli yoki oddiy hozirgi zamon · 200 ta test",
    seed: 11011,
    parts: PARTS,
    quotas: [[0, 60], [1, 40], [2, 35], [3, 35], [4, 30]],
    pool,
    intro: {
      what: "Ikki zamonni farqlash: hozir, shu daqiqada bo‘layotgan ish — Present Continuous; odat, doimiy ish — Present Simple.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Now or usually?",
          name_uz: "Hozirmi yoki odatdami?",
          summary: "Gapdagi signal so‘zga qarang: now, at the moment, Look!, Listen! → Present Continuous. every day, usually, always, often, on Sundays → Present Simple.",
          usage: [
            { text: "Present Continuous — hozir bo‘layotgan ish.", example: { en: "Ali is playing football now.", uz: "Ali hozir futbol o‘ynayapti." } },
            { text: "Present Simple — odat, har doim takrorlanadigan ish.", example: { en: "Ali plays football every day.", uz: "Ali har kuni futbol o‘ynaydi." } },
            { text: "Ikkalasi bitta gapda.", example: { en: "She usually walks to school, but today she is going by bus.", uz: "U odatda maktabga piyoda boradi, lekin bugun avtobusda ketyapti." } },
          ],
          structure: [
            { type: "+", formula: "am / is / are + verb-ing", example: { en: "They are swimming now.", uz: "Ular hozir suzishyapti." } },
            { type: "+", formula: "verb / verb-s", example: { en: "They swim on Sundays.", uz: "Ular yakshanbalari suzishadi." } },
          ],
          signals: [
            { en: "now / right now / at the moment", uz: "hozir → Continuous" },
            { en: "Look! / Listen!", uz: "Qara! / Eshit! → Continuous" },
            { en: "every day / on Mondays", uz: "har kuni / dushanbalari → Simple" },
            { en: "always / usually / often / never", uz: "doim / odatda / tez-tez / hech qachon → Simple" },
          ],
          tip: "Avval signal so‘zni toping — u zamonni aytib beradi.",
        },
        {
          name: "Stative verbs",
          name_uz: "Holat fe’llari",
          summary: "Ba’zi fe’llar harakat emas, holat yoki fikrni bildiradi. Ular odatda -ing olmaydi, hatto “now” bo‘lsa ham.",
          usage: [
            { text: "Yoqtirish: like, love, hate, prefer.", example: { en: "I like this song now.", uz: "Menga hozir bu qo‘shiq yoqadi." } },
            { text: "Xohish va ehtiyoj: want, need.", example: { en: "She wants an ice cream.", uz: "U muzqaymoq xohlayapti." } },
            { text: "Fikr: know, understand, remember, believe, mean.", example: { en: "Do you understand me?", uz: "Meni tushunyapsanmi?" } },
          ],
          structure: [
            { type: "+", formula: "subject + like / want / know …", example: { en: "He knows the answer.", uz: "U javobni biladi." } },
            { type: "-", formula: "don’t / doesn’t + know / want …", example: { en: "I don’t understand.", uz: "Tushunmayapman." } },
          ],
          signals: [],
          tip: "“I am knowing”, “She is wanting” — XATO. To‘g‘risi: I know, She wants.",
        },
        {
          name: "Questions and negatives",
          name_uz: "So‘roq va inkor",
          summary: "Continuous: Am / Is / Are … -ing? — isn’t / aren’t + -ing. Simple: Do / Does … ? — don’t / doesn’t + fe’l.",
          usage: [
            { text: "Hozir haqida so‘rash.", example: { en: "What are you doing now?", uz: "Hozir nima qilyapsan?" } },
            { text: "Odat haqida so‘rash.", example: { en: "What do you do at weekends?", uz: "Dam olish kunlari nima qilasan?" } },
          ],
          structure: [
            { type: "?", formula: "Is / Are + subject + -ing?", example: { en: "Is she reading?", uz: "U o‘qiyaptimi?" } },
            { type: "?", formula: "Do / Does + subject + verb?", example: { en: "Does she read every day?", uz: "U har kuni o‘qiydimi?" } },
          ],
          signals: [],
          tip: "Does bilan -s yo‘qoladi: Does he play? (plays emas).",
        },
      ],
      mistakes: [
        { wrong: "Look! The baby sleeps.", right: "Look! The baby is sleeping.", why: "Look! → hozir." },
        { wrong: "I am going to school every day.", right: "I go to school every day.", why: "every day → odat." },
        { wrong: "I am liking pizza.", right: "I like pizza.", why: "like — holat fe’li." },
        { wrong: "Are you play football now?", right: "Are you playing football now?", why: "Are + -ing." },
        { wrong: "She isn’t like milk.", right: "She doesn’t like milk.", why: "Present Simple inkori — doesn’t." },
      ],
    },
  };
}
