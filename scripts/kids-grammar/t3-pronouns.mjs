// 3. SUBJECT PRONOUNS — kishilik olmoshlari (I, you, he, she, it, we, they).
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

const PRON = ["I", "you", "he", "she", "it", "we", "they"];
const OBJ = { I: "me", you: "you", he: "him", she: "her", it: "it", we: "us", they: "them" };
const POSS = { I: "my", you: "your", he: "his", she: "her", it: "its", we: "our", they: "their" };
const BE = { I: "am", you: "are", he: "is", she: "is", it: "is", we: "are", they: "are" };
const UZ = { I: "men", you: "sen / siz", he: "u (o‘g‘il bola, erkak)", she: "u (qiz bola, ayol)", it: "u (narsa, hayvon)", we: "biz", they: "ular" };

// [ega, olmosh, 1-gap davomi, 2-gap davomi]
const SUBJ = [
  ["my father", "he", "a doctor", "very kind"], ["my brother", "he", "ten years old", "a good pupil"], ["Ali", "he", "my classmate", "very clever"],
  ["Bobur", "he", "in the garden", "happy today"], ["the boy", "he", "at school", "in class 4"], ["Mr Brown", "he", "our teacher", "from London"],
  ["my uncle", "he", "a pilot", "very brave"], ["my grandfather", "he", "seventy years old", "at home"], ["the man", "he", "tall", "a driver"],
  ["Tom", "he", "from England", "my pen friend"], ["the king", "he", "rich", "in the palace"], ["Jasur", "he", "a football player", "very fast"],
  ["my mother", "she", "a teacher", "very kind"], ["my sister", "she", "eight years old", "in the kitchen"], ["Malika", "she", "my best friend", "very clever"],
  ["Laylo", "she", "in class 4", "a good singer"], ["the girl", "she", "in the park", "happy"], ["Mrs Smith", "she", "a nurse", "from Canada"],
  ["my aunt", "she", "a doctor", "at work"], ["my grandmother", "she", "sixty-five years old", "very kind"], ["the woman", "she", "a shop assistant", "very polite"],
  ["Anna", "she", "from Italy", "my pen friend"], ["the queen", "she", "beautiful", "in the castle"], ["Nilufar", "she", "a good pupil", "very tidy"],
  ["the cat", "it", "black", "under the table"], ["my bag", "it", "new", "very heavy"], ["the book", "it", "interesting", "on the shelf"],
  ["the sun", "it", "very hot", "in the sky"], ["the car", "it", "red", "very fast"], ["this pen", "it", "blue", "in my pencil case"],
  ["the tree", "it", "very tall", "in our garden"], ["the ball", "it", "big", "under the bed"], ["my house", "it", "big", "near the park"],
  ["the dog", "it", "white", "very friendly"], ["Tashkent", "it", "a big city", "very beautiful"], ["the elephant", "it", "very big", "grey"],
  ["my friends", "they", "at school", "very kind"], ["the children", "they", "in the park", "happy"], ["the books", "they", "on the table", "new"],
  ["the cats", "they", "in the garden", "hungry"], ["my parents", "they", "at work", "very busy"], ["the students", "they", "in the classroom", "ready"],
  ["the birds", "they", "in the tree", "beautiful"], ["Ali and Vali", "they", "brothers", "twins"], ["Malika and Anna", "they", "friends", "in class 4"],
  ["the boys", "they", "in the yard", "very noisy"], ["my shoes", "they", "black", "new"], ["the flowers", "they", "red", "beautiful"],
  ["my brother and I", "we", "at home", "happy"], ["Ali and I", "we", "classmates", "good friends"], ["my friends and I", "we", "in the park", "hungry"],
  ["my family and I", "we", "in Samarkand", "on holiday"], ["my sister and I", "we", "twins", "nine years old"], ["Bobur and I", "we", "in class 4", "good pupils"],
  ["you and your sister", "you", "very kind", "good pupils"], ["you and Bobur", "you", "late", "in the wrong room"], ["you and your friends", "you", "very noisy", "in the library"],
];

const why = {
  he: "bitta o‘g‘il bola yoki erkak → he",
  she: "bitta qiz bola yoki ayol → she",
  it: "bitta narsa, hayvon yoki joy → it",
  they: "bir nechta odam yoki narsa → they",
  we: "“… and I” — men ham bor → we",
  you: "“you and …” — siz ham bor → you (sizlar)",
  I: "o‘zim haqimda → I",
};

