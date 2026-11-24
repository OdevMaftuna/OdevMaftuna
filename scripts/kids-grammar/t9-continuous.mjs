// 9. PRESENT CONTINUOUS TENSE AND STATIVE VERBS.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// [asos, -ing, qoida, o'zbekcha, davomi]
const V = [
  ["play", "playing", "add", "o‘ynamoq", "football in the yard"], ["read", "reading", "add", "o‘qimoq", "a book"], ["watch", "watching", "add", "tomosha qilmoq", "TV"],
  ["eat", "eating", "add", "yemoq", "an apple"], ["drink", "drinking", "add", "ichmoq", "milk"], ["sing", "singing", "add", "kuylamoq", "a song"],
  ["cook", "cooking", "add", "pishirmoq", "dinner"], ["draw", "drawing", "add", "chizmoq", "a picture"], ["clean", "cleaning", "add", "tozalamoq", "the room"],
  ["wait", "waiting", "add", "kutmoq", "for the bus"], ["listen", "listening", "add", "tinglamoq", "to music"], ["help", "helping", "add", "yordam bermoq", "the teacher"],
  ["study", "studying", "add", "o‘qimoq (dars)", "English"], ["fly", "flying", "add", "uchmoq", "a kite"], ["cry", "crying", "add", "yig‘lamoq", "in the bedroom"],
  ["write", "writing", "e", "yozmoq", "a letter"], ["make", "making", "e", "yasamoq", "a cake"], ["dance", "dancing", "e", "raqsga tushmoq", "at the party"],
  ["ride", "riding", "e", "minmoq", "a bike"], ["take", "taking", "e", "olmoq", "a photo"], ["smile", "smiling", "e", "jilmaymoq", "at the baby"],
  ["drive", "driving", "e", "haydamoq", "a car"], ["come", "coming", "e", "kelmoq", "home"], ["have", "having", "e", "(ovqat) yemoq", "lunch"],
  ["swim", "swimming", "double", "suzmoq", "in the pool"], ["run", "running", "double", "yugurmoq", "in the park"], ["sit", "sitting", "double", "o‘tirmoq", "on the sofa"],
  ["get", "getting", "double", "(tayyor) bo‘lmoq", "ready for school"], ["put", "putting", "double", "qo‘ymoq", "the books on the shelf"], ["shop", "shopping", "double", "xarid qilmoq", "at the market"],
  ["stop", "stopping", "double", "to‘xtamoq", "at the bus stop"], ["cut", "cutting", "double", "kesmoq", "the paper"], ["lie", "lying", "ie", "yotmoq", "on the bed"],
  ["tie", "tying", "ie", "bog‘lamoq", "his shoes"], ["jump", "jumping", "add", "sakramoq", "on the bed"], ["climb", "climbing", "add", "chiqmoq", "a tree"],
];
const RULE = {
  add: "Fe’lga oddiy -ing qo‘shiladi",
  e: "Oxiri -e bilan tugasa, e tushib qoladi va -ing qo‘shiladi",
  double: "Bir bo‘g‘inli, unli + undosh bilan tugasa, oxirgi undosh ikkilanadi",
  ie: "Oxiri -ie bilan tugasa, ie → y bo‘lib -ing qo‘shiladi",
};
const wrongIng = ([b, ing, rule]) => {
  const pool = [];
  const add = (x, why) => x !== ing && x !== "fling" && !pool.some((p) => p[0] === x) && pool.push([x, why]);
  if (rule === "e") {
    add(`${b}ing`, `“${b}” -e bilan tugaydi — e tushib qoladi: ${ing}.`);
    add(`${b.slice(0, -1)}${b.at(-2)}ing`, "Harf ikkilanmaydi.");
  }
  if (rule === "double") {
    add(`${b}ing`, `Bir bo‘g‘inli, unli + undosh → oxirgi harf ikkilanadi: ${ing}.`);
    add(`${b}${b.at(-1)}${b.at(-1)}ing`, "Faqat bir marta ikkilanadi.");
  }
  if (rule === "ie") {
    add(`${b}ing`, `-ie → y + ing: ${ing}.`);
    add(`${b.slice(0, -2)}ing`, `-ie → y + ing: ${ing}.`);
  }
  if (rule === "add") {
    add(`${b}${b.at(-1)}ing`, "Harf ikkilanmaydi — oddiy -ing.");
    if (b.endsWith("y")) add(`${b.slice(0, -1)}ing`, "y tushib qolmaydi: " + ing + ".");
  }
  add(`${b}eing`, "-eing degan qo‘shimcha yo‘q.");
  add(`${b}ng`, "-ing to‘liq yoziladi.");
  return pool.slice(0, 3);
};

