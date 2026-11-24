// 24. IF CONDITIONALS — ZERO AND FIRST.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// Zero: [if-qism (sodda), natija ega, natija fe'l asl, 3-shaxsmi, davomi, o'zbekcha]
const ZERO = [
  ["you heat ice", "it", "melt", 1, "", "muzni isitsang, eriydi"], ["you heat water to 100°C", "it", "boil", 1, "", "suv 100°C da qaynaydi"], ["you mix red and yellow", "you", "get", 0, "orange", "qizil + sariq = to‘q sariq"],
  ["you drop a glass", "it", "break", 1, "", "stakan tushsa, sinadi"], ["plants don’t get water", "they", "die", 0, "", "o‘simlik suvsiz qurib qoladi"], ["it rains", "the grass", "get", 1, "wet", "yomg‘ir yog‘sa, maysa ho‘l bo‘ladi"],
  ["you don’t eat", "you", "feel", 0, "hungry", "ovqat yemasang, och qolasan"], ["you press this button", "the door", "open", 1, "", "tugmani bossang, eshik ochiladi"], ["you put oil in water", "it", "float", 1, "", "moy suvda qalqib turadi"],
  ["the sun goes down", "it", "get", 1, "dark", "quyosh botsa, qorong‘i tushadi"], ["you touch fire", "it", "hurt", 1, "", "olovga tegsang, kuydiradi"], ["babies are hungry", "they", "cry", 0, "", "chaqaloqlar och qolsa, yig‘laydi"],
  ["you freeze water", "it", "become", 1, "ice", "suv muzlasa, muzga aylanadi"], ["my cat is happy", "it", "purr", 1, "", "mushugim xursand bo‘lsa, xurillaydi"],
  ["you mix blue and yellow", "you", "get", 0, "green", "ko‘k + sariq = yashil"], ["I drink coffee at night", "I", "stay", 0, "awake", "kechasi qahva ichsam, uyg‘oq qolaman"],
  ["you don’t water flowers", "they", "die", 0, "", "gullarga suv quymasang, quriydi"], ["it snows", "the roads", "get", 0, "slippery", "qor yog‘sa, yo‘llar sirpanchiq bo‘ladi"],
  ["you put sugar in tea", "it", "taste", 1, "sweet", "choyga shakar solsang, shirin bo‘ladi"], ["people don’t sleep", "they", "get", 0, "tired", "odam uxlamasa, charchaydi"],
  ["my mum is angry", "she", "shout", 1, "", "onam jahli chiqsa, baqiradi"], ["you boil an egg", "it", "get", 1, "hard", "tuxumni qaynatsang, qattiq bo‘ladi"],
  ["you leave milk in the sun", "it", "go", 1, "bad", "sutni quyoshda qoldirsang, ayniydi"], ["you exercise every day", "you", "stay", 0, "healthy", "har kuni mashq qilsang, sog‘lom bo‘lasan"],
];
const S3 = (v) => (/(s|sh|ch|x|o)$/.test(v) ? `${v}es` : /[^aeiou]y$/.test(v) ? `${v.slice(0, -1)}ies` : `${v}s`);
// First: [if-ega, if-fe'l asl, 3-shaxsmi, if-davomi, natija ega, natija fe'l, natija davomi, o'zbekcha]
const FIRST = [
  ["it", "rain", 1, "tomorrow", "we", "stay", "at home", "ertaga yomg‘ir yog‘sa, uyda qolamiz"], ["you", "study", 0, "hard", "you", "pass", "the exam", "yaxshi o‘qisang, imtihondan o‘tasan"],
  ["Ali", "come", 1, "to the party", "we", "be", "happy", "Ali bazmga kelsa, xursand bo‘lamiz"], ["you", "eat", 0, "too much", "you", "feel", "ill", "ko‘p yesang, kasal bo‘lasan"],
  ["she", "miss", 1, "the bus", "she", "be", "late", "avtobusga ulgurmasa, kechikadi"], ["we", "hurry", 0, "", "we", "catch", "the train", "shoshilsak, poyezdga ulguramiz"],
  ["you", "help", 0, "me", "I", "buy", "you an ice cream", "yordam bersang, muzqaymoq olib beraman"], ["it", "be", 1, "sunny", "we", "go", "to the beach", "quyoshli bo‘lsa, plyajga boramiz"],
  ["my dad", "have", 1, "time", "he", "take", "us to the zoo", "dadamning vaqti bo‘lsa, bizni hayvonot bog‘iga olib boradi"], ["you", "go", 0, "to bed late", "you", "be", "tired", "kech yotsang, charchaysan"],
  ["they", "win", 0, "the match", "they", "get", "a prize", "o‘yinda yutishsa, sovrin olishadi"], ["I", "find", 0, "your book", "I", "give", "it to you", "kitobingni topsam, senga beraman"],
  ["Malika", "practise", 1, "every day", "she", "speak", "English well", "har kuni mashq qilsa, inglizchani yaxshi gapiradi"], ["you", "touch", 0, "the dog", "it", "bite", "you", "itga tegsang, seni tishlaydi"],
  ["we", "leave", 0, "now", "we", "arrive", "on time", "hozir chiqsak, vaqtida yetib boramiz"], ["you", "not hurry", 0, "", "you", "miss", "the bus", "shoshilmasang, avtobusga ulgurmaysan"],
  ["the weather", "be", 1, "nice", "we", "have", "a picnic", "havo yaxshi bo‘lsa, piknik qilamiz"], ["Mum", "cook", 1, "plov", "we", "eat", "together", "onam palov pishirsa, birga yeymiz"],
  ["you", "ask", 0, "the teacher", "she", "explain", "the rule again", "o‘qituvchidan so‘rasang, qoidani qayta tushuntiradi"], ["it", "snow", 1, "tonight", "we", "make", "a snowman", "bugun kechasi qor yog‘sa, qorbobo yasaymiz"],
  ["I", "get", 0, "a good mark", "my parents", "be", "proud", "yaxshi baho olsam, ota-onam faxrlanadi"], ["you", "not wear", 0, "a coat", "you", "catch", "a cold", "palto kiymasang, shamollaysan"],
  ["he", "save", 1, "money", "he", "buy", "a new bike", "pul yig‘sa, yangi velosiped oladi"], ["we", "plant", 0, "trees", "the air", "be", "cleaner", "daraxt eksak, havo tozaroq bo‘ladi"],
  ["she", "feel", 1, "better", "she", "come", "to school", "o‘zini yaxshi his qilsa, maktabga keladi"], ["you", "not listen", 0, "in class", "you", "get", "a bad mark", "darsda tinglamasang, yomon baho olasan"],
  ["they", "invite", 0, "us", "we", "go", "to the wedding", "taklif qilishsa, to‘yga boramiz"], ["I", "see", 0, "Vali", "I", "tell", "him the news", "Valini ko‘rsam, unga yangilikni aytaman"],
  ["you", "drop", 0, "the phone", "it", "break", "", "telefonni tushirsang, sinadi"], ["the shop", "be", 1, "open", "I", "buy", "some bread", "do‘kon ochiq bo‘lsa, non olaman"],
  ["you", "water", 0, "the plant", "it", "grow", "fast", "o‘simlikka suv quysang, tez o‘sadi"], ["we", "not leave", 0, "now", "we", "miss", "the film", "hozir chiqmasak, filmga kech qolamiz"],
  ["Ali", "call", 1, "me", "I", "tell", "him everything", "Ali qo‘ng‘iroq qilsa, hammasini aytaman"], ["you", "read", 0, "this book", "you", "love", "it", "bu kitobni o‘qisang, yaxshi ko‘rib qolasan"],
  ["my brother", "win", 1, "the race", "he", "get", "a medal", "akam poygada yutsa, medal oladi"], ["it", "be", 1, "cold", "I", "wear", "my hat", "sovuq bo‘lsa, shapkamni kiyaman"],
];
const BEF = (subj, b, third) => (b === "be" ? (subj === "I" ? "am" : third ? "is" : "are") : b.startsWith("not ") ? `${third ? "doesn’t" : "don’t"} ${b.slice(4)}` : third ? S3(b) : b);
const PARTS = [
  "A. Zero conditional · If + Present, Present",
  "B. First conditional · If + Present, will",
  "C. if-qismdagi fe’l · If it rains … (will emas!)",
  "D. unless / when",
  "E. To‘g‘ri gapni tanlang · Choose the correct sentence",
];

