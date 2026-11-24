// 8. POSSESSIVE ADJECTIVES AND OBJECT PRONOUNS — my / your / his… va me / you / him…
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

const PRON = ["I", "you", "he", "she", "it", "we", "they"];
const POSS = { I: "my", you: "your", he: "his", she: "her", it: "its", we: "our", they: "their" };
const OBJ = { I: "me", you: "you", he: "him", she: "her", it: "it", we: "us", they: "them" };
const UZP = { I: "mening", you: "sening / sizning", he: "uning (o‘g‘il / erkak)", she: "uning (qiz / ayol)", it: "uning (narsa / hayvon)", we: "bizning", they: "ularning" };
const UZO = { I: "meni / menga", you: "seni / sizni", he: "uni / unga (o‘g‘il / erkak)", she: "uni / unga (qiz / ayol)", it: "uni / unga (narsa / hayvon)", we: "bizni / bizga", they: "ularni / ularga" };

// [ega (gap boshida), olmosh]
const SUBJ = [
  ["I", "I"], ["You", "you"], ["We", "we"], ["They", "they"], ["He", "he"], ["She", "she"],
  ["Ali", "he"], ["My brother", "he"], ["Mr Brown", "he"], ["The boy", "he"], ["My father", "he"],
  ["Malika", "she"], ["My sister", "she"], ["Mrs Smith", "she"], ["The girl", "she"], ["My mother", "she"],
  ["The children", "they"], ["My friends", "they"], ["Ali and Vali", "they"], ["My parents", "they"],
  ["My brother and I", "we"], ["Laylo and I", "we"], ["The dog", "it"], ["The cat", "it"], ["The bird", "it"],
];
// Egalik uchun narsalar (odam / hayvon)
const THINGS_P = ["bag", "bike", "room", "pen", "house", "kite", "ball", "phone", "computer", "dog"];
const THINGS_A = ["tail", "bowl", "ball", "toy", "bed"];
const allWrong = (right, list, map) => list.filter((x) => map[x] !== map[right]).map((x) => map[x]);

