// 21. QUESTIONS. TAG QUESTIONS.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { SUBJ, VERBS, lower, pron, uw } from "./verbs.mjs";

// So'roq so'zlari: [savol, javob, so'roq so'zi]
const WH = [
  ["___ do you live? — In Tashkent.", "Where"], ["___ is your birthday? — On 5th May.", "When"], ["___ is your name? — Malika.", "What"], ["___ is that man? — He’s my uncle.", "Who"],
  ["___ are you crying? — Because I’m sad.", "Why"], ["___ do you go to school? — By bus.", "How"], ["___ are you? — I’m eleven.", "How old"], ["___ brothers have you got? — Two.", "How many"],
  ["___ is this bag? — It’s 30,000 so‘m.", "How much"], ["___ bag is this? — It’s Ali’s.", "Whose"], ["___ colour do you like? — Blue.", "What"], ["___ do you play tennis? — Twice a week.", "How often"],
  ["___ is the bank? — Next to the park.", "Where"], ["___ did you come? — Yesterday.", "When"], ["___ did you see? — I saw Ali.", "Who"], ["___ is it from here to school? — 2 km.", "How far"],
  ["___ is your sister? — She’s very tall.", "What … like"], ["___ one do you want, the red or the blue? — The red one.", "Which"], ["___ does the film start? — At 7.", "What time"], ["___ did you stay there? — For two weeks.", "How long"],
  ["___ milk do you need? — One litre.", "How much"], ["___ are you late? — I missed the bus.", "Why"], ["___ are my keys? — On the table.", "Where"], ["___ is your favourite teacher? — Mrs Karimova.", "Who"],
  ["___ apples are there? — Five.", "How many"], ["___ is your dad? — He’s 40.", "How old"], ["___ shoes are these? — They’re mine.", "Whose"], ["___ do you have breakfast? — At 7 o’clock.", "What time"],
];
const WH_ALL = ["Where", "When", "What", "Who", "Why", "How", "How old", "How many", "How much", "Whose", "Which", "How often", "How far", "How long", "What time"];
// Tag: [gap, tag]
const TAGS = [];
const addTag = (s, t) => TAGS.push([s, t]);
const OTHER = { I: "you", You: "I", We: "they", They: "we", He: "she", She: "he" };
const PARTS = [
  "A. So‘roq so‘zlari · Question words",
  "B. Yordamchi fe’l · Do / Does / Did / Is / Are …?",
  "C. Tag questions · …, isn’t it? / …, don’t you?",
  "D. Ega haqida savol · Who broke …? / Who did … see?",
  "E. To‘g‘ri savolni tanlang · Choose the correct question",
];

