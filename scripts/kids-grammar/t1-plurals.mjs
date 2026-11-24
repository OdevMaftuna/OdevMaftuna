// 1. PLURALS — otlarning ko'plik shakli.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// [birlik, ko'plik, o'zbekcha]
const REG = [
  ["book", "books", "kitob"], ["pen", "pens", "ruchka"], ["cat", "cats", "mushuk"], ["dog", "dogs", "it"], ["apple", "apples", "olma"],
  ["girl", "girls", "qiz"], ["tree", "trees", "daraxt"], ["flower", "flowers", "gul"], ["bird", "birds", "qush"], ["chair", "chairs", "stul"],
  ["table", "tables", "stol"], ["door", "doors", "eshik"], ["window", "windows", "deraza"], ["egg", "eggs", "tuxum"], ["ball", "balls", "koptok"],
  ["cake", "cakes", "tort"], ["house", "houses", "uy"], ["friend", "friends", "do‘st"], ["bag", "bags", "sumka"], ["kite", "kites", "varrak"],
  ["horse", "horses", "ot"], ["rabbit", "rabbits", "quyon"], ["lemon", "lemons", "limon"], ["carrot", "carrots", "sabzi"], ["pencil", "pencils", "qalam"],
  ["ruler", "rulers", "chizg‘ich"], ["desk", "desks", "parta"], ["banana", "bananas", "banan"], ["orange", "oranges", "apelsin"], ["elephant", "elephants", "fil"],
  ["frog", "frogs", "qurbaqa"], ["duck", "ducks", "o‘rdak"], ["shoe", "shoes", "poyabzal"], ["sock", "socks", "paypoq"], ["cup", "cups", "piyola"],
  ["lion", "lions", "sher"], ["student", "students", "talaba"], ["teacher", "teachers", "o‘qituvchi"], ["doll", "dolls", "qo‘g‘irchoq"], ["river", "rivers", "daryo"],
];
const VOWEL_Y = [["boy", "boys", "o‘g‘il bola"], ["toy", "toys", "o‘yinchoq"], ["key", "keys", "kalit"], ["day", "days", "kun"], ["monkey", "monkeys", "maymun"], ["donkey", "donkeys", "eshak"]];
const ES = [
  ["bus", "buses", "avtobus"], ["glass", "glasses", "stakan"], ["dress", "dresses", "ko‘ylak"], ["class", "classes", "sinf"], ["box", "boxes", "quti"],
  ["fox", "foxes", "tulki"], ["watch", "watches", "qo‘l soati"], ["bench", "benches", "skameyka"], ["brush", "brushes", "cho‘tka"], ["dish", "dishes", "idish"],
  ["peach", "peaches", "shaftoli"], ["sandwich", "sandwiches", "sendvich"], ["tomato", "tomatoes", "pomidor"], ["potato", "potatoes", "kartoshka"],
  ["hero", "heroes", "qahramon"], ["beach", "beaches", "plyaj"], ["wish", "wishes", "istak"], ["address", "addresses", "manzil"], ["witch", "witches", "jodugar"],
];
const O_S = [["photo", "photos", "surat"], ["piano", "pianos", "pianino"], ["radio", "radios", "radio"], ["zoo", "zoos", "hayvonot bog‘i"], ["video", "videos", "video"], ["kangaroo", "kangaroos", "kenguru"]];
const IES = [
  ["baby", "babies", "chaqaloq"], ["city", "cities", "shahar"], ["lady", "ladies", "xonim"], ["party", "parties", "bayram"], ["family", "families", "oila"],
  ["cherry", "cherries", "olcha"], ["story", "stories", "hikoya"], ["country", "countries", "mamlakat"], ["butterfly", "butterflies", "kapalak"],
  ["strawberry", "strawberries", "qulupnay"], ["puppy", "puppies", "kuchukcha"], ["library", "libraries", "kutubxona"], ["fly", "flies", "pashsha"],
  ["dictionary", "dictionaries", "lug‘at"], ["candy", "candies", "konfet"],
];
const VES = [
  ["leaf", "leaves", "barg"], ["wolf", "wolves", "bo‘ri"], ["knife", "knives", "pichoq"], ["wife", "wives", "xotin"], ["life", "lives", "hayot"],
  ["half", "halves", "yarim"], ["shelf", "shelves", "javon"], ["thief", "thieves", "o‘g‘ri"], ["loaf", "loaves", "buxanka non"], ["calf", "calves", "buzoq"],
];
const F_S = [["roof", "roofs", "tom"], ["chief", "chiefs", "boshliq"], ["cliff", "cliffs", "qoya"], ["giraffe", "giraffes", "jirafa"]];
const IRR = [
  ["man", "men", "erkak"], ["woman", "women", "ayol"], ["child", "children", "bola"], ["foot", "feet", "oyoq panjasi"], ["tooth", "teeth", "tish"],
  ["mouse", "mice", "sichqon"], ["goose", "geese", "g‘oz"], ["person", "people", "odam"], ["ox", "oxen", "ho‘kiz"],
];
const SAME = [["sheep", "sheep", "qo‘y"], ["fish", "fish", "baliq"], ["deer", "deer", "kiyik"]];

