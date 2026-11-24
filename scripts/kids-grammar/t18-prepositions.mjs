// 18. PREPOSITIONS OF TIME AND PLACE. PREPOSITIONS OF MOVEMENT.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// Vaqt: [ibora, to'g'ri predlog, izoh]
const TIME = [
  ["Monday", "on", "hafta kunlari → on"], ["Sunday morning", "on", "aniq kunning qismi → on"], ["my birthday", "on", "aniq kun → on"], ["5th May", "on", "sana → on"],
  ["New Year’s Day", "on", "bayram kuni → on"], ["Friday evening", "on", "aniq kun → on"], ["weekdays", "on", "on weekdays"], ["Independence Day", "on", "bayram kuni → on"],
  ["July", "in", "oylar → in"], ["2010", "in", "yillar → in"], ["summer", "in", "fasllar → in"], ["the morning", "in", "in the morning / afternoon / evening"],
  ["the evening", "in", "in the evening"], ["the afternoon", "in", "in the afternoon"], ["winter", "in", "fasllar → in"], ["the 21st century", "in", "asrlar → in"], ["December", "in", "oylar → in"],
  ["5 o’clock", "at", "soat → at"], ["night", "at", "at night (istisno)"], ["noon", "at", "at noon"], ["the weekend", "at", "at the weekend"], ["half past seven", "at", "soat → at"],
  ["lunchtime", "at", "at lunchtime"], ["midnight", "at", "at midnight"], ["sunrise", "at", "at sunrise (quyosh chiqishida)"], ["Christmas", "at", "at Christmas / at Navruz (bayram davri)"],
];
const FRAMES_T = ["I get up ___ {x}.", "We have a party ___ {x}.", "My lesson starts ___ {x}.", "They visited us ___ {x}.", "It is very cold ___ {x}.", "Let’s meet ___ {x}."];
// Joy: [gap, to'g'ri, izoh]
const PLACE = [
  ["My parents are ___ home now.", "at", "at home"], ["Ali is ___ school.", "at", "at school / at work"], ["We waited ___ the bus stop.", "at", "aniq nuqta → at"],
  ["She lives ___ London.", "in", "shahar / mamlakat → in"], ["The milk is ___ the fridge.", "in", "ichida → in"], ["There is a picture ___ the wall.", "on", "sirt ustida → on"],
  ["The book is ___ the table.", "on", "ustida → on"], ["My father works ___ a bank.", "in", "bino ichida → in"], ["The children are playing ___ the garden.", "in", "bog‘ ichida → in"],
  ["My flat is ___ the third floor.", "on", "qavat → on"], ["I saw him ___ the party.", "at", "tadbir → at"], ["The cat is sleeping ___ the sofa.", "on", "ustida → on"],
  ["Your keys are ___ my bag.", "in", "ichida → in"], ["We live ___ Navoi Street.", "on", "ko‘cha → on (AmE) / in (BrE); kitobda → on"], ["She is sitting ___ the desk.", "at", "stol yonida (ishlab) → at"],
  ["There are many fish ___ the river.", "in", "ichida → in"], ["My friend is ___ hospital.", "in", "in hospital"], ["Write your name ___ the top of the page.", "at", "at the top / at the bottom"],
  ["The plane is ___ the sky.", "in", "in the sky"], ["The pupils are ___ the classroom.", "in", "ichida → in"],
];
// Joylashuv: [ega, joy, to'g'ri, o'zbekcha]
const POS = [
  ["The ball is", "the bed", "under", "ostida"], ["The lamp is", "the table", "above", "tepasida (tegmasdan)"], ["The shop is", "the bank", "next to", "yonida"],
  ["The cat is", "the box", "behind", "orqasida"], ["The car is", "the house", "in front of", "oldida"], ["The bank is", "the cafe and the shop", "between", "o‘rtasida"],
  ["My house is", "the park", "near", "yaqinida"], ["The dog is", "the door", "next to", "yonida"], ["The garden is", "the house", "behind", "orqasida"],
  ["The bag is", "the chair", "under", "ostida"], ["Ali is sitting", "Vali and Sardor", "between", "o‘rtasida"], ["The clock is", "the board", "above", "tepasida"],
  ["The bus stop is", "our school", "opposite", "qarshisida"], ["The tree is", "the window", "in front of", "oldida"], ["The pharmacy is", "the hospital", "opposite", "ro‘parasida"],
];
const POS_ALL = ["under", "above", "next to", "behind", "in front of", "between", "near", "opposite"];
// Harakat: [gap boshi, joy, to'g'ri, o'zbekcha]
const MOVE = [
  ["The cat jumped", "the box", "into", "ichiga"], ["The boy ran", "the house", "out of", "ichidan tashqariga"], ["We walked", "the street", "across", "ko‘chaning u tomoniga (kesib)"],
  ["They walked", "the river", "along", "bo‘ylab"], ["The train went", "the tunnel", "through", "orqali (ichidan o‘tib)"], ["The children climbed", "the hill", "up", "tepaga"],
  ["The ball rolled", "the hill", "down", "pastga"], ["The horse jumped", "the fence", "over", "ustidan oshib"], ["The boat went", "the bridge", "under", "ostidan"],
  ["I walked", "the bank", "past", "yonidan o‘tib"], ["The dog ran", "me", "towards", "tomon"], ["We drove", "the city", "round", "aylanib"],
  ["The bird flew", "the window", "out of", "derazadan tashqariga"], ["She came", "the room", "into", "ichiga"], ["The cat jumped", "the table", "onto", "ustiga"],
  ["He swam", "the lake", "across", "u qirg‘oqqa"], ["We went", "the stairs", "up", "tepaga"], ["The children ran", "the park", "through", "orqali"],
  ["The man fell", "the ladder", "off", "ustidan (tushib ketdi)"], ["The plane flew", "the clouds", "above", "tepasidan"],
];
const ING = { jumped: "jumping", ran: "running", walked: "walking", went: "going", climbed: "climbing", rolled: "rolling", came: "coming", flew: "flying", drove: "driving", swam: "swimming", fell: "falling" };
const MOVE_ALL = ["into", "out of", "across", "along", "through", "up", "down", "over", "under", "past", "towards", "round", "onto", "off"];
const PARTS = [
  "A. Vaqt predloglari · in, on, at (time)",
  "B. Joy predloglari · in, on, at (place)",
  "C. Joylashuv · under, behind, next to, between …",
  "D. Harakat predloglari · into, across, through …",
  "E. Ikki bo‘shliqni to‘ldiring · in / on / at",
];

