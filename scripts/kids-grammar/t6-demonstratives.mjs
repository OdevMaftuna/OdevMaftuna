// 6. DEMONSTRATIVE PRONOUNS — this / that / these / those.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

// [birlik, ko'plik, o'zbekcha, sifat]
const N = [
  ["book", "books", "kitob", "new"], ["pen", "pens", "ruchka", "blue"], ["bag", "bags", "sumka", "heavy"], ["car", "cars", "mashina", "fast"],
  ["apple", "apples", "olma", "red"], ["flower", "flowers", "gul", "beautiful"], ["box", "boxes", "quti", "big"], ["dress", "dresses", "ko‘ylak", "pretty"],
  ["watch", "watches", "qo‘l soati", "expensive"], ["toy", "toys", "o‘yinchoq", "new"], ["key", "keys", "kalit", "small"], ["baby", "babies", "chaqaloq", "very small"],
  ["city", "cities", "shahar", "very big"], ["shoe", "shoes", "poyabzal", "black"], ["house", "houses", "uy", "old"], ["tree", "trees", "daraxt", "very tall"],
  ["bird", "birds", "qush", "very small"], ["dog", "dogs", "it", "friendly"], ["cat", "cats", "mushuk", "white"], ["ball", "balls", "koptok", "round"],
  ["chair", "chairs", "stul", "comfortable"], ["picture", "pictures", "rasm", "nice"], ["bike", "bikes", "velosiped", "new"], ["horse", "horses", "ot", "fast"],
  ["knife", "knives", "pichoq", "sharp"], ["leaf", "leaves", "barg", "yellow"], ["child", "children", "bola", "happy"], ["man", "men", "erkak", "tall"],
  ["woman", "women", "ayol", "kind"], ["mouse", "mice", "sichqon", "grey"], ["sheep", "sheep", "qo‘y", "white"], ["fish", "fish", "baliq", "orange"],
  ["tooth", "teeth", "tish", "white"], ["foot", "feet", "oyoq", "cold"], ["peach", "peaches", "shaftoli", "sweet"], ["tomato", "tomatoes", "pomidor", "red"],
];
const D = {
  this: { near: true, pl: false, uz: "bu (yaqindagi bitta)" },
  that: { near: false, pl: false, uz: "anavi / u (uzoqdagi bitta)" },
  these: { near: true, pl: true, uz: "bular (yaqindagi ko‘p)" },
  those: { near: false, pl: true, uz: "anavilar / ular (uzoqdagi ko‘p)" },
};
const ALL4 = Object.keys(D);
const whyD = (d) => `${d} — ${D[d].uz}.`;
const choose = (near, pl) => ALL4.find((d) => D[d].near === near && D[d].pl === pl);
const reasonFor = (right, wrong) => {
  const a = D[right];
  const b = D[wrong];
  if (a.pl !== b.pl) return `“${wrong}” ${b.pl ? "ko‘plik" : "birlik"} uchun, bu yerda ${a.pl ? "ko‘plik" : "birlik"} ot bor.`;
  return `“${wrong}” ${b.near ? "yaqindagi" : "uzoqdagi"} narsa uchun, bu yerda narsa ${a.near ? "yaqinda (here)" : "uzoqda (over there)"}.`;
};

const PARTS = [
  "A. this / that / these / those",
  "B. is yoki are? · is or are?",
  "C. Birlik yoki ko‘plik? · Singular or plural noun?",
  "D. Savol va qisqa javob · Questions and short answers",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
  "F. Tarjima qiling · Translate",
];