const GROUPS = [
  ["REG", REG, "Ko‘p otlarga oxiriga faqat -s qo‘shiladi"],
  ["VY", VOWEL_Y, "Unli + y bilan tugasa (boy, key, day), y o‘zgarmaydi — faqat -s qo‘shiladi"],
  ["ES", ES, "-s, -ss, -sh, -ch, -x, -o bilan tugagan otlarga -es qo‘shiladi"],
  ["OS", O_S, "Istisno: photo, piano, radio, zoo, video, kangaroo faqat -s oladi"],
  ["IES", IES, "Undosh + y bilan tugasa, y → i bo‘lib -es qo‘shiladi"],
  ["VES", VES, "-f / -fe bilan tugagan ko‘p otlarda f → v bo‘lib -es qo‘shiladi"],
  ["FS", F_S, "Istisno: roof, chief, cliff, giraffe faqat -s oladi"],
  ["IRR", IRR, "Bu noto‘g‘ri (irregular) ot — ko‘plik shakli qoidaga bo‘ysunmaydi, yodlanadi"],
  ["SAME", SAME, "sheep, fish, deer — birlik va ko‘plik shakli bir xil"],
];
const ALL = GROUPS.flatMap(([g, list, rule]) => list.map(([s, p, uz]) => ({ s, p, uz, g, rule })));
const CORRECT = new Set(ALL.map((w) => w.p));
// Haqiqiy inglizcha so'zlar — noto'g'ri variant sifatida ishlatilmaydi (aks holda chalg'itadi).
const REAL = new Set(["cares", "stares", "hates", "caries", "bookies", "fishes", "persons", "scarfs", "lives", "dates", "shoees", "cupes", "pens", "pines", "dayes", "toes", "goes", "busses", "peoples", "mouses", "rooves", "loafs", "heros"]);

