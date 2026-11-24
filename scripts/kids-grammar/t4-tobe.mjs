// 4. THE VERB "TO BE" — am / is / are: darak, inkor, so'roq, qisqa javob.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";

const BE = { I: "am", you: "are", he: "is", she: "is", it: "is", we: "are", they: "are" };
const NEG = { am: "am not", is: "isn’t", are: "aren’t" };
const SHORT = { I: "I’m", you: "you’re", he: "he’s", she: "she’s", it: "it’s", we: "we’re", they: "they’re" };

// [ega, olmosh (short answer uchun), davomi]
const SUBJ = [
  ["I", "I", "a pupil"], ["I", "I", "ten years old"], ["I", "I", "in class 4"], ["I", "I", "from Tashkent"], ["I", "I", "hungry"], ["I", "I", "at home"],
  ["you", "you", "my friend"], ["you", "you", "very clever"], ["you", "you", "late"], ["you", "you", "right"],
  ["he", "he", "a doctor"], ["she", "she", "a teacher"], ["it", "it", "a cat"], ["we", "we", "friends"], ["they", "they", "at school"],
  ["my father", "he", "a pilot"], ["my brother", "he", "nine years old"], ["Ali", "he", "my classmate"], ["the boy", "he", "in the garden"],
  ["Mr Brown", "he", "our English teacher"], ["my mother", "she", "a nurse"], ["my sister", "she", "at school"], ["Malika", "she", "very kind"],
  ["the girl", "she", "in the park"], ["Mrs Smith", "she", "from London"], ["the cat", "it", "under the bed"], ["my bag", "it", "very heavy"],
  ["the sun", "it", "hot"], ["Tashkent", "it", "a big city"], ["this book", "it", "interesting"], ["the weather", "it", "nice today"],
  ["my friends", "they", "in the yard"], ["the children", "they", "happy"], ["the apples", "they", "green"], ["my parents", "they", "at work"],
  ["the dogs", "they", "hungry"], ["Ali and Vali", "they", "brothers"], ["my brother and I", "we", "at the cinema"], ["Laylo and I", "we", "classmates"],
  ["my friends and I", "we", "in the library"], ["you and your sister", "you", "very tidy"], ["the pencils", "they", "in the box"], ["the milk", "it", "cold"],
];
const reason = (p, be) =>
  p === "I" ? "I bilan doim am ishlatiladi." : be === "is" ? `“${p}” — bitta (he / she / it) → is.` : `“${p}” — ko‘plik yoki you → are.`;

const PARTS = [
  "A. am / is / are",
  "B. Inkor shakli · Negative",
  "C. So‘roq gap · Questions",
  "D. Qisqa javob · Short answers",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
  "F. Qisqartmalar · Short forms",
];

