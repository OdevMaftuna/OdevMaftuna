// 20. ADJECTIVES — ADVERBS — COMPARATIVES (va superlatives).
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { uw } from "./verbs.mjs";

// [sifat, qiyosiy, orttirma, qoida, o'zbekcha]
const ADJ = [
  ["tall", "taller", "the tallest", "er", "baland"], ["small", "smaller", "the smallest", "er", "kichik"], ["fast", "faster", "the fastest", "er", "tez"], ["old", "older", "the oldest", "er", "qari / eski"],
  ["cold", "colder", "the coldest", "er", "sovuq"], ["long", "longer", "the longest", "er", "uzun"], ["short", "shorter", "the shortest", "er", "qisqa"], ["clever", "cleverer", "the cleverest", "er", "aqlli"],
  ["nice", "nicer", "the nicest", "e", "yoqimli"], ["large", "larger", "the largest", "e", "katta"], ["safe", "safer", "the safest", "e", "xavfsiz"], ["wide", "wider", "the widest", "e", "keng"],
  ["big", "bigger", "the biggest", "dbl", "katta"], ["hot", "hotter", "the hottest", "dbl", "issiq"], ["thin", "thinner", "the thinnest", "dbl", "ozg‘in"], ["fat", "fatter", "the fattest", "dbl", "semiz"], ["sad", "sadder", "the saddest", "dbl", "xafa"],
  ["happy", "happier", "the happiest", "y", "baxtli"], ["easy", "easier", "the easiest", "y", "oson"], ["funny", "funnier", "the funniest", "y", "kulgili"], ["busy", "busier", "the busiest", "y", "band"], ["heavy", "heavier", "the heaviest", "y", "og‘ir"], ["pretty", "prettier", "the prettiest", "y", "chiroyli"],
  ["beautiful", "more beautiful", "the most beautiful", "more", "chiroyli"], ["expensive", "more expensive", "the most expensive", "more", "qimmat"], ["interesting", "more interesting", "the most interesting", "more", "qiziqarli"],
  ["difficult", "more difficult", "the most difficult", "more", "qiyin"], ["dangerous", "more dangerous", "the most dangerous", "more", "xavfli"], ["popular", "more popular", "the most popular", "more", "mashhur"], ["comfortable", "more comfortable", "the most comfortable", "more", "qulay"],
  ["good", "better", "the best", "irr", "yaxshi"], ["bad", "worse", "the worst", "irr", "yomon"], ["far", "farther", "the farthest", "irr", "uzoq"],
];
const RULE = { er: "Qisqa sifat → -er / the -est", e: "e bilan tugasa → -r / the -st", dbl: "Unli + undosh → undosh ikkilanadi", y: "y → ier / the iest", more: "Uzun sifat → more / the most", irr: "Istisno" };
const wrongC = ([a, c, , k]) => {
  if (k === "more") return [[`${a}er`, `Uzun sifat → more ${a}.`], [`more ${a}er`, "more va -er birga kelmaydi."], [`most ${a}`, "Qiyoslashda more."]];
  if (k === "irr") return [[`${a}er`, `${a} — istisno: ${c}.`], [`more ${a}`, `${a} → ${c}.`], [`more ${c}`, "more va qiyosiy shakl birga kelmaydi."]];
  const out = [[`more ${a}`, `Qisqa sifat → ${c}.`], [`more ${c}`, "more va -er birga kelmaydi."]];
  if (k === "dbl") out.push([`${a}er`, `${RULE.dbl}: ${c}.`]);
  else if (k === "y") out.push([`${a}er`, `${RULE.y}: ${c}.`]);
  else if (k === "e") out.push([`${a}er`, `${RULE.e}: ${c}.`]);
  else out.push([`${a}est`, "Ikki narsa qiyoslanganda -er (than)."]);
  return out;
};
const PAIRS = [
  ["An elephant is", "a mouse", ["big", "heavy"]], ["My grandpa is", "my dad", ["old"]], ["A car is", "a bike", ["fast", "expensive"]], ["Summer is", "spring", ["hot"]],
  ["This book is", "that one", ["interesting", "funny", "long"]], ["Maths is", "art", ["difficult"]], ["Football is", "chess", ["popular"]], ["My sister is", "me", ["tall", "clever", "happy"]],
  ["A sofa is", "a chair", ["comfortable", "large"]], ["Lions are", "cats", ["dangerous"]], ["This test is", "the last one", ["easy", "bad", "good"]], ["Tashkent is", "my village", ["big", "busy"]],
  ["Winter is", "autumn", ["cold"]], ["The river is", "the street", ["wide", "long"]], ["My new phone is", "my old one", ["good", "nice"]], ["A giraffe is", "a horse", ["tall"]],
];
const SUP = [
  ["Mount Everest is", "mountain in the world", ["high"]], ["The cheetah is", "animal on land", ["fast"]], ["The Nile is", "river in the world", ["long"]], ["This is", "day of my life", ["happy", "good"]],
  ["Ali is", "boy in our class", ["tall", "clever", "funny"]], ["This is", "film I’ve ever seen", ["bad", "interesting", "good"]], ["Gold is", "thing in the shop", ["expensive"]], ["Sharks are", "fish in the sea", ["dangerous"]],
  ["January is", "month of the year", ["cold"]], ["This is", "chair in the room", ["comfortable", "big"]], ["Malika is", "girl in the school", ["pretty", "popular"]], ["July is", "month here", ["hot"]],
];
// Ravishlar: [sifat, ravish, fe'lli gaplar, sifatli gaplar]
const ADV = [
  ["quick", "quickly", ["He ate his lunch ___ .", "Come here ___ !"], ["It was a ___ lunch.", "He is a ___ learner."]],
  ["slow", "slowly", ["The old man walks ___ .", "Please speak ___ ."], ["The old man is ___ .", "This is a ___ bus."]],
  ["careful", "carefully", ["Please drive ___ .", "Read the question ___ ."], ["Be ___ on the road!", "She is a ___ driver."]],
  ["quiet", "quietly", ["The baby is sleeping. Speak ___ .", "She closed the door ___ ."], ["The library is very ___ .", "He is a ___ boy."]],
  ["loud", "loudly", ["Don’t shout so ___ !", "The dog barked ___ ."], ["The music is too ___ .", "I heard a ___ noise."]],
  ["beautiful", "beautifully", ["She sings ___ .", "Malika dances ___ ."], ["She has a ___ voice.", "What a ___ flower!"]],
  ["bad", "badly", ["Our team played ___ yesterday.", "He writes ___ ."], ["The weather was ___ .", "It was a ___ game."]],
  ["easy", "easily", ["She answered all the questions ___ .", "He won the race ___ ."], ["The test was ___ .", "It’s an ___ question."]],
  ["happy", "happily", ["The children played ___ .", "They lived ___ ."], ["The children were ___ .", "She is a ___ girl."]],
  ["good", "well", ["He speaks English very ___ .", "She plays the piano ___ ."], ["His English is very ___ .", "She is a ___ pianist."]],
  ["fast", "fast", ["Ali runs very ___ .", "Don’t drive so ___ !"], ["Ali is a ___ runner.", "This is a ___ car."]],
  ["hard", "hard", ["She works very ___ .", "He studies ___ every day."], ["The work is very ___ .", "He is a ___ worker."]],
  ["polite", "politely", ["He asked ___ for help.", "Answer the teacher ___ ."], ["He is a very ___ boy.", "Be ___ to your friends."]],
  ["safe", "safely", ["We arrived home ___ .", "Cross the road ___ ."], ["The park is ___ for children.", "It’s a ___ place."]],
  ["angry", "angrily", ["“Go away!” he said ___ .", "She looked at me ___ ."], ["My dad was ___ .", "He is an ___ man."]],
  ["nervous", "nervously", ["She smiled ___ before the exam.", "He waited ___ ."], ["I am ___ before exams.", "She is a ___ girl."]],
];
const PARTS = [
  "A. Sifat yoki ravish? · Adjective or adverb?",
  "B. Qiyosiy daraja · Comparatives (-er / more)",
  "C. Orttirma daraja · Superlatives (the -est / the most)",
  "D. as … as, than",
  "E. To‘g‘ri shaklni tanlang · Choose the correct form",
];