export function build() {
  const r = rng(2424);
  const pool = [];

  // A
  for (const [ifp, rs, rv, third, rest, uz] of ZERO) {
    const right = third ? S3(rv) : rv;
    pool.push(mc(0, `If ${ifp}, ${rs} ___ ${rest}. (${uz})`.replace(" .", "."), right, uw(right, [[`will ${rv}`, "Fakt / doim shunday (zero conditional) → ikkala qism Present Simple. Bu yerda “will” ham tushunarli, lekin qoida — Present."], [third ? rv : S3(rv), third ? `${rs} → ${S3(rv)}.` : `${rs} bilan -s yo‘q.`], [`${rv.endsWith("e") ? rv.slice(0, -1) : rv}ing`, "Fakt — Present Simple (-ing emas)."], [`would ${rv}`, "would — ikkinchi tur shart gap."]].filter((w, i) => i !== 0), 3), `Zero conditional (fakt): If + Present, Present → ${right}.`));
  }

  // B
  for (const [is, ib, it, ir, rs, rv, rr, uz] of FIRST) {
    const right = `’ll ${rv}`;
    const rsx = rs === "I" ? "I" : rs;
    pool.push(mc(1, `If ${is} ${BEF(is, ib, it)} ${ir}, ${rsx} ___ ${rr}. (${uz})`.replace(" ,", ","), `will ${rv}`, uw(`will ${rv}`, [
      [`will ${rv === "be" ? "is" : S3(rv)}`, "will + asl fe’l."], [`would ${rv}`, "would — ikkinchi tur; real kelajak → will."], [`will to ${rv}`, "will dan keyin to yo‘q."],
    ]), `If + Present Simple, will + asl fe’l.`));
    void right;
    pool.push(mc(1, `${cap(rsx)} ___ ${rv} ${rr} if ${is} ${BEF(is, ib, it)} ${ir}.`.replace(/ +/g, " ").replace(" .", "."), "will", uw("will", [
      ["would", "Real kelajak sharti → will."], [/^(he|she|it|my|the|Ali)/i.test(rs) && rs !== "the roads" ? "does" : "do", "Natija qismi — will + fe’l."], ["wills", "will o‘zgarmaydi."],
    ]), "Natija qismi: will + fe’l (if-qism esa Present Simple)."));
  }

  // C. if-qism: Present (will emas)
  for (const [is, ib, it, ir, rs, rv, rr, uz] of FIRST) {
    const right = BEF(is, ib, it);
    const neg = ib.startsWith("not ");
    pool.push(mc(2, `If ${is} ___ ${ir}, ${rs} will ${rv} ${rr}. (${ib.replace("not ", "")}${neg ? " — inkor" : ""})`.replace(" ,", ","), right, uw(right, [
      [neg ? `won’t ${ib.slice(4)}` : `will ${ib}`, "if-qismda will ishlatilmaydi! If + Present Simple."], [neg ? `${it ? "don’t" : "doesn’t"} ${ib.slice(4)}` : ib === "be" ? (it ? "are" : "is") : it ? ib : S3(ib), "Ega bilan moslashuv xato."],
      [neg ? `not ${ib.slice(4)}` : ib === "be" ? "being" : `${ib}ing`.replace(/eing$/, "ing"), "If + Present Simple."], [neg ? `didn’t ${ib.slice(4)}` : ib === "be" ? (it ? "was" : "were") : `${ib}ed`.replace(/eed$/, "ed"), "Kelajak sharti → Present Simple."],
    ]), `If-qismda Present Simple: If ${is} ${right} …`));
  }

  // D. unless / when
  for (const [is, ib, it, ir, rs, rv, rr, uz] of FIRST.filter((x) => !x[1].startsWith("not "))) {
    const neg = ib === "be" ? `${is === "I" ? "am not" : it ? "isn’t" : "aren’t"}` : `${it ? "doesn’t" : "don’t"} ${ib}`;
    pool.push(mc(3, `___ ${is} ${BEF(is, ib, it)} ${ir}, ${rs} won’t ${rv} ${rr}. (= If ${is} ${neg} …)`.replace(" ,", ","), "Unless", uw("Unless", [["If", "Ma’no “agar … masa” → Unless (= If … not)."], ["When", "when — “qachonki” (aniq bo‘ladi)."], ["So", "so — shuning uchun."]]), "unless = if not."));
  }
  for (const [q, a, ws] of [
    ["I’ll call you ___ I get home. (uyga albatta boraman)", "when", [["if", "Aniq bo‘ladigan ish → when."], ["unless", "unless = if not."], ["so", "so — shuning uchun."]]],
    ["___ you don’t study, you won’t pass.", "If", [["Unless", "Gapda allaqachon “don’t” bor → If."], ["When", "Shart → If."], ["So", "Shart → If."]]],
    ["We’ll go out ___ the rain stops. (yomg‘ir albatta to‘xtaydi)", "when", [["unless", "unless = if not."], ["if", "Aniq bo‘ladigan voqea → when."], ["so", "so — shuning uchun."]]],
    ["You can’t go out ___ you finish your homework.", "unless", [["if", "Ma’no: “tugatmasang, chiqa olmaysan” → unless."], ["when", "Ma’no — shart (if not)."], ["so", "Shart → unless."]]],
  ]) pool.push(mc(3, q, a, ws, `${a}.`));

  // E
  for (const [is, ib, it, ir, rs, rv, rr] of FIRST) {
    const pres = BEF(is, ib, it);
    const right = `If ${is} ${pres} ${ir}, ${rs} will ${rv} ${rr}.`.replace(" ,", ",");
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`If ${is} will ${ib.replace("not ", "not ")} ${ir}, ${rs} will ${rv} ${rr}.`.replace(" ,", ",").replace("will not ", "won’t "), "if-qismda will ishlatilmaydi."],
      [`If ${is} ${pres} ${ir}, ${rs} will ${rv === "be" ? "is" : S3(rv)} ${rr}.`.replace(" ,", ","), "will + asl fe’l."],
      [`If ${is} ${pres} ${ir}, ${rs} would ${rv} ${rr}.`.replace(" ,", ","), "Real kelajak → will."],
    ]), `First conditional: ${right}`));
  }
  for (const [ifp, rs, rv, third, rest] of ZERO) {
    const right = `If ${ifp}, ${rs} ${third ? S3(rv) : rv}${rest ? " " + rest : ""}.`;
    pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
      [`If ${ifp}, ${rs} ${third ? rv : S3(rv)}${rest ? " " + rest : ""}.`, third ? `${rs} → -s.` : `${rs} bilan -s yo‘q.`], [`If ${ifp}, ${rs} would ${rv}${rest ? " " + rest : ""}.`, "Fakt → Present Simple."],
      [`If ${ifp}, ${rs} ${rv.endsWith("e") ? rv.slice(0, -1) : rv}ing${rest ? " " + rest : ""}.`, "Fakt → Present Simple."],
    ]), `Zero conditional: ${right}`));
  }

  return {
    code: "KG24",
    unit: 24,
    title: "24. If Conditionals: zero and first",
    title_uz: "Shart gaplar (0 va 1-tur) · 200 ta test",
    seed: 24024,
    parts: PARTS,
    quotas: [[0, 24], [1, 60], [2, 36], [3, 30], [4, 50]],
    pool,
    intro: {
      what: "Shart gaplar: “agar …, …”. Zero — doim to‘g‘ri bo‘ladigan fakt; First — kelajakda bo‘lishi mumkin bo‘lgan real holat.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Zero conditional",
          name_uz: "0-tur: fakt",
          summary: "If + Present Simple, Present Simple. Ilmiy faktlar, doim shunday bo‘ladigan narsalar.",
          usage: [
            { text: "Fakt.", example: { en: "If you heat ice, it melts.", uz: "Muzni isitsang, u eriydi." } },
            { text: "Odat natijasi.", example: { en: "If I am tired, I go to bed early.", uz: "Charchasam, erta yotaman." } },
          ],
          structure: [{ type: "+", formula: "If + Present Simple, Present Simple", example: { en: "If it rains, the grass gets wet.", uz: "Yomg‘ir yog‘sa, maysa ho‘l bo‘ladi." } }],
          signals: [],
          tip: "if o‘rniga when qo‘ysa ham ma’no o‘zgarmaydi: When you heat ice, it melts.",
        },
        {
          name: "First conditional",
          name_uz: "1-tur: real kelajak",
          summary: "If + Present Simple, will + asl fe’l. if-qismda will ishlatilmaydi!",
          usage: [
            { text: "Bo‘lishi mumkin bo‘lgan kelajak.", example: { en: "If it rains tomorrow, we will stay at home.", uz: "Ertaga yomg‘ir yog‘sa, uyda qolamiz." } },
            { text: "Ogohlantirish va va’da.", example: { en: "If you touch the dog, it will bite you.", uz: "Itga tegsang, seni tishlaydi." } },
          ],
          structure: [
            { type: "+", formula: "If + Present Simple, will + verb", example: { en: "If you study, you will pass.", uz: "O‘qisang, o‘tasan." } },
            { type: "+", formula: "will + verb + if + Present Simple", example: { en: "We’ll be late if we don’t hurry.", uz: "Shoshilmasak, kechikamiz." } },
          ],
          signals: [],
          tip: "“If it will rain” — XATO. If it rains …",
        },
        {
          name: "unless, when",
          name_uz: "unless va when",
          summary: "unless = if … not (agar … masa). when — aniq bo‘ladigan ish uchun.",
          usage: [
            { text: "unless", example: { en: "Unless you hurry, you’ll miss the bus.", uz: "Shoshilmasang, avtobusga ulgurmaysan." } },
            { text: "when", example: { en: "I’ll call you when I get home.", uz: "Uyga yetganimda qo‘ng‘iroq qilaman." } },
          ],
          structure: [],
          signals: [],
          tip: "unless bilan yana not qo‘yilmaydi: Unless you hurry (Unless you don’t hurry — XATO).",
        },
      ],
      mistakes: [
        { wrong: "If it will rain, we will stay home.", right: "If it rains, we will stay home.", why: "if-qismda will yo‘q." },
        { wrong: "If you heat ice, it melt.", right: "If you heat ice, it melts.", why: "it → -s." },
        { wrong: "If you study, you pass the exam tomorrow.", right: "If you study, you will pass the exam tomorrow.", why: "Kelajak natija → will." },
        { wrong: "Unless you don’t hurry, …", right: "Unless you hurry, …", why: "unless = if not." },
      ],
    },
  };
}