const SUBJ = [
  ["I", "am"], ["You", "are"], ["We", "are"], ["They", "are"], ["He", "is"], ["She", "is"], ["My brother", "is"], ["Ali", "is"], ["My mother", "is"],
  ["Malika", "is"], ["The children", "are"], ["My friends", "are"], ["Mr Brown", "is"], ["My sister and I", "are"], ["The boys", "are"], ["Grandma", "is"],
];
const SIG = ["now", "right now", "at the moment"];

// Holat fe'llari: [asos, 3-shaxs, o'zbekcha, davomi]
const STATIVE = [
  ["like", "likes", "yoqtirmoq", "ice cream"], ["love", "loves", "sevmoq", "my family"], ["hate", "hates", "yomon ko‘rmoq", "rainy days"], ["want", "wants", "xohlamoq", "a glass of water"],
  ["need", "needs", "kerak bo‘lmoq", "a new pen"], ["know", "knows", "bilmoq", "the answer"], ["understand", "understands", "tushunmoq", "the lesson"], ["remember", "remembers", "eslamoq", "his name"],
  ["believe", "believes", "ishonmoq", "you"], ["prefer", "prefers", "afzal ko‘rmoq", "tea"],
];

const PARTS = [
  "A. -ing shaklini tanlang · Spelling of -ing",
  "B. Gapni to‘ldiring · am / is / are + -ing",
  "C. Inkor va so‘roq · Negative and questions",
  "D. Holat fe’llari · Stative verbs",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

const ingOf = (b) => (b === "prefer" ? "preferring" : b.endsWith("e") ? `${b.slice(0, -1)}ing` : `${b}ing`);

export function build() {
  const r = rng(909);
  const pool = [];

  // A
  for (const v of V) pool.push(mc(0, `${v[0]} → ___`, v[1], wrongIng(v), `${RULE[v[2]]}: ${v[0]} → ${v[1]}.`));

  // B
  for (const v of V) {
    for (const [s, be] of shuffle(SUBJ, r).slice(0, 2)) {
      const sig = pick(SIG, r);
      const isThird = be === "is";
      const right = `${be} ${v[1]}`;
      const wrongBe = be === "is" ? "are" : "is";
      pool.push(
        mc(1, `${s} ___ ${v[4]} ${sig}. (${v[0]})`, right, [
          [`${wrongBe} ${v[1]}`, `${s} bilan ${be}.`],
          [isThird ? `${v[0]}s` : v[0], `“${sig}” — hozir sodir bo‘layotgan ish → Present Continuous (am / is / are + -ing).`],
          [v[1], "am / is / are tushib qolmaydi."],
        ], `“${sig}” → hozir davom etayotgan ish: ${s} ${be} ${v[1]}.`),
      );
    }
    const look = pick(["Look!", "Listen!", "Be quiet!"], r);
    const [s, be] = pick(SUBJ.filter((x) => x[0] !== "I" && x[0] !== "You"), r);
    pool.push(mc(1, `${look} ${s} ___ ${v[4]}. (${v[0]})`, `${be} ${v[1]}`, [[`${be} ${v[0]}`, "be + fe’lning -ing shakli."], [`${v[0]}${be === "is" ? "s" : ""}`, `“${look}” — hozir ko‘z oldimizda bo‘layapti → Present Continuous.`], [`${be === "is" ? "are" : "is"} ${v[1]}`, `${s} bilan ${be}.`]], `“${look}” — hozir bo‘layotgan ish → ${be} ${v[1]}.`));
  }

  // C
  for (const v of shuffle(V, r)) {
    const [s, be] = pick(SUBJ, r);
    const neg = be === "am" ? "am not" : `${be}n’t`;
    pool.push(
      mc(2, `${s} ___ ${v[1]} ${v[4]} now. (−)`, neg, [
        [be === "is" ? "aren’t" : be === "are" ? "isn’t" : "isn’t", `${s} bilan ${be} → ${neg}.`],
        [be === "is" ? "doesn’t" : "don’t", "Present Continuous inkorida don’t / doesn’t emas — am / is / are + not."],
        ["not", "not yolg‘iz kelmaydi — am / is / are + not."],
      ], `Inkor: ${be} + not + ${v[1]}.`),
    );
    const [s2, be2] = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const subj = ["You", "We", "They", "He", "She"].includes(s2) ? s2.toLowerCase() : s2.replace(/^(My|The) /, (m) => m.toLowerCase());
    pool.push(
      mc(2, `___ ${subj} ${v[1]} ${v[4]} now?`, cap(be2), [
        [be2 === "is" ? "Are" : "Is", `${subj} bilan ${be2}.`],
        [be2 === "is" ? "Does" : "Do", "Present Continuous so‘rog‘ida Do / Does emas — Am / Is / Are."],
        ["Am", "Am faqat I bilan."],
      ].filter((w) => w[0] !== cap(be2)), `So‘roq: ${cap(be2)} + ${subj} + ${v[1]}?`),
    );
  }

  // D. Holat fe'llari
  const SUBJ_S = [["I", 0], ["You", 0], ["We", 0], ["They", 0], ["He", 1], ["She", 1], ["My brother", 1], ["Malika", 1], ["My parents", 0], ["Ali", 1]];
  for (const [b, s3, uz, rest] of STATIVE) {
    for (const [s, third] of shuffle(SUBJ_S, r).slice(0, 5)) {
      const right = third ? s3 : b;
      const be = s === "I" ? "am" : third ? "is" : "are";
      pool.push(
        mc(3, `${s} ___ ${rest} now. (${b})`, right, [
          [`${be} ${ingOf(b)}`, `“${b}” — holat fe’li (${uz}). U -ing bilan ishlatilmaydi, hatto “now” bo‘lsa ham.`],
          [third ? b : s3, third ? `${s} — 3-shaxs birlik → ${s3}.` : `${s} bilan -s qo‘shilmaydi.`],
          [ingOf(b), "Holat fe’li -ing olmaydi."],
        ], `“${b}” — holat fe’li (his-tuyg‘u, fikr, istak). Present Continuous’da ishlatilmaydi: ${s} ${right} ${rest}.`),
      );
    }
  }

  // E
  for (const v of V) {
    const [s, be] = pick(SUBJ, r);
    const sig = pick(SIG, r);
    const right = `${s} ${be} ${v[1]} ${v[4]} ${sig}.`;
    pool.push(
      mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, [
        [`${s} ${v[1]} ${v[4]} ${sig}.`, "am / is / are tushib qolgan."],
        [`${s} ${be} ${v[0]} ${v[4]} ${sig}.`, "be dan keyin fe’l -ing shaklida."],
        [`${s} ${be === "is" ? "are" : "is"} ${v[1]} ${v[4]} ${sig}.`, `${s} bilan ${be}.`],
      ], `${s} + ${be} + ${v[1]}.`),
    );
  }
  for (const [b, s3, uz, rest] of STATIVE) {
    const right = `I ${b} ${rest}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, [[`I am ${ingOf(b)} ${rest}.`, `“${b}” — holat fe’li, -ing olmaydi.`], [`I ${s3} ${rest}.`, "I bilan -s qo‘shilmaydi."], [`I ${ingOf(b)} ${rest}.`, "Holat fe’li -ing olmaydi."]], `“${b}” (${uz}) — holat fe’li: I ${b} ${rest}.`));
  }

  return {
    code: "KG9",
    unit: 9,
    title: "9. Present Continuous Tense and Stative Verbs",
    title_uz: "Hozirgi davomiy zamon va holat fe’llari · 200 ta test",
    seed: 9009,
    parts: PARTS,
    quotas: [[0, 30], [1, 60], [2, 40], [3, 35], [4, 35]],
    pool,
    intro: {
      what: "Present Continuous — hozir, gapirayotgan paytda davom etayotgan ish: I am reading now — Men hozir o‘qiyapman.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Present Continuous: am / is / are + -ing",
          name_uz: "Hozirgi davomiy zamon",
          summary: "Hozir, ayni paytda bo‘layotgan ishni aytish uchun. O‘zbekchada “-yapman, -yapti” qo‘shimchasiga o‘xshaydi: o‘qiyapman → I am reading.",
          usage: [
            { text: "Hozir (gapirayotgan paytda) bo‘layotgan ish.", example: { en: "Look! The baby is sleeping.", uz: "Qara! Chaqaloq uxlayapti." } },
            { text: "Ayni damda davom etayotgan ish.", example: { en: "We are having lunch at the moment.", uz: "Biz hozir tushlik qilyapmiz." } },
          ],
          structure: [
            { type: "+", formula: "I am / he, she, it is / you, we, they are + V-ing", example: { en: "She is drawing a picture.", uz: "U rasm chizyapti." } },
            { type: "-", formula: "am not / isn’t / aren’t + V-ing", example: { en: "They aren’t watching TV.", uz: "Ular televizor ko‘rmayapti." } },
            { type: "?", formula: "Am / Is / Are + subject + V-ing?", example: { en: "Are you listening to me?", uz: "Meni tinglayapsanmi?" } },
            { type: "short", formula: "Yes, I am. / No, she isn’t.", example: { en: "Is it raining? — Yes, it is.", uz: "Yomg‘ir yog‘yaptimi? — Ha." } },
          ],
          signals: [
            { en: "now", uz: "hozir" },
            { en: "right now", uz: "aynan hozir" },
            { en: "at the moment", uz: "ayni paytda" },
            { en: "Look!", uz: "Qara!" },
            { en: "Listen!", uz: "Eshit!" },
            { en: "Be quiet!", uz: "Jim bo‘l!" },
          ],
          tip: "am / is / are tushib qolmaydi: “I reading” — XATO, “I am reading” — to‘g‘ri.",
        },
        {
          name: "Spelling: -ing",
          name_uz: "-ing qo‘shish qoidalari",
          summary: "Ko‘p fe’llarga oddiy -ing qo‘shiladi. Lekin uchta maxsus qoida bor.",
          usage: [
            { text: "Oddiy: play → playing, read → reading, study → studying.", example: { en: "He is studying English.", uz: "U ingliz tilini o‘rganyapti." } },
            { text: "-e tushadi: write → writing, make → making, dance → dancing.", example: { en: "I am writing a letter.", uz: "Men xat yozyapman." } },
            { text: "Undosh ikkilanadi: swim → swimming, run → running, sit → sitting, shop → shopping.", example: { en: "The children are swimming.", uz: "Bolalar suzyapti." } },
            { text: "-ie → y: lie → lying, tie → tying.", example: { en: "The cat is lying on the bed.", uz: "Mushuk karavotda yotibdi." } },
          ],
          structure: [
            { type: "+", formula: "write → writing (e tushadi)", example: { en: "She is riding a bike.", uz: "U velosiped minyapti." } },
            { type: "+", formula: "run → running (n ikkilanadi)", example: { en: "Ali is running.", uz: "Ali yuguryapti." } },
          ],
          signals: [],
          tip: "Ikkilanish faqat qisqa (bir bo‘g‘inli) “unli + undosh” fe’llarda: swim, run, sit, get, put, cut, stop, shop.",
        },
        {
          name: "Stative verbs",
          name_uz: "Holat fe’llari (-ing olmaydi)",
          summary: "Harakatni emas, his-tuyg‘u, fikr yoki istakni bildiradigan fe’llar Present Continuous’da ishlatilmaydi — “now” bo‘lsa ham Present Simple qo‘llanadi.",
          usage: [
            { text: "His-tuyg‘u: like, love, hate, prefer.", example: { en: "I like this song. (✗ I am liking)", uz: "Menga bu qo‘shiq yoqadi." } },
            { text: "Istak: want, need.", example: { en: "I want some water now.", uz: "Hozir suv xohlayman." } },
            { text: "Fikr: know, understand, remember, believe.", example: { en: "She knows the answer.", uz: "U javobni biladi." } },
          ],
          structure: [
            { type: "+", formula: "I / you / we / they + verb · he / she / it + verb-s", example: { en: "He understands the lesson now.", uz: "U hozir darsni tushunadi." } },
          ],
          signals: [
            { en: "like, love, hate, prefer", uz: "his-tuyg‘u" },
            { en: "want, need", uz: "istak" },
            { en: "know, understand, remember, believe", uz: "fikr" },
          ],
          tip: "“I am knowing”, “She is wanting” — XATO. “I know”, “She wants” — to‘g‘ri.",
        },
      ],
      mistakes: [
        { wrong: "She reading a book.", right: "She is reading a book.", why: "is tushib qolmaydi." },
        { wrong: "I am writeing.", right: "I am writing.", why: "-e tushadi." },
        { wrong: "He is runing.", right: "He is running.", why: "n ikkilanadi." },
        { wrong: "Do you watching TV?", right: "Are you watching TV?", why: "So‘roq — Are." },
        { wrong: "I am wanting an apple.", right: "I want an apple.", why: "want — holat fe’li." },
      ],
    },
  };
}