export function build() {
  const r = rng(2020);
  const pool = [];
  const miss = (a) => (a.endsWith("y") ? `${a}ly` : a.endsWith("e") ? `${a.slice(0, -1)}ly` : `${a}lly`);
  const advWrong = (a, d) => {
    const ws = [];
    if (a === "good") ws.push(["good", "Fe’lni (qanday?) ravish tasvirlaydi: good → well (istisno)."], ["goodly", "Bunday so‘z yo‘q: well."]);
    else if (a === "fast" || a === "hard") ws.push([`${a}ly`, `${a} → ${a} (istisno, -ly olmaydi).`], [`${a}er`, "Bu qiyosiy daraja."]);
    else ws.push([a, `Fe’lni (qanday?) ravish tasvirlaydi: ${d}.`], [miss(a), `Imlo xato. To‘g‘risi: ${d}.`]);
    ws.push([`more ${a}`, "Qiyosiy daraja emas, ravish kerak."], [`${a}ness`, "Bu ot; ravish kerak."]);
    return ws;
  };

  // A. Sifat yoki ravish
  for (const [a, d, vs, as] of ADV) {
    for (const q of vs) pool.push(mc(0, `${q} (${a})`, d, uw(d, advWrong(a, d)), `Fe’l (qanday?) → ravish: ${d}.`));
    for (const q of as) pool.push(mc(0, `${q} (${a})`, a, uw(a, [[d, `Ot oldida yoki to be dan keyin sifat kerak: ${a}.`], [`${a}ly`, a === "hard" ? "hardly — boshqa so‘z (“deyarli … emas”)." : `Ot oldida -ly qo‘shilmaydi: ${a}.`], [`more ${a}`, "Qiyosiy daraja emas."], [`${a}ness`, "Bu ot, sifat kerak."]]), `Ot oldida yoki to be dan keyin → sifat: ${a}.`));
  }

  // B. Qiyosiy
  for (const [x, y, adjs] of PAIRS) {
    for (const a of adjs) {
      const A = ADJ.find((q) => q[0] === a);
      pool.push(mc(1, `${x} ___ than ${y}. (${a})`, A[1], uw(A[1], wrongC(A)), `${RULE[A[3]]}: ${a} → ${A[1]}.`));
    }
  }
  for (const A of ADJ) pool.push(mc(1, `${A[0]} (${A[4]}) → comparative: ___`, A[1], uw(A[1], wrongC(A)), `${RULE[A[3]]}: ${A[1]}.`));

  // C. Orttirma
  for (const [x, rest, adjs] of SUP) {
    for (const a of adjs) {
      const A = a === "high" ? ["high", "higher", "the highest", "er", "baland"] : ADJ.find((q) => q[0] === a);
      const ws = A[3] === "more" ? [[`the ${a}est`, `Uzun sifat → the most ${a}.`], [`the more ${a}`, "Orttirma: the most."], [`most ${a}`, "the tushib qolgan."]]
        : A[3] === "irr" ? [[`the ${a}est`, `${a} → ${A[2]} (istisno).`], [`the most ${a}`, `${a} → ${A[2]}.`], [A[1], "Bu qiyosiy daraja; hammadan → orttirma."]]
        : [[`the most ${a}`, `Qisqa sifat → ${A[2]}.`], [A[1], "Bu qiyosiy (than bilan). Hammadan → orttirma."], [A[2].replace("the ", ""), "Orttirma darajada “the” kerak."]];
      pool.push(mc(2, `${x} ___ ${rest}. (${a})`, A[2], uw(A[2], ws), `${RULE[A[3]]}: ${A[2]}.`));
    }
  }
  for (const A of ADJ) {
    const ws = A[3] === "more" ? [[`the ${A[0]}est`, "Uzun sifat → the most."], [A[1], "Bu qiyosiy."], [`most ${A[0]}`, "the kerak."]] : [[`the most ${A[0]}`, `${A[0]} → ${A[2]}.`], [A[1], "Bu qiyosiy."], [A[2].replace("the ", "the more "), "more emas."]];
    pool.push(mc(2, `${A[0]} (${A[4]}) → superlative: ___`, A[2], uw(A[2], ws), `${A[0]} → ${A[2]}.`));
  }

  // D. as … as / than
  for (const [x, y, adjs] of PAIRS) {
    const a = adjs[0];
    pool.push(mc(3, `${x.replace(/ (is|are)$/, (m) => m)} not as ${a} ___ ${y}.`, "as", uw("as", [["than", "as … as — tenglik; than faqat -er / more bilan."], ["like", "as … as qolipi."], ["that", "not as … as qolipi."]]), "not as + sifat + as."));
    const A = ADJ.find((q) => q[0] === a);
    pool.push(mc(3, `${x} ${A[1]} ___ ${y}.`, "than", uw("than", [["as", "Qiyosiy daraja (-er / more) + than."], ["then", "then — keyin; qiyoslashda than."], ["that", "Qiyoslashda than."]]), `${A[1]} + than.`));
  }

  // E. To'g'ri gap
  for (const [x, y, adjs] of PAIRS) {
    for (const a of adjs) {
      const A = ADJ.find((q) => q[0] === a);
      const right = `${x} ${A[1]} than ${y}.`;
      pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
        [`${x} ${A[3] === "more" ? `more ${a}er` : `more ${A[1]}`} than ${y}.`, "more va -er birga kelmaydi."],
        [`${x} ${a} than ${y}.`, "than bilan qiyosiy daraja kerak."],
        [`${x} ${A[1]} as ${y}.`, "Qiyosiy daraja + than."],
        [`${x} ${A[2]} than ${y}.`, "Ikki narsa → qiyosiy (the -est emas)."],
      ]), `Qiyosiy: ${right}`));
    }
  }
  for (const [x, rest, adjs] of SUP) {
    for (const a of adjs) {
      const A = a === "high" ? ["high", "higher", "the highest", "er", "baland"] : ADJ.find((q) => q[0] === a);
      const right = `${x} ${A[2]} ${rest}.`;
      pool.push(mc(4, "Choose the correct sentence · To‘g‘ri gapni tanlang", right, uw(right, [
        [`${x} ${A[2].replace("the ", "")} ${rest}.`, "Orttirma darajada the kerak."],
        [`${x} the ${A[1]} ${rest}.`, "Hammadan → orttirma (the -est / the most)."],
        [`${x} ${A[3] === "more" ? `the ${a}est` : `the most ${a}`} ${rest}.`, `${a} → ${A[2]}.`],
      ]), `Orttirma: ${right}`));
    }
  }

  return {
    code: "KG20",
    unit: 20,
    title: "20. Adjectives — Adverbs — Comparatives",
    title_uz: "Sifat, ravish, qiyosiy va orttirma daraja · 200 ta test",
    seed: 20020,
    parts: PARTS,
    quotas: [[0, 50], [1, 45], [2, 40], [3, 30], [4, 35]],
    pool,
    intro: {
      what: "Sifat otni tasvirlaydi (a fast car), ravish fe’lni tasvirlaydi (he runs fast). Sifatlarning qiyosiy (bigger) va orttirma (the biggest) darajalari bor.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Adjectives and adverbs",
          name_uz: "Sifat va ravish",
          summary: "Sifat — ot oldida yoki to be dan keyin. Ravish — fe’ldan keyin, “qanday?” savoliga javob. Ko‘pincha sifat + -ly.",
          usage: [
            { text: "Sifat.", example: { en: "She is a careful driver.", uz: "U ehtiyotkor haydovchi." } },
            { text: "Ravish.", example: { en: "She drives carefully.", uz: "U ehtiyotkorona haydaydi." } },
            { text: "Istisnolar: good → well, fast → fast, hard → hard.", example: { en: "He plays football well.", uz: "U futbolni yaxshi o‘ynaydi." } },
          ],
          structure: [
            { type: "+", formula: "quick → quickly, happy → happily, easy → easily", example: { en: "Speak quietly, please.", uz: "Iltimos, sekin gapiring." } },
          ],
          signals: [],
          tip: "“He speaks English good” — XATO. He speaks English well.",
        },
        {
          name: "Comparatives",
          name_uz: "Qiyosiy daraja",
          summary: "Ikki narsani qiyoslash: qisqa sifat + -er + than; uzun sifat: more + sifat + than.",
          usage: [
            { text: "-er: tall → taller, nice → nicer, big → bigger, happy → happier.", example: { en: "Ali is taller than Vali.", uz: "Ali Validan baland." } },
            { text: "more: beautiful → more beautiful.", example: { en: "This book is more interesting than that one.", uz: "Bu kitob u kitobdan qiziqroq." } },
            { text: "Istisno: good → better, bad → worse, far → farther.", example: { en: "Your mark is better than mine.", uz: "Sening bahoing menikidan yaxshiroq." } },
            { text: "as … as — teng; not as … as — teng emas.", example: { en: "I’m not as tall as my brother.", uz: "Men akamdek baland emasman." } },
          ],
          structure: [{ type: "+", formula: "A + is + adj-er / more adj + than + B", example: { en: "A car is faster than a bike.", uz: "Mashina velosipeddan tez." } }],
          signals: [{ en: "than", uz: "…dan (qiyoslash)" }, { en: "as … as", uz: "…dek" }],
          tip: "“more bigger”, “more better” — XATO. Faqat bitta: bigger / more beautiful.",
        },
        {
          name: "Superlatives",
          name_uz: "Orttirma daraja",
          summary: "Hammasidan: the + sifat-est yoki the most + sifat. Ko‘pincha in the world / in our class / of all bilan.",
          usage: [
            { text: "the -est", example: { en: "The cheetah is the fastest animal.", uz: "Gepard eng tez hayvon." } },
            { text: "the most", example: { en: "This is the most beautiful city.", uz: "Bu eng chiroyli shahar." } },
            { text: "Istisno: the best, the worst, the farthest.", example: { en: "She is the best student.", uz: "U eng yaxshi o‘quvchi." } },
          ],
          structure: [],
          signals: [],
          tip: "Orttirma darajada “the” tushib qolmasin.",
        },
      ],
      mistakes: [
        { wrong: "She is more taller than me.", right: "She is taller than me.", why: "more + -er bo‘lmaydi." },
        { wrong: "This is the goodest film.", right: "This is the best film.", why: "good → the best." },
        { wrong: "He runs quick.", right: "He runs quickly.", why: "Fe’l → ravish." },
        { wrong: "Ali is tall than Vali.", right: "Ali is taller than Vali.", why: "than bilan qiyosiy." },
        { wrong: "I’m as tall than you.", right: "I’m as tall as you.", why: "as … as." },
      ],
    },
  };
}
