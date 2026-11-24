// 22. MODAL VERBS — can, could, must, mustn't, have to, don't have to, should, may / might.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { SUBJ, VERBS, lower, pron, uw } from "./verbs.mjs";

// Qobiliyat: [faoliyat, o'zbekcha]
const ABIL = [
  ["swim", "suzish"], ["ride a bike", "velosiped haydash"], ["speak English", "inglizcha gapirish"], ["play the piano", "pianino chalish"], ["cook plov", "palov pishirish"],
  ["read", "o‘qish"], ["count to ten", "o‘ngacha sanash"], ["draw horses", "ot chizish"], ["climb trees", "daraxtga chiqish"], ["play chess", "shaxmat o‘ynash"],
];
// Qoidalar: [gap, javob, izoh]
const RULES = [
  ["You ___ talk in the library.", "mustn’t", "ta’qiq"], ["You ___ wear a seat belt in the car.", "must", "majburiyat"], ["Pupils ___ run in the corridor.", "mustn’t", "ta’qiq"],
  ["You ___ be quiet in the hospital.", "must", "majburiyat"], ["You ___ use your phone during the exam.", "mustn’t", "ta’qiq"], ["We ___ stop at a red light.", "must", "majburiyat"],
  ["You ___ swim here. It’s dangerous!", "mustn’t", "ta’qiq"], ["You ___ do your homework every day.", "must", "majburiyat"], ["Children ___ play with matches.", "mustn’t", "ta’qiq"],
  ["You ___ wash your hands before dinner.", "must", "majburiyat"], ["You ___ feed the animals in the zoo.", "mustn’t", "ta’qiq"], ["Drivers ___ have a licence.", "must", "majburiyat"],
  ["You ___ eat in the classroom.", "mustn’t", "ta’qiq"], ["You ___ listen to your teacher.", "must", "majburiyat"], ["You ___ throw rubbish in the street.", "mustn’t", "ta’qiq"],
  ["Students ___ wear a uniform at our school.", "must", "majburiyat"], ["You ___ cross the road here.", "mustn’t", "ta’qiq"], ["You ___ be late for school.", "mustn’t", "ta’qiq"],
];
// Maslahat
const ADVICE = [
  ["I have a headache. — You ___ take a rest.", "should", "maslahat"], ["You ___ eat so many sweets. They are bad for your teeth.", "shouldn’t", "maslahat (yo‘q)"],
  ["You look tired. You ___ go to bed early.", "should", "maslahat"], ["You ___ watch TV all day.", "shouldn’t", "maslahat (yo‘q)"], ["It’s cold. You ___ wear a warm coat.", "should", "maslahat"],
  ["You ___ be rude to your parents.", "shouldn’t", "maslahat (yo‘q)"], ["You have a test tomorrow. You ___ study tonight.", "should", "maslahat"], ["You ___ play computer games so late.", "shouldn’t", "maslahat (yo‘q)"],
  ["He’s ill. He ___ see a doctor.", "should", "maslahat"], ["She ___ drink more water.", "should", "maslahat"], ["You ___ talk to strangers.", "shouldn’t", "maslahat (yo‘q)"], ["We ___ help old people.", "should", "maslahat"],
];
// have to / don't have to
const HAVE_TO = [
  ["Tomorrow is Sunday. I ___ get up early.", "don’t have to", "kerak emas"], ["My dad ___ work on Saturdays. He is free.", "doesn’t have to", "kerak emas"],
  ["My mum is a doctor. She ___ work at night sometimes.", "has to", "zarurat"], ["We ___ wear a uniform at school. It’s the rule.", "have to", "zarurat"],
  ["You ___ pay. The museum is free.", "don’t have to", "kerak emas"], ["Ali ___ walk to school. His dad drives him.", "doesn’t have to", "kerak emas"],
  ["I ___ help my mum in the kitchen every evening.", "have to", "zarurat"], ["She ___ take medicine three times a day.", "has to", "zarurat"],
  ["You ___ bring food. There is a lot here.", "don’t have to", "kerak emas"], ["He ___ feed his dog every morning.", "has to", "zarurat"],
  ["They ___ go to school today. It’s a holiday.", "don’t have to", "kerak emas"], ["My brother ___ study hard. He has exams.", "has to", "zarurat"],
];
// Ruxsat / ehtimol
const MAY = [
  ["___ I come in, please?", "May", ["Must", "So‘rash (ruxsat) → May I …? / Can I …?"], ["Should", "Ruxsat so‘rash → May."], ["Have", "Ruxsat → May I?"]],
  ["___ I open the window? It’s hot.", "Can", ["Must", "Ruxsat so‘rash → Can / May."], ["Do", "Ruxsat → Can I?"], ["Have", "Ruxsat → Can I?"]],
  ["Take an umbrella. It ___ rain later. (balki)", "might", ["must", "Ehtimol (balki) → might / may."], ["should", "Ehtimol → might."], ["has to", "Ehtimol → might."]],
  ["I’m not sure. I ___ go to the party. (balki)", "may", ["must", "Ehtimol → may / might."], ["have to", "Ehtimol → may."], ["can’t", "Ehtimol → may."]],
  ["She ___ be at home. Her light is on. (ehtimol)", "may", ["must not", "Ehtimol → may."], ["shouldn’t", "Ehtimol → may."], ["has", "Ehtimol → may."]],
  ["We ___ visit Grandma at the weekend. We haven’t decided. (balki)", "might", ["must", "Qaror qilinmagan → might."], ["should", "Ehtimol → might."], ["have", "Ehtimol → might."]],
];
const PARTS = [
  "A. can / can’t / could / couldn’t · Ability",
  "B. must / mustn’t · Rules",
  "C. have to / don’t have to",
  "D. should / shouldn’t · may / might",
  "E. Modal + fe’l shakli · Modal + verb",
];