export function build() {
  const r = rng(2121);
  const pool = [];

  // A
  for (const [q, a] of WH) {
    if (a === "What … like") {
      pool.push(mc(0, "___ is your sister ___? — She’s very tall and kind.", "What / like", [["How / like", "Tashqi ko‘rinish / xarakter: What … like?"], ["Who / like", "What … like?"], ["What / likes", "What … like?"]], "Qanday odam? → What is she like?"));
      continue;
    }
    const ws = shuffle(WH_ALL.filter((x) => x !== a && !(a === "What" && x === "Which") && !(a === "Which" && x === "What") && !(a === "What time" && x === "When") && !(a === "When" && x === "What time")), r).slice(0, 3);
    pool.push(mc(0, q, a, ws.map((w) => [w, `${w} — boshqa narsani so‘raydi. Javobga qarang: ${a}.`]), `Javob “${q.split("— ")[1]}” → ${a}.`));
  }

  // B. Yordamchi fe'l
  for (const v of VERBS) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I" && x[0] !== "My sister and I"), r);
    const sj = lower(s[0]);
    const aux = s[1] ? "Does" : "Do";
    pool.push(mc(1, `___ ${sj} ${v.b} ${v.o} every day?`, aux, uw(aux, [[s[1] ? "Do" : "Does", `${sj} bilan ${aux}.`], [s[2] === 2 ? "Are" : "Is", "Fe’l asl shaklda (odat) → Do / Does."], ["Did", "every day — hozirgi odat."]]), `Present Simple: ${aux} + ega + fe’l?`));
    pool.push(mc(1, `Where ___ ${sj} ${v.b} ${v.o} yesterday?`, "did", uw("did", [[s[1] ? "does" : "do", "yesterday → did."], [s[2] === 2 ? "were" : "was", "Fe’l asl shaklda → did."], ["have", "yesterday → Past Simple."]]), "yesterday → Wh + did + ega + fe’l?"));
    const be = s[2] === 2 ? "are" : "is";
    pool.push(mc(1, `What ___ ${sj} doing now?`, be, uw(be, [[be === "is" ? "are" : "is", `${sj} bilan ${be}.`], [s[1] ? "does" : "do", "doing now → Present Continuous: is / are."], ["did", "now → hozirgi zamon."]]), `Present Continuous: What + ${be} + ega + doing?`));
  }

  // C. Tag questions
  for (const s of SUBJ) {
    const p = pron(s);
    const pl = p === "I" ? "I" : p;
    const isBe = s[2] === 0 ? "am" : s[2] === 1 ? "is" : "are";
    const tagBe = s[2] === 0 ? "aren’t I" : `${isBe}n’t ${pl}`;
    pool.push(mc(2, `${s[0]} ${isBe} ${pick(["clever", "happy", "at home", "ready", "late"], r)}, ___ ?`, tagBe, uw(tagBe, [
      [s[2] === 0 ? "am not I" : `${isBe} ${pl}`, s[2] === 0 ? "I am … → aren’t I? (istisno)." : "Darak gap → inkor tag."],
      [s[1] ? `doesn’t ${pl}` : `don’t ${pl}`, "Gapda to be → tagda ham to be."],
      [`${isBe === "am" ? "aren’t" : `${isBe}n’t`} ${OTHER[s[0]] ?? lower(s[0])}`, OTHER[s[0]] ? `Tagdagi olmosh egaga mos bo‘lishi kerak: ${pl}.` : `Tagda ot emas, olmosh ishlatiladi: ${pl}.`],
    ]), `${s[0]} ${isBe} … → ${tagBe}?`));
    const v = pick(VERBS, r);
    const tagDo = `${s[1] ? "doesn’t" : "don’t"} ${pl}`;
    pool.push(mc(2, `${s[0]} ${s[1] ? v.s : v.b} ${v.o}, ___ ?`, tagDo, uw(tagDo, [
      [`${s[1] ? "don’t" : "doesn’t"} ${pl}`, `${pl} bilan ${s[1] ? "doesn’t" : "don’t"}.`], [`${s[2] === 0 ? "aren’t" : s[2] === 1 ? "isn’t" : "aren’t"} ${pl}`, "Gapda oddiy fe’l → tagda do / does."], [`${s[1] ? "does" : "do"} ${pl}`, "Darak gap → inkor tag."],
    ]), `Present Simple darak → ${tagDo}?`));
    const v2 = pick(VERBS, r);
    pool.push(mc(2, `${s[0]} ${v2.p} ${v2.o} yesterday, ___ ?`, `didn’t ${pl}`, uw(`didn’t ${pl}`, [
      [`did ${pl}`, "Darak gap → inkor tag: didn’t."], [`${s[1] ? "doesn’t" : "don’t"} ${pl}`, "O‘tgan zamon → didn’t."], [`${s[2] === 2 ? "weren’t" : "wasn’t"} ${pl}`, "Oddiy fe’l → did."],
    ]), `Past Simple → didn’t ${pl}?`));
    pool.push(mc(2, `${s[0]} can’t swim, ___ ?`, `can ${pl}`, uw(`can ${pl}`, [[`can’t ${pl}`, "Inkor gap → ijobiy tag."], [`${s[1] ? "does" : "do"} ${pl}`, "can → tagda ham can."], [`could ${pl}`, "Zamon o‘zgarmaydi: can."]]), `Inkor gap (can’t) → ijobiy tag: can ${pl}?`));
    pool.push(mc(2, `${s[0]} will come tomorrow, ___ ?`, `won’t ${pl}`, uw(`won’t ${pl}`, [[`will ${pl}`, "Darak gap → inkor tag."], [`willn’t ${pl}`, "will not → won’t."], [`don’t ${pl}`, "will → won’t."]]), `will → won’t ${pl}?`));
    if (s[2] !== 0) pool.push(mc(2, `${s[0]} ${s[2] === 2 ? "weren’t" : "wasn’t"} at school yesterday, ___ ?`, `${s[2] === 2 ? "were" : "was"} ${pl}`, uw(`${s[2] === 2 ? "were" : "was"} ${pl}`, [[`${s[2] === 2 ? "weren’t" : "wasn’t"} ${pl}`, "Inkor gap → ijobiy tag."], [`did ${pl}`, "to be → tagda ham was / were."], [`${s[2] === 2 ? "was" : "were"} ${pl}`, `${pl} bilan ${s[2] === 2 ? "were" : "was"}.`]]), "Inkor gap → ijobiy tag."));
  }
  for (const [q, a, ws] of [
    ["Let’s go to the park, ___ ?", "shall we", [["will we", "Let’s … → shall we? (qoida)."], ["don’t we", "Let’s → shall we."], ["let we", "Let’s → shall we."]]],
    ["Open the window, ___ ?", "will you", [["do you", "Buyruq gap → will you?"], ["shall we", "shall we — Let’s bilan."], ["don’t you", "Buyruq → will you."]]],
    ["I’m your friend, ___ ?", "aren’t I", [["amn’t I", "Bunday shakl yo‘q."], ["am not I", "I am → aren’t I?"], ["isn’t I", "I am → aren’t I?"]]],
    ["There is a cat in the garden, ___ ?", "isn’t there", [["isn’t it", "There is … → isn’t there?"], ["is there", "Darak → inkor tag."], ["doesn’t there", "There is → isn’t there."]]],
    ["Nobody called, ___ ?", "did they", [["didn’t they", "Nobody — inkor ma’no → ijobiy tag."], ["did he", "nobody / everybody → they."], ["didn’t he", "Nobody → did they?"]]],
    ["She has got a cat, ___ ?", "hasn’t she", [["doesn’t she", "have got → hasn’t."], ["has she", "Darak → inkor tag."], ["isn’t she", "have got → hasn’t."]]],
  ]) pool.push(mc(2, q, a, ws, `Maxsus holat: ${a}?`));

  // D. Ega haqida savol
  const SUBQ = [
    ["broke the window? — Tom broke it.", "Who broke", "Who did break", "did break"], ["ate my cake? — The dog ate it.", "Who ate", "Who did eat", "did eat"], ["told you? — Malika told me.", "Who told", "Who did tell", "did tell"],
    ["happened? — There was an accident.", "What happened", "What did happen", "did happen"], ["opened the door? — Ali opened it.", "Who opened", "Who did open", "did open"], ["won the game? — Our team won.", "Who won", "Who did win", "did win"],
    ["lives in this house? — My aunt lives there.", "Who lives", "Who does live", "does live"], ["wrote this book? — Alisher Navoi wrote it.", "Who wrote", "Who did write", "did write"],
    ["made this cake? — My mum made it.", "Who made", "Who did make", "did make"], ["sent you this letter? — My friend sent it.", "Who sent", "Who did send", "did send"],
  ];
  for (const [rest, right, wrong] of SUBQ) {
    const v = right.split(" ")[1];
    const isWhat = right.startsWith("What");
    pool.push(mc(3, `___ ${rest}`, right, [[wrong, "Savol EGA haqida (kim? / nima?) — did / does kerak emas."], [isWhat ? `Who ${v}` : `Whom ${v}`, isWhat ? "Voqea haqida → What happened?" : "Ega haqida → Who."], [isWhat ? "What happens" : `Whose ${v}`, isWhat ? "Javob o‘tgan zamonda → happened." : "Whose — kimning; bu yerda “kim?” → Who."]], `Ega haqida savol: ${right} …?`));
  }
  const OBJQ = [
    ["did you see at the party? — I saw Ali.", "Who"], ["did Tom break? — He broke the window.", "What"], ["did your mum buy? — She bought a dress.", "What"], ["did you call? — I called my uncle.", "Who"],
    ["does she love? — She loves her family.", "Who"], ["did they eat? — They ate plov.", "What"], ["do you want? — I want an ice cream.", "What"], ["did the teacher ask? — She asked me.", "Who"],
  ];
  for (const [rest, w] of OBJQ) {
    const verb = rest.split(" ")[2].replace("?", "");
    pool.push(mc(3, `${w} ___ ${rest.replace(/^(did|does|do) \\S+ \\S+/, "")}`.replace(/___ .*/, `___ ${rest.split("—")[0].trim().split(" ").slice(1).join(" ")} — ${rest.split("— ")[1]}`), rest.split(" ")[0], uw(rest.split(" ")[0], [[rest.split(" ")[0] === "did" ? "was" : "is", "To‘ldiruvchi haqida savol → yordamchi fe’l do / does / did."], [rest.split(" ")[0] === "did" ? "does" : "did", "Zamon javobdagi bilan bir xil bo‘lishi kerak."], [rest.split(" ")[0] === "do" ? "does" : "do", "Ega va zamonga mos yordamchi fe’l kerak."], ["did", "Zamon javobdagi bilan bir xil."]]), `To‘ldiruvchi haqida savol: ${w} + ${rest.split(" ")[0]} + ega + fe’l? (${verb})`));
  }

  // E. To'g'ri savol
  for (const v of VERBS) {
    const s = pick(SUBJ.filter((x) => x[0] !== "I" && x[0] !== "You"), r);
    const sj = lower(s[0]);
    const aux = s[1] ? "does" : "do";
    const right = `Where ${aux} ${sj} ${v.b} ${v.o}?`;
    pool.push(mc(4, "Choose the correct question · To‘g‘ri savolni tanlang", right, uw(right, [
      [`Where ${sj} ${aux} ${v.b} ${v.o}?`, "So‘z tartibi: Wh + yordamchi fe’l + ega + fe’l."], [`Where ${aux} ${sj} ${v.s} ${v.o}?`, "do / does dan keyin asl fe’l."],
      [`Where ${sj} ${s[1] ? v.s : v.b} ${v.o}?`, "Yordamchi fe’l (do / does) tushib qolgan."], [`Where ${s[1] ? "do" : "does"} ${sj} ${v.b} ${v.o}?`, `${sj} bilan ${aux}.`],
    ]), `Wh + ${aux} + ega + asl fe’l?`));
  }

  return {
    code: "KG21",
    unit: 21,
    title: "21. Questions. Tag questions",
    title_uz: "So‘roq gaplar va tag questions · 200 ta test",
    seed: 21021,
    parts: PARTS,
    quotas: [[0, 28], [1, 50], [2, 62], [3, 18], [4, 42]],
    pool,
    intro: {
      what: "Savol tuzish: so‘roq so‘zi + yordamchi fe’l + ega + asosiy fe’l. Tag question — gap oxiridagi qisqa “shundaymi?” savoli.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Question words",
          name_uz: "So‘roq so‘zlari",
          summary: "What — nima; Who — kim; Where — qayerda; When — qachon; Why — nega; How — qanday; Whose — kimning; Which — qaysi (tanlov); How many / How much / How old / How often / How long / What time.",
          usage: [
            { text: "Javobga qarab so‘roq so‘zini tanlang.", example: { en: "Where do you live? — In Bukhara.", uz: "Qayerda yashaysan? — Buxoroda." } },
            { text: "What … like? — qanday odam / narsa?", example: { en: "What is your teacher like? — She’s kind.", uz: "O‘qituvching qanday? — Mehribon." } },
          ],
          structure: [{ type: "?", formula: "Wh-word + auxiliary + subject + verb?", example: { en: "Why did you come late?", uz: "Nega kech qolding?" } }],
          signals: [],
          tip: "Which — tanlov bo‘lsa (the red or the blue?).",
        },
        {
          name: "Tag questions",
          name_uz: "…, shundaymi?",
          summary: "Darak gap → inkor tag; inkor gap → ijobiy tag. Tagda gapdagi yordamchi fe’l va olmosh ishlatiladi.",
          usage: [
            { text: "to be", example: { en: "She is a student, isn’t she?", uz: "U talaba, shundaymi?" } },
            { text: "Present Simple", example: { en: "You like tea, don’t you?", uz: "Choy yoqtirasan, to‘g‘rimi?" } },
            { text: "Past Simple", example: { en: "They went home, didn’t they?", uz: "Ular uyga ketishdi, shundaymi?" } },
            { text: "Inkor gap", example: { en: "He can’t swim, can he?", uz: "U suzolmaydi, shundaymi?" } },
          ],
          structure: [{ type: "?", formula: "positive sentence, negative tag? / negative sentence, positive tag?", example: { en: "It isn’t cold, is it?", uz: "Sovuq emas, to‘g‘rimi?" } }],
          signals: [],
          tip: "Istisnolar: I am → aren’t I? Let’s → shall we? Buyruq → will you?",
        },
        {
          name: "Subject questions",
          name_uz: "Ega haqida savol",
          summary: "Who / What EGA haqida so‘rasa — did / does qo‘yilmaydi: Who broke the window? To‘ldiruvchi haqida — yordamchi fe’l kerak: Who did you see?",
          usage: [
            { text: "Ega haqida.", example: { en: "Who called you? — Ali called me.", uz: "Senga kim qo‘ng‘iroq qildi? — Ali." } },
            { text: "To‘ldiruvchi haqida.", example: { en: "Who did you call? — I called Ali.", uz: "Kimga qo‘ng‘iroq qilding? — Aliga." } },
          ],
          structure: [],
          signals: [],
          tip: "Javobda savol so‘zi o‘rnida ega turgan bo‘lsa — did / does yo‘q.",
        },
      ],
      mistakes: [
        { wrong: "Where you live?", right: "Where do you live?", why: "Yordamchi fe’l kerak." },
        { wrong: "What does she likes?", right: "What does she like?", why: "does + asl fe’l." },
        { wrong: "She is nice, is she?", right: "She is nice, isn’t she?", why: "Darak → inkor tag." },
        { wrong: "Who did break the window?", right: "Who broke the window?", why: "Ega haqida savol." },
        { wrong: "I’m late, amn’t I?", right: "I’m late, aren’t I?", why: "Istisno." },
      ],
    },
  };
}
