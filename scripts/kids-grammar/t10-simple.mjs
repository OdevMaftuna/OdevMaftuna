// 10. PRESENT SIMPLE — oddiy hozirgi zamon.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// [asos, 3-shaxs, qoida, o'zbekcha, davomi]
const V = [
  ["play", "plays", "s", "o‘ynamoq", "football after school"], ["read", "reads", "s", "o‘qimoq", "books in the evening"], ["like", "likes", "s", "yoqtirmoq", "ice cream"],
  ["eat", "eats", "s", "yemoq", "breakfast at 7 o’clock"], ["drink", "drinks", "s", "ichmoq", "milk every morning"], ["live", "lives", "s", "yashamoq", "in Tashkent"],
  ["get up", "gets up", "s", "turmoq", "at 7 o’clock"], ["speak", "speaks", "s", "gapirmoq", "English well"], ["ride", "rides", "s", "minmoq", "a bike to school"],
  ["swim", "swims", "s", "suzmoq", "in the pool on Sundays"], ["buy", "buys", "s", "sotib olmoq", "bread every day"], ["say", "says", "s", "aytmoq", "“Good morning”"],
  ["watch", "watches", "es", "tomosha qilmoq", "cartoons on Saturdays"], ["go", "goes", "es", "bormoq", "to school by bus"], ["do", "does", "es", "qilmoq", "homework every evening"],
  ["wash", "washes", "es", "yuvmoq", "the dishes after dinner"], ["relax", "relaxes", "es", "dam olmoq", "at home at weekends"], ["catch", "catches", "es", "ushlamoq", "the bus at 8"],
  ["teach", "teaches", "es", "o‘rgatmoq", "English at our school"], ["finish", "finishes", "es", "tugatmoq", "school at 1 o’clock"], ["fix", "fixes", "es", "tuzatmoq", "cars"],
  ["study", "studies", "ies", "o‘qimoq (dars)", "maths every day"], ["fly", "flies", "ies", "uchmoq", "kites in spring"], ["cry", "cries", "ies", "yig‘lamoq", "a lot"],
  ["carry", "carries", "ies", "ko‘tarib yurmoq", "a big bag"], ["try", "tries", "ies", "harakat qilmoq", "very hard"], ["have", "has", "irr", "bor bo‘lmoq / (ovqat) yemoq", "lunch at school"],
];
const RULE = {
  s: "Ko‘p fe’llarga -s qo‘shiladi",
  es: "-s, -sh, -ch, -x, -o bilan tugasa -es qo‘shiladi",
  ies: "Undosh + y bilan tugasa, y → i bo‘lib -es qo‘shiladi",
  irr: "Istisno: have → has",
};
const head = (v) => v.split(" ")[0];
const ING = (b) => (/^(swim|get|run|sit)$/.test(b) ? `${b}${b.at(-1)}ing` : b.endsWith("e") ? `${b.slice(0, -1)}ing` : `${b}ing`);
const lowerSubj = (s) => (["You", "We", "They", "He", "She"].includes(s) ? s.toLowerCase() : s.replace(/^(My|The) /, (m) => m.toLowerCase()));
const tail = (v) => v.split(" ").slice(1).join(" ");
const wrong3 = ([b, s3, rule]) => {
  const h = head(b);
  const t = tail(b) ? ` ${tail(b)}` : "";
  const pool = [];
  const add = (x, why) => x !== s3 && !pool.some((p) => p[0] === x) && pool.push([x, why]);
  if (rule === "s") add(`${h}es${t}`, `“${h}” ga faqat -s qo‘shiladi: ${s3}.`);
  if (rule === "es") add(`${h}s${t}`, `“${h}” ${h.endsWith("o") ? "-o" : "-sh / -ch / -x"} bilan tugaydi → -es: ${s3}.`);
  if (rule === "ies") {
    add(`${h}s${t}`, `Undosh + y → ies: ${s3}.`);
    add(`${h}es${t}`, `y → i + es: ${s3}.`);
  }
  if (rule === "irr") {
    add("haves", "have → has (istisno).");
    add("haves’", "have → has.");
  }
  add(`${ING(h)}${t}`, "Present Simple’da -ing qo‘shilmaydi.");
  add(`${h}${t}`, "he / she / it bilan fe’lga -s qo‘shiladi.");
  add(`${h}ies${t}`, "Bunday shakl yo‘q.");
  return pool.slice(0, 3);
};

// [ega, 3-shaxs birlikmi]
const SUBJ = [
  ["I", 0], ["You", 0], ["We", 0], ["They", 0], ["He", 1], ["She", 1], ["My brother", 1], ["Ali", 1], ["My mother", 1], ["Malika", 1],
  ["My parents", 0], ["The children", 0], ["My friends", 0], ["Mr Brown", 1], ["My sister and I", 0], ["Grandpa", 1],
];
const SIG = ["every day", "every morning", "on Mondays", "at weekends"];
const FREQ = ["always", "usually", "often", "sometimes", "never"];