export function build() {
  const r = rng(404);
  const pool = [];
  const ALLBE = ["am", "is", "are"];

  // A. Darak gap.
  for (const [s, p, c] of SUBJ) {
    const be = BE[p];
    pool.push(
      mc(0, `${cap(s)} ___ ${c}.`, be, [...ALLBE.filter((x) => x !== be).map((x) => [x, `${reason(p, be)} “${x}” mos emas.`]), ["be", "“be” — asl shakl; gapda am / is / are bo‘ladi."]], `${cap(s)} → ${p} → ${be}. ${reason(p, be)}`),
    );
  }
  // A2. Joy/ish bilan aralash ikkita bo'shliq emas — bitta, boshqa kontekst.
  const EXTRA = [["There", "is", "a cat in the garden."], ["There", "are", "five pupils in the room."], ["Where", "is", "my pen?"], ["Where", "are", "my shoes?"], ["What", "is", "your name?"], ["How old", "are", "you?"], ["How", "are", "you?"], ["Who", "is", "that girl?"], ["What colour", "is", "your bag?"], ["How many books", "are", "there?"]];
  for (const [w, be, rest] of EXTRA)
    pool.push(mc(0, `${w} ___ ${rest}`, be, ALLBE.filter((x) => x !== be).map((x) => [x, be === "is" ? `Keyingi so‘z birlikda → is.` : `Keyingi so‘z ko‘plikda yoki “you” → are.`]).concat([["be", "Gapda am / is / are bo‘ladi."]]), be === "is" ? "Birlik → is." : "Ko‘plik yoki you → are."));

  // B. Inkor.
  for (const [s, p, c] of SUBJ) {
    const be = BE[p];
    const right = NEG[be];
    const wrongs = Object.values(NEG).filter((x) => x !== right).map((x) => [x, `${cap(s)} bilan ${be} ishlatiladi → ${right}.`]);
    wrongs.push(["not", "“not” yolg‘iz kelmaydi — oldidan am / is / are kerak."]);
    pool.push(mc(1, `${cap(s)} ___ ${c}. (−)`, right, wrongs, `Inkor: ${be} + not → ${right}. ${reason(p, be)}`));
  }

  // C. So'roq.
  for (const [s, p, c] of SUBJ.filter((x) => x[0] !== "I")) {
    const be = BE[p];
    const subj = s === "I" ? "I" : s;
    pool.push(
      mc(2, `___ ${subj} ${c}?`, cap(be), [...ALLBE.filter((x) => x !== be).map((x) => [cap(x), `${reason(p, be)}`]), ["Do", "“to be” li gapda so‘roq uchun do ishlatilmaydi — am / is / are oldinga chiqadi."]], `So‘roq gapda ${be} egadan oldinga chiqadi: ${cap(be)} ${subj} ${c}?`),
    );
  }
  for (const c of ["late", "right", "in the right room", "in your team"])
    pool.push(mc(2, `___ I ${c}?`, "Am", [["Is", "I bilan am."], ["Are", "I bilan am."], ["Do", "“to be” li gapda do ishlatilmaydi."]], "I bilan so‘roq: Am I …?"));

  // D. Qisqa javob.
  const swap = { I: "you", you: "I", he: "he", she: "she", it: "it", we: "you", they: "they" };
  for (const [s, p, c] of SUBJ.filter((x) => x[0] !== "I" && x[1] !== "we" && x[0] !== "it")) {
    const be = BE[p];
    const ap = p === "you" && s.includes(" and ") ? "we" : swap[p];
    const abe = BE[ap];
    const q = `${cap(be)} ${s} ${c}?`;
    if (r() < 0.5) {
      const right = `${ap === "I" ? "I" : ap} ${abe}`;
      pool.push(
        mc(3, `${q} — Yes, ___ .`, right, [
          [SHORT[ap], `Ijobiy qisqa javobda qisqartma ishlatilmaydi: “Yes, ${right}.” (“Yes, ${SHORT[ap]}.” — xato).`],
          [`${ap === "I" ? "I" : ap} ${abe === "is" ? "are" : "is"}`, `${cap(ap)} bilan ${abe}.`],
          [`${ap === "I" ? "I" : ap} do`, "“to be” li savolga “do” bilan javob berilmaydi."],
        ], `Qisqa javob: Yes, ${right}. ${p === "you" ? "“you” deb so‘rashsa — “I” deb javob beramiz." : ""}`),
      );
    } else {
      const neg = ap === "I" ? "I’m not" : `${ap} ${NEG[abe]}`;
      pool.push(
        mc(3, `${q} — No, ___ .`, neg, [
          [`${ap === "I" ? "I" : ap} ${abe === "is" ? "aren’t" : "isn’t"}`, `${cap(ap)} bilan ${abe} → ${neg}.`],
          [`${ap === "I" ? "I" : ap} not`, "Inkorda am / is / are + not kerak."],
          [`${ap === "I" ? "I" : ap} don’t`, "“to be” li savolga “don’t” bilan javob berilmaydi."],
        ], `Qisqa inkor javob: No, ${neg}.`),
      );
    }
  }
  for (const [q, right, ws, ex] of [
    ["Are you a pupil? — Yes, ___ .", "I am", [["I’m", "Ijobiy qisqa javob qisqartmasiz: Yes, I am."], ["you are", "“you” deb so‘rashsa — “I” bilan javob beramiz."], ["I is", "I bilan am."]], "Are you…? — Yes, I am."],
    ["Are you ten? — No, ___ .", "I’m not", [["I amn’t", "“amn’t” degan shakl yo‘q — I’m not."], ["I isn’t", "I bilan am not → I’m not."], ["you aren’t", "“you” deb so‘rashsa — “I” bilan javob beramiz."]], "Are you…? — No, I’m not."],
    ["Are you and Ali friends? — Yes, ___ .", "we are", [["we’re", "Ijobiy qisqa javob qisqartmasiz."], ["you are", "“you and Ali” → javobda “we”."], ["they are", "“you and Ali” → javobda “we”."]], "you and Ali → we: Yes, we are."],
    ["Are you and your sister twins? — No, ___ .", "we aren’t", [["we isn’t", "we bilan are → aren’t."], ["you aren’t", "Javobda “we”."], ["we not", "are + not kerak."]], "No, we aren’t."],
    ["Is it your cat? — Yes, ___ .", "it is", [["it’s", "Ijobiy qisqa javob qisqartmasiz: Yes, it is."], ["it are", "it bilan is."], ["he is", "Savolda “it”."]], "Yes, it is."],
    ["Is it hot today? — No, ___ .", "it isn’t", [["it aren’t", "it bilan is → isn’t."], ["it not", "is + not kerak."], ["it don’t", "“to be” li savolga don’t bilan javob berilmaydi."]], "No, it isn’t."],
  ])
    pool.push(mc(3, q, right, ws, ex));

  // E. To'g'ri gap.
  for (const [s, p, c] of SUBJ) {
    const be = BE[p];
    const S = cap(s);
    const right = `${S} ${be} ${c}.`;
    const wrongBe = ALLBE.filter((x) => x !== be);
    pool.push(
      mc(4, `Choose the correct sentence · To‘g‘ri gapni tanlang (“${s}”)`, right, [
        [`${S} ${wrongBe[0]} ${c}.`, reason(p, be)],
        [`${S} ${wrongBe[1]} ${c}.`, reason(p, be)],
        [`${S} ${c}.`, "Ingliz tilida “to be” tushib qolmaydi! O‘zbekchada “Men o‘quvchi(man)” deymiz, inglizchada albatta am / is / are kerak."],
      ], `${S} + ${be}. ${reason(p, be)}`),
    );
  }
  for (const [s, p, c] of SUBJ.filter((x) => x[0] !== "I")) {
    const be = BE[p];
    const right = `${cap(be)} ${s} ${c}?`;
    pool.push(
      mc(4, `Choose the correct question · To‘g‘ri so‘roq gapni tanlang (“${s}”)`, right, [
        [`${cap(s)} ${be} ${c}?`, "So‘roq gapda am / is / are egadan OLDIN keladi."],
        [`Do ${s} ${be} ${c}?`, "“to be” bilan do ishlatilmaydi."],
        [`${cap(be === "is" ? "are" : "is")} ${s} ${c}?`, reason(p, be)],
      ], `So‘roq: ${cap(be)} + ega + …?`),
    );
  }

  // F. Qisqartmalar.
  const FULL = [["I am", "I’m"], ["you are", "you’re"], ["he is", "he’s"], ["she is", "she’s"], ["it is", "it’s"], ["we are", "we’re"], ["they are", "they’re"], ["is not", "isn’t"], ["are not", "aren’t"], ["I am not", "I’m not"]];
  const FAKE = { "I am": ["Im", "I’am", "I’s"], "you are": ["your", "you’s", "yo’re"], "he is": ["his", "he’re", "hes’"], "she is": ["she’re", "shes’", "she’am"], "it is": ["its", "it’re", "it’am"], "we are": ["were", "we’s", "w’are"], "they are": ["their", "there", "they’s"], "is not": ["is’nt", "isnt’", "aren’t"], "are not": ["are’nt", "isn’t", "arent’"], "I am not": ["I amn’t", "I’m’nt", "I isn’t"] };
  for (const [full, short] of FULL) {
    const why = (f) => (f === "aren’t" ? "“aren’t” = are not, “is not” emas." : f === "isn’t" ? "“isn’t” = is not, “are not” emas." : ["its", "his", "your", "their", "there", "were"].includes(f) ? `“${f}” — boshqa so‘z (ma’nosi boshqa), qisqartma emas.` : `“${f}” — noto‘g‘ri yozilgan.`);
    pool.push(mc(5, `“${full}” = ?`, short, FAKE[full].map((f) => [f, why(f)]), `${full} → ${short} (apostrof ’ tushib qolgan harf o‘rnida).`));
    pool.push(mc(5, `“${short}” = ?`, full, shuffle(FULL.filter((x) => x[0] !== full), r).slice(0, 3).map((x) => [x[0], `“${x[0]}” → ${x[1]}.`]), `${short} = ${full}.`));
  }

  return {
    code: "KG4",
    unit: 4,
    title: "4. The Verb “To be”",
    title_uz: "“To be” fe’li: am / is / are · 200 ta test",
    seed: 4004,
    parts: PARTS,
    quotas: [[0, 45], [1, 30], [2, 30], [3, 30], [4, 45], [5, 20]],
    pool,
    intro: {
      what: "“To be” — “bo‘lmoq” fe’li. Hozirgi zamonda uch shakli bor: am, is, are.",
      when: [],
      structures: [],
      rules: [],
      signal_words: [],
      topics: [
        {
          name: "am / is / are (positive)",
          name_uz: "Darak gap",
          summary: "O‘zbek tilida “Men o‘quvchiman”, “U shifokor” deymiz — fe’l ko‘rinmaydi. Ingliz tilida esa “to be” ALBATTA bo‘lishi kerak: I am a pupil. She is a doctor.",
          usage: [
            { text: "Kim yoki nima ekanligini aytish.", example: { en: "I am a pupil. He is a pilot.", uz: "Men o‘quvchiman. U uchuvchi." } },
            { text: "Yoshni aytish.", example: { en: "I am ten years old.", uz: "Men o‘n yoshdaman." } },
            { text: "Qayerda ekanligini aytish.", example: { en: "They are at school.", uz: "Ular maktabda." } },
            { text: "Qanday ekanligini aytish (sifat).", example: { en: "The sun is hot.", uz: "Quyosh issiq." } },
          ],
          structure: [
            { type: "+", formula: "I + am", example: { en: "I am happy. (I’m happy.)", uz: "Men xursandman." } },
            { type: "+", formula: "He / She / It + is", example: { en: "She is a teacher. (She’s a teacher.)", uz: "U o‘qituvchi." } },
            { type: "+", formula: "You / We / They + are", example: { en: "We are friends. (We’re friends.)", uz: "Biz do‘stmiz." } },
          ],
          signals: [
            { en: "I", uz: "→ am" },
            { en: "he, she, it, birlik ot", uz: "→ is" },
            { en: "you, we, they, ko‘plik ot", uz: "→ are" },
          ],
          tip: "Esda tuting: am — faqat I bilan! “You” bitta odam bo‘lsa ham — are.",
        },
        {
          name: "Negative: am not / isn’t / aren’t",
          name_uz: "Inkor gap",
          summary: "Inkor gapda am / is / are dan keyin “not” qo‘shiladi.",
          usage: [{ text: "Biror narsa to‘g‘ri emasligini aytish.", example: { en: "He isn’t at home. They aren’t hungry.", uz: "U uyda emas. Ular och emas." } }],
          structure: [
            { type: "-", formula: "I am not (I’m not)", example: { en: "I’m not tired.", uz: "Men charchamaganman." } },
            { type: "-", formula: "He / She / It is not (isn’t)", example: { en: "It isn’t cold.", uz: "Sovuq emas." } },
            { type: "-", formula: "You / We / They are not (aren’t)", example: { en: "We aren’t late.", uz: "Biz kech qolmadik." } },
          ],
          signals: [{ en: "not", uz: "emas" }],
          tip: "“I amn’t” degan shakl YO‘Q — faqat “I’m not”.",
        },
        {
          name: "Questions and short answers",
          name_uz: "So‘roq gap va qisqa javoblar",
          summary: "So‘roq gapda am / is / are egadan OLDIN keladi. Javob qisqa bo‘ladi: Yes, I am. / No, I’m not.",
          usage: [
            { text: "Savol berish: Is she…? Are you…?", example: { en: "Is your father a doctor?", uz: "Otang shifokormi?" } },
            { text: "Qisqa javob: ijobiyda qisqartma ishlatilmaydi!", example: { en: "Yes, he is. (✗ Yes, he’s.)", uz: "Ha, shifokor." } },
            { text: "“Are you…?” deb so‘rashsa — “I” bilan javob beramiz.", example: { en: "Are you hungry? — No, I’m not.", uz: "Ochmisan? — Yo‘q." } },
          ],
          structure: [
            { type: "?", formula: "Am / Is / Are + subject + …?", example: { en: "Are they at school?", uz: "Ular maktabdami?" } },
            { type: "short", formula: "Yes, + pronoun + am / is / are.", example: { en: "Yes, they are.", uz: "Ha." } },
            { type: "short", formula: "No, + pronoun + ’m not / isn’t / aren’t.", example: { en: "No, they aren’t.", uz: "Yo‘q." } },
          ],
          signals: [
            { en: "Where…? What…? Who…? How old…?", uz: "so‘roq so‘zlari" },
          ],
          tip: "“to be” bilan “Do” ishlatilmaydi: “Do you happy?” — XATO, “Are you happy?” — to‘g‘ri.",
        },
      ],
      mistakes: [
        { wrong: "I a pupil.", right: "I am a pupil.", why: "“to be” tushib qolmaydi." },
        { wrong: "She are a doctor.", right: "She is a doctor.", why: "she → is." },
        { wrong: "You is my friend.", right: "You are my friend.", why: "you → are (birlikda ham)." },
        { wrong: "Do you hungry?", right: "Are you hungry?", why: "“to be” bilan do ishlatilmaydi." },
        { wrong: "Yes, I’m.", right: "Yes, I am.", why: "Ijobiy qisqa javob qisqartmasiz." },
        { wrong: "I amn’t late.", right: "I’m not late.", why: "“amn’t” shakli yo‘q." },
      ],
    },
  };
}
