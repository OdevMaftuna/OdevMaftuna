// 25. BOTH / NEITHER / EITHER — ALL / NONE.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// Ikki kishi: [A, B, ish (3-shaxs), ish (ko'plik), o'zbekcha]
const TWO = [
  ["Ali", "Vali", "plays football", "play football", "futbol o‘ynaydi"], ["Malika", "Laylo", "speaks English", "speak English", "inglizcha gapiradi"], ["my mum", "my dad", "works in a bank", "work in a bank", "bankda ishlaydi"],
  ["Tom", "Jack", "likes pizza", "like pizza", "pitsani yoqtiradi"], ["my brother", "my sister", "goes to school", "go to school", "maktabga boradi"], ["Sardor", "Jasur", "can swim", "can swim", "suza oladi"],
  ["the cat", "the dog", "is hungry", "are hungry", "och"], ["Lola", "Nodira", "is a teacher", "are teachers", "o‘qituvchi"], ["my grandma", "my grandpa", "lives in Bukhara", "live in Bukhara", "Buxoroda yashaydi"],
  ["Anvar", "Bekzod", "has got a bike", "have got bikes", "velosipedi bor"], ["this book", "that book", "is interesting", "are interesting", "qiziqarli"], ["Kamola", "Zarina", "sings well", "sing well", "yaxshi kuylaydi"],
  ["my uncle", "my aunt", "drives a car", "drive a car", "mashina haydaydi"], ["Aziz", "Botir", "is tall", "are tall", "baland bo‘yli"], ["the red dress", "the blue dress", "is expensive", "are expensive", "qimmat"],
  ["Diyora", "Sevara", "reads books", "read books", "kitob o‘qiydi"], ["my cousin", "my friend", "wants a dog", "want a dog", "it xohlaydi"], ["Olim", "Rustam", "eats meat", "eat meat", "go‘sht yeydi"],
  ["this test", "that test", "is difficult", "are difficult", "qiyin"], ["Shahzoda", "Madina", "draws well", "draw well", "yaxshi chizadi"], ["my father", "my uncle", "watches football", "watch football", "futbol ko‘radi"],
  ["Ali’s house", "Vali’s house", "has a garden", "have gardens", "bog‘i bor"], ["Timur", "Javohir", "knows the answer", "know the answer", "javobni biladi"], ["the bus", "the train", "is fast", "are fast", "tez"],
];
// Guruh: [ot (ko'plik), ish (ko'plik), ish (birlik — none of bilan), o'zbekcha]
const GROUP = [
  ["the students", "passed the test", "testdan o‘tdi"], ["my friends", "came to the party", "bazmga keldi"], ["the children", "like ice cream", "muzqaymoqni yoqtiradi"],
  ["the apples", "are red", "qizil"], ["the pupils", "did their homework", "uy vazifasini qildi"], ["the players", "were tired", "charchagan edi"],
  ["the books", "are new", "yangi"], ["my classmates", "can speak English", "inglizcha gapira oladi"], ["the shops", "were open", "ochiq edi"],
  ["the eggs", "were broken", "singan edi"], ["the girls", "wore dresses", "ko‘ylak kiygan edi"], ["the questions", "were easy", "oson edi"],
  ["the teachers", "were at the meeting", "yig‘ilishda edi"], ["my cousins", "live in Tashkent", "Toshkentda yashaydi"], ["the boys", "played football", "futbol o‘ynadi"],
  ["the flowers", "are yellow", "sariq"], ["the windows", "were closed", "yopiq edi"], ["the cakes", "were delicious", "mazali edi"],
  ["my neighbours", "have cars", "mashinasi bor"], ["the tickets", "were sold", "sotilgan edi"],
];
const PARTS = [
  "A. both / neither / either (ikki kishi / narsa)",
  "B. both … and / neither … nor / either … or",
  "C. all / none (ikkitadan ko‘p)",
  "D. Fe’l shakli · Neither of them is … / All of them are …",
  "E. Olmosh bilan · both of us / none of them …",
];

