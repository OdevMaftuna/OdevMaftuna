// 5. ARTICLES: a, an, the (va artiklsiz "—").
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

const Z = "— (artikl kerak emas)";

// a / an: [ibora, to'g'ri artikl, izoh]
const AAN = [
  ["apple", "an", "olma"], ["egg", "an", "tuxum"], ["orange", "an", "apelsin"], ["umbrella", "an", "soyabon"], ["elephant", "an", "fil"], ["owl", "an", "boyqush"],
  ["ice cream", "an", "muzqaymoq"], ["onion", "an", "piyoz"], ["ant", "an", "chumoli"], ["eye", "an", "ko‘z"], ["ear", "an", "quloq"], ["island", "an", "orol"],
  ["idea", "an", "fikr"], ["eraser", "an", "o‘chirg‘ich"], ["octopus", "an", "sakkizoyoq"], ["armchair", "an", "kreslo"], ["airport", "an", "aeroport"],
  ["eagle", "an", "burgut"], ["insect", "an", "hasharot"], ["oven", "an", "pech"], ["envelope", "an", "konvert"], ["uncle", "an", "amaki"], ["hour", "an", "soat (60 daqiqa)"],
  ["honest boy", "an", "halol bola"], ["old man", "an", "qariya"], ["interesting book", "an", "qiziqarli kitob"], ["English book", "an", "ingliz tili kitobi"], ["easy question", "an", "oson savol"],
  ["university", "a", "universitet"], ["uniform", "a", "forma"], ["unicorn", "a", "yakshoxli ot"], ["horse", "a", "ot"], ["house", "a", "uy"], ["hat", "a", "shlyapa"],
  ["banana", "a", "banan"], ["book", "a", "kitob"], ["dog", "a", "it"], ["pen", "a", "ruchka"], ["ruler", "a", "chizg‘ich"], ["hotel", "a", "mehmonxona"],
  ["red apple", "a", "qizil olma"], ["big elephant", "a", "katta fil"], ["small egg", "a", "kichik tuxum"], ["new umbrella", "a", "yangi soyabon"], ["useful book", "a", "foydali kitob"],
  ["happy child", "a", "baxtli bola"], ["yellow orange", "a", "sariq apelsin"], ["green onion", "a", "ko‘k piyoz"], ["tall boy", "a", "baland bola"], ["European city", "a", "Yevropa shahri"],
];
const TRICKY = {
  hour: "“hour” so‘zida h o‘qilmaydi [auə] — unli tovush bilan boshlanadi → an hour.",
  "honest boy": "“honest” so‘zida h o‘qilmaydi [ɒnɪst] → an honest boy.",
  university: "“university” [ju:] — “yu” tovushi bilan boshlanadi, bu undosh tovush → a university.",
  uniform: "“uniform” [ju:] — “yu” tovushi → a uniform.",
  unicorn: "“unicorn” [ju:] — “yu” tovushi → a unicorn.",
  "useful book": "“useful” [ju:] — “yu” tovushi → a useful book.",
  "European city": "“European” [jʊə] — “yu” tovushi → a European city.",
  uncle: "“uncle” [ʌ] — unli tovush → an uncle.",
};
const aanWhy = (w, a) => TRICKY[w] ?? (w.includes(" ") ? `Artikl keyingi so‘zga qaraydi: “${w.split(" ")[0]}” ${a === "an" ? "unli" : "undosh"} tovush bilan boshlanadi → ${a} ${w}.` : `“${w}” ${a === "an" ? "unli" : "undosh"} tovush bilan boshlanadi → ${a} ${w}.`);

// The / a / an / — : [gap, javob, qoida, [noto'g'ri variant, nega]...]
const TB = [];
const add = (q, ans, rule, wrongs) => TB.push({ q, ans, rule, wrongs });
const W = {
  a: (why) => ["a", why],
  an: (why) => ["an", why],
  the: (why) => ["the", why],
  z: (why) => [Z, why],
};
// Yagona narsalar
for (const [q, n] of [["___ sun is very hot.", "sun"], ["___ moon is bright tonight.", "moon"], ["Look at ___ sky! It is blue.", "sky"], ["___ earth is round.", "earth"], ["There are many countries in ___ world.", "world"], ["___ Sun goes down in the evening.", "Sun"]])
  add(q, "the", `Dunyoda bitta bo‘lgan narsa → the ${n.toLowerCase()}.`, [W.a("Bitta yagona narsa — a emas, the."), W.an("Bitta yagona narsa — the."), W.z("Yagona narsa oldidan the kerak.")]);