const PARTS = [
  "A. 3-shaxs shakli · he / she / it + -s",
  "B. Gapni to‘ldiring · Complete the sentence",
  "C. Inkor shakli · don’t / doesn’t",
  "D. So‘roq va qisqa javob · Questions and short answers",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1010);
  const pool = [];

  // A
  for (const v of V) pool.push(mc(0, `${v[0]} → he / she ___`, v[1], wrong3(v), `${RULE[v[2]]}: ${v[0]} → ${v[1]}.`));
  for (const v of V.filter((x) => x[2] !== "s")) pool.push(mc(0, `My sister ___ ${v[4]}. (${v[0]})`, v[1], wrong3(v), `${RULE[v[2]]}: she ${v[1]}.`));

  // B
  for (const v of V) {
    for (const [s, third] of shuffle(SUBJ, r).slice(0, 3)) {
      const right = third ? v[1] : v[0];
      const ws = third
        ? [[v[0], `${s} — 3-shaxs birlik (he / she) → fe’lga -s: ${v[1]}.`], [`is ${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""}`, "Bu odat (har doim takrorlanadigan ish) — Present Simple, -ing emas."], [wrong3(v)[0][0], wrong3(v)[0][1]]]
        : [[v[1], `${s} — I / you / we / they → fe’l o‘zgarmaydi: ${v[0]}.`], [`are ${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""}`, "Odat — Present Simple."], [`${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""}`, "Present Simple’da -ing yo‘q."]];
      const uniq = ws.filter((w, i) => w[0] !== right && ws.findIndex((y) => y[0] === w[0]) === i);
      const sig = v[4].match(/every|on |at weekends|after|twice|in spring|at \d/) ? "" : ` ${pick(SIG, r)}`;
      pool.push(mc(1, `${s} ___ ${v[4]}${sig}. (${v[0]})`, right, uniq, third ? `${s} → he / she → ${v[1]}.` : `${s} → fe’l asl shaklda: ${v[0]}.`));
    }
  }

  // C. Inkor
  for (const v of V) {
    for (const [s, third] of shuffle(SUBJ, r).slice(0, 2)) {
      const right = third ? "doesn’t" : "don’t";
      pool.push(
        mc(2, `${s} ___ ${v[0]} ${v[4]}. (−)`, right, [
          [third ? "don’t" : "doesn’t", third ? `${s} — he / she → doesn’t.` : `${s} — I / you / we / they → don’t.`],
          [third ? "isn’t" : "aren’t", "Present Simple inkorida don’t / doesn’t ishlatiladi (to be emas)."],
          ["not", "not yolg‘iz kelmaydi — don’t / doesn’t."],
        ], `Inkor: ${right} + fe’lning asl shakli.`),
      );
    }
    const s = pick(SUBJ.filter((x) => x[1]), r)[0];
    pool.push(
      mc(2, `${s} doesn’t ___ ${v[4]}. (${v[0]})`, v[0], [[v[1], "doesn’t dan keyin fe’l asl shaklda (-s qo‘shilmaydi)."], [`${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""}`, "doesn’t + fe’lning asl shakli."], [`to ${v[0]}`, "doesn’t dan keyin “to” qo‘yilmaydi."]], `doesn’t + ${v[0]} (s yo‘q!).`),
    );
  }

  // D. So'roq va qisqa javob
  for (const v of V) {
    const [s, third] = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const subj = lowerSubj(s);
    const right = third ? "Does" : "Do";
    pool.push(
      mc(3, `___ ${subj} ${v[0]} ${v[4]}?`, right, [
        [third ? "Do" : "Does", third ? `${subj} — he / she → Does.` : `${subj} — you / we / they → Do.`],
        [third ? "Is" : "Are", "Present Simple so‘rog‘ida Do / Does ishlatiladi."],
        ["Have", "Present Simple so‘rog‘i — Do / Does bilan."],
      ], `So‘roq: ${right} + ${subj} + fe’lning asl shakli?`),
    );
    if (third) pool.push(mc(3, `Does ${subj} ___ ${v[4]}? (${v[0]})`, v[0], [[v[1], "Does dan keyin fe’l asl shaklda."], [`${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""}`, "Does + asl shakl."], [`${v[1]}s`.replace("ss", "s"), "Does + asl shakl."]].filter((w, i, a) => a.findIndex((y) => y[0] === w[0]) === i && w[0] !== v[0]), "Does + fe’lning asl shakli."));
  }
  const SA = [
    ["Do you like apples? — Yes, ___ .", "I do", [["I like", "Qisqa javob: Yes, I do."], ["I am", "Do savoliga do bilan javob."], ["you do", "“you” deb so‘rashsa — I."]]],
    ["Do you play chess? — No, ___ .", "I don’t", [["I doesn’t", "I bilan don’t."], ["I’m not", "Do savoliga don’t bilan."], ["I not", "don’t kerak."]]],
    ["Does Ali speak English? — Yes, ___ .", "he does", [["he do", "he bilan does."], ["he is", "Does savoliga does bilan."], ["he speaks", "Qisqa javob: Yes, he does."]]],
    ["Does your mother cook well? — Yes, ___ .", "she does", [["she do", "she bilan does."], ["she cooks", "Qisqa javob: Yes, she does."], ["she is", "Does savoliga does bilan."]]],
    ["Does Malika like milk? — No, ___ .", "she doesn’t", [["she don’t", "she bilan doesn’t."], ["she isn’t", "Does savoliga doesn’t bilan."], ["she not", "doesn’t kerak."]]],
    ["Do they live in Tashkent? — Yes, ___ .", "they do", [["they does", "they bilan do."], ["they are", "Do savoliga do bilan."], ["they live", "Qisqa javob: Yes, they do."]]],
    ["Do your friends play football? — No, ___ .", "they don’t", [["they doesn’t", "they bilan don’t."], ["they aren’t", "Do savoliga don’t bilan."], ["we don’t", "“your friends” → they."]]],
    ["Does the cat drink milk? — Yes, ___ .", "it does", [["it do", "it bilan does."], ["it is", "Does savoliga does bilan."], ["he does", "cat → it."]]],
    ["Do you and Ali go to school? — Yes, ___ .", "we do", [["we does", "we bilan do."], ["they do", "“you and Ali” → we."], ["we are", "Do savoliga do bilan."]]],
    ["Does your brother get up early? — No, ___ .", "he doesn’t", [["he don’t", "he bilan doesn’t."], ["he isn’t", "Does savoliga doesn’t bilan."], ["she doesn’t", "brother → he."]]],
    ["Does your dad drive a car? — Yes, ___ .", "he does", [["he drives", "Qisqa javob: Yes, he does."], ["he do", "he bilan does."], ["he is", "Does savoliga does bilan."]]],
    ["Do you watch TV in the evening? — No, ___ .", "I don’t", [["I doesn’t", "I bilan don’t."], ["I’m not", "Do savoliga don’t bilan."], ["you don’t", "Javobda I."]]],
  ];
  for (const [q, right, ws] of SA) pool.push(mc(3, q, right, ws, `Qisqa javob: ${right}.`));

  // E. To'g'ri gap (+ chastota ravishi o'rni)
  for (const v of V) {
    const [s, third] = pick(SUBJ, r);
    const f = pick(FREQ, r);
    const verb = third ? v[1] : v[0];
    const right = `${s} ${f} ${verb} ${v[4]}.`;
    pool.push(
      mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, [
        [`${s} ${f} ${third ? v[0] : v[1]} ${v[4]}.`, third ? `${s} — he / she → ${v[1]}.` : `${s} bilan -s qo‘shilmaydi.`],
        [`${s} ${verb} ${f} ${v[4]}.`.replace(`${v[1]} ${f}`, `${v[1]} ${f}`), `“${f}” fe’ldan OLDIN keladi: ${s} ${f} ${verb}.`],
        [`${s} ${f} ${ING(head(v[0]))}${tail(v[0]) ? " " + tail(v[0]) : ""} ${v[4]}.`, `“${f}” — odat, Present Simple: fe’l -ing olmaydi.`],
      ], `Present Simple + chastota ravishi (${f}) fe’ldan oldin: ${right}`),
    );
  }

  return {
    code: "KG10",
    unit: 10,
    title: "10. Present Simple",
    title_uz: "Oddiy hozirgi zamon · 200 ta test",
    seed: 10010,
    parts: PARTS,
    quotas: [[0, 35], [1, 55], [2, 45], [3, 40], [4, 25]],
    pool,
    intro: {
      what: "Present Simple — doimiy, har doim takrorlanadigan ishlar va faktlar uchun: I go to school every day.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Present Simple: positive",
          name_uz: "Darak gap",
          summary: "Odat, kundalik ish, doimiy holat va faktlarni aytish uchun. He / she / it bilan fe’lga -s qo‘shiladi — bu eng muhim qoida!",
          usage: [
            { text: "Odat va kundalik ishlar.", example: { en: "I get up at 7 o’clock every day.", uz: "Men har kuni soat 7 da turaman." } },
            { text: "Doimiy holat.", example: { en: "My uncle lives in London.", uz: "Amakim Londonda yashaydi." } },
            { text: "Faktlar.", example: { en: "The sun rises in the east.", uz: "Quyosh sharqdan chiqadi." } },
          ],
          structure: [
            { type: "+", formula: "I / you / we / they + verb", example: { en: "They play football.", uz: "Ular futbol o‘ynaydi." } },
            { type: "+", formula: "he / she / it + verb-s", example: { en: "She plays the piano.", uz: "U pianino chaladi." } },
          ],
          signals: [
            { en: "every day / every morning", uz: "har kuni / har tong" },
            { en: "always", uz: "doim" },
            { en: "usually", uz: "odatda" },
            { en: "often", uz: "tez-tez" },
            { en: "sometimes", uz: "ba’zan" },
            { en: "never", uz: "hech qachon" },
            { en: "on Mondays / at weekends", uz: "dushanbalari / dam olish kunlari" },
          ],
          tip: "always, usually, often, sometimes, never — fe’ldan OLDIN keladi: She always helps me.",
        },
        {
          name: "Spelling: he / she / it + s",
          name_uz: "-s qo‘shish qoidalari",
          summary: "Otlarning ko‘pligi kabi: oddiy -s, ba’zilarga -es, y → ies, have → has.",
          usage: [
            { text: "Oddiy -s: play → plays, read → reads, like → likes.", example: { en: "He reads books.", uz: "U kitob o‘qiydi." } },
            { text: "-es: watch → watches, go → goes, do → does, wash → washes, fix → fixes.", example: { en: "She goes to school.", uz: "U maktabga boradi." } },
            { text: "y → ies: study → studies, fly → flies, cry → cries. Lekin: play → plays, buy → buys.", example: { en: "My brother studies maths.", uz: "Akam matematika o‘qiydi." } },
            { text: "Istisno: have → has.", example: { en: "She has lunch at 1.", uz: "U soat 1 da tushlik qiladi." } },
          ],
          structure: [
            { type: "+", formula: "watch → watches, go → goes, study → studies", example: { en: "Ali watches cartoons.", uz: "Ali multfilm ko‘radi." } },
          ],
          signals: [],
          tip: "-s faqat he / she / it (va bitta odam / narsa) bilan! “I plays”, “They goes” — XATO.",
        },
        {
          name: "Negative and questions",
          name_uz: "Inkor va so‘roq",
          summary: "Inkor va so‘roqda yordamchi fe’l do / does ishlatiladi. Does bo‘lsa, -s yordamchi fe’lga o‘tadi — asosiy fe’l asl shaklida qoladi!",
          usage: [
            { text: "Inkor: don’t / doesn’t + asl fe’l.", example: { en: "He doesn’t like milk.", uz: "U sutni yoqtirmaydi." } },
            { text: "So‘roq: Do / Does + ega + asl fe’l?", example: { en: "Does she speak English?", uz: "U inglizcha gapiradimi?" } },
            { text: "Qisqa javob: Yes, I do. / No, she doesn’t.", example: { en: "Do you like cats? — Yes, I do.", uz: "Mushuklarni yoqtirasanmi? — Ha." } },
          ],
          structure: [
            { type: "-", formula: "I / you / we / they + don’t + verb", example: { en: "We don’t go to school on Sunday.", uz: "Yakshanba kuni maktabga bormaymiz." } },
            { type: "-", formula: "he / she / it + doesn’t + verb", example: { en: "She doesn’t watch TV.", uz: "U televizor ko‘rmaydi." } },
            { type: "?", formula: "Do / Does + subject + verb?", example: { en: "Do they live here?", uz: "Ular shu yerda yashaydimi?" } },
            { type: "short", formula: "Yes, he does. / No, they don’t.", example: { en: "Does Ali play chess? — No, he doesn’t.", uz: "Ali shaxmat o‘ynaydimi? — Yo‘q." } },
          ],
          signals: [],
          tip: "“She doesn’t likes” — XATO. doesn’t dan keyin -s yo‘q: “She doesn’t like”.",
        },
      ],
      mistakes: [
        { wrong: "He play football.", right: "He plays football.", why: "he → -s." },
        { wrong: "She watchs TV.", right: "She watches TV.", why: "-ch → -es." },
        { wrong: "He studys.", right: "He studies.", why: "y → ies." },
        { wrong: "She don’t like milk.", right: "She doesn’t like milk.", why: "she → doesn’t." },
        { wrong: "Does he plays?", right: "Does he play?", why: "Does + asl fe’l." },
        { wrong: "I go always to school.", right: "I always go to school.", why: "always — fe’ldan oldin." },
      ],
    },
  };
}
