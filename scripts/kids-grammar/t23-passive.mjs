// 23. PASSIVE VOICE — Present Simple va Past Simple majhul nisbat.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// Hozirgi zamon: [ega, birlikmi, fe'l asl, V3, davomi, o'zbekcha]
const PRES = [
  ["English", 1, "speak", "spoken", "in many countries", "ingliz tilida ko‘p davlatlarda gapiriladi"], ["Rice", 1, "grow", "grown", "in Asia", "guruch Osiyoda yetishtiriladi"],
  ["Cars", 0, "make", "made", "in this factory", "mashinalar shu zavodda ishlab chiqariladi"], ["The classroom", 1, "clean", "cleaned", "every day", "sinf har kuni tozalanadi"],
  ["Letters", 0, "deliver", "delivered", "every morning", "xatlar har tong yetkaziladi"], ["Bread", 1, "bake", "baked", "every morning", "non har tong yopiladi"],
  ["These toys", 0, "sell", "sold", "all over the world", "bu o‘yinchoqlar butun dunyoda sotiladi"], ["The windows", 0, "wash", "washed", "once a month", "derazalar oyda bir yuviladi"],
  ["Plov", 1, "cook", "cooked", "in a big pot", "palov katta qozonda pishiriladi"], ["Tea", 1, "drink", "drunk", "everywhere in Uzbekistan", "choy O‘zbekistonda hamma joyda ichiladi"],
  ["Cotton", 1, "grow", "grown", "in Uzbekistan", "paxta O‘zbekistonda yetishtiriladi"], ["The animals", 0, "feed", "fed", "twice a day", "hayvonlar kuniga ikki marta boqiladi"],
  ["Football", 1, "play", "played", "in every country", "futbol har bir davlatda o‘ynaladi"], ["The letters", 0, "write", "written", "by hand", "xatlar qo‘lda yoziladi"],
  ["Milk", 1, "sell", "sold", "in bottles", "sut shishalarda sotiladi"], ["The rooms", 0, "paint", "painted", "every year", "xonalar har yili bo‘yaladi"],
  ["Breakfast", 1, "serve", "served", "at 8 o’clock", "nonushta soat 8 da tortiladi"], ["Many books", 0, "read", "read", "by children", "ko‘p kitoblar bolalar tomonidan o‘qiladi"],
  ["Our homework", 1, "check", "checked", "by the teacher", "uy vazifamiz o‘qituvchi tomonidan tekshiriladi"], ["The doors", 0, "close", "closed", "at 9 pm", "eshiklar soat 21 da yopiladi"],
];
// O'tgan zamon
const PAST = [
  ["The window", 1, "break", "broken", "yesterday", "deraza kecha sindirildi"], ["This house", 1, "build", "built", "in 1990", "bu uy 1990-yilda qurilgan"],
  ["The cake", 1, "make", "made", "by my mum", "tort onam tomonidan pishirildi"], ["The letters", 0, "send", "sent", "last week", "xatlar o‘tgan hafta yuborildi"],
  ["Romeo and Juliet", 1, "write", "written", "by Shakespeare", "“Romeo va Julyetta” Shekspir tomonidan yozilgan"], ["The thief", 1, "catch", "caught", "by the police", "o‘g‘ri politsiya tomonidan ushlandi"],
  ["My bike", 1, "steal", "stolen", "last night", "velosipedim kecha kechasi o‘g‘irlandi"], ["The pictures", 0, "paint", "painted", "by children", "rasmlar bolalar tomonidan chizildi"],
  ["The game", 1, "win", "won", "by our team", "o‘yinda jamoamiz g‘olib bo‘ldi"], ["These photos", 0, "take", "taken", "in Samarkand", "bu suratlar Samarqandda olingan"],
  ["The telephone", 1, "invent", "invented", "by Bell", "telefon Bell tomonidan ixtiro qilingan"], ["The cups", 0, "wash", "washed", "after dinner", "piyolalar kechki ovqatdan keyin yuvildi"],
  ["The money", 1, "find", "found", "under the bed", "pul karavot ostidan topildi"], ["The students", 0, "give", "given", "new books", "o‘quvchilarga yangi kitoblar berildi"],
  ["The film", 1, "show", "shown", "on TV last night", "film kecha televizorda ko‘rsatildi"], ["The doors", 0, "open", "opened", "at 8 am", "eshiklar ertalab 8 da ochildi"],
  ["America", 1, "discover", "discovered", "in 1492", "Amerika 1492-yilda kashf etilgan"], ["The trees", 0, "plant", "planted", "last spring", "daraxtlar o‘tgan bahorda ekildi"],
  ["The food", 1, "eat", "eaten", "very quickly", "ovqat juda tez yeyildi"], ["The songs", 0, "sing", "sung", "by the children", "qo‘shiqlar bolalar tomonidan kuylandi"],
];
// Aktiv → passiv
const ACT = [
  ["Ali broke the window.", "The window was broken by Ali.", "broke"],
  ["My mum cooks dinner every day.", "Dinner is cooked by my mum every day.", "cooks"],
  ["Shakespeare wrote Hamlet.", "Hamlet was written by Shakespeare.", "wrote"],
  ["The teacher checks our tests.", "Our tests are checked by the teacher.", "checks"],
  ["The children painted these pictures.", "These pictures were painted by the children.", "painted"],
  ["People speak English here.", "English is spoken here.", "speak"],
  ["Farmers grow cotton.", "Cotton is grown by farmers.", "grow"],
  ["The police caught the thief.", "The thief was caught by the police.", "caught"],
  ["My dad built this house.", "This house was built by my dad.", "built"],
  ["The cat ate the fish.", "The fish was eaten by the cat.", "ate"],
  ["Malika cleans the rooms.", "The rooms are cleaned by Malika.", "cleans"],
  ["The boys won the game.", "The game was won by the boys.", "won"],
  ["My sister made this cake.", "This cake was made by my sister.", "made"],
  ["They sell bread here.", "Bread is sold here.", "sell"],
  ["Ali sent the letters.", "The letters were sent by Ali.", "sent"],
  ["The workers repaired the road.", "The road was repaired by the workers.", "repaired"],
  ["Grandma waters the flowers.", "The flowers are watered by Grandma.", "waters"],
  ["The students planted the trees.", "The trees were planted by the students.", "planted"],
];
const PARTS = [
  "A. is / are + V3 · Present Simple Passive",
  "B. was / were + V3 · Past Simple Passive",
  "C. Fe’lning 3-shakli · Past participle",
  "D. Aktivdan passivga · Active → Passive",
  "E. Inkor va so‘roq · isn’t / wasn’t, Is … ? / Was … ?",
];

