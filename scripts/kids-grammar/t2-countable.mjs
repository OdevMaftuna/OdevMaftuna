// 2. COUNTABLE AND UNCOUNTABLE NOUNS — sanaladigan va sanalmaydigan otlar.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// Sanalmaydigan (kids darajasida aniq): [so'z, o'zbekcha, ovqatmi]
const UNC = [
  ["water", "suv", 1], ["milk", "sut", 1], ["juice", "sharbat", 1], ["tea", "choy", 1], ["bread", "non", 1], ["rice", "guruch", 1],
  ["sugar", "shakar", 1], ["salt", "tuz", 1], ["butter", "sariyog‘", 1], ["meat", "go‘sht", 1], ["honey", "asal", 1], ["soup", "sho‘rva", 1],
  ["flour", "un", 1], ["cheese", "pishloq", 1], ["money", "pul", 0], ["music", "musiqa", 0], ["homework", "uy vazifasi", 0],
  ["information", "ma’lumot", 0], ["advice", "maslahat", 0], ["furniture", "mebel", 0], ["news", "yangilik", 0], ["snow", "qor", 0],
  ["air", "havo", 0], ["weather", "ob-havo", 0], ["luggage", "yuk", 0],
];
// Sanaladigan: [birlik, ko'plik, o'zbekcha, ovqatmi]
const CNT = [
  ["apple", "apples", "olma", 1], ["egg", "eggs", "tuxum", 1], ["banana", "bananas", "banan", 1], ["orange", "oranges", "apelsin", 1],
  ["sandwich", "sandwiches", "sendvich", 1], ["tomato", "tomatoes", "pomidor", 1], ["carrot", "carrots", "sabzi", 1], ["onion", "onions", "piyoz", 1],
  ["cookie", "cookies", "pechenye", 1], ["potato", "potatoes", "kartoshka", 1], ["book", "books", "kitob", 0], ["chair", "chairs", "stul", 0],
  ["pencil", "pencils", "qalam", 0], ["toy", "toys", "o‘yinchoq", 0], ["friend", "friends", "do‘st", 0], ["car", "cars", "mashina", 0],
  ["bag", "bags", "sumka", 0], ["umbrella", "umbrellas", "soyabon", 0], ["eraser", "erasers", "o‘chirg‘ich", 0], ["idea", "ideas", "fikr", 0],
  ["dog", "dogs", "it", 0], ["flower", "flowers", "gul", 0], ["table", "tables", "stol", 0], ["window", "windows", "deraza", 0],
];
const vowel = (w) => /^[aeiou]/.test(w);
const art = (w) => (vowel(w) ? "an" : "a");

// Idishlar: [ot, to'g'ri idishlar, aniq noto'g'ri idishlar]
const CONT = [
  ["milk", ["glass", "bottle", "carton"], ["loaf", "slice", "bar", "sheet"]],
  ["water", ["glass", "bottle"], ["loaf", "slice", "bar", "sheet"]],
  ["juice", ["glass", "carton", "bottle"], ["loaf", "slice", "bar", "sheet"]],
  ["tea", ["cup"], ["loaf", "slice", "bar", "sheet"]],
  ["coffee", ["cup"], ["loaf", "slice", "sheet", "bar"]],
  ["bread", ["loaf", "slice"], ["glass", "cup", "bottle", "carton"]],
  ["cheese", ["slice", "piece"], ["glass", "cup", "bottle", "carton"]],
  ["soup", ["bowl"], ["loaf", "slice", "sheet", "bar"]],
  ["honey", ["jar"], ["loaf", "slice", "sheet", "bar"]],
  ["jam", ["jar"], ["loaf", "slice", "sheet", "bar"]],
  ["chocolate", ["bar"], ["glass", "cup", "bottle", "loaf"]],
  ["paper", ["sheet", "piece"], ["glass", "cup", "bottle", "loaf"]],
  ["pizza", ["slice", "piece"], ["glass", "cup", "bottle", "carton"]],
  ["cake", ["piece", "slice"], ["glass", "cup", "bottle", "carton"]],
  ["rice", ["bowl", "kilo"], ["loaf", "slice", "sheet", "bar"]],
  ["sugar", ["kilo"], ["loaf", "slice", "sheet", "bar"]],
  ["meat", ["kilo", "piece"], ["glass", "cup", "bottle", "carton"]],
  ["soap", ["bar"], ["glass", "cup", "loaf", "carton"]],
  ["advice", ["piece"], ["glass", "cup", "bottle", "loaf"]],
  ["information", ["piece"], ["glass", "cup", "bottle", "loaf"]],
  ["furniture", ["piece"], ["glass", "cup", "bottle", "loaf"]],
  ["oil", ["bottle"], ["loaf", "slice", "sheet", "bar"]],
  ["toothpaste", ["tube"], ["loaf", "slice", "glass", "cup"]],
  ["flour", ["kilo", "bag"], ["loaf", "slice", "sheet", "bar"]],
];
const C_UZ = { glass: "stakan", bottle: "shisha", carton: "karton quti", cup: "piyola/chashka", loaf: "buxanka", slice: "bo‘lak (yupqa)", piece: "bo‘lak", bowl: "kosa", jar: "banka", bar: "plitka", sheet: "varaq", kilo: "kilogramm", tube: "tyubik", bag: "qop/xalta" };