export function build() {
  const r = rng(2222);
  const pool = [];

  // A
  for (const [a, uz] of ABIL) {
    for (const s of shuffle(SUBJ, r).slice(0, 3)) {
      const now = pick([0, 1], r);
      if (now) {
        pool.push(mc(0, `${s[0]} ___ ${a} very well. (hozir qila oladi)`, "can", uw("can", [["could", "could — o‘tmishda qila olardi. Hozir → can."], ["cans", "can hamma ega bilan bir xil (-s yo‘q)."], ["must", "must — majburiyat, qobiliyat emas."]]), `Hozirgi qobiliyat → can.`));
      } else {
        pool.push(mc(0, `When ${pron(s) === "I" ? "I" : pron(s)} ${s[2] === 2 ? "were" : "was"} five, ${pron(s)} ___ ${a}. (o‘tmishda qila olardi)`, "could", uw("could", [["can", "O‘tmish (when … was five) → could."], ["could to", "could + asl fe’l (to yo‘q)."], ["was can", "Bunday shakl yo‘q."]]), "O‘tmishdagi qobiliyat → could."));
      }
      pool.push(mc(0, `${s[0]} ___ ${a}. (qila olmaydi)`, "can’t", uw("can’t", [["don’t can", "can inkori — can’t (cannot)."], ["can not to", "can’t + asl fe’l."], ["mustn’t", "mustn’t — ta’qiq, qobiliyat emas."]]), "Qila olmaslik → can’t."));
    }
    const s = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    pool.push(mc(0, `___ ${lower(s[0])} ${a}? — Yes, ${pron(s)} can.`, "Can", uw("Can", [[s[1] ? "Does" : "Do", "can bilan so‘roqda Do / Does ishlatilmaydi: Can + ega + fe’l?"], ["Is", "Can + ega + fe’l?"], ["Must", "Qobiliyat → Can."]]), "So‘roq: Can + ega + asl fe’l?"));
  }

  // B
  for (const [q, a, kind] of RULES) {
    pool.push(mc(1, q, a, uw(a, [
      [a === "must" ? "mustn’t" : "must", a === "must" ? "Bu majburiyat (kerak) → must." : "Bu ta’qiq (mumkin emas) → mustn’t."],
      [a === "must" ? "don’t have to" : "don’t have to", a === "must" ? "Majburiyat → must." : "don’t have to — “shart emas”; bu yerda “mumkin emas” → mustn’t."],
      [a === "must" ? "musts" : "don’t must", a === "must" ? "must o‘zgarmaydi." : "must inkori — mustn’t."],
    ]), `${kind} → ${a}.`));
    const vb = q.match(/___ (\S+)/)[1];
    const s3 = /(s|sh|ch|x|o)$/.test(vb) ? `${vb}es` : /[^aeiou]y$/.test(vb) ? `${vb.slice(0, -1)}ies` : `${vb}s`;
    const ing = vb.endsWith("e") && vb !== "be" ? `${vb.slice(0, -1)}ing` : `${vb}ing`;
    pool.push(mc(1, q.replace(`___ ${vb}`, `${a} ___`), vb, uw(vb, [
      [`to ${vb}`, "must / mustn’t dan keyin to qo‘yilmaydi."], [s3, "must + asl fe’l (-s yo‘q)."], [ing, "must + asl fe’l (-ing yo‘q)."],
    ]), "must / mustn’t + asl fe’l (to yo‘q)."));
  }

  // C
  for (const [q, a, kind] of HAVE_TO) {
    const third = /has|doesn’t/.test(a);
    pool.push(mc(2, q, a, uw(a, [
      [a.includes("n’t") ? "mustn’t" : "mustn’t", a.includes("n’t") ? "mustn’t — ta’qiq (mumkin emas); bu yerda “shart emas” → don’t / doesn’t have to." : "Zarurat → have / has to."],
      [third ? a.replace("doesn’t", "don’t").replace("has to", "have to") : a.replace("don’t", "doesn’t").replace("have to", "has to"), third ? "He / she → has to / doesn’t have to." : "I / you / we / they → have to / don’t have to."],
      [a.includes("n’t") ? (third ? "doesn’t has to" : "haven’t to") : third ? "has" : "have", a.includes("n’t") ? "Inkor: don’t / doesn’t + have to." : "have / has TO + fe’l."],
    ]), `${kind} → ${a}.`));
  }
  for (const s of SUBJ) {
    const right = s[1] ? "has to" : "have to";
    const [act] = pick([["do homework"], ["get up at 6"], ["clean the room"], ["walk the dog"], ["help at home"], ["wear glasses"]], r);
    pool.push(mc(2, `${s[0]} ___ ${act} every day. (zarur)`, right, uw(right, [[s[1] ? "have to" : "has to", s[1] ? `${s[0]} — he / she → has to.` : `${s[0]} → have to.`], [s[1] ? "has" : "have", "have / has + to + fe’l."], [s[1] ? "haves to" : "has to", "Shakl xato."], ["must to", "must dan keyin to yo‘q."]]), `${s[0]} → ${right}.`));
    const neg = s[1] ? "doesn’t have to" : "don’t have to";
    pool.push(mc(2, `${s[0]} ___ ${act} on Sunday. (shart emas)`, neg, uw(neg, [["mustn’t", "mustn’t — ta’qiq; “shart emas” → don’t / doesn’t have to."], [s[1] ? "don’t have to" : "doesn’t have to", `${s[0]} bilan ${neg}.`], [s[1] ? "doesn’t has to" : "haven’t to", "Inkor: don’t / doesn’t + have to."]]), `Shart emas → ${neg}.`));
  }

  // D
  for (const [q, a, kind] of ADVICE) pool.push(mc(3, q, a, uw(a, [[a === "should" ? "shouldn’t" : "should", `Ma’noga qarang: ${kind}.`], [a === "should" ? "should to" : "shouldn’t to", "should + asl fe’l (to yo‘q)."], ["mustn’t", "Bu qoida emas, maslahat → should / shouldn’t."]]), `${kind} → ${a}.`));
  for (const [q, a, ...ws] of MAY) pool.push(mc(3, q, a, ws, `${a}.`));
  for (const s of SUBJ) {
    const [act, uz] = pick([["eat more vegetables", "ko‘proq sabzavot yeyish"], ["read every day", "har kuni o‘qish"], ["sleep more", "ko‘proq uxlash"], ["drink more water", "ko‘proq suv ichish"], ["go to bed late", "kech yotish"], ["eat fast food", "fast food yeyish"]], r);
    const bad = /late|fast food/.test(act);
    const a = bad ? "shouldn’t" : "should";
    pool.push(mc(3, `${s[0]} ___ ${act}. (maslahat: ${bad ? "qilmagan yaxshi" : "qilgan yaxshi"})`, a, uw(a, [[bad ? "should" : "shouldn’t", `Ma’noga qarang: ${bad ? "qilmagan yaxshi → shouldn’t" : "qilgan yaxshi → should"}.`], [`${a} to`, "should + asl fe’l."], [s[1] ? "shoulds" : "do should", s[1] ? "should o‘zgarmaydi (-s olmaydi)." : "Bunday shakl yo‘q: should + fe’l."]]), `Maslahat → ${a}.`));
  }

  // E. Modal + fe'l
  for (const v of VERBS) {
    const m = pick(["can", "can’t", "must", "should", "might", "could", "mustn’t", "shouldn’t"], r);
    const s = pick(SUBJ, r);
    pool.push(mc(4, `${s[0]} ${m} ___ ${v.o}. (${v.b})`, v.b, uw(v.b, [[`to ${v.b}`, `${m} dan keyin to qo‘yilmaydi.`], [v.s, `${m} + asl fe’l (-s yo‘q).`], [v.ing, `${m} + asl fe’l.`], [v.p, `${m} + asl fe’l.`]]), `Modal fe’l (${m}) + asl fe’l: ${v.b}.`));
  }

  return {
    code: "KG22",
    unit: 22,
    title: "22. Modal verbs",
    title_uz: "Modal fe’llar · 200 ta test",
    seed: 22022,
    parts: PARTS,
    quotas: [[0, 50], [1, 35], [2, 40], [3, 30], [4, 45]],
    pool,
    intro: {
      what: "Modal fe’llar qobiliyat, ruxsat, majburiyat, ta’qiq, maslahat va ehtimolni bildiradi. Ulardan keyin fe’l doim ASL shaklda (to siz).",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "can, could",
          name_uz: "Qobiliyat va ruxsat",
          summary: "can — hozir qila olaman; could — o‘tmishda qila olardim. Ruxsat so‘rash: Can I …? / May I …?",
          usage: [
            { text: "Hozirgi qobiliyat.", example: { en: "I can swim.", uz: "Men suza olaman." } },
            { text: "O‘tmishdagi qobiliyat.", example: { en: "She could read when she was four.", uz: "U to‘rt yoshida o‘qiy olardi." } },
            { text: "Ruxsat.", example: { en: "Can I use your pen?", uz: "Ruchkangdan foydalansam maylimi?" } },
          ],
          structure: [
            { type: "+", formula: "subject + can + verb", example: { en: "He can play chess.", uz: "U shaxmat o‘ynay oladi." } },
            { type: "-", formula: "subject + can’t / couldn’t + verb", example: { en: "I can’t sing.", uz: "Men kuylay olmayman." } },
            { type: "?", formula: "Can + subject + verb?", example: { en: "Can you help me?", uz: "Yordam bera olasanmi?" } },
          ],
          signals: [],
          tip: "“He cans”, “I can to swim” — XATO.",
        },
        {
          name: "must, mustn’t, have to, don’t have to",
          name_uz: "Majburiyat va ta’qiq",
          summary: "must / have to — kerak, shart. mustn’t — mumkin emas (ta’qiq). don’t have to — shart emas (xohlasang qil).",
          usage: [
            { text: "must — qoida, majburiyat.", example: { en: "You must wear a helmet.", uz: "Dubulg‘a kiyishing shart." } },
            { text: "mustn’t — ta’qiq.", example: { en: "You mustn’t smoke here.", uz: "Bu yerda chekish mumkin emas." } },
            { text: "have to / has to — zarurat.", example: { en: "She has to work on Saturdays.", uz: "U shanbalari ishlashi kerak." } },
            { text: "don’t have to — shart emas.", example: { en: "You don’t have to come.", uz: "Kelishing shart emas." } },
          ],
          structure: [],
          signals: [],
          tip: "mustn’t ≠ don’t have to! mustn’t — man etilgan; don’t have to — kerak emas.",
        },
        {
          name: "should, may, might",
          name_uz: "Maslahat va ehtimol",
          summary: "should / shouldn’t — maslahat (qilgan / qilmagan yaxshi). may / might — balki, ehtimol.",
          usage: [
            { text: "Maslahat.", example: { en: "You should drink more water.", uz: "Ko‘proq suv ichishing kerak (yaxshi bo‘ladi)." } },
            { text: "Ehtimol.", example: { en: "It might rain today.", uz: "Bugun yomg‘ir yog‘ishi mumkin." } },
          ],
          structure: [],
          signals: [],
          tip: "Hamma modal fe’llardan keyin — asl fe’l, to yo‘q (have to bundan mustasno).",
        },
      ],
      mistakes: [
        { wrong: "She cans swim.", right: "She can swim.", why: "can o‘zgarmaydi." },
        { wrong: "You must to go.", right: "You must go.", why: "must + asl fe’l." },
        { wrong: "He should goes.", right: "He should go.", why: "should + asl fe’l." },
        { wrong: "He have to work.", right: "He has to work.", why: "he → has to." },
        { wrong: "You mustn’t come tomorrow. (shart emas)", right: "You don’t have to come tomorrow.", why: "Shart emas → don’t have to." },
      ],
    },
  };
}