// Ikkinchi marta tilga olinganda
for (const [first, second, rest] of [
  ["a cat and a dog", "cat", "is white"], ["a pen and a pencil", "pen", "is blue"], ["an apple and a pear", "apple", "is sweet"], ["a brother and a sister", "sister", "is eight"],
  ["a ball and a kite", "kite", "is red"], ["a book and a magazine", "book", "is interesting"], ["an orange and a banana", "banana", "is yellow"], ["a bike and a car", "bike", "is new"],
  ["a parrot and a fish", "parrot", "is green"], ["a doll and a teddy bear", "doll", "is beautiful"], ["a hat and a scarf", "scarf", "is warm"], ["an egg and a sandwich", "egg", "is boiled"],
])
  add(`I have ${first}. ___ ${second} ${rest}.`, "The", `Birinchi marta — a/an, ikkinchi marta (ma’lum bo‘lgach) — the: the ${second}.`, [W.a("Bu narsa allaqachon tilga olindi — endi the."), W.an("Bu narsa allaqachon tilga olindi — the."), W.z("Birlik sanaladigan ot artiklsiz kelmaydi.")].map(([x, y]) => [cap(x), y]));
// Musiqa asboblari
for (const ins of ["piano", "guitar", "violin", "drums", "flute", "dutar"])
  add(`My sister plays ___ ${ins}.`, "the", `Musiqa asbobi chalish → play the ${ins}.`, [W.a("play + musiqa asbobi → the."), W.an("play + musiqa asbobi → the."), W.z("Musiqa asbobi oldidan the kerak.")]);
// Sport — artiklsiz
for (const sp of ["football", "tennis", "chess", "basketball", "volleyball", "table tennis"])
  add(`We play ___ ${sp} after school.`, Z, `Sport o‘yinlari oldidan artikl qo‘yilmaydi: play ${sp}.`, [W.the("Sport oldidan the qo‘yilmaydi (musiqa asbobidan farqli!)."), W.a("Sport oldidan a qo‘yilmaydi."), W.an("Sport oldidan an qo‘yilmaydi.")]);
// Ovqatlanish — artiklsiz
for (const [m, t] of [["breakfast", "at 7 o’clock"], ["lunch", "at school"], ["dinner", "with my family"], ["breakfast", "every morning"], ["dinner", "at 8 o’clock"], ["lunch", "at 1 o’clock"]])
  add(`I have ___ ${m} ${t}.`, Z, `Ovqatlanish (breakfast, lunch, dinner) oldidan artikl qo‘yilmaydi.`, [W.the("have breakfast / lunch / dinner — the qo‘yilmaydi."), W.a("have breakfast — a qo‘yilmaydi."), W.an("have breakfast — an qo‘yilmaydi.")]);
// Ismlar, shaharlar, mamlakatlar
for (const [q, n] of [["___ Tashkent is the capital of Uzbekistan.", "Tashkent"], ["___ Ali is my best friend.", "Ali"], ["We live in ___ Samarkand.", "Samarkand"], ["My uncle lives in ___ France.", "France"], ["___ Malika is in class 4.", "Malika"], ["I want to visit ___ London.", "London"], ["They are from ___ Uzbekistan.", "Uzbekistan"], ["___ Mr Brown is our teacher.", "Mr Brown"]])
  add(q, Z, `Ismlar, shaharlar va ko‘p mamlakatlar oldidan artikl qo‘yilmaydi: ${n}.`, [W.the(`${n} — atoqli ot, the qo‘yilmaydi.`), W.a(`${n} — atoqli ot, a qo‘yilmaydi.`), W.an(`${n} — atoqli ot, an qo‘yilmaydi.`)]);
for (const [q, n] of [["My cousin lives in ___ USA.", "the USA"], ["London is in ___ UK.", "the UK"]])
  add(q, "the", `Istisno: “States, Kingdom” so‘zi bor mamlakatlar — ${n}.`, [W.a("Mamlakat nomi — a emas."), W.an("Mamlakat nomi — an emas."), W.z("USA / UK oldidan the kerak.")]);
// Tillar, fanlar, kunlar, transport, joylar
for (const l of ["English", "Russian", "Uzbek", "Chinese"])
  add(`She can speak ___ ${l}.`, Z, `Tillar oldidan artikl qo‘yilmaydi: speak ${l}.`, [W.the("Til nomi oldidan the qo‘yilmaydi."), W.a("Til nomi oldidan a qo‘yilmaydi."), W.an("Til nomi oldidan an qo‘yilmaydi.")]);
