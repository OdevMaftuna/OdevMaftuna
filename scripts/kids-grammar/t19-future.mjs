// 19. FUTURE SIMPLE (will). BE GOING TO. PRESENT CONTINUOUS (kelishilgan reja).
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { BE, SUBJ, VERBS, lower, pron, uw } from "./verbs.mjs";

const FUT_T = ["tomorrow", "next week", "next year", "next Sunday", "in two days", "tonight", "this weekend"];
// Bashorat (I think … will)
const PRED = [
  ["it", "rain tomorrow", "yomg‘ir yog‘adi"], ["our team", "win the match", "jamoamiz yutadi"], ["you", "pass the exam", "imtihondan o‘tasan"], ["she", "like your present", "sovg‘ang unga yoqadi"],
  ["people", "live on Mars one day", "odamlar Marsda yashaydi"], ["the test", "be easy", "test oson bo‘ladi"], ["Ali", "be a good doctor", "Ali yaxshi shifokor bo‘ladi"], ["it", "be sunny on Sunday", "yakshanba quyoshli bo‘ladi"],
  ["robots", "do our homework in the future", "robotlar uy vazifamizni qiladi"], ["the bus", "come soon", "avtobus tez keladi"], ["they", "be late", "ular kechikadi"], ["my mum", "be happy", "onam xursand bo‘ladi"],
];
// Darhol qaror / taklif / va'da
const INSTANT = [
  ["The phone is ringing. I ___ answer it.", "darhol qaror"], ["It’s cold. I ___ close the window.", "darhol qaror"], ["Your bag looks heavy. I ___ help you.", "taklif"],
  ["I’m thirsty. — I ___ get you some water.", "taklif"], ["I promise I ___ call you every day.", "va’da"], ["Don’t worry, I ___ tell anybody your secret. (−)", "va’da"],
  ["There’s no milk. — OK, I ___ buy some.", "darhol qaror"], ["The door is open. I ___ shut it.", "darhol qaror"], ["You forgot your pen? I ___ lend you mine.", "taklif"],
  ["I ___ always love you, Mum.", "va’da"], ["It’s dark. I ___ turn on the light.", "darhol qaror"], ["I can’t do this sum. — Don’t worry, I ___ show you.", "taklif"],
];
// Dalil bor (going to)
const EVID = [
  ["Look at those black clouds! It ___ rain.", "is going to"], ["Be careful! You ___ fall!", "are going to"], ["Look! The baby ___ cry.", "is going to"],
  ["The bus is very fast. It ___ crash!", "is going to"], ["He is running very fast. He ___ win the race.", "is going to"], ["Look at the sky! It ___ snow.", "is going to"],
];
// Rejalar (going to)
const PLANS = [
  ["visit Grandma", "buvini ziyorat qilish"], ["buy a new phone", "yangi telefon olish"], ["learn to swim", "suzishni o‘rganish"], ["paint the kitchen", "oshxonani bo‘yash"],
  ["study harder", "ko‘proq o‘qish"], ["travel to Samarkand", "Samarqandga borish"], ["have a party", "bazm qilish"], ["play chess", "shaxmat o‘ynash"],
  ["watch a film", "film ko‘rish"], ["clean the garden", "bog‘ni tozalash"], ["read this book", "bu kitobni o‘qish"], ["cook plov", "palov pishirish"],
];
// Kelishilgan reja (Present Continuous)
const ARR = [
  ["meet Ali at 5 tomorrow", "meeting Ali at 5 tomorrow"], ["fly to Istanbul on Friday", "flying to Istanbul on Friday"], ["see the dentist tomorrow morning", "seeing the dentist tomorrow morning"],
  ["have a party on Saturday", "having a party on Saturday"], ["play football with my cousins on Sunday", "playing football with my cousins on Sunday"], ["visit the museum next Monday", "visiting the museum next Monday"],
  ["go to the cinema tonight", "going to the cinema tonight"], ["leave at 8 tomorrow", "leaving at 8 tomorrow"],
];
const PARTS = [
  "A. will / won’t · Bashorat, qaror, va’da",
  "B. am / is / are going to",
  "C. will yoki going to?",
  "D. Present Continuous — kelishilgan reja",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(1919);
  const pool = [];

  // A
  for (const [s, rest, uz] of PRED) {
    for (const lead of ["I think", "I’m sure", "Maybe", "I hope"]) {
      const [v, ...o] = rest.split(" ");
      pool.push(mc(0, `${lead} ${s} ___ ${o.join(" ")}. (${uz})`.replace(/___ (.)/, `___ $1`), `will ${v}`, uw(`will ${v}`, [
        [`will ${v === "be" ? "is" : `${v}s`}`, "will + fe’lning asl shakli (-s yo‘q)."], [`will to ${v}`, "will dan keyin “to” qo‘yilmaydi."], [`wills ${v}`, "will hamma ega bilan bir xil."], [`${v === "be" ? "being" : `${v}ing`.replace(/eing$/, "ing")}`, "Kelasi zamon: will + asl fe’l."],
      ]), `${lead} … → bashorat: will + ${v}.`));
    }
  }
  for (const [q, kind] of INSTANT) {
    const neg = q.includes("(−)");
    const right = neg ? "won’t" : "’ll";
    pool.push(mc(0, q, right, uw(right, [
      [neg ? "don’t" : "am", neg ? "Kelasi zamon inkori: won’t (= will not)." : `${kind} → will (’ll), am emas.`],
      [neg ? "willn’t" : "’m going", neg ? "willn’t degan shakl yo‘q — won’t." : `Shu daqiqada qabul qilingan qaror (${kind}) → will.`],
      [neg ? "not will" : "do", neg ? "will not → won’t." : `${kind} → will.`],
    ]), `${kind} → will (’ll).`));
  }

  // B. going to
  for (const [p, uz] of PLANS) {
    for (const s of shuffle(SUBJ, r).slice(0, 3)) {
      const be = BE(s[2]);
      const t = pick(FUT_T, r);
      pool.push(mc(1, `${s[0]} ___ going to ${p} ${t}. (reja: ${uz})`, be, uw(be, [
        [be === "is" ? "are" : "is", `${s[0]} bilan ${be}.`], ["will", "will going to — xato. am / is / are going to."], ["do", "am / is / are + going to."],
      ]), `Reja → ${s[0]} ${be} going to + fe’l.`));
    }
  }
  for (const [q, a] of EVID) pool.push(mc(1, q, a, uw(a, [["will", "Ko‘rinib turgan dalil bor → going to."], [a.replace("going to", "going"), "going TO bo‘lishi kerak."], [`${a.split(" ")[0]} go to`, "be + going to + fe’l."]]), "Dalil asosida bashorat → going to."));

  // C. will yoki going to
  for (const [p, uz] of PLANS) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const right = `${BE(s[2])} going to ${p.split(" ")[0]}`;
    pool.push(mc(2, `${s[0]} ${s[1] ? "has" : "have"} already decided: ${pron(s)} ___ ${p.split(" ").slice(1).join(" ")} next week.`, right, uw(right, [
      [`will ${p.split(" ")[0]}`, "Oldindan qaror qilingan reja (already decided) → going to."], [`${BE(s[2])} going ${p.split(" ")[0]}`, "going TO + fe’l."], [`going to ${p.split(" ")[0]}`, "am / is / are tushib qolgan."],
    ]), `Oldindan reja → be going to.`));
  }
  for (const [p, uz] of PLANS) {
    const [v, ...o] = p.split(" ");
    const right = `are going to ${v}`;
    pool.push(mc(2, `We made a plan last week. We ___ ${o.join(" ")} on Saturday. (${uz})`, right, uw(right, [
      [`will ${v}`, "O‘tgan haftadayoq tuzilgan reja → going to."], [`are going ${v}`, "going TO + fe’l."], [`is going to ${v}`, "We bilan are."],
    ]), "Oldindan tuzilgan reja → be going to."));
  }
  for (const [q, kind] of INSTANT.filter((x) => !x[0].includes("(−)"))) {
    pool.push(mc(2, q.replace("___", "___"), "will", uw("will", [
      ["am going to", `Gapirish paytida qabul qilingan qaror (${kind}) → will.`], ["going to", "Darhol qaror → will."], ["am", "Darhol qaror → will."],
    ]), `${kind} → will.`));
  }
  for (const [q, a] of EVID) pool.push(mc(2, q.replace("___", "___"), a, uw(a, [["will", "Ko‘z oldidagi dalil (Look!, clouds) → going to."], ["is", "be going to kerak."], ["going to", "am / is / are tushib qolgan."]]), "Dalil bor → going to."));

  // D. Present Continuous (arrangement)
  for (const [base, ing] of ARR) {
    for (const s of shuffle(SUBJ, r).slice(0, 4)) {
      const right = `${BE(s[2])} ${ing.split(" ")[0]}`;
      const rest = ing.split(" ").slice(1).join(" ");
      pool.push(mc(3, `${s[0]} ___ ${rest}. (kelishib qo‘yilgan, chipta / vaqt bor)`, right, uw(right, [
        [base.split(" ")[0] + (s[1] ? "s" : ""), "Kelasi kelishilgan reja → Present Continuous (be + -ing)."], [`${BE(s[2] === 1 ? 2 : 1)} ${ing.split(" ")[0]}`, `${s[0]} bilan ${BE(s[2])}.`], [`${BE(s[2])} ${base.split(" ")[0]}`, "be + -ing."],
      ]), `Kelishilgan reja → ${s[0]} ${right}.`));
    }
  }

  // E. To'g'ri gap
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const t = pick(FUT_T, r);
    const right = `${s[0]} will ${v.b} ${v.o} ${t}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`${s[0]} will ${v.s} ${v.o} ${t}.`, "will + asl fe’l (-s yo‘q)."], [`${s[0]} will to ${v.b} ${v.o} ${t}.`, "will dan keyin to yo‘q."],
      [`${s[0]} ${BE(s[2])} going ${v.b} ${v.o} ${t}.`, "going TO."], [`${s[0]} will ${v.ing} ${v.o} ${t}.`, "will + asl fe’l."],
    ]), `will + asl fe’l: ${right}`));
  }

  return {
    code: "KG19",
    unit: 19,
    title: "19. Future Simple Tense. Be going to and Present Continuous",
    title_uz: "Kelasi zamon: will, be going to, Present Continuous · 200 ta test",
    seed: 19019,
    parts: PARTS,
    quotas: [[0, 50], [1, 40], [2, 35], [3, 30], [4, 45]],
    pool,
    intro: {
      what: "Kelajak haqida gapirishning uch yo‘li: will, be going to va Present Continuous.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Future Simple: will",
          name_uz: "will",
          summary: "will + asl fe’l. Bashorat (I think …), gapirish paytidagi qaror, taklif va va’da uchun. Hamma ega bilan bir xil.",
          usage: [
            { text: "Bashorat (fikr).", example: { en: "I think it will rain tomorrow.", uz: "Menimcha, ertaga yomg‘ir yog‘adi." } },
            { text: "Darhol qaror.", example: { en: "The phone is ringing. I’ll answer it.", uz: "Telefon jiringlayapti. Men olaman." } },
            { text: "Taklif va va’da.", example: { en: "I’ll help you. I won’t forget.", uz: "Senga yordam beraman. Unutmayman." } },
          ],
          structure: [
            { type: "+", formula: "subject + will (’ll) + verb", example: { en: "She will come.", uz: "U keladi." } },
            { type: "-", formula: "subject + won’t + verb", example: { en: "They won’t be late.", uz: "Ular kechikmaydi." } },
            { type: "?", formula: "Will + subject + verb?", example: { en: "Will you help me?", uz: "Yordam berasanmi?" } },
          ],
          signals: [
            { en: "tomorrow / next week / in two days", uz: "ertaga / keyingi hafta / ikki kundan keyin" },
            { en: "I think / I’m sure / maybe / probably", uz: "menimcha / ishonaman / balki / ehtimol" },
          ],
          tip: "“She will comes”, “I will to go” — XATO. will + asl fe’l.",
        },
        {
          name: "Be going to",
          name_uz: "Reja va dalil",
          summary: "am / is / are + going to + asl fe’l. Oldindan qilingan reja yoki ko‘rinib turgan dalilga asoslangan bashorat.",
          usage: [
            { text: "Oldindan reja.", example: { en: "I’m going to visit my grandma on Sunday.", uz: "Yakshanba buvimnikiga bormoqchiman." } },
            { text: "Dalil bor.", example: { en: "Look at the clouds! It’s going to rain.", uz: "Bulutlarga qara! Yomg‘ir yog‘adi." } },
          ],
          structure: [
            { type: "+", formula: "am / is / are + going to + verb", example: { en: "We are going to play.", uz: "Biz o‘ynamoqchimiz." } },
            { type: "-", formula: "am not / isn’t / aren’t + going to", example: { en: "He isn’t going to come.", uz: "U kelmoqchi emas." } },
          ],
          signals: [],
          tip: "Darhol qaror → will; avvaldan reja → going to.",
        },
        {
          name: "Present Continuous for the future",
          name_uz: "Kelishilgan reja",
          summary: "Vaqti va joyi kelishib qo‘yilgan reja (chipta olingan, uchrashuv belgilangan) → am / is / are + -ing + kelasi vaqt.",
          usage: [
            { text: "Kelishilgan uchrashuv.", example: { en: "I’m meeting Ali at 5 tomorrow.", uz: "Ertaga soat 5 da Ali bilan uchrashaman." } },
          ],
          structure: [{ type: "+", formula: "am / is / are + verb-ing + future time", example: { en: "We’re flying to Dubai on Friday.", uz: "Juma kuni Dubayga uchamiz." } }],
          signals: [],
          tip: "Kelasi vaqt so‘zi (tomorrow, on Friday) bo‘lishi shart — aks holda bu “hozir” ma’nosini beradi.",
        },
      ],
      mistakes: [
        { wrong: "I will to call you.", right: "I will call you.", why: "will + asl fe’l." },
        { wrong: "He wills come.", right: "He will come.", why: "will o‘zgarmaydi." },
        { wrong: "She going to buy a car.", right: "She is going to buy a car.", why: "is tushib qolgan." },
        { wrong: "Look at the clouds! It will rain.", right: "Look at the clouds! It’s going to rain.", why: "Dalil → going to." },
        { wrong: "I willn’t tell.", right: "I won’t tell.", why: "will not → won’t." },
      ],
    },
  };
}