/** Noto'g'ri ko'plik variantlari (3 ta) — har biri izohi bilan. */
function wrongsFor(w) {
  const { s, p } = w;
  const base = s.endsWith("y") ? s.slice(0, -1) : s;
  const stemF = s.endsWith("fe") ? s.slice(0, -2) : s.endsWith("f") ? s.slice(0, -1) : s;
  const pool = [];
  const add = (x, why) => {
    if (x && x !== p && !CORRECT.has(x) && !REAL.has(x) && !pool.some((y) => y[0] === x)) pool.push([x, why]);
  };
  switch (w.g) {
    case "REG":
      add(`${s}es`, `“${s}” -s/-sh/-ch/-x/-o bilan tugamaydi, shuning uchun -es emas, -s qo‘shiladi.`);
      add(`${s}${s.at(-1)}s`, "Harf ikkilantirilmaydi — faqat -s qo‘shiladi.");
      add(`${s}en`, "-en faqat ox → oxen kabi istisnolarda bo‘ladi.");
      add(`${s}ies`, "-ies faqat undosh + y bilan tugagan so‘zlarda bo‘ladi.");
      break;
    case "VY":
      add(`${base}ies`, "y dan oldin unli (a, e, o) bor — y o‘zgarmaydi, faqat -s qo‘shiladi.");
      add(`${s}es`, "Unli + y dan keyin -es emas, faqat -s qo‘shiladi.");
      add(`${base}is`, "Bunday shakl yo‘q — y o‘zgarmaydi.");
      break;
    case "ES":
      add(`${s}s`, `“${s}” ${s.endsWith("o") ? "-o" : "-s/-sh/-ch/-x"} bilan tugaydi — faqat -s emas, -es qo‘shiladi.`);
      add(`${s}ies`, "-ies faqat undosh + y bilan tugagan so‘zlarda bo‘ladi.");
      add(`${s}en`, "-en faqat ox → oxen kabi istisnolarda bo‘ladi.");
      add(`${s}ses`, "Ortiqcha harf qo‘shilgan.");
      break;
    case "OS":
      add(`${s}es`, `“${s}” — istisno: -o bilan tugasa ham faqat -s oladi.`);
      add(`${s}ies`, "-ies faqat undosh + y bilan tugagan so‘zlarda bo‘ladi.");
      add(`${s}en`, "-en faqat ox → oxen kabi istisnolarda bo‘ladi.");
      break;
    case "IES":
      add(`${s}s`, "y dan oldin undosh bor — y → i bo‘lib -es qo‘shiladi.");
      add(`${s}es`, "y o‘zgarishi kerak: y → i + es.");
      add(`${base}ys`, "Bunday shakl yo‘q — y → ies bo‘ladi.");
      add(`${base}is`, "Bunday shakl yo‘q — y → ies bo‘ladi.");
      break;
    case "VES":
      add(`${s}s`, `“${s}” -f/-fe bilan tugaydi — f → v bo‘lib -es qo‘shiladi.`);
      add(`${s}es`, "f o‘zgarishi kerak: f → ves.");
      add(`${stemF}fs`, "f → v bo‘lishi kerak.");
      add(`${stemF}vs`, "-ves bo‘lishi kerak (v + es).");
      add(`${s}en`, "-en faqat ox → oxen kabi istisnolarda bo‘ladi.");
      break;
    case "FS":
      add(`${stemF}ves`, `“${s}” — istisno: f → v bo‘lmaydi, faqat -s qo‘shiladi.`);
      add(`${s}es`, "Faqat -s qo‘shiladi.");
      add(`${stemF}vs`, "Bunday shakl yo‘q — faqat -s qo‘shiladi.");
      add(`${s}en`, "-en faqat ox → oxen kabi istisnolarda bo‘ladi.");
      break;
    case "IRR":
      add(`${s}s`, `“${s}” — noto‘g‘ri ot, -s qo‘shilmaydi: ${s} → ${p}.`);
      add(`${p}s`, `“${p}” o‘zi ko‘plik — yana -s qo‘shilmaydi.`);
      add(`${s}es`, `Noto‘g‘ri ot: ${s} → ${p}.`);
      add(`${s}en`, `Noto‘g‘ri ot: ${s} → ${p}.`);
      break;
    case "SAME":
      add(`${s}s`, `“${s}” ko‘plikda ham o‘zgarmaydi: two ${p}.`);
      add(`${s}es`, `“${s}” ko‘plikda ham o‘zgarmaydi.`);
      add(`${s}ies`, `“${s}” ko‘plikda ham o‘zgarmaydi.`);
      add(`${s}en`, `“${s}” ko‘plikda ham o‘zgarmaydi.`);
      break;
  }
  return pool.slice(0, 3);
}
const explainOf = (w) => `${w.rule}: ${w.s} → ${w.p}.`;
const NUMS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const PARTS = [
  "A. Ko‘plik shaklini tanlang · Choose the plural",
  "B. Gapni to‘ldiring · Complete the sentence",
  "C. Birlik yoki ko‘plik? · Singular or plural?",
  "D. Qoidani toping · Find the rule",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(101);
  const pool = [];
  const usable = ALL.filter((w) => wrongsFor(w).length === 3);

  // A. Ko'plik shakli.
  for (const w of usable) pool.push(mc(0, `“${w.s}” (${w.uz}) so‘zining ko‘plik shakli qaysi?`, w.p, wrongsFor(w), explainOf(w)));

  // B. Gapda — son bilan (ko'plik) yoki "one/a" bilan (birlik).
  const TPL = [
    (n, x) => `There are ${n} ___ in the picture. (${x})`,
    (n, x) => `I can see ${n} ___ in this photo. (${x})`,
    (n, x) => `Can you see ${n} ___ in the picture? (${x})`,
    (n, x) => `Look! There are ${n} ___ in the book. (${x})`,
    (n, x) => `Count the ${n} ___ in the picture. (${x})`,
  ];
  for (const w of shuffle(usable, r)) {
    const n = pick(NUMS, r);
    pool.push(mc(1, pick(TPL, r)(n, w.s), w.p, wrongsFor(w), `“${n}” — ko‘plik. ${explainOf(w)}`));
  }
  for (const w of shuffle(usable.filter((x) => x.g !== "SAME"), r).slice(0, 25)) {
    const t = pick([(x) => `There is only one ___ in the picture. (${x})`, (x) => `I can see one ___ in this photo. (${x})`], r);
    pool.push(mc(1, t(w.s), w.s, [[w.p, `“one” — bitta, demak birlik shakli kerak: one ${w.s}.`], ...wrongsFor(w).slice(0, 2)], `“one” dan keyin ot birlikda bo‘ladi: one ${w.s}.`));
  }

  // C. Qaysi so'z ko'plikda / birlikda?
  const notSame = ALL.filter((w) => w.g !== "SAME");
  const sneaky = new Set(["bus", "glass", "dress", "class", "address"]);
  for (let i = 0; i < 30; i++) {
    const right = pick(notSame, r);
    const others = shuffle(notSame.filter((w) => w !== right), r).slice(0, 3);
    pool.push(
      mc(2, "Which word is PLURAL? · Qaysi so‘z ko‘plikda?", right.p, others.map((w) => [w.s, `“${w.s}” — birlik (bitta ${w.uz}).${sneaky.has(w.s) ? " Oxiri -s bo‘lsa ham, bu birlik!" : ""}`]), `“${right.p}” — ko‘plik (${right.s} → ${right.p}).`),
    );
  }
  for (let i = 0; i < 20; i++) {
    const right = pick(notSame.filter((w) => !sneaky.has(w.s)), r);
    const others = shuffle(notSame.filter((w) => w !== right), r).slice(0, 3);
    pool.push(mc(2, "Which word is SINGULAR? · Qaysi so‘z birlikda?", right.s, others.map((w) => [w.p, `“${w.p}” — ko‘plik (${w.s} → ${w.p}).`]), `“${right.s}” — birlik (bitta ${right.uz}).`));
  }

  // D. Qoida: noto'g'ri juftlikni topish va qaysi so'z -es / -ies / -ves oladi.
  for (let i = 0; i < 30; i++) {
    const bad = pick(usable, r);
    const [wf, why] = pick(wrongsFor(bad), r);
    const goods = shuffle(usable.filter((w) => w.g !== bad.g), r).slice(0, 3);
    pool.push(
      mc(3, "Find the WRONG pair · Noto‘g‘ri juftlikni toping", `${bad.s} – ${wf}`, goods.map((w) => [`${w.s} – ${w.p}`, `Bu to‘g‘ri: ${explainOf(w)}`]), `Noto‘g‘ri: ${bad.s} – ${wf}. ${why} To‘g‘risi: ${bad.s} → ${bad.p}.`),
    );
  }
  const ruleQ = [
    ["ES", ["REG", "OS"], "Which word takes -ES in the plural? · Qaysi so‘zga -es qo‘shiladi?", "faqat -s oladi"],
    ["IES", ["VY"], "Which word changes Y → IES? · Qaysi so‘zda y → ies bo‘ladi?", "y o‘zgarmaydi yoki y bilan tugamaydi"],
    ["VES", ["FS"], "Which word changes F → VES? · Qaysi so‘zda f → ves bo‘ladi?", "f → v bo‘lmaydi"],
    ["IRR", ["REG", "ES"], "Which word has an IRREGULAR plural? · Qaysi so‘z noto‘g‘ri ko‘plik shakliga ega?", "qoidaga bo‘ysunadi"],
  ];
  for (const [g, from, q, whyNot] of ruleQ)
    for (let i = 0; i < 10; i++) {
      const right = pick(ALL.filter((w) => w.g === g), r);
      const others = shuffle(ALL.filter((w) => from.includes(w.g)), r).slice(0, 3);
      pool.push(mc(3, q, right.s, others.map((w) => [w.s, `“${w.s}” ${whyNot}: ${w.s} → ${w.p}.`]), explainOf(right)));
    }

  // E. To'g'ri gap.
  const SENT = [
    (x) => `There are three ${x} in the picture.`,
    (x) => `I can see two ${x} in this photo.`,
    (x) => `Look at those ${x} in the picture!`,
    (x) => `She drew five ${x} in her notebook.`,
  ];
  for (const w of shuffle(usable, r).slice(0, 45)) {
    const t = pick(SENT, r);
    pool.push(mc(4, `Choose the correct sentence (“${w.s}”) · To‘g‘ri gapni tanlang`, cap(t(w.p)), wrongsFor(w).map(([x, why]) => [cap(t(x)), `“${x}” noto‘g‘ri. ${why}`]), `${explainOf(w)}`));
  }

  return {
    code: "KG1",
    unit: 1,
    title: "1. Plurals",
    title_uz: "Otlarning ko‘plik shakli · 200 ta test",
    seed: 1001,
    parts: PARTS,
    quotas: [[0, 60], [1, 50], [2, 30], [3, 30], [4, 30]],
    pool,
    intro: {
      what: "Ko‘plik shakli — bittadan ko‘p narsani bildiradi: one book → two books.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Regular plurals: + s",
          name_uz: "Oddiy ko‘plik: -s qo‘shiladi",
          summary: "Ingliz tilida ko‘p otlarning ko‘plik shakli oxiriga -s qo‘shib yasaladi. O‘zbek tilidagi “-lar” qo‘shimchasiga o‘xshaydi: kitob → kitoblar, book → books.",
          usage: [
            { text: "Bittadan ko‘p narsa haqida gapirganda ot ko‘plikda bo‘ladi.", example: { en: "I have two cats.", uz: "Mening ikkita mushugim bor." } },
            { text: "Son (two, three…) dan keyin ot doim ko‘plikda bo‘ladi. Diqqat: o‘zbekchada “ikkita kitob” deymiz, inglizchada esa “two books”!", example: { en: "There are five apples.", uz: "Beshta olma bor." } },
            { text: "“one / a / an” dan keyin ot birlikda qoladi.", example: { en: "I have one sister and two brothers.", uz: "Mening bitta opam va ikkita akam bor." } },
          ],
          structure: [
            { type: "+", formula: "noun + s", example: { en: "book → books, pen → pens, girl → girls", uz: "kitob → kitoblar" } },
            { type: "+", formula: "vowel + y → + s", example: { en: "boy → boys, toy → toys, key → keys, day → days", uz: "y dan oldin unli bo‘lsa — faqat -s" } },
          ],
          signals: [
            { en: "two, three, four…", uz: "sonlar" },
            { en: "many", uz: "ko‘p" },
            { en: "some", uz: "bir nechta" },
            { en: "these / those", uz: "bular / ular" },
            { en: "There are…", uz: "…bor (ko‘p)" },
          ],
          tip: "Sondan keyin -s ni unutmang! “two book” emas, “two books”.",
        },
        {
          name: "+ es (s, ss, sh, ch, x, o)",
          name_uz: "-es qo‘shiladigan otlar",
          summary: "So‘z -s, -ss, -sh, -ch, -x yoki -o bilan tugasa, talaffuz oson bo‘lishi uchun -es qo‘shiladi.",
          usage: [
            { text: "-s, -ss bilan tugasa: bus → buses, glass → glasses, dress → dresses.", example: { en: "There are two buses.", uz: "Ikkita avtobus bor." } },
            { text: "-sh, -ch bilan tugasa: brush → brushes, watch → watches, peach → peaches.", example: { en: "I like peaches.", uz: "Men shaftolini yaxshi ko‘raman." } },
            { text: "-x bilan tugasa: box → boxes, fox → foxes.", example: { en: "The boxes are big.", uz: "Qutilar katta." } },
            { text: "-o bilan tugasa: tomato → tomatoes, potato → potatoes, hero → heroes.", example: { en: "Mum bought some potatoes.", uz: "Oyim kartoshka sotib oldi." } },
          ],
          structure: [
            { type: "+", formula: "s / ss / sh / ch / x / o + es", example: { en: "box → boxes, watch → watches, tomato → tomatoes", uz: "quti → qutilar" } },
            { type: "short", formula: "Istisno: photo → photos, piano → pianos, radio → radios, zoo → zoos, video → videos", example: { en: "I have many photos.", uz: "Menda ko‘p suratlar bor." } },
          ],
          signals: [
            { en: "-s, -ss", uz: "bus, glass" },
            { en: "-sh", uz: "brush, dish" },
            { en: "-ch", uz: "watch, bench" },
            { en: "-x", uz: "box, fox" },
            { en: "-o", uz: "tomato, potato" },
          ],
          tip: "Yodlash uchun: “Sasha’s boxes, watches and tomatoes” — s, sh, ch, x, o → -es.",
        },
        {
          name: "y → ies",
          name_uz: "-y bilan tugagan otlar",
          summary: "So‘z undosh + y bilan tugasa, y → i ga o‘zgaradi va -es qo‘shiladi. Agar y dan oldin unli (a, e, o, u) bo‘lsa — faqat -s.",
          usage: [
            { text: "Undosh + y: baby → babies, city → cities, story → stories, butterfly → butterflies.", example: { en: "Tashkent and Samarkand are big cities.", uz: "Toshkent va Samarqand — katta shaharlar." } },
            { text: "Unli + y: boy → boys, key → keys, toy → toys, monkey → monkeys.", example: { en: "The boys are playing with toys.", uz: "Bolalar o‘yinchoqlar bilan o‘ynayapti." } },
          ],
          structure: [
            { type: "+", formula: "consonant + y → i + es", example: { en: "baby → babies, family → families", uz: "chaqaloq → chaqaloqlar" } },
            { type: "+", formula: "vowel + y → y + s", example: { en: "boy → boys, day → days", uz: "kun → kunlar" } },
          ],
          signals: [],
          tip: "y dan oldingi harfga qarang: unli bo‘lsa — boys; undosh bo‘lsa — babies.",
        },
        {
          name: "f / fe → ves",
          name_uz: "-f / -fe bilan tugagan otlar",
          summary: "Ko‘p -f yoki -fe bilan tugagan so‘zlarda f → v bo‘lib -es qo‘shiladi. Lekin bir nechta istisnolar bor.",
          usage: [
            { text: "leaf → leaves, wolf → wolves, knife → knives, shelf → shelves, half → halves, life → lives.", example: { en: "The leaves are yellow in autumn.", uz: "Kuzda barglar sariq bo‘ladi." } },
            { text: "Istisnolar — faqat -s: roof → roofs, chief → chiefs, cliff → cliffs, giraffe → giraffes.", example: { en: "There are two giraffes at the zoo.", uz: "Hayvonot bog‘ida ikkita jirafa bor." } },
          ],
          structure: [
            { type: "+", formula: "f / fe → ves", example: { en: "knife → knives, wolf → wolves", uz: "pichoq → pichoqlar" } },
            { type: "short", formula: "Istisno: roof → roofs, giraffe → giraffes", example: { en: "The roofs are red.", uz: "Tomlar qizil." } },
          ],
          signals: [],
          tip: "“leaf, wolf, knife, wife, life, half, shelf, thief, loaf, calf” — shu 10 ta so‘zni yodlang.",
        },
        {
          name: "Irregular plurals",
          name_uz: "Noto‘g‘ri (irregular) ko‘plik shakllari",
          summary: "Ba’zi otlar qoidaga bo‘ysunmaydi — ularning ko‘plik shakli butunlay boshqacha. Ularni yodlash kerak. sheep, fish, deer esa umuman o‘zgarmaydi.",
          usage: [
            { text: "man → men, woman → women, child → children, person → people.", example: { en: "There are ten people in the room.", uz: "Xonada o‘nta odam bor." } },
            { text: "foot → feet, tooth → teeth, mouse → mice, goose → geese, ox → oxen.", example: { en: "Brush your teeth every day.", uz: "Har kuni tishingizni yuving." } },
            { text: "Bir xil shakl: one sheep → two sheep, one fish → five fish, one deer → three deer.", example: { en: "I can see three sheep.", uz: "Men uchta qo‘yni ko‘ryapman." } },
          ],
          structure: [
            { type: "+", formula: "man → men, child → children, foot → feet", example: { en: "The children are happy.", uz: "Bolalar xursand." } },
            { type: "short", formula: "sheep → sheep, fish → fish, deer → deer", example: { en: "My grandpa has twenty sheep.", uz: "Bobomning yigirmata qo‘yi bor." } },
          ],
          signals: [],
          tip: "“childrens”, “mens”, “feets”, “sheeps” — bunday so‘zlar YO‘Q! Ular allaqachon ko‘plikda.",
        },
      ],
      mistakes: [
        { wrong: "two book", right: "two books", why: "Sondan keyin ot ko‘plikda bo‘ladi." },
        { wrong: "boxs", right: "boxes", why: "-x bilan tugaydi → -es." },
        { wrong: "babys", right: "babies", why: "Undosh + y → ies." },
        { wrong: "boies", right: "boys", why: "Unli + y → faqat -s." },
        { wrong: "knifes", right: "knives", why: "f/fe → ves." },
        { wrong: "childrens", right: "children", why: "children — o‘zi ko‘plik." },
        { wrong: "sheeps", right: "sheep", why: "sheep o‘zgarmaydi." },
      ],
    },
  };
}