for (const s of ["maths", "science", "history", "music"])
  add(`My favourite subject is ___ ${s}.`, Z, `Fanlar oldidan artikl qo‘yilmaydi.`, [W.the("Fan nomi oldidan the qo‘yilmaydi."), W.a("Fan nomi oldidan a qo‘yilmaydi."), W.an("Fan nomi oldidan an qo‘yilmaydi.")]);
for (const tr of ["bus", "car", "train", "bike"])
  add(`I go to school by ___ ${tr}.`, Z, `“by + transport” — artiklsiz: by ${tr}.`, [W.the("by + transport — the qo‘yilmaydi."), W.a("by + transport — a qo‘yilmaydi."), W.an("by + transport — an qo‘yilmaydi.")]);
for (const [q, rule] of [["It is late. Go to ___ bed!", "go to bed"], ["I go to ___ school every day.", "go to school"], ["My dad is at ___ work.", "at work"], ["We are at ___ home now.", "at home"]])
  add(q, Z, `Turg‘un ibora: ${rule} — artiklsiz.`, [W.the(`${rule} — the qo‘yilmaydi.`), W.a(`${rule} — a qo‘yilmaydi.`), W.an(`${rule} — an qo‘yilmaydi.`)]);
// Ma'lum narsa (ikkalamiz biladigan)
for (const [q, n] of [["Please close ___ door.", "door"], ["Open ___ window, please. It is hot.", "window"], ["Where is ___ teacher? The lesson is starting.", "teacher"], ["Turn off ___ light, please.", "light"], ["Put the milk in ___ fridge.", "fridge"], ["Can you pass me ___ salt, please?", "salt"], ["Who is ___ girl in this photo?", "girl"], ["___ cake on the table is for you.", "cake"]])
  add(q, q.startsWith("___") ? "The" : "the", `Qaysi ${n} ekanligi aniq (ikkalamiz bilamiz) → the.`, (q.startsWith("___") ? [["A", "Aniq, ma’lum narsa haqida — the."], ["An", "Aniq narsa — the."], [Z, "Aniq narsa oldidan the kerak."]] : [W.a("Aniq, ma’lum narsa haqida — the."), W.an("Aniq narsa — the."), W.z("Aniq narsa oldidan the kerak.")]));
// Kasb va "There is" — a/an
for (const [job, a] of [["engineer", "an"], ["artist", "an"], ["actor", "an"], ["doctor", "a"], ["pilot", "a"], ["teacher", "a"], ["astronaut", "an"], ["dentist", "a"], ["architect", "an"], ["farmer", "a"]])
  add(`My uncle is ___ ${job}.`, a, `Kasb aytilganda a / an kerak. “${job}” ${a === "an" ? "unli" : "undosh"} tovush bilan boshlanadi → ${a} ${job}.`, [a === "an" ? W.a(`“${job}” unli tovush bilan boshlanadi → an.`) : W.an(`“${job}” undosh tovush bilan boshlanadi → a.`), W.z("Kasb oldidan a / an tushib qolmaydi: He is a doctor."), W.the("Kasbini aytganda — a / an (the emas).")]);
for (const [n, a] of [["cat", "a"], ["owl", "an"], ["apple", "an"], ["bird", "a"], ["elephant", "an"], ["boy", "a"], ["insect", "an"], ["ball", "a"]])
  add(`There is ___ ${n} in the garden.`, a, `There is + birinchi marta tilga olingan birlik ot → ${a} ${n}.`, [a === "an" ? W.a(`“${n}” unli tovush bilan → an.`) : W.an(`“${n}” undosh tovush bilan → a.`), W.the("There is dan keyin yangi narsa — a / an."), W.z("Birlik sanaladigan ot artiklsiz kelmaydi.")]);

const PARTS = [
  "A. a yoki an? · a or an?",
  "B. a, an, the yoki — ? · Choose the article",
  "C. To‘g‘ri gapni tanlang · Choose the correct sentence",
  "D. Qaysi so‘z? · Which word needs a / an?",
];

const PEOPLE = new Set(["honest boy", "old man", "happy child", "tall boy"]);
const lead = (w) => (w === "hour" ? "We have" : w === "uncle" ? "I have" : PEOPLE.has(w) ? "He is" : w === "European city" ? "Paris is" : "It is");