export function build() {
  const r = rng(2525);
  const pool = [];

  // A
  for (const [a, b, s3, pl, uz] of TWO) {
    const aux = pl.match(/^(are|can|have got) /);
    pool.push(mc(0, aux ? `${cap(a)} and ${b} ${aux[1] === "have got" ? "have ___ got" : `${aux[1]} ___`} ${pl.slice(aux[0].length)}. (ikkalasi ham ${uz})` : `${cap(a)} and ${b} ___ ${pl}. (ikkalasi ham ${uz})`, "both", uw("both", [["all", "all — uch va undan ko‘p. Ikki kishi → both."], ["neither", "neither — ikkalasi ham … emas."], ["either", "either — ikkalasidan biri."]]), "Ikki kishi, ikkalasi ham → both."));
    pool.push(mc(0, `___ of them ${s3}. (${a} ham, ${b} ham — hech biri)`, "Neither", uw("Neither", [["Both", "both — ikkalasi ham (ijobiy). Ma’no inkor → Neither."], ["None", "none — uch va undan ko‘p uchun. Ikki kishi → neither."], ["Either", "either — ikkalasidan biri (qaysi biri bo‘lsa ham)."]]), "Ikkovi ham emas → Neither of them + birlik fe’l."));
    pool.push(mc(0, `You can ask ___ ${a} or ${b}. (qaysi biri bo‘lsa ham)`, "either", uw("either", [["both", "both … and — “ikkalasi ham”. “… or …” → either."], ["neither", "neither … nor — inkor ma’no."], ["all", "all — ko‘pchilik uchun."]]), "either … or — u yoki bu."));
  }

  // B
  for (const [a, b, s3, pl, uz] of TWO) {
    pool.push(mc(1, `Both ${a} ___ ${b} ${pl}.`, "and", uw("and", [["or", "both … AND."], ["nor", "neither … nor; both … and."], ["but", "both … and."]]), "both … and."));
    pool.push(mc(1, `Neither ${a} ___ ${b} ${s3}.`, "nor", uw("nor", [["or", "neither … NOR."], ["and", "both … and; neither … nor."], ["not", "neither … nor."]]), "neither … nor."));
    pool.push(mc(1, `Either ${a} ___ ${b} ${s3}.`, "or", uw("or", [["nor", "either … OR; neither … nor."], ["and", "both … and; either … or."], ["but", "either … or."]]), "either … or."));
  }

  // C. all / none
  for (const [n, act, uz] of GROUP) {
    pool.push(mc(2, `___ of ${n} ${act}. (hammasi ${uz})`, "All", uw("All", [["Both", "both — faqat ikki kishi / narsa uchun."], ["None", "none — hech biri; ma’no ijobiy → All."], ["Every", "every + birlik ot (every student); “of” bilan kelmaydi."]]), "Hammasi (uch va undan ko‘p) → All of …"));
    pool.push(mc(2, `___ of ${n} ${act}. (hech biri — 0 ta)`, "None", uw("None", [["Neither", "neither — faqat ikki kishi uchun. Ko‘pchilik → none."], ["All", "all — hammasi (ijobiy)."], ["No", "no + ot (no students); “of” bilan → none of."]]), "Hech biri (uch va undan ko‘p) → None of …"));
  }

  // D. Fe'l shakli
  for (const [a, b, s3, pl] of TWO) {
    const [v1] = s3.split(" ");
    const [v2] = pl.split(" ");
    if (v1 === v2) continue;
    pool.push(mc(3, `Neither of them ___ ${s3.split(" ").slice(1).join(" ")}.`, v1, uw(v1, [[v2, "Neither of … → odatda birlik fe’l (kitob qoidasi)."], [`don’t ${v2}`.replace("don’t are", "aren’t").replace("don’t is", "isn’t"), "neither o‘zi inkor — fe’l darak shaklda."], [`doesn’t ${v2}`.replace("doesn’t are", "isn’t"), "Ikki inkor bo‘lmaydi."]]), `Neither of + birlik fe’l: ${v1}.`));
    pool.push(mc(3, `Both of them ___ ${pl.split(" ").slice(1).join(" ")}.`, v2, uw(v2, [[v1, "Both — ikki kishi → ko‘plik fe’l."], [v2 === "are" ? "aren’t" : v2 === "have" ? "haven’t" : `don’t ${v2}`, "Ma’no ijobiy — ikkalasi ham."], [`not ${v2}`, "Ma’no ijobiy."]]), `Both + ko‘plik fe’l: ${v2}.`));
  }
  for (const [n] of GROUP) {
    const pastBe = pick([["are", "is"], ["were", "was"]], r);
    pool.push(mc(3, `All of ${n} ___ here.`, pastBe[0], uw(pastBe[0], [[pastBe[1], "All of + ko‘plik ot → ko‘plik fe’l."], [pastBe[0] === "are" ? "be" : "been", "Shakl xato."], ["am", "Ko‘plik → are / were."]]), `All of + ko‘plik → ${pastBe[0]}.`));
  }

  // E. Olmosh bilan
  const PRO = [["us", "biz"], ["them", "ular"], ["you", "sizlar"]];
  for (const [p, uz] of PRO) {
    for (const [q, a, ws, ex] of [
      [`Both of ___ like music. (${uz} ikkalamiz / ikkalasi)`, p, [[p === "us" ? "we" : p === "them" ? "they" : "your", "of dan keyin obyekt olmoshi: us / you / them."], [p === "us" ? "our" : p === "them" ? "their" : "yours", "of + obyekt olmoshi."], [p === "us" ? "ours" : p === "them" ? "theirs" : "you’re", "of + obyekt olmoshi."]], "both of + us / you / them."],
      [`None of ___ knew the answer. (${uz} hech birimiz / hech biri)`, p, [[p === "us" ? "we" : p === "them" ? "they" : "your", "of + obyekt olmoshi (us / you / them)."], [p === "us" ? "our" : p === "them" ? "their" : "yours", "of + obyekt olmoshi."], [p === "us" ? "ours" : p === "them" ? "theirs" : "you’re", "of + obyekt olmoshi."]], "none of + us / you / them."],
    ]) pool.push(mc(4, q, a, ws, ex));
  }
  const MIX = [
    ["I have two brothers. ___ of them are doctors.", "Both", [["All", "Ikki kishi → both."], ["Neither", "Ma’no ijobiy."], ["Every", "every of — xato."]]],
    ["I have two brothers. ___ of them is married. (hech qaysi)", "Neither", [["None", "Ikki kishi → neither."], ["Both", "Ma’no inkor."], ["Either", "either — biri (qaysi bo‘lsa ham)."]]],
    ["I have five cousins. ___ of them live in Tashkent. (hammasi)", "All", [["Both", "Besh kishi → all."], ["Every", "every of — xato."], ["Each", "each of + birlik fe’l (lives)."]]],
    ["I have five cousins. ___ of them lives in Samarkand. (hech biri)", "None", [["Neither", "Besh kishi → none."], ["No", "no of — xato; none of."], ["All", "Ma’no inkor."]]],
    ["“Tea or coffee?” — “___. I don’t like them.”", "Neither", [["Both", "I don’t like them → hech biri."], ["Either", "Either — qaysi bo‘lsa ham (ijobiy)."], ["None", "Ikki narsa → neither."]]],
    ["“Tea or coffee?” — “___ . I don’t mind.”", "Either", [["Neither", "I don’t mind → qaysi bo‘lsa ham → either."], ["Both", "Ikkalasini birdan emas."], ["All", "Ikki narsa → either."]]],
    ["“Tea or coffee?” — “___, please. I’m very thirsty.”", "Both", [["Either", "Ikkalasini ham xohlaydi → both."], ["Neither", "Ma’no ijobiy."], ["All", "Ikki narsa → both."]]],
    ["There are ten students in the room. ___ of them are reading.", "All", [["Both", "O‘n kishi → all."], ["Neither", "Ma’no ijobiy, va o‘n kishi."], ["Either", "Ko‘pchilik → all."]]],
    ["Ali and I ___ like football. (ikkalamiz ham)", "both", [["all", "Ikki kishi → both."], ["either", "Ma’no — ikkalamiz ham."], ["neither", "Ma’no ijobiy."]]],
    ["We ___ went to the cinema. (uchalamiz ham)", "all", [["both", "Uch kishi → all."], ["either", "Ma’no — hammamiz."], ["none", "none — hech biri."]]],
    ["My parents are ___ teachers. (ikkalasi ham)", "both", [["all", "Ikki kishi → both."], ["either", "Ma’no — ikkalasi ham."], ["each", "Ma’no — ikkalasi ham."]]],
    ["___ my friends were late, so I waited alone. (hammasi)", "All", [["Both", "Ko‘p do‘st → all."], ["Every", "every + birlik ot."], ["None", "Ma’no — hammasi kechikdi."]]],
    ["___ of the two answers is correct. Try again!", "Neither", [["None", "Ikki javob → neither."], ["Both", "Ma’no — hech biri to‘g‘ri emas."], ["Either", "Ma’no inkor."]]],
    ["I phoned three hotels but ___ of them had a room.", "none", [["neither", "Uchta → none."], ["all", "Ma’no inkor."], ["both", "Uchta → none."]]],
  ];
  for (const [q, a, ws] of MIX) pool.push(mc(4, q, a, ws, `${a}.`));

  return {
    code: "KG25",
    unit: 25,
    title: "25. Both / Neither — All / None",
    title_uz: "Ikkalasi / hech biri, hammasi / hech kim · 200 ta test",
    seed: 25025,
    parts: PARTS,
    quotas: [[0, 50], [1, 50], [2, 40], [3, 40], [4, 20]],
    pool,
    intro: {
      what: "Ikki kishi / narsa haqida: both (ikkalasi ham), neither (hech biri), either (biri). Uch va undan ko‘p: all (hammasi), none (hech biri).",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "both, neither, either",
          name_uz: "Ikki narsa haqida",
          summary: "both — ikkalasi ham; neither — ikkalasi ham emas; either — u yoki bu. Juftlar: both … and, neither … nor, either … or.",
          usage: [
            { text: "both", example: { en: "Both Ali and Vali play chess.", uz: "Ali ham, Vali ham shaxmat o‘ynaydi." } },
            { text: "neither", example: { en: "Neither of my brothers smokes.", uz: "Akalarimning hech biri chekmaydi." } },
            { text: "either", example: { en: "You can sit on either chair.", uz: "Istalgan stulga o‘tirishing mumkin." } },
          ],
          structure: [
            { type: "+", formula: "Both A and B + plural verb", example: { en: "Both my parents are doctors.", uz: "Ota-onamning ikkalasi ham shifokor." } },
            { type: "-", formula: "Neither A nor B + verb", example: { en: "Neither Tom nor Jack likes fish.", uz: "Tom ham, Jek ham baliqni yoqtirmaydi." } },
          ],
          signals: [],
          tip: "neither o‘zi inkor — fe’l inkor bo‘lmaydi: Neither of them knows (doesn’t know — XATO).",
        },
        {
          name: "all, none",
          name_uz: "Ko‘pchilik haqida",
          summary: "all — hammasi (3+); none — hech biri (3+). of dan keyin obyekt olmoshi: all of us, none of them.",
          usage: [
            { text: "all", example: { en: "All of the students passed.", uz: "O‘quvchilarning hammasi o‘tdi." } },
            { text: "none", example: { en: "None of my friends came.", uz: "Do‘stlarimdan hech biri kelmadi." } },
          ],
          structure: [
            { type: "+", formula: "all of / none of + us / you / them / the + noun", example: { en: "None of us knew.", uz: "Hech birimiz bilmasdik." } },
          ],
          signals: [],
          tip: "Ikki kishi → both / neither; uch va ko‘p → all / none.",
        },
      ],
      mistakes: [
        { wrong: "All my parents are teachers.", right: "Both my parents are teachers.", why: "Ikki kishi → both." },
        { wrong: "Neither of them don’t know.", right: "Neither of them knows.", why: "Ikki inkor bo‘lmaydi." },
        { wrong: "Both Ali or Vali …", right: "Both Ali and Vali …", why: "both … and." },
        { wrong: "None of we …", right: "None of us …", why: "of + obyekt olmoshi." },
        { wrong: "Neither of my three friends …", right: "None of my three friends …", why: "Uch kishi → none." },
      ],
    },
  };
}