const PARTS = [
  "A. Egalik olmoshi · my, your, his, her…",
  "B. To‘ldiruvchi olmosh · me, you, him, her…",
  "C. Ega, egalik yoki to‘ldiruvchi? · I, my or me?",
  "D. Tarjima qiling · Translate",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(808);
  const pool = [];

  // A. "Ali has got a bike. ___ bike is red."
  for (const [s, p] of SUBJ) {
    const things = p === "it" ? THINGS_A : THINGS_P;
    for (const th of shuffle(things, r).slice(0, 3)) {
      const has = p === "I" || p === "you" || p === "we" || p === "they" ? "have" : "has";
      const right = POSS[p];
      const ws = shuffle(allWrong(p, PRON, POSS), r).slice(0, 3).map((w) => [cap(w), `“${w}” — ${UZP[PRON.find((x) => POSS[x] === w)]}. “${s}” → ${right}.`]);
      pool.push(mc(0, `${s} ${has} got a ${th}. ___ ${th} is new.`, cap(right), ws, `“${s}” → ${p} → ${right} (${UZP[p]}).`));
    }
  }
  // A2. its / it's
  for (const [n, part] of [["dog", "tail"], ["cat", "eyes"], ["bird", "wings"], ["tree", "leaves"], ["elephant", "ears"], ["house", "door"], ["horse", "legs"], ["fish", "fins"]])
    pool.push(
      mc(0, `The ${n} is happy. ___ ${part} ${part.endsWith("s") ? "are" : "is"} beautiful.`, "Its", [["It’s", "“It’s” = it is. Egalik uchun apostrofsiz “its”."], ["His", `${n} — hayvon / narsa → its.`], ["Their", `Bitta ${n} → its.`]], "Hayvon / narsa egaligi → its (apostrofsiz!)."),
    );

  // B. Object pronoun
  const B_TPL = [
    ["I love my mother. I help ___ every day.", "she"], ["My grandfather is old. We visit ___ on Sundays.", "he"], ["Where are my keys? I can’t find ___ .", "they"],
    ["This is my cat. I play with ___ every day.", "it"], ["Mum is calling you and me. She wants ___ in the kitchen.", "we"], ["I don’t understand. Can you help ___ , please?", "I"],
    ["Ali is my best friend. I sit next to ___ .", "he"], ["Malika is in my class. I like ___ very much.", "she"], ["The books are on the table. Please give ___ to me.", "they"],
    ["Hello, Bobur! I can see ___ !", "you"], ["My parents are at work. I miss ___ .", "they"], ["Our teacher is kind. She always helps ___ .", "we"],
    ["This apple is for ___ . Eat it, please!", "you"], ["Look at that bird! Can you see ___ ?", "it"], ["Mr Brown is our teacher. We listen to ___ carefully.", "he"],
    ["Where is your sister? I want to talk to ___ .", "she"], ["Tom and I are hungry. Please give ___ some bread.", "we"], ["I have a new kite. Do you want to fly ___ ?", "it"],
    ["The children are in the garden. Call ___ , please.", "they"], ["I am lost! Please help ___ !", "I"], ["Your shoes are dirty. Clean ___ , please.", "they"],
    ["My brother has got a new bike. He loves ___ .", "it"], ["Grandma makes cakes for ___ . We love her cakes!", "we"], ["Anna is my pen friend. I write to ___ every week.", "she"],
    ["Uncle Tom lives in London. We phone ___ every Sunday.", "he"], ["I’ve got two cats. I feed ___ every morning.", "they"], ["Can you hear ___ ? I’m here!", "I"],
    ["This present is for ___ , Malika!", "you"], ["Mum and Dad, I love ___ !", "you"], ["Our neighbours are nice. We often visit ___ .", "they"],
  ];
  for (const [q, p] of B_TPL) {
    const right = OBJ[p];
    const cand = [[p === "I" ? "I" : p, `“${p}” — ega olmoshi, gap boshida keladi. Fe’l / predlogdan keyin ${right}.`], [POSS[p], `“${POSS[p]}” — egalik, undan keyin ot keladi.`]];
    for (const x of shuffle(PRON, r)) if (OBJ[x] !== right) cand.push([OBJ[x], `“${OBJ[x]}” — ${UZO[x]}. Bu yerda ${right} kerak.`]);
    const ws = cand.filter((c, i) => c[0] !== right && cand.findIndex((y) => y[0] === c[0]) === i).slice(0, 3);
    pool.push(mc(1, q, right, ws, `Fe’l yoki predlogdan keyin to‘ldiruvchi olmosh: ${right} (${UZO[p]}).`));
  }
  // B2. Gap ichida: "Look at ___ ." / "Tell ___ the answer."
  for (const [s, p] of SUBJ.filter((x) => x[1] !== "I" && !/^(You|We|They|He|She)$/.test(x[0]))) {
    const right = OBJ[p];
    const be = p === "they" || p === "we" ? "are" : "is";
    for (const t of [() => `${s} ${be} here. Look at ___ !`, () => `${s} ${be} sad. Let’s help ___ .`]) {
      const q = t(right);
      const cand = [[p, `“${p}” — ega olmoshi. Fe’ldan keyin ${right}.`], [POSS[p], `“${POSS[p]}” — egalik olmoshi.`]];
      for (const x of shuffle(PRON, r)) if (OBJ[x] !== right && x !== "I" && x !== "you") cand.push([OBJ[x], `“${s}” → ${right}, ${OBJ[x]} emas.`]);
      const ws = cand.filter((c, i) => c[0] !== right && cand.findIndex((y) => y[0] === c[0]) === i).slice(0, 3);
      pool.push(mc(1, q, right, ws, `“${s}” → ${right}.`));
    }
  }

  // C. I / my / me aralash
  for (const p of PRON) {
    const rows = [
      [`___ ${p === "I" ? "am" : ["he", "she", "it"].includes(p) ? "is" : "are"} happy today.`, cap(p), "Gap boshida (ega) →"],
      [`This is ___ bag.`, POSS[p], "Ot oldida (kimning?) →"],
      [`Please call ___ later.`, OBJ[p], "Fe’ldan keyin (kimni?) →"],
    ];
    for (const [q, right, how] of rows) {
      if (p === "it" && q.includes("call")) continue;
      const opts = [cap(p), POSS[p], OBJ[p]].map((x, i) => (i === 0 && !q.startsWith("___") ? p : x));
      const fmt = (x) => (q.startsWith("___") ? cap(x) : x);
      const set = [...new Set([p, POSS[p], OBJ[p]].map(fmt))].filter((x) => x !== fmt(right));
      void opts;
      if (set.length < 2) set.push(fmt(p === "I" ? "mine" : "I"));
      pool.push(mc(2, `${q} (${p})`, fmt(right), set.map((x) => [x, `${how} ${fmt(right)}.`]), `${how} ${fmt(right)}. Ega: ${p} · Egalik: ${POSS[p]} · To‘ldiruvchi: ${OBJ[p]}.`));
    }
  }
  for (const [q, right, ws, ex] of [
    ["___ name is Ali. (I)", "My", [["I", "Ot (name) oldida egalik → my."], ["Me", "Ot oldida → my."]], "Ot oldida → my."],
    ["Ali and ___ are friends.", "I", [["me", "Gap egasi → I."], ["my", "Ega → I."], ["mine", "Ega → I."]], "Gap egasi (kim?) → I."],
    ["This book is for Ali and ___ .", "me", [["I", "Predlogdan (for) keyin → me."], ["my", "Ot yo‘q → me."], ["mine", "for + me."]], "Predlogdan keyin → me."],
    ["Tell ___ your name, please.", "me", [["I", "Fe’ldan keyin → me."], ["my", "Ot oldida emas → me."], ["mine", "Fe’ldan keyin → me."]], "Fe’ldan keyin → me."],
    ["The children love ___ teacher.", "their", [["them", "Ot oldida egalik → their."], ["they", "Ot oldida → their."], ["there", "“there” — u yerda."]], "Ot oldida → their."],
    ["We love ___ grandma.", "our", [["us", "Ot oldida → our."], ["we", "Ot oldida → our."], ["ours", "Ot oldida → our."]], "Ot oldida → our."],
    ["Is this ___ pen, Bobur?", "your", [["you", "Ot oldida → your."], ["you’re", "“you’re” = you are."], ["yours", "Ot oldida → your."]], "Ot oldida → your."],
    ["Malika is in the park with ___ dog.", "her", [["she", "Ot oldida → her."], ["his", "Malika — qiz → her."], ["hers", "Ot oldida → her."]], "Malika — qiz → her."],
    ["Bobur is washing ___ hands.", "his", [["him", "Ot oldida → his."], ["he", "Ot oldida → his."], ["her", "Bobur — o‘g‘il bola → his."]], "Bobur → his."],
  ])
    pool.push(mc(2, q, right, ws, ex));

  // D. Tarjima
  const TR = [
    ["mening ukam", "___ brother", "my", POSS], ["sizning maktabingiz", "___ school", "your", POSS], ["uning (Ali) velosipedi", "___ bike", "his", POSS],
    ["uning (Malika) qo‘g‘irchog‘i", "___ doll", "her", POSS], ["bizning uyimiz", "___ house", "our", POSS], ["ularning bog‘i", "___ garden", "their", POSS],
    ["uning (mushuk) dumi", "___ tail", "its", POSS], ["mening onam", "___ mother", "my", POSS], ["ularning o‘qituvchisi", "___ teacher", "their", POSS],
    ["bizning sinfimiz", "___ class", "our", POSS], ["Men uni (Ali) ko‘ryapman.", "I can see ___ .", "him", OBJ], ["Men uni (Malika) yaxshi ko‘raman.", "I like ___ .", "her", OBJ],
    ["U bizga yordam beradi.", "She helps ___ .", "us", OBJ], ["Ularni chaqiring!", "Call ___ !", "them", OBJ], ["Menga qarang!", "Look at ___ !", "me", OBJ],
    ["Men seni yaxshi ko‘raman.", "I love ___ .", "you", OBJ], ["Uni (kitob) menga bering.", "Give ___ to me.", "it", OBJ], ["Biz ularga yozamiz.", "We write to ___ .", "them", OBJ],
    ["U menga kitob beradi.", "He gives ___ a book.", "me", OBJ], ["Men uni (otam) kutyapman.", "I am waiting for ___ .", "him", OBJ],
  ];
  for (const [uz, en, right, map] of TR) {
    const p = PRON.find((x) => map[x] === right);
    const ws = [];
    const other = map === POSS ? OBJ : POSS;
    if (other[p] !== right) ws.push([other[p], map === POSS ? `“${other[p]}” — to‘ldiruvchi (uni / unga). Ot oldida egalik kerak.` : `“${other[p]}” — egalik (uning). Fe’ldan keyin to‘ldiruvchi kerak.`]);
    if (p !== "it" && p !== "you") ws.push([p === "I" ? "I" : p, `“${p}” — ega olmoshi.`]);
    for (const x of shuffle(PRON, r)) if (map[x] !== right && !ws.some((w) => w[0] === map[x])) ws.push([map[x], `“${map[x]}” — ${map === POSS ? UZP[x] : UZO[x]}.`]);
    pool.push(mc(3, `“${uz}” → ${en}`, right, ws.slice(0, 3), `${uz} → ${right}.`));
  }

  // E. To'g'ri gap
  for (const [s, p] of SUBJ) {
    const th = pick(p === "it" ? THINGS_A : THINGS_P, r);
    const has = ["I", "you", "we", "they"].includes(p) ? "love" : "loves";
    const right = `${s} ${has} ${POSS[p]} ${th}.`;
    const ws = [[`${s} ${has} ${OBJ[p]} ${th}.`, `Ot oldida egalik → ${POSS[p]}, ${OBJ[p]} emas.`]];
    if (p !== "I") ws.push([`${s} ${has} ${p} ${th}.`, `Ot oldida egalik → ${POSS[p]}.`]);
    else ws.push([`${s} ${has} I ${th}.`, "Ot oldida → my."]);
    const alt = shuffle(PRON.filter((x) => POSS[x] !== POSS[p]), r)[0];
    ws.push([`${s} ${has} ${POSS[alt]} ${th}.`, `“${s}” → ${POSS[p]}, ${POSS[alt]} emas.`]);
    const uniq = ws.filter((w, i) => w[0] !== right && ws.findIndex((y) => y[0] === w[0]) === i);
    pool.push(mc(4, `Choose the correct sentence (“${s}”) · To‘g‘ri gapni tanlang`, right, uniq, `“${s}” → ${POSS[p]} ${th}.`));
  }
  for (const [s, p] of SUBJ.filter((x) => !["I", "You", "We", "They", "He", "She"].includes(x[0]))) {
    const right = `I know ${OBJ[p]}.`;
    const ws = [[`I know ${p}.`, `Fe’ldan keyin → ${OBJ[p]}.`], [`I know ${POSS[p]}.`, `“${POSS[p]}” dan keyin ot kerak.`], [`Me know ${OBJ[p]}.`, "Gap boshida → I."]];
    pool.push(mc(4, `“${s}” → Choose the correct sentence · To‘g‘ri gapni tanlang`, right, ws.filter((w, i) => w[0] !== right && ws.findIndex((y) => y[0] === w[0]) === i), `${s} → ${OBJ[p]}: I know ${OBJ[p]}.`));
  }

  return {
    code: "KG8",
    unit: 8,
    title: "8. Possessive Adjectives and Object Pronouns",
    title_uz: "Egalik va to‘ldiruvchi olmoshlar · 200 ta test",
    seed: 8008,
    parts: PARTS,
    quotas: [[0, 60], [1, 55], [2, 25], [3, 20], [4, 40]],
    pool,
    intro: {
      what: "Har bir kishilik olmoshining uch shakli bor: ega (I), egalik (my), to‘ldiruvchi (me).",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Possessive adjectives",
          name_uz: "Egalik olmoshlari: my, your, his, her, its, our, their",
          summary: "“Kimning?” degan savolga javob beradi va doim OTDAN OLDIN keladi: my bag — mening sumkam.",
          usage: [
            { text: "I → my, you → your, he → his, she → her, it → its, we → our, they → their.", example: { en: "This is my brother. His name is Ali.", uz: "Bu mening ukam. Uning ismi Ali." } },
            { text: "his — erkak / o‘g‘il bolaning, her — ayol / qizning. O‘zbekchada ikkalasi ham “uning”!", example: { en: "Malika has got a cat. Her cat is white.", uz: "Malikaning mushugi bor. Uning mushugi oq." } },
            { text: "its — hayvon / narsaning. Apostrof yo‘q!", example: { en: "The dog is wagging its tail.", uz: "It dumini likillatyapti." } },
          ],
          structure: [
            { type: "+", formula: "possessive + noun", example: { en: "our house, their teacher", uz: "bizning uyimiz, ularning o‘qituvchisi" } },
          ],
          signals: [
            { en: "Whose…?", uz: "Kimning…?" },
            { en: "egalikdan keyin doim ot", uz: "my + book" },
          ],
          tip: "its ≠ it’s. “its” — uning (egalik), “it’s” — it is.",
        },
        {
          name: "Object pronouns",
          name_uz: "To‘ldiruvchi olmoshlar: me, you, him, her, it, us, them",
          summary: "“Kimni? Kimga?” degan savolga javob beradi. Fe’ldan yoki predlogdan (with, for, to, at) KEYIN keladi.",
          usage: [
            { text: "Fe’ldan keyin.", example: { en: "I love her. She helps me.", uz: "Men uni yaxshi ko‘raman. U menga yordam beradi." } },
            { text: "Predlogdan keyin.", example: { en: "This present is for them. Look at us!", uz: "Bu sovg‘a ular uchun. Bizga qarang!" } },
          ],
          structure: [
            { type: "+", formula: "verb + object pronoun", example: { en: "Call him!", uz: "Unga qo‘ng‘iroq qil!" } },
            { type: "+", formula: "preposition + object pronoun", example: { en: "Come with me.", uz: "Men bilan yur." } },
          ],
          signals: [
            { en: "with, for, to, at", uz: "predloglar" },
            { en: "help, love, like, see, call, give", uz: "fe’llar" },
          ],
          tip: "Jadval: I – my – me · you – your – you · he – his – him · she – her – her · it – its – it · we – our – us · they – their – them.",
        },
      ],
      mistakes: [
        { wrong: "Me name is Ali.", right: "My name is Ali.", why: "Ot oldida → my." },
        { wrong: "I love she.", right: "I love her.", why: "Fe’ldan keyin → her." },
        { wrong: "Malika and his mother", right: "Malika and her mother", why: "Malika — qiz → her." },
        { wrong: "The dog wags it’s tail.", right: "The dog wags its tail.", why: "Egalik → its." },
        { wrong: "Give it to I.", right: "Give it to me.", why: "Predlogdan keyin → me." },
      ],
    },
  };
}