export function build() {
  const r = rng(2323);
  const pool = [];
  const V2 = { speak: "spoke", grow: "grew", make: "made", sell: "sold", drink: "drank", feed: "fed", write: "wrote", read: "read", break: "broke", build: "built", send: "sent", catch: "caught", steal: "stole", win: "won", take: "took", find: "found", give: "gave", show: "showed", eat: "ate", sing: "sang" };
  const v2 = (b) => V2[b] ?? (b.endsWith("e") ? `${b}d` : `${b}ed`);

  for (const [s, sg, b, pp, rest, uz] of PRES) {
    const be = sg ? "is" : "are";
    pool.push(mc(0, `${s} ___ ${pp} ${rest}. (${uz})`, be, uw(be, [[sg ? "are" : "is", `${s} — ${sg ? "birlik → is" : "ko‘plik → are"}.`], [sg ? "was" : "were", "Hozirgi odat / fakt → is / are."], ["does", "Passiv: be + V3 (does emas)."]]), `Present Simple Passive: ${be} + V3.`));
    const right = `${be} ${pp}`;
    pool.push(mc(0, `${s} ___ ${rest}. (${b} — ${uz})`, right, uw(right, [[sg ? b + "s" : b, "Ega ishni o‘zi qilmaydi → passiv: is / are + V3."], [`${be} ${b}`, "be + V3 (asl shakl emas)."], [`${sg ? "are" : "is"} ${pp}`, `${s} bilan ${be}.`], [`${be} ${b}ing`.replace(/eing$/, "ing"), "Passiv: be + V3."]]), `Passiv: ${right}.`));
  }
  for (const [s, sg, b, pp, rest, uz] of PAST) {
    const be = sg ? "was" : "were";
    pool.push(mc(1, `${s} ___ ${pp} ${rest}. (${uz})`, be, uw(be, [[sg ? "were" : "was", `${s} — ${sg ? "birlik → was" : "ko‘plik → were"}.`], [sg ? "is" : "are", "O‘tgan zamon → was / were."], ["did", "Passiv: was / were + V3."]]), `Past Simple Passive: ${be} + V3.`));
    const right = `${be} ${pp}`;
    pool.push(mc(1, `${s} ___ ${rest}. (${b} — ${uz})`, right, uw(right, [[v2(b), "Ega ishni o‘zi qilmagan → passiv: was / were + V3."], [`${be} ${v2(b) === pp ? b : v2(b)}`, `was / were + V3: ${pp}.`], [`${sg ? "were" : "was"} ${pp}`, `${s} bilan ${be}.`], [`${sg ? "is" : "are"} ${pp}`, "O‘tgan zamon → was / were."]]), `Passiv: ${right}.`));
  }
  const ALLV = [...PRES, ...PAST].map((x) => [x[2], x[3], x[0], x[1], x[4]]);
  const seen = new Set();
  for (const [b, pp, s, sg, rest] of ALLV) {
    if (seen.has(b)) continue;
    seen.add(b);
    const ws = [[b, "Passivda fe’lning 3-shakli (V3) keladi."], [`${b}ing`.replace(/eing$/, "ing"), "Passiv: be + V3."]];
    if (v2(b) !== pp) ws.unshift([v2(b), `${v2(b)} — 2-shakl. Passivda 3-shakl: ${pp}.`]);
    else ws.push([b.endsWith("e") ? `${b}ed` : `${b}en`, `To‘g‘ri shakl: ${pp}.`]);
    ws.push([`${b}s`, "Passiv: be + V3."]);
    pool.push(mc(2, `${s} ${pick(["is", "was"], r) === "is" ? (sg ? "is" : "are") : sg ? "was" : "were"} ___ ${rest}. (${b})`, pp, uw(pp, ws), `${b} → ${pp} (V3).`));
    pool.push(mc(2, `${b} → V3: ___`, pp, uw(pp, ws), `${b} – ${v2(b)} – ${pp}.`));
  }
  for (const [act, pas, av] of ACT) {
    const m = pas.match(/^(.+?) (is|are|was|were) (\S+)(.*)$/);
    const [, subj, be, pp, tail] = m;
    const ws = [
      [`${subj} ${be} ${av === pp ? av.replace(/ed$/, "") : av}${tail}`, "Passivda be + V3 kerak."],
      [`${subj} ${be === "is" ? "are" : be === "are" ? "is" : be === "was" ? "were" : "was"} ${pp}${tail}`, `${subj} bilan ${be}.`],
      [`${subj} ${/was|were/.test(be) ? (be === "was" ? "is" : "are") : be === "is" ? "was" : "were"} ${pp}${tail}`, "Zamon aktiv gapdagi bilan bir xil qoladi."],
      [`${subj} ${pp}${tail}`, "be (is / are / was / were) tushib qolgan."],
    ];
    pool.push(mc(3, `Make it passive: “${act}”`, pas, uw(pas, ws), `Aktiv → passiv: ${pas}`));
  }

  // E
  for (const [s, sg, b, pp, rest] of PRES) {
    const neg = sg ? "isn’t" : "aren’t";
    pool.push(mc(4, `${s} ___ ${pp} ${rest}. (−)`, neg, uw(neg, [[sg ? "doesn’t" : "don’t", "Passiv inkori: isn’t / aren’t + V3."], [sg ? "aren’t" : "isn’t", `${s} bilan ${neg}.`], ["not", "be + not kerak."]]), `Inkor: ${neg} + V3.`));
    const q = sg ? "Is" : "Are";
    pool.push(mc(4, `___ ${s.replace(/^(The|These|Our|Many) /, (x) => x.toLowerCase())} ${pp} ${rest}?`, q, uw(q, [[sg ? "Does" : "Do", "Passiv so‘rog‘i: Is / Are + ega + V3?"], [sg ? "Are" : "Is", `${s} bilan ${q}.`], ["Has", "Passiv so‘rog‘i: Is / Are."]]), `So‘roq: ${q} + ega + V3?`));
  }
  for (const [s, sg, b, pp, rest] of PAST) {
    const neg = sg ? "wasn’t" : "weren’t";
    pool.push(mc(4, `${s} ___ ${pp} ${rest}. (−)`, neg, uw(neg, [["didn’t", "Passiv inkori: wasn’t / weren’t + V3."], [sg ? "weren’t" : "wasn’t", `${s} bilan ${neg}.`], [sg ? "isn’t" : "aren’t", "O‘tgan zamon."]]), `Inkor: ${neg} + V3.`));
    const q = sg ? "Was" : "Were";
    pool.push(mc(4, `___ ${s.replace(/^(The|These|My) /, (x) => x.toLowerCase())} ${pp} ${rest}?`, q, uw(q, [["Did", "Passiv so‘rog‘i: Was / Were + ega + V3?"], [sg ? "Were" : "Was", `${s} bilan ${q}.`], [sg ? "Is" : "Are", "O‘tgan zamon → Was / Were."]]), `So‘roq: ${q} + ega + V3?`));
  }

  return {
    code: "KG23",
    unit: 23,
    title: "23. Passive Voice",
    title_uz: "Majhul nisbat · 200 ta test",
    seed: 23023,
    parts: PARTS,
    quotas: [[0, 40], [1, 40], [2, 40], [3, 18], [4, 62]],
    pool,
    intro: {
      what: "Passiv (majhul nisbat) — ishni kim qilgani emas, ishning o‘zi yoki natijasi muhim bo‘lganda: The window was broken.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Present Simple Passive",
          name_uz: "Hozirgi zamon passiv",
          summary: "is / are + V3. Faktlar va doimiy ishlar uchun.",
          usage: [
            { text: "Kim qilgani muhim emas.", example: { en: "English is spoken all over the world.", uz: "Ingliz tilida butun dunyoda gapiriladi." } },
            { text: "by — kim tomonidan.", example: { en: "Our tests are checked by the teacher.", uz: "Testlarimiz o‘qituvchi tomonidan tekshiriladi." } },
          ],
          structure: [
            { type: "+", formula: "subject + is / are + V3", example: { en: "Cars are made in this factory.", uz: "Mashinalar shu zavodda ishlab chiqariladi." } },
            { type: "-", formula: "subject + isn’t / aren’t + V3", example: { en: "Tea isn’t grown here.", uz: "Bu yerda choy yetishtirilmaydi." } },
            { type: "?", formula: "Is / Are + subject + V3?", example: { en: "Is English spoken here?", uz: "Bu yerda inglizcha gapiriladimi?" } },
          ],
          signals: [],
          tip: "Passivda doim be + V3. “The room is clean every day” — passiv emas; “is cleaned” bo‘lishi kerak.",
        },
        {
          name: "Past Simple Passive",
          name_uz: "O‘tgan zamon passiv",
          summary: "was / were + V3. O‘tmishda qilingan ish.",
          usage: [
            { text: "O‘tmishda qilingan ish.", example: { en: "This house was built in 1990.", uz: "Bu uy 1990-yilda qurilgan." } },
            { text: "by bilan.", example: { en: "Hamlet was written by Shakespeare.", uz: "“Hamlet” Shekspir tomonidan yozilgan." } },
          ],
          structure: [
            { type: "+", formula: "subject + was / were + V3", example: { en: "The letters were sent yesterday.", uz: "Xatlar kecha yuborildi." } },
            { type: "-", formula: "subject + wasn’t / weren’t + V3", example: { en: "The window wasn’t broken.", uz: "Deraza sindirilmagan." } },
          ],
          signals: [],
          tip: "Aktiv → passiv: to‘ldiruvchi ega bo‘ladi, zamon o‘zgarmaydi: Ali broke the cup → The cup was broken by Ali.",
        },
      ],
      mistakes: [
        { wrong: "English is speak here.", right: "English is spoken here.", why: "be + V3." },
        { wrong: "The house built in 1990.", right: "The house was built in 1990.", why: "be tushib qolgan." },
        { wrong: "The cars was made in Japan.", right: "The cars were made in Japan.", why: "Ko‘plik → were." },
        { wrong: "The cake was maked by Mum.", right: "The cake was made by Mum.", why: "make → made." },
        { wrong: "Did the window broken?", right: "Was the window broken?", why: "So‘roq: Was + ega + V3." },
      ],
    },
  };
}