const PARTS = [
  "A. Olmosh bilan almashtiring · Replace with a pronoun",
  "B. Ega olmoshini tanlang · Subject or object?",
  "C. Tarjima qiling · Translate the pronoun",
  "D. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(303);
  const pool = [];

  // A. "My mother is a teacher. ___ is very kind."
  for (const [s, p, c1, c2] of SUBJ) {
    const be = BE[p];
    const others = shuffle(PRON.filter((x) => x !== p && x !== "I" && !(BE[x] !== be && false)), r).slice(0, 3);
    pool.push(
      mc(0, `${cap(s)} ${be} ${c1}. ___ ${be} ${c2}.`, cap(p), others.map((o) => [cap(o), `${cap(o)} — ${UZ[o]}. “${s}” uchun mos emas: ${why[p]}.`]), `“${s}” — ${why[p]}.`),
    );
  }
  // A2. "Look at ___" emas — "Which pronoun replaces …?"
  for (const [s, p] of SUBJ) {
    const others = shuffle(PRON.filter((x) => x !== p && x !== "I"), r).slice(0, 3);
    pool.push(mc(0, `Which pronoun can replace “${s}”? · “${s}” o‘rniga qaysi olmosh?`, p, others.map((o) => [o, `${o} — ${UZ[o]}.`]), `“${s}” — ${why[p]}.`));
  }

  // B. Subject vs object/possessive: "Look at Ali. ___ is my friend."
  const LOOK = ["Look at", "This is", "Do you know", "Say hello to"];
  for (const [s, p, , c2] of SUBJ.filter((x) => x[1] !== "we" && x[1] !== "you")) {
    const be = BE[p];
    const opts = [[cap(OBJ[p]), `“${OBJ[p]}” — to‘ldiruvchi olmosh (…ni, …ga). Gap boshida, ega o‘rnida ${cap(p)} ishlatiladi.`], [cap(POSS[p]), `“${POSS[p]}” — egalik (…ning). Undan keyin ot kerak: ${POSS[p]} book.`]];
    const extra = shuffle(PRON.filter((x) => x !== p && BE[x] !== be && x !== "I"), r)[0] ?? "I";
    opts.push([cap(extra), `“${cap(extra)} ${be}” noto‘g‘ri — ${extra} bilan ${BE[extra]} ishlatiladi.`]);
    const uniq = opts.filter((o, i) => o[0] !== cap(p) && opts.findIndex((x) => x[0] === o[0]) === i);
    if (uniq.length < 2) continue;
    pool.push(mc(1, `${p === "he" || p === "she" ? pick(LOOK, r) : "Look at"} ${s}. ___ ${be} ${c2}.`, cap(p), uniq, `Gap egasi (kim? nima?) → ${cap(p)}. ${cap(OBJ[p])} va ${cap(POSS[p])} ega bo‘la olmaydi.`));
  }
  for (const p of ["I", "we", "you", "they", "he", "she"]) {
    const preds = { I: ["ten years old", "a pupil", "from Uzbekistan", "hungry", "in class 4", "happy today"], we: ["good friends", "in the same class", "at school", "ready", "brothers", "hungry"], you: ["my best friend", "very clever", "late again", "a good pupil", "right", "tall"], they: ["my cousins", "at home", "very kind", "new pupils", "in the garden", "tired"], he: ["my brother", "a pilot", "very funny", "at the cinema", "twelve", "a good cook"], she: ["my sister", "a dentist", "very tidy", "at the shop", "eleven", "a good dancer"] }[p];
    for (const pr of preds) {
      const wrong = [[cap(OBJ[p]), `“${OBJ[p]}” — to‘ldiruvchi olmosh, ega bo‘la olmaydi.`], [cap(POSS[p]), `“${POSS[p]}” — egalik olmoshi, undan keyin ot keladi.`]].filter((w) => w[0] !== cap(p));
      if (p === "you") wrong.push(["Your", "“your” — egalik (sening/sizning)."]);
      const ws = wrong.filter((w, i) => wrong.findIndex((x) => x[0] === w[0]) === i);
      if (ws.length < 2) {
        const alt = BE[p] === "is" ? "They" : "He";
        ws.push([alt, `“${alt}” bilan ${alt === "They" ? "are" : "is"} ishlatiladi, “${BE[p]}” emas.`]);
      }
      pool.push(mc(1, `___ ${BE[p]} ${pr}.`, cap(p), ws.slice(0, 3), `“${BE[p]}” fe’li va gap egasi → ${cap(p)}.`));
    }
  }

  // C. Tarjima: "Biz do'stmiz." → ___ are friends.
  const TR = {
    I: [["Men o‘quvchiman.", "am a pupil"], ["Men o‘n yoshdaman.", "am ten years old"], ["Men uydaman.", "am at home"], ["Men chanqadim.", "am thirsty"], ["Men xursandman.", "am happy"], ["Men O‘zbekistondanman.", "am from Uzbekistan"]],
    you: [["Sen mening do‘stimsan.", "are my friend"], ["Siz juda mehribonsiz.", "are very kind"], ["Sen kech qolding.", "are late"], ["Siz haqsiz.", "are right"], ["Sen juda aqllisan.", "are very clever"], ["Siz o‘qituvchisiz.", "are a teacher"]],
    he: [["U (bola) mening akam.", "is my brother"], ["U (erkak) shifokor.", "is a doctor"], ["U (bola) maktabda.", "is at school"], ["U (erkak) juda baland.", "is very tall"], ["U (bola) to‘qqiz yoshda.", "is nine years old"], ["U (erkak) uchuvchi.", "is a pilot"]],
    she: [["U (qiz) mening singlim.", "is my sister"], ["U (ayol) o‘qituvchi.", "is a teacher"], ["U (qiz) bog‘da.", "is in the garden"], ["U (ayol) juda chiroyli.", "is very beautiful"], ["U (qiz) sakkiz yoshda.", "is eight years old"], ["U (ayol) hamshira.", "is a nurse"]],
    it: [["U (mushuk) qora.", "is black"], ["U (kitob) qiziqarli.", "is interesting"], ["U (mashina) yangi.", "is new"], ["U (it) juda do‘stona.", "is very friendly"], ["U (shahar) juda katta.", "is very big"], ["U (koptok) stol ostida.", "is under the table"]],
    we: [["Biz do‘stmiz.", "are friends"], ["Biz sinfdoshmiz.", "are classmates"], ["Biz maktabdamiz.", "are at school"], ["Biz och qoldik.", "are hungry"], ["Biz tayyormiz.", "are ready"], ["Biz egizaklarmiz.", "are twins"]],
    they: [["Ular mening ota-onam.", "are my parents"], ["Ular bog‘da.", "are in the park"], ["Ular juda mehribon.", "are very kind"], ["Ular (kitoblar) yangi.", "are new"], ["Ular charchagan.", "are tired"], ["Ular (mushuklar) och.", "are hungry"]],
  };
  for (const [p, rows] of Object.entries(TR))
    for (const [uz, en] of rows) {
      const be = en.split(" ")[0];
      const cands = PRON.filter((x) => x !== p);
      const same = shuffle(cands.filter((x) => BE[x] === be), r);
      const diff = shuffle(cands.filter((x) => BE[x] !== be), r);
      const others = [...same, ...diff].slice(0, 3);
      pool.push(mc(2, `“${uz}” → ___ ${en}.`, cap(p), others.map((o) => [cap(o), `${cap(o)} — ${UZ[o]}.`]), `${UZ[p]} → ${cap(p)}.`));
    }

  // D. To'g'ri gap.
  for (const [s, p, , c2] of SUBJ) {
    const be = BE[p];
    const right = `${cap(p)} ${be} ${c2}.`;
    const wrongs = [];
    if (OBJ[p] !== p) wrongs.push([`${cap(OBJ[p])} ${be} ${c2}.`, `“${OBJ[p]}” ega bo‘la olmaydi — ${cap(p)} kerak.`]);
    if (POSS[p] !== p && POSS[p] !== OBJ[p]) wrongs.push([`${cap(POSS[p])} ${be} ${c2}.`, `“${POSS[p]}” — egalik olmoshi, ega bo‘la olmaydi.`]);
    const badBe = be === "is" ? "are" : "is";
    wrongs.push([`${cap(p)} ${badBe} ${c2}.`, `${cap(p)} bilan “${badBe}” emas, “${be}” ishlatiladi.`]);
    if (wrongs.length < 3) wrongs.push([`${cap(p)} am ${c2}.`, "am faqat I bilan ishlatiladi."]);
    pool.push(mc(3, `“${s}” → Choose the correct sentence · To‘g‘ri gapni tanlang`, right, wrongs.slice(0, 3), `“${s}” → ${p}; ${p} + ${be}.`));
  }

  return {
    code: "KG3",
    unit: 3,
    title: "3. Subject Pronouns",
    title_uz: "Kishilik olmoshlari: I, you, he, she, it, we, they · 200 ta test",
    seed: 3003,
    parts: PARTS,
    quotas: [[0, 70], [1, 45], [2, 40], [3, 45]],
    pool,
    intro: {
      what: "Kishilik olmoshlari gapda ega bo‘ladi va otning o‘rnini bosadi: My mother is kind. → She is kind.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "Subject pronouns",
          name_uz: "Ega o‘rnidagi olmoshlar",
          summary: "Olmosh — otni takrorlamaslik uchun ishlatiladi. Ingliz tilida “u” uchun uchta olmosh bor: he (erkak), she (ayol), it (narsa / hayvon). Bu o‘zbek tilidan eng katta farq!",
          usage: [
            { text: "I — men. Har doim katta harf bilan yoziladi!", example: { en: "I am a pupil.", uz: "Men o‘quvchiman." } },
            { text: "you — sen / siz / sizlar (birlik va ko‘plik bir xil).", example: { en: "You are my best friend.", uz: "Sen mening eng yaqin do‘stimsan." } },
            { text: "he — u (o‘g‘il bola, erkak): my father, Ali, the boy, Mr Brown.", example: { en: "Ali is my friend. He is ten.", uz: "Ali — do‘stim. U o‘n yoshda." } },
            { text: "she — u (qiz bola, ayol): my mother, Malika, the girl, Mrs Smith.", example: { en: "My sister is a pupil. She is clever.", uz: "Singlim o‘quvchi. U aqlli." } },
            { text: "it — u (narsa, hayvon, joy): the cat, my bag, the sun, Tashkent.", example: { en: "Look at the cat. It is black.", uz: "Mushukka qara. U qora." } },
            { text: "we — biz: “… and I” → we.", example: { en: "Ali and I are classmates. We are in class 4.", uz: "Ali va men sinfdoshmiz. Biz 4-sinfdamiz." } },
            { text: "they — ular (odamlar, narsalar, hayvonlar — hammasi uchun!).", example: { en: "The books are new. They are on the table.", uz: "Kitoblar yangi. Ular stol ustida." } },
          ],
          structure: [
            { type: "+", formula: "I + am", example: { en: "I am happy.", uz: "Men xursandman." } },
            { type: "+", formula: "he / she / it + is", example: { en: "She is a doctor.", uz: "U shifokor." } },
            { type: "+", formula: "you / we / they + are", example: { en: "They are at home.", uz: "Ular uyda." } },
          ],
          signals: [
            { en: "… and I", uz: "→ we" },
            { en: "you and …", uz: "→ you" },
            { en: "mother, sister, girl, Mrs", uz: "→ she" },
            { en: "father, brother, boy, Mr", uz: "→ he" },
            { en: "narsa / hayvon (birlik)", uz: "→ it" },
            { en: "ko‘plik (-s)", uz: "→ they" },
          ],
          tip: "Gap boshida (ega o‘rnida) faqat I, you, he, she, it, we, they! “Me am…”, “Him is…”, “Them are…” — XATO.",
        },
        {
          name: "Subject vs object pronouns",
          name_uz: "Ega va to‘ldiruvchi olmoshlarni farqlash",
          summary: "me, him, her, us, them — to‘ldiruvchi olmoshlar (meni, uni, bizni, ularni). Ular fe’ldan KEYIN keladi. Gap boshida esa I, he, she, we, they bo‘ladi.",
          usage: [
            { text: "Ega (kim?) — gap boshida: He is my brother.", example: { en: "He is my brother.", uz: "U mening akam." } },
            { text: "To‘ldiruvchi (kimni? kimga?) — fe’ldan keyin: I love him.", example: { en: "I love him.", uz: "Men uni yaxshi ko‘raman." } },
          ],
          structure: [
            { type: "+", formula: "I → me, he → him, she → her, we → us, they → them", example: { en: "She helps me. I help her.", uz: "U menga yordam beradi. Men unga yordam beraman." } },
          ],
          signals: [],
          tip: "Tekshirish usuli: gapni “kim?” so‘rog‘i bilan boshlang. Javob gap boshida bo‘lsa — I / he / she / we / they.",
        },
      ],
      mistakes: [
        { wrong: "My mother she is a teacher.", right: "My mother is a teacher.", why: "Ega ikki marta takrorlanmaydi." },
        { wrong: "Him is my friend.", right: "He is my friend.", why: "Gap boshida ega olmoshi — he." },
        { wrong: "The cat … She is black.", right: "It is black.", why: "Hayvon / narsa uchun it." },
        { wrong: "i am a pupil.", right: "I am a pupil.", why: "I doim katta harf bilan." },
        { wrong: "Ali and me are friends.", right: "Ali and I are friends.", why: "Ega o‘rnida I." },
      ],
    },
  };
}