export function build() {
  const r = rng(505);
  const pool = [];

  // A. a / an
  const TPL = [(x) => `It is ___ ${x}.`, (x) => `This is ___ ${x}.`, (x) => `I can see ___ ${x}.`];
  for (const [w, a, uz] of AAN) {
    const tpl = w === "hour" ? (x) => `We have ___ ${x} for lunch.` : w === "uncle" ? (x) => `I have ___ ${x} in London.` : PEOPLE.has(w) ? (x) => `He is ___ ${x}.` : w === "European city" ? (x) => `Paris is ___ ${x}.` : pick(TPL, r);
    const other = a === "a" ? "an" : "a";
    pool.push(mc(0, `${tpl(w)} (${uz})`, a, [[other, aanWhy(w, a)], [Z, `“${w.split(" ").at(-1)}” — birlik sanaladigan ot, artiklsiz kelmaydi.`]], aanWhy(w, a)));
  }

  // B. the / a / an / —
  for (const x of TB) pool.push(mc(1, x.q, x.ans, x.wrongs, x.rule));

  // C. To'g'ri gap: B va A dagi gaplardan.
  const fill = (q, opt) => {
    const v = opt === Z ? "" : opt;
    return q.replace(/___ ?/, v ? `${v} ` : "").replace(/^\s+/, "").replace(/(^|[.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase());
  };
  for (const x of TB) {
    const right = fill(x.q, x.ans);
    pool.push(mc(2, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, x.wrongs.map(([o, why]) => [fill(x.q, o), why]), x.rule));
  }
  for (const [w, a] of AAN) {
    const other = a === "a" ? "an" : "a";
    const L = lead(w);
    pool.push(mc(2, "Choose the correct sentence · To‘g‘ri gapni tanlang", `${L} ${a} ${w}.`, [[`${L} ${other} ${w}.`, aanWhy(w, a)], [`${L} ${w}.`, "Birlik sanaladigan ot artiklsiz kelmaydi."]], aanWhy(w, a)));
  }

  // D. Qaysi so'zga an / a kerak?
  const ANS = AAN.filter((x) => !x[0].includes(" "));
  const vow = ANS.filter((x) => x[1] === "an");
  const con = ANS.filter((x) => x[1] === "a");
  for (let i = 0; i < 35; i++) {
    const right = pick(vow, r);
    const others = shuffle(con, r).slice(0, 3);
    pool.push(mc(3, "Which word needs “AN”? · Qaysi so‘z oldidan “an” keladi?", right[0], others.map((o) => [o[0], aanWhy(o[0], "a")]), aanWhy(right[0], "an")));
  }
  for (let i = 0; i < 35; i++) {
    const right = pick(con, r);
    const others = shuffle(vow, r).slice(0, 3);
    pool.push(mc(3, "Which word needs “A”? · Qaysi so‘z oldidan “a” keladi?", right[0], others.map((o) => [o[0], aanWhy(o[0], "an")]), aanWhy(right[0], "a")));
  }

  return {
    code: "KG5",
    unit: 5,
    title: "5. Articles: a, an, the",
    title_uz: "Artikllar: a, an, the · 200 ta test",
    seed: 5005,
    parts: PARTS,
    quotas: [[0, 45], [1, 80], [2, 45], [3, 30]],
    pool,
    intro: {
      what: "Artikl — ot oldidan keladigan kichik so‘z: a, an, the. O‘zbek tilida artikl yo‘q, shuning uchun uni yaxshi o‘rganish kerak.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "a / an",
          name_uz: "Noaniq artikl: a, an",
          summary: "a / an — “bitta, qandaydir bir” degan ma’noni beradi. Faqat BIRLIKDAGI SANALADIGAN ot bilan ishlatiladi. Qaysi biri kerakligi keyingi so‘zning TOVUSHIGA bog‘liq (harfiga emas!).",
          usage: [
            { text: "Undosh tovush oldidan — a: a book, a dog, a red apple.", example: { en: "I have a dog.", uz: "Mening itim bor." } },
            { text: "Unli tovush (a, e, i, o, u) oldidan — an: an apple, an egg, an owl.", example: { en: "She has an orange.", uz: "Unda apelsin bor." } },
            { text: "Kasbni aytganda.", example: { en: "My mother is a doctor. My uncle is an engineer.", uz: "Oyim shifokor. Amakim muhandis." } },
            { text: "Birinchi marta tilga olinganda.", example: { en: "There is a cat in the garden.", uz: "Bog‘da bir mushuk bor." } },
          ],
          structure: [
            { type: "+", formula: "a + undosh tovush", example: { en: "a pen, a horse, a big egg", uz: "ruchka, ot, katta tuxum" } },
            { type: "+", formula: "an + unli tovush", example: { en: "an egg, an umbrella, an old man", uz: "tuxum, soyabon, qariya" } },
            { type: "short", formula: "Tovushga qarang! an hour, an honest boy · a university, a uniform", example: { en: "I waited for an hour.", uz: "Men bir soat kutdim." } },
          ],
          signals: [
            { en: "a, e, i, o, u (tovush)", uz: "→ an" },
            { en: "h o‘qilmasa (hour, honest)", uz: "→ an" },
            { en: "u = [yu] (university, uniform)", uz: "→ a" },
            { en: "There is…", uz: "→ a / an" },
          ],
          tip: "Artikl ortidagi SIFATga qarang: an apple, lekin a red apple; an egg, lekin a big egg.",
        },
        {
          name: "the",
          name_uz: "Aniq artikl: the",
          summary: "the — “o‘sha, ma’lum” degan ma’noni beradi. Gapirayotgan va eshitayotgan odam qaysi narsa haqida gap ketayotganini biladi.",
          usage: [
            { text: "Ikkinchi marta tilga olinganda.", example: { en: "I have a cat and a dog. The cat is white.", uz: "Mening mushugim va itim bor. Mushuk oq." } },
            { text: "Dunyoda bitta bo‘lgan narsalar: the sun, the moon, the sky, the earth, the world.", example: { en: "The sun is hot.", uz: "Quyosh issiq." } },
            { text: "Ikkalamiz biladigan narsa: the door, the window, the teacher.", example: { en: "Please close the door.", uz: "Iltimos, eshikni yoping." } },
            { text: "Musiqa asboblari: play the piano, play the guitar.", example: { en: "He plays the guitar.", uz: "U gitara chaladi." } },
            { text: "Ba’zi mamlakatlar: the USA, the UK.", example: { en: "My cousin lives in the USA.", uz: "Amakivachcham AQShda yashaydi." } },
          ],
          structure: [
            { type: "+", formula: "the + birlik / ko‘plik / sanalmaydigan ot", example: { en: "the book, the books, the milk", uz: "o‘sha kitob, o‘sha kitoblar, o‘sha sut" } },
          ],
          signals: [
            { en: "sun, moon, sky, earth, world", uz: "→ the" },
            { en: "play + piano / guitar / violin", uz: "→ the" },
            { en: "ikkinchi marta", uz: "→ the" },
          ],
          tip: "a cat → the cat: birinchi marta “a”, keyin “the”.",
        },
        {
          name: "No article (—)",
          name_uz: "Artikl qo‘yilmaydigan holatlar",
          summary: "Ba’zi so‘zlar oldidan hech qanday artikl qo‘yilmaydi.",
          usage: [
            { text: "Ismlar, shaharlar, ko‘p mamlakatlar: Ali, Tashkent, Uzbekistan.", example: { en: "Ali lives in Tashkent.", uz: "Ali Toshkentda yashaydi." } },
            { text: "Sport o‘yinlari: play football, play chess.", example: { en: "We play football.", uz: "Biz futbol o‘ynaymiz." } },
            { text: "Ovqatlanish: have breakfast / lunch / dinner.", example: { en: "I have breakfast at 7.", uz: "Men soat 7 da nonushta qilaman." } },
            { text: "Tillar va fanlar: speak English, like maths.", example: { en: "She speaks English.", uz: "U inglizcha gapiradi." } },
            { text: "Hafta kunlari, transport, turg‘un iboralar: on Monday, by bus, go to school, go to bed, at home.", example: { en: "I go to school by bus.", uz: "Men maktabga avtobusda boraman." } },
          ],
          structure: [
            { type: "short", formula: "play football ✓ · play the football ✗", example: { en: "They play tennis on Sunday.", uz: "Ular yakshanba kuni tennis o‘ynaydi." } },
          ],
          signals: [
            { en: "play + sport", uz: "→ —" },
            { en: "breakfast, lunch, dinner", uz: "→ —" },
            { en: "by bus / car / train", uz: "→ —" },
            { en: "Monday, Tuesday…", uz: "→ —" },
          ],
          tip: "Taqqoslang: play the piano (musiqa) — play football (sport).",
        },
      ],
      mistakes: [
        { wrong: "a apple", right: "an apple", why: "Unli tovush → an." },
        { wrong: "an university", right: "a university", why: "[yu] — undosh tovush → a." },
        { wrong: "a hour", right: "an hour", why: "h o‘qilmaydi → an." },
        { wrong: "My father is doctor.", right: "My father is a doctor.", why: "Kasb oldidan a / an kerak." },
        { wrong: "play the football", right: "play football", why: "Sport oldidan artikl yo‘q." },
        { wrong: "play piano", right: "play the piano", why: "Musiqa asbobi oldidan the." },
        { wrong: "a sun", right: "the sun", why: "Yagona narsa → the." },
      ],
    },
  };
}