export function build() {
  const r = rng(606);
  const pool = [];

  // A.
  for (const [s, p, uz, adj] of N) {
    for (const pl of [false, true]) {
      const noun = pl ? p : s;
      const be = pl ? "are" : "is";
      for (const near of [true, false]) {
        const right = choose(near, pl);
        const place = near ? "here" : "over there";
        const q = pick([`___ ${noun} ${place} ${be} ${adj}.`, `Look at ___ ${noun} ${place}!`], r);
        const fmt = (d) => (q.startsWith("___") ? cap(d) : d);
        pool.push(
          mc(0, q, fmt(right), ALL4.filter((d) => d !== right).map((d) => [fmt(d), reasonFor(right, d)]), `${noun} — ${pl ? "ko‘plik" : "birlik"}, ${near ? "yaqinda (here)" : "uzoqda (over there)"} → ${right}. ${whyD(right)}`),
        );
      }
    }
  }

  // B. is / are
  for (const [s, p, , adj] of shuffle(N, r)) {
    for (const d of ALL4) {
      const pl = D[d].pl;
      const be = pl ? "are" : "is";
      const noun = pl ? p : s;
      const q = pick([`${cap(d)} ___ my ${noun}.`, `${cap(d)} ${noun} ___ ${adj}.`], r);
      pool.push(mc(1, q, be, [[pl ? "is" : "are", `“${d}” — ${pl ? "ko‘plik → are" : "birlik → is"}.`], ["am", "am faqat I bilan."], ["be", "Gapda is / are bo‘ladi."]], `${d} + ${be}.`));
    }
  }

  // C. Ot shakli
  for (const [s, p, uz, adj] of N.filter((x) => x[0] !== x[1])) {
    for (const d of ALL4) {
      const pl = D[d].pl;
      const right = pl ? p : s;
      const other = pl ? s : p;
      const be = pl ? "are" : "is";
      pool.push(
        mc(2, `${cap(d)} ___ ${be} ${adj}. (${s})`, right, [[other, `“${d}” — ${pl ? "ko‘plik, ot ham ko‘plikda" : "birlik, ot ham birlikda"} bo‘ladi.`], [pl ? `${s}${s.at(-1)}s` : `${p}s`, "Noto‘g‘ri shakl — bunday so‘z yo‘q."]], `${d} → ${pl ? "ko‘plik" : "birlik"}: ${d} ${right}.`),
      );
    }
  }

  // D. Savol va qisqa javob
  for (const [s, p] of N) {
    for (const d of ALL4) {
      const pl = D[d].pl;
      const noun = pl ? p : s;
      const be = pl ? "Are" : "Is";
      const pr = pl ? "they" : "it";
      const yes = r() < 0.5;
      const right = yes ? `${pr} ${pl ? "are" : "is"}` : `${pr} ${pl ? "aren’t" : "isn’t"}`;
      const wrongs = yes
        ? [[`${d} ${pl ? "are" : "is"}`, `Qisqa javobda ${d} emas, ${pr} ishlatiladi.`], [pl ? "it is" : "they are", `${d} ${noun} → ${pr}.`], [`${pr}’${pl ? "re" : "s"}`, "Ijobiy qisqa javobda qisqartma ishlatilmaydi."]]
        : [[`${d} ${pl ? "aren’t" : "isn’t"}`, `Qisqa javobda ${d} emas, ${pr} ishlatiladi.`], [pl ? "it isn’t" : "they aren’t", `${d} ${noun} → ${pr}.`], [`${pr} ${pl ? "isn’t" : "aren’t"}`, `${pr} bilan ${pl ? "aren’t" : "isn’t"}.`]];
      pool.push(mc(3, `${be} ${d} your ${noun}? — ${yes ? "Yes" : "No"}, ___ .`, right, wrongs, `this / that → javobda it; these / those → javobda they. ${cap(yes ? "Yes" : "No")}, ${right}.`));
    }
  }
  for (const [q, right, wrongs, ex] of [
    ["What’s ___ over there? — It’s a bird.", "that", [["this", "Uzoqda (over there) → that."], ["these", "Javob “It’s a bird” — birlik."], ["those", "Birlik va uzoq → that."]], "Uzoqdagi bitta narsa → that."],
    ["What are ___ in your hand? — They’re sweets.", "these", [["those", "Qo‘lingizda — yaqin → these."], ["this", "“are … They’re” — ko‘plik."], ["that", "Ko‘plik va yaqin → these."]], "Qo‘ldagi (yaqin) ko‘p narsa → these."],
    ["What’s ___ in your bag? — It’s my lunch.", "this", [["that", "Sumkangizda — yaqin."], ["these", "“It’s” — birlik."], ["those", "Birlik va yaqin → this."]], "Yaqindagi bitta → this."],
    ["Who are ___ people over there?", "those", [["these", "Uzoqda (over there) → those."], ["that", "people — ko‘plik."], ["this", "Ko‘plik va uzoq → those."]], "Uzoqdagi ko‘p → those."],
  ])
    pool.push(mc(3, q, right, wrongs, ex));

  // E. To'g'ri gap
  for (const [s, p, , adj] of N.filter((x) => x[0] !== x[1])) {
    for (const d of ALL4) {
      const pl = D[d].pl;
      const right = `${cap(d)} ${pl ? p : s} ${pl ? "are" : "is"} ${adj}.`;
      const swapD = pl ? (d === "these" ? "this" : "that") : d === "this" ? "these" : "those";
      pool.push(
        mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, [
          [`${cap(d)} ${pl ? p : s} ${pl ? "is" : "are"} ${adj}.`, `${d} + ${pl ? "are" : "is"}.`],
          [`${cap(d)} ${pl ? s : p} ${pl ? "are" : "is"} ${adj}.`, `${d} dan keyin ot ${pl ? "ko‘plikda" : "birlikda"} bo‘ladi.`],
          [`${cap(swapD)} ${pl ? p : s} ${pl ? "are" : "is"} ${adj}.`, `${swapD} — ${D[swapD].pl ? "ko‘plik" : "birlik"} uchun, ot esa ${pl ? "ko‘plikda" : "birlikda"}.`],
        ], `${d} + ${pl ? "ko‘plik ot + are" : "birlik ot + is"}.`),
      );
    }
  }

  // F. Tarjima
  const TR = [
    ["Bu mening kitobim.", "___ is my book.", "This"], ["Bular mening kitoblarim.", "___ are my books.", "These"], ["Anavi — mening uyim.", "___ is my house.", "That"],
    ["Anavilar — mening do‘stlarim.", "___ are my friends.", "Those"], ["Bu mening singlim.", "___ is my sister.", "This"], ["Bular mening ota-onam.", "___ are my parents.", "These"],
    ["Anavi qiz kim?", "Who is ___ girl?", "that"], ["Anavi bolalar kim?", "Who are ___ children?", "those"], ["Bu olma shirin.", "___ apple is sweet.", "This"],
    ["Bu olmalar shirin.", "___ apples are sweet.", "These"], ["Anavi mashina tez.", "___ car is fast.", "That"], ["Anavi mashinalar tez.", "___ cars are fast.", "Those"],
    ["Bu nima?", "What is ___ ?", "this"], ["Anavi nima?", "What is ___ ?", "that"], ["Bular nima?", "What are ___ ?", "these"], ["Anavilar nima?", "What are ___ ?", "those"],
    ["Bu ruchkalar yangi.", "___ pens are new.", "These"], ["Anavi daraxt baland.", "___ tree is tall.", "That"], ["Bu mushuk oq.", "___ cat is white.", "This"],
    ["Anavi qushlar chiroyli.", "___ birds are beautiful.", "Those"], ["Bu tuflilar qora.", "___ shoes are black.", "These"], ["Anavi ayol — o‘qituvchi.", "___ woman is a teacher.", "That"],
  ];
  for (const [uz, en, right] of TR) {
    const lower = right.toLowerCase();
    const others = ALL4.filter((d) => d !== lower).map((d) => [right === lower ? d : cap(d), `${whyD(d)} ${reasonFor(lower, d)}`]);
    pool.push(mc(5, `“${uz}” → ${en}`, right, others, `${whyD(lower)}`));
  }

  return {
    code: "KG6",
    unit: 6,
    title: "6. Demonstrative Pronouns",
    title_uz: "Ko‘rsatish olmoshlari: this, that, these, those · 200 ta test",
    seed: 6006,
    parts: PARTS,
    quotas: [[0, 50], [1, 35], [2, 30], [3, 30], [4, 35], [5, 20]],
    pool,
    intro: {
      what: "Ko‘rsatish olmoshlari narsani ko‘rsatish uchun ishlatiladi: bu, anavi, bular, anavilar.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "this / these — near",
          name_uz: "Yaqindagi narsalar: this, these",
          summary: "Narsa yoningizda, qo‘lingizda bo‘lsa — this (bitta) yoki these (ko‘p).",
          usage: [
            { text: "this + birlik ot + is", example: { en: "This book is interesting.", uz: "Bu kitob qiziqarli." } },
            { text: "these + ko‘plik ot + are", example: { en: "These books are interesting.", uz: "Bu kitoblar qiziqarli." } },
            { text: "Odamni tanishtirganda.", example: { en: "This is my friend Ali.", uz: "Bu mening do‘stim Ali." } },
          ],
          structure: [
            { type: "+", formula: "This + is + birlik", example: { en: "This is my pen.", uz: "Bu mening ruchkam." } },
            { type: "+", formula: "These + are + ko‘plik", example: { en: "These are my pens.", uz: "Bular mening ruchkalarim." } },
          ],
          signals: [
            { en: "here", uz: "bu yerda" },
            { en: "in my hand", uz: "qo‘limda" },
            { en: "this morning / this week", uz: "bugun ertalab / shu hafta" },
          ],
          tip: "these — this ning ko‘pligi. “These book” emas — “these books”.",
        },
        {
          name: "that / those — far",
          name_uz: "Uzoqdagi narsalar: that, those",
          summary: "Narsa uzoqda, qo‘lingiz yetmaydigan joyda bo‘lsa — that (bitta) yoki those (ko‘p).",
          usage: [
            { text: "that + birlik ot + is", example: { en: "That house is very big.", uz: "Anavi uy juda katta." } },
            { text: "those + ko‘plik ot + are", example: { en: "Those birds are beautiful.", uz: "Anavi qushlar chiroyli." } },
          ],
          structure: [
            { type: "+", formula: "That + is + birlik", example: { en: "That is my school.", uz: "Anavi — mening maktabim." } },
            { type: "+", formula: "Those + are + ko‘plik", example: { en: "Those are my friends.", uz: "Anavilar — mening do‘stlarim." } },
          ],
          signals: [
            { en: "there / over there", uz: "u yerda / narida" },
            { en: "Look at…", uz: "Qara…" },
          ],
          tip: "Jadval: yaqin + bitta = this · yaqin + ko‘p = these · uzoq + bitta = that · uzoq + ko‘p = those.",
        },
        {
          name: "Questions and short answers",
          name_uz: "Savol va qisqa javob",
          summary: "Savolda this / that / these / those, javobda esa it (bitta) yoki they (ko‘p) ishlatiladi.",
          usage: [
            { text: "Is this / that…? — Yes, it is. / No, it isn’t.", example: { en: "Is that your bike? — Yes, it is.", uz: "Anavi seningmi velosiped? — Ha." } },
            { text: "Are these / those…? — Yes, they are. / No, they aren’t.", example: { en: "Are these your shoes? — No, they aren’t.", uz: "Bular seningmi tuflilar? — Yo‘q." } },
          ],
          structure: [
            { type: "?", formula: "Is this / that + birlik?", example: { en: "What is this? — It’s a pencil case.", uz: "Bu nima? — Qalamdon." } },
            { type: "?", formula: "Are these / those + ko‘plik?", example: { en: "What are those? — They’re kites.", uz: "Anavilar nima? — Varraklar." } },
          ],
          signals: [],
          tip: "Javobda “Yes, this is” emas — “Yes, it is”!",
        },
      ],
      mistakes: [
        { wrong: "This books are new.", right: "These books are new.", why: "Ko‘plik ot → these." },
        { wrong: "These is my bag.", right: "This is my bag.", why: "Birlik → this is." },
        { wrong: "Those car is fast.", right: "That car is fast.", why: "Birlik → that." },
        { wrong: "Is this your pen? — Yes, this is.", right: "Yes, it is.", why: "Javobda it." },
        { wrong: "Are those your shoes? — Yes, those are.", right: "Yes, they are.", why: "Javobda they." },
      ],
    },
  };
}