export function build() {
  const r = rng(1818);
  const pool = [];
  const W = { in: "in — oy, yil, fasl, kunning qismi.", on: "on — kun, sana, bayram kuni.", at: "at — soat, at night, at the weekend." };

  for (const [x, p, why] of TIME) {
    for (const f of shuffle(FRAMES_T, r).slice(0, 3)) {
      const others = ["in", "on", "at"].filter((y) => y !== p);
      pool.push(mc(0, f.replace("{x}", x), p, uw(p, [...others.map((o) => [o, `“${x}”: ${why}. (${W[o]})`]), ["to", "to — harakat yo‘nalishi, vaqt uchun emas."]]), `${why}: ${p} ${x}.`));
    }
  }
  for (const [q, p, why] of PLACE) {
    const others = ["in", "on", "at"].filter((y) => y !== p);
    pool.push(mc(1, q, p, uw(p, [...others.map((o) => [o, `Bu yerda ${why}.`]), ["to", "to — harakat (go to school); bu yerda joy."]]), `${why}.`));
  }

  for (const [a, b, p, uz] of POS) {
    const wrongs = shuffle(POS_ALL.filter((x) => x !== p && !(p === "next to" && x === "near") && !(p === "near" && x === "next to") && !(p === "opposite" && x === "in front of") && !(p === "in front of" && x === "opposite")), r);
    const thing = a.replace(/ (is|is sitting)$/, "");
    for (const q of [`${a} ___ ${b}. (${uz})`, `Where ${a.endsWith("sitting") ? "is Ali sitting" : `is ${thing.replace(/^The /, "the ").replace(/^My /, "your ")}`}? — ${a.endsWith("sitting") ? "He is sitting" : "It’s"} ___ ${b}. (${uz})`]) {
      const ws = shuffle(wrongs, r).slice(0, 3);
      pool.push(mc(2, q, p, uw(p, ws.map((w) => [w, `${w} — boshqa ma’no. “${uz}” → ${p}.`])), `${uz} → ${p}.`));
    }
  }

  for (const [a, b, p, uz] of MOVE) {
    const wrongs = MOVE_ALL.filter((x) => x !== p && !(["into", "onto"].includes(p) && ["into", "onto"].includes(x)) && !(["over", "above"].includes(p) && ["over", "above"].includes(x)));
    const subj = a.split(" ").slice(0, -1).join(" ");
    const verb = a.split(" ").at(-1);
    for (const q of [`${a} ___ ${b}. (${uz})`, `Look! ${subj} ${subj === "I" ? "am" : /^(We|They|The children)$/.test(subj) ? "are" : "is"} ${ING[verb]} ___ ${b}. (${uz})`]) {
      const ws = shuffle(wrongs, r).slice(0, 3);
      pool.push(mc(3, q, p, uw(p, ws.map((w) => [w, `${w} — boshqa yo‘nalish. “${uz}” → ${p}.`])), `${uz} → ${p}.`));
    }
  }

  // E. Ikki bo'shliq: vaqt
  const T2 = TIME.filter((t) => !["sunrise", "weekdays", "the 21st century", "2010"].includes(t[0]));
  const seenPair = new Set();
  for (let k = 0; k < 400 && seenPair.size < 45; k++) {
    const [x1, p1] = pick(T2, r);
    const [x2, p2] = pick(T2.filter((t) => t[1] !== p1), r);
    if (seenPair.has(x1 + x2)) continue;
    seenPair.add(x1 + x2);
    const right = `${p1} / ${p2}`;
    const all = ["in", "on", "at"];
    const ws = [];
    for (const a of all) for (const b of all) if (`${a} / ${b}` !== right) ws.push([`${a} / ${b}`, `${x1} → ${p1}; ${x2} → ${p2}.`]);
    pool.push(mc(4, `We met ___ ${x1}, and they left ___ ${x2}.`, right, uw(right, shuffle(ws, r)), `${p1} ${x1}, ${p2} ${x2}.`));
  }

  return {
    code: "KG18",
    unit: 18,
    title: "18. Prepositions of time and place. Prepositions of movement",
    title_uz: "Vaqt, joy va harakat predloglari · 200 ta test",
    seed: 18018,
    parts: PARTS,
    quotas: [[0, 70], [1, 20], [2, 30], [3, 40], [4, 40]],
    pool,
    intro: {
      what: "Predloglar — qachon (vaqt), qayerda (joy) va qayerga (harakat) ekanini ko‘rsatadi.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Prepositions of time: in, on, at",
          name_uz: "Vaqt predloglari",
          summary: "at — aniq vaqt (soat); on — kun va sana; in — oy, yil, fasl, kunning qismi.",
          usage: [
            { text: "at + soat, at night, at the weekend, at noon.", example: { en: "The film starts at 7 o’clock.", uz: "Film soat 7 da boshlanadi." } },
            { text: "on + hafta kuni, sana, bayram kuni.", example: { en: "My birthday is on 5th May.", uz: "Tug‘ilgan kunim 5-mayda." } },
            { text: "in + oy, yil, fasl, in the morning / afternoon / evening.", example: { en: "We go to the sea in summer.", uz: "Yozda dengizga boramiz." } },
          ],
          structure: [],
          signals: [
            { en: "at 5 o’clock / at night", uz: "soat 5 da / tunda" }, { en: "on Monday / on 1st June", uz: "dushanba kuni / 1-iyunda" }, { en: "in July / in 2020 / in winter", uz: "iyulda / 2020-yilda / qishda" },
          ],
          tip: "in the morning, LEKIN on Monday morning (aniq kun bo‘lsa — on).",
        },
        {
          name: "Prepositions of place",
          name_uz: "Joy predloglari",
          summary: "in — ichida (shahar, xona, quti); on — ustida, sirtida (stol, devor, qavat); at — nuqta / joy (at home, at school, at the bus stop).",
          usage: [
            { text: "in", example: { en: "The pen is in the box.", uz: "Ruchka qutida." } },
            { text: "on", example: { en: "The pen is on the desk.", uz: "Ruchka partada." } },
            { text: "at", example: { en: "I’m at home.", uz: "Men uydaman." } },
            { text: "under, behind, next to, between, in front of, opposite, above, near.", example: { en: "The cat is under the table.", uz: "Mushuk stol ostida." } },
          ],
          structure: [],
          signals: [],
          tip: "between — ikki narsa o‘rtasida: between the bank and the shop.",
        },
        {
          name: "Prepositions of movement",
          name_uz: "Harakat predloglari",
          summary: "into / out of, up / down, across, along, through, over, under, past, towards, round, onto / off.",
          usage: [
            { text: "into — ichiga, out of — ichidan tashqariga.", example: { en: "She went into the shop.", uz: "U do‘konga kirdi." } },
            { text: "across — kesib o‘tib; along — bo‘ylab.", example: { en: "Walk across the road.", uz: "Yo‘lni kesib o‘ting." } },
            { text: "through — ichidan o‘tib; over — ustidan oshib.", example: { en: "The train went through the tunnel.", uz: "Poyezd tunneldan o‘tdi." } },
          ],
          structure: [],
          signals: [],
          tip: "in — joy (holat), into — harakat: The cat is in the box. / The cat jumped into the box.",
        },
      ],
      mistakes: [
        { wrong: "in Monday", right: "on Monday", why: "Hafta kuni → on." },
        { wrong: "on July", right: "in July", why: "Oy → in." },
        { wrong: "in night", right: "at night", why: "at night — istisno." },
        { wrong: "She went in the room.", right: "She went into the room.", why: "Harakat → into." },
        { wrong: "I am in home.", right: "I am at home.", why: "at home." },
      ],
    },
  };
}