const PARTS = [
  "A. Sanaladimi yoki yo‘qmi? · Countable or uncountable?",
  "B. a / an yoki some? · a, an or some?",
  "C. is yoki are? · is or are?",
  "D. Idishlar · a glass of, a loaf of…",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(202);
  const pool = [];
  const uncTxt = (w) => `“${w}” — sanalmaydigan ot: “a ${w}” yoki “${w}s” deyilmaydi.`;

  // A. Qaysi so'z sanalmaydi / sanaladi?
  for (let i = 0; i < 60; i++) {
    const u = pick(UNC, r);
    const cs = shuffle(CNT, r).slice(0, 3);
    pool.push(mc(0, "Which word is UNCOUNTABLE? · Qaysi ot sanalmaydi?", u[0], cs.map((c) => [c[0], `“${c[0]}” — sanaladi: one ${c[0]}, two ${c[1]}.`]), `${uncTxt(u[0])} (${u[1]})`));
  }
  for (let i = 0; i < 50; i++) {
    const c = pick(CNT, r);
    const us = shuffle(UNC, r).slice(0, 3);
    pool.push(mc(0, "Which word is COUNTABLE? · Qaysi ot sanaladi?", c[0], us.map((u) => [u[0], uncTxt(u[0])]), `“${c[0]}” (${c[2]}) — sanaladi: one ${c[0]}, two ${c[1]}.`));
  }

  // B. a / an / some
  const FOOD_TPL = [(x) => `I’d like ___ ${x}, please.`, (x) => `Mum bought ___ ${x}.`, (x) => `Can I have ___ ${x}?`, (x) => `There is ___ ${x} in the kitchen.`];
  const OTHER_UNC = {
    money: [(x) => `I have ___ ${x} in my bag.`], music: [(x) => `Let’s listen to ___ ${x}.`], homework: [(x) => `I have ___ ${x} today.`],
    information: [(x) => `She gave me ___ ${x}.`], advice: [(x) => `My teacher gave me ___ ${x}.`], furniture: [(x) => `We bought ___ new ${x}.`],
    news: [(x) => `I have ___ good ${x} for you.`], snow: [(x) => `There is ___ ${x} in the garden.`], luggage: [(x) => `He has ___ ${x}.`],
  };
  const OTHER_CNT = [(x) => `I have ___ ${x}.`, (x) => `There is ___ ${x} on the desk.`, (x) => `She has got ___ ${x}.`];
  for (const [w, uz, food] of UNC) {
    const tpls = food ? FOOD_TPL : (OTHER_UNC[w] ?? []);
    for (const t of tpls)
      pool.push(mc(1, t(w), "some", [["a", uncTxt(w)], ["an", uncTxt(w)]], `“${w}” (${uz}) sanalmaydi → some ${w}.`));
  }
  for (const [s, p, uz, food] of CNT) {
    const tpls = food ? FOOD_TPL : OTHER_CNT;
    for (const t of shuffle(tpls, r).slice(0, 2)) {
      const right = art(s);
      const other = right === "a" ? "an" : "a";
      pool.push(
        mc(1, t(s), right, [[other, right === "an" ? `“${s}” unli tovush bilan boshlanadi → an.` : `“${s}” undosh tovush bilan boshlanadi → a.`], ["some", `“${s}” birlikda va sanaladi — some emas, ${right} kerak. some faqat ko‘plik bilan: some ${p}.`]], `“${s}” (${uz}) — sanaladigan, birlikda → ${right} ${s}.`),
      );
    }
  }

  // C. is / are
  const ADJ = { water: "cold", milk: "fresh", juice: "sweet", tea: "hot", bread: "fresh", rice: "ready", sugar: "white", butter: "soft", meat: "fresh", honey: "sweet", soup: "hot", cheese: "tasty", money: "on the table", music: "loud", homework: "easy", information: "useful", advice: "good", furniture: "new", news: "good", snow: "white", air: "fresh", weather: "nice", luggage: "heavy", flour: "in the bag", salt: "on the table" };
  for (const [w, uz] of UNC) {
    pool.push(mc(2, `The ${w} ___ ${ADJ[w]}.`, "is", [["are", uncTxt(w) + " Sanalmaydigan ot bilan fe’l birlikda: is."], ["am", "am faqat “I” bilan ishlatiladi."], ["be", "“be” — fe’lning asl shakli, gapda is/am/are bo‘ladi."]], `“${w}” (${uz}) sanalmaydi → fe’l birlikda: The ${w} is…`));
    pool.push(mc(2, `This ${w} ___ ${ADJ[w]}.`, "is", [["are", uncTxt(w)], ["am", "am faqat “I” bilan ishlatiladi."], ["be", "Gapda is/am/are bo‘ladi."]], `Sanalmaydigan ot → is.`));
  }
  const CADJ = ["fresh", "big", "new", "on the table", "very nice", "in the box"];
  for (const [s, p, uz] of CNT) {
    const a = pick(CADJ, r);
    pool.push(mc(2, `The ${p} ___ ${a}.`, "are", [["is", `“${p}” — ko‘plik → are.`], ["am", "am faqat “I” bilan ishlatiladi."], ["be", "Gapda is/am/are bo‘ladi."]], `“${p}” (${uz}lar) ko‘plikda → are.`));
  }
  if (pool.filter((x) => x.part === 2).length < 30) throw new Error("C kam");

  // D. Idishlar.
  for (const [n, rights, wrongs] of CONT) {
    for (const c of rights) {
      const ws = shuffle(wrongs, r).slice(0, 3);
      const SPECIAL = { advice: (x) => `Let me give you a ___ of ${x}.`, information: (x) => `That is a useful ___ of ${x}.`, furniture: (x) => `This chair is a nice ___ of ${x}.`, paper: (x) => `Please give me a ___ of ${x}.` };
      const t = SPECIAL[n] ?? pick([(x) => `Can I have a ___ of ${x}, please?`, (x) => `I bought a ___ of ${x}.`, (x) => `Please give me a ___ of ${x}.`], r);
      pool.push(mc(3, t(n), c, ws.map((w) => [w, `“a ${w} of ${n}” deyilmaydi — ${w} (${C_UZ[w]}) ${n} uchun mos emas.`]), `a ${c} of ${n} — bir ${C_UZ[c]} ${n}. Sanalmaydigan narsani idish bilan sanaymiz.`));
    }
  }
  // Teskari: "a loaf of ___"
  const CONTAINERS = [...new Set(CONT.flatMap((x) => x[1]))];
  for (const c of CONTAINERS) {
    const fits = CONT.filter((x) => x[1].includes(c)).map((x) => x[0]);
    const nots = CONT.filter((x) => x[2].includes(c)).map((x) => x[0]);
    if (nots.length < 3) continue;
    for (const n of fits) {
      const ws = shuffle(nots, r).slice(0, 3);
      pool.push(mc(3, `a ${c} of ___`, n, ws.map((w) => [w, `“a ${c} of ${w}” deyilmaydi.`]), `a ${c} of ${n} — to‘g‘ri birikma.`));
    }
  }

  // E. To'g'ri gap.
  for (const [w, uz] of UNC.filter((x) => !["weather", "air"].includes(x[0]))) {
    const t = pick([(x) => `I need some ${x}.`, (x) => `We have got some ${x}.`, (x) => `There is some ${x} here.`], r);
    const right = t(w);
    pool.push(
      mc(4, `Choose the correct sentence (“${w}”) · To‘g‘ri gapni tanlang`, right, [
        [right.replace(`some ${w}`, `${art(w)} ${w}`), `${uncTxt(w)}`],
        [right.replace(`some ${w}`, `some ${w}s`), `“${w}” ko‘plikda ishlatilmaydi.`],
        [right.replace(`some ${w}`, `two ${w}s`), `Sanalmaydigan otni son bilan sanab bo‘lmaydi — idish kerak (two bottles of…, two pieces of…).`],
      ], `“${w}” (${uz}) sanalmaydi → some ${w}.`),
    );
  }
  for (const [n, rights] of CONT.filter((x) => x[0] !== "chocolate" && x[0] !== "pizza" && x[0] !== "cake" && x[0] !== "paper" && x[0] !== "advice" && x[0] !== "information")) {
    const c = rights[0];
    const cp = c === "loaf" ? "loaves" : c === "glass" ? "glasses" : c === "piece" ? "pieces" : c === "slice" ? "slices" : c === "bowl" ? "bowls" : c === "jar" ? "jars" : c === "bar" ? "bars" : c === "kilo" ? "kilos" : c === "tube" ? "tubes" : c === "cup" ? "cups" : c === "bottle" ? "bottles" : c === "carton" ? "cartons" : `${c}s`;
    const right = `I bought two ${cp} of ${n}.`;
    pool.push(
      mc(4, `Choose the correct sentence (“${n}”) · To‘g‘ri gapni tanlang`, right, [
        [`I bought two ${n}s.`, `“${n}” sanalmaydi — “${n}s” deyilmaydi.`],
        [`I bought two ${c} of ${n}.`, `Idish so‘zi ko‘plikda bo‘ladi: two ${cp}.`],
        [`I bought two ${cp} of ${n}s.`, `“${n}” ko‘plikka o‘tmaydi.`],
      ], `Sanalmaydigan ot o‘zgarmaydi, idish ko‘plikka o‘tadi: two ${cp} of ${n}.`),
    );
  }

  return {
    code: "KG2",
    unit: 2,
    title: "2. Countable and Uncountable Nouns",
    title_uz: "Sanaladigan va sanalmaydigan otlar · 200 ta test",
    seed: 2002,
    parts: PARTS,
    quotas: [[0, 50], [1, 45], [2, 30], [3, 45], [4, 30]],
    pool,
    intro: {
      what: "Otlar ikki xil bo‘ladi: sanaladigan (apple, book) va sanalmaydigan (water, milk).",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Countable nouns",
          name_uz: "Sanaladigan otlar",
          summary: "Bir, ikki, uch… deb sanash mumkin bo‘lgan otlar. Ular birlik va ko‘plikda bo‘ladi: an apple → two apples.",
          usage: [
            { text: "Birlikda — oldidan a / an keladi.", example: { en: "I have an apple and a banana.", uz: "Menda bitta olma va bitta banan bor." } },
            { text: "Ko‘plikda — -s qo‘shiladi va son yoki some bilan keladi.", example: { en: "There are some eggs in the fridge.", uz: "Muzlatgichda bir nechta tuxum bor." } },
            { text: "Fe’l: birlikda — is, ko‘plikda — are.", example: { en: "The apple is red. The apples are red.", uz: "Olma qizil. Olmalar qizil." } },
          ],
          structure: [
            { type: "+", formula: "a / an + birlik ot", example: { en: "a book, an egg, an orange", uz: "bitta kitob, bitta tuxum" } },
            { type: "+", formula: "son / some + ko‘plik ot", example: { en: "three books, some eggs", uz: "uchta kitob, bir nechta tuxum" } },
          ],
          signals: [
            { en: "a / an", uz: "bitta" },
            { en: "one, two, three…", uz: "sonlar" },
            { en: "How many…?", uz: "Nechta…?" },
          ],
          tip: "Sanaladigan ot birlikda yolg‘iz turmaydi: “I have book” emas — “I have a book”.",
        },
        {
          name: "Uncountable nouns",
          name_uz: "Sanalmaydigan otlar",
          summary: "Sanab bo‘lmaydigan narsalar: suyuqliklar (water, milk, juice, tea), mayda donalar (rice, sugar, salt, flour), ba’zi ovqatlar (bread, cheese, meat, butter, honey) va ko‘rinmaydigan narsalar (money, music, homework, information, advice, news, furniture, weather).",
          usage: [
            { text: "a / an ishlatilmaydi va -s qo‘shilmaydi.", example: { en: "I drink water every day.", uz: "Men har kuni suv ichaman." } },
            { text: "Fe’l doim birlikda: is.", example: { en: "The milk is cold.", uz: "Sut sovuq." } },
            { text: "“some” bilan ishlatiladi.", example: { en: "Can I have some bread, please?", uz: "Menga ozgina non bera olasizmi?" } },
            { text: "Diqqat: news, furniture, advice, homework, information — o‘zbekchada sanaladi, inglizchada SANALMAYDI!", example: { en: "My teacher gave me some advice.", uz: "Ustozim menga maslahat berdi." } },
          ],
          structure: [
            { type: "+", formula: "some + uncountable noun", example: { en: "some water, some rice", uz: "biroz suv, biroz guruch" } },
            { type: "+", formula: "uncountable noun + is", example: { en: "The news is good.", uz: "Yangilik yaxshi." } },
            { type: "-", formula: "a / an + uncountable ✗", example: { en: "a bread ✗ → some bread ✓", uz: "“a bread” deyilmaydi" } },
          ],
          signals: [
            { en: "some", uz: "biroz, ozgina" },
            { en: "How much…?", uz: "Qancha…?" },
            { en: "is (birlik)", uz: "fe’l birlikda" },
          ],
          tip: "“breads, moneys, homeworks, advices, furnitures” — bunday so‘zlar yo‘q!",
        },
        {
          name: "Containers: a glass of, a loaf of…",
          name_uz: "Sanalmaydigan narsani idish bilan sanash",
          summary: "Sanalmaydigan narsani sanash uchun idish yoki bo‘lak so‘zi ishlatiladi. Shunda idish ko‘plikka o‘tadi, ot esa o‘zgarmaydi.",
          usage: [
            { text: "Ichimliklar: a glass of water / milk / juice, a cup of tea / coffee, a bottle of water / oil, a carton of milk / juice.", example: { en: "Can I have a glass of milk?", uz: "Bir stakan sut bera olasizmi?" } },
            { text: "Ovqatlar: a loaf of bread, a slice of bread / cheese / pizza, a bowl of soup / rice, a jar of honey / jam, a bar of chocolate, a kilo of meat / sugar.", example: { en: "Mum bought two loaves of bread.", uz: "Oyim ikki buxanka non sotib oldi." } },
            { text: "Boshqa: a piece of paper / advice / information / furniture, a sheet of paper, a bar of soap, a tube of toothpaste.", example: { en: "Give me a piece of paper, please.", uz: "Menga bir varaq qog‘oz bering." } },
          ],
          structure: [
            { type: "+", formula: "a / one + container + of + noun", example: { en: "a bowl of soup", uz: "bir kosa sho‘rva" } },
            { type: "+", formula: "two + containers + of + noun", example: { en: "two glasses of juice", uz: "ikki stakan sharbat" } },
          ],
          signals: [
            { en: "glass, cup, bottle, carton", uz: "ichimliklar uchun" },
            { en: "loaf, slice, piece, bowl, jar, bar, kilo", uz: "ovqatlar uchun" },
          ],
          tip: "“two breads” emas — “two loaves of bread”. Ko‘plikka idish o‘tadi, ot emas!",
        },
      ],
      mistakes: [
        { wrong: "I want a water.", right: "I want some water.", why: "water sanalmaydi — a/an bilan kelmaydi." },
        { wrong: "two breads", right: "two loaves of bread", why: "bread sanalmaydi — idish bilan sanaladi." },
        { wrong: "The news are good.", right: "The news is good.", why: "news — sanalmaydi, fe’l birlikda." },
        { wrong: "a furniture", right: "a piece of furniture", why: "furniture sanalmaydi." },
        { wrong: "I have homeworks.", right: "I have some homework.", why: "homework sanalmaydi." },
      ],
    },
  };
}
