// 16. PRESENT PERFECT — have / has + V3.
import { cap, mc, pick, rng, shuffle } from "./common.mjs";
import { SUBJ, VERBS, lower, uw } from "./verbs.mjs";

const HAVE = (s) => (s[1] ? "has" : "have");
const regWrong = (v) => (v.b.endsWith("e") ? `${v.b}d` : `${v.b}ed`);
// for / since
const FOR = ["two years", "three days", "a long time", "ten minutes", "six months", "a week", "five hours", "ages"];
const SINCE = ["2020", "Monday", "last summer", "8 o’clock", "I was five", "January", "yesterday morning", "my birthday"];
const LIVE = [["lived in Tashkent", "live"], ["known Ali", "know"], ["had this bike", "have"], ["been ill", "be"], ["worked here", "work"], ["studied English", "study"], ["been at this school", "be"], ["had a cat", "have"]];
const PARTS = [
  "A. Fe’lning 3-shakli · Past participle (V3)",
  "B. have yoki has?",
  "C. already, yet, just, ever, never",
  "D. Inkor va so‘roq · haven’t / hasn’t, Have / Has …?",
  "E. for yoki since?",
];

export function build() {
  const r = rng(1616);
  const pool = [];

  // A. V3
  for (const v of VERBS) {
    const ws = [];
    if (v.pp !== v.p) ws.push([v.p, `${v.p} — 2-shakl (Past Simple). Present Perfect’da 3-shakl: ${v.pp}.`]);
    if (v.irr) ws.push([regWrong(v), `“${v.b}” — noto‘g‘ri fe’l: 3-shakli ${v.pp}.`]);
    else ws.push([v.b.endsWith("e") ? `${v.b}ed` : `${v.b}d`, `To‘g‘ri fe’l: ${v.pp}.`]);
    ws.push([v.ing, "-ing shakl emas, 3-shakl (V3) kerak."], [v.b, "have / has + V3 (asl shakl emas)."], [v.s, "have / has + V3."]);
    const s = pick(SUBJ, r);
    pool.push(mc(0, `${s[0]} ${HAVE(s)} ___ ${v.o}. (${v.b})`, v.pp, uw(v.pp, ws), `have / has + V3: ${v.b} → ${v.pp}.`));
    pool.push(mc(0, `${v.b} (${v.uz}) → V3: ___`, v.pp, uw(v.pp, ws), `${v.b} – ${v.p} – ${v.pp}.`));
  }

  // B. have / has
  for (const v of VERBS) {
    for (const s of shuffle(SUBJ, r).slice(0, 2)) {
      const h = HAVE(s);
      pool.push(mc(1, `${s[0]} ___ just ${v.pp} ${v.o}.`, h, uw(h, [
        [h === "has" ? "have" : "has", h === "has" ? `${s[0]} — he / she / it → has.` : `${s[0]} — I / you / we / they → have.`],
        [s[2] === 0 ? "am" : s[2] === 1 ? "is" : "are", "Present Perfect: have / has + V3."],
        ["did", "did + V3 bo‘lmaydi."],
      ]), `${s[0]} → ${h} + V3.`));
    }
  }

  // C. already / yet / just / ever / never
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    pool.push(mc(2, `${s[0]} ${HAVE(s)}n’t ${v.pp} ${v.o} ___ .`, "yet", uw("yet", [
      ["already", "already — darak gapda. Inkor gap oxirida → yet."], ["just", "just — darak gapda, have / has dan keyin."], ["ever", "ever — so‘roqda."],
    ]), "Inkor gap oxirida → yet (hali)."));
    const s2 = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    pool.push(mc(2, `${cap(HAVE(s2))} ${lower(s2[0])} ${v.pp} ${v.o} ___ ?`, "yet", uw("yet", [
      ["already", "So‘roq oxirida ko‘pincha yet (…mi hali?)."], ["never", "never — darak gapda (hech qachon)."], ["just", "just — darak gapda."],
    ]), "So‘roq oxirida → yet."));
    const s3 = pick(SUBJ, r);
    pool.push(mc(2, `${s3[0]} ${HAVE(s3)} ___ ${v.pp} ${v.o}. (allaqachon)`, "already", uw("already", [
      ["yet", "yet — inkor va so‘roq oxirida."], ["ever", "ever — so‘roqda."], ["ago", "ago — Past Simple bilan."],
    ]), "already = allaqachon; have / has va V3 orasida."));
    pool.push(mc(2, `Have you ___ ${v.pp} ${v.o}? (hech … mi?)`, "ever", uw("ever", [
      ["yet", "yet — gap oxirida keladi."], ["never", "never — “hech qachon” (inkor ma’no), so‘roqda ishlatilmaydi."], ["already", "already — darak gapda."],
    ]), "Have you ever + V3? — hayotingda hech …mi?"));
    pool.push(mc(2, `${s3[0]} ${HAVE(s3)} ___ ${v.pp} ${v.o}. (hech qachon)`, "never", uw("never", [
      ["ever", "ever — so‘roqda. Darak gapda “hech qachon” → never."], ["yet", "yet — gap oxirida, inkor bilan."], ["not", "have not … — “hech qachon” emas."],
    ]), "never = hech qachon (fe’l inkor shaklga o‘tmaydi)."));
  }

  // D. Inkor va so'roq
  for (const v of VERBS) {
    const s = pick(SUBJ, r);
    const neg = `${HAVE(s)}n’t`;
    pool.push(mc(3, `${s[0]} ___ ${v.pp} ${v.o} yet.`, neg, uw(neg, [
      [neg === "hasn’t" ? "haven’t" : "hasn’t", `${s[0]} bilan ${neg}.`], ["didn’t", "V3 + yet → Present Perfect: haven’t / hasn’t."], [s[1] ? "doesn’t" : "don’t", "Present Perfect inkori — haven’t / hasn’t."],
    ]), `Inkor: ${neg} + V3.`));
    const s2 = pick(SUBJ.filter((x) => x[0] !== "I"), r);
    const H = cap(HAVE(s2));
    pool.push(mc(3, `___ ${lower(s2[0])} ever ${v.pp} ${v.o}?`, H, uw(H, [
      [H === "Has" ? "Have" : "Has", `${lower(s2[0])} bilan ${H}.`], ["Did", "V3 bilan Did ishlatilmaydi."], [s2[1] ? "Does" : "Do", "Present Perfect so‘rog‘i — Have / Has."],
    ]), `So‘roq: ${H} + ega + V3?`));
  }
  const SA = [
    ["Have you finished? — Yes, I ___ .", "have", [["has", "I bilan have."], ["did", "Have savoliga have bilan."], ["am", "Have savoliga have bilan."]]],
    ["Has Ali eaten? — No, he ___ .", "hasn’t", [["haven’t", "he bilan hasn’t."], ["didn’t", "Has savoliga hasn’t bilan."], ["isn’t", "Has savoliga hasn’t."]]],
    ["Have they arrived? — Yes, they ___ .", "have", [["has", "they bilan have."], ["did", "Have savoliga have bilan."], ["are", "Have savoliga have bilan."]]],
    ["Has your mum cooked dinner? — Yes, she ___ .", "has", [["have", "she bilan has."], ["does", "Has savoliga has bilan."], ["is", "Has savoliga has bilan."]]],
    ["Have you ever been to London? — No, I ___ .", "haven’t", [["hasn’t", "I bilan haven’t."], ["didn’t", "Have savoliga haven’t."], ["don’t", "Have savoliga haven’t."]]],
  ];
  for (const [q, a, ws] of SA) pool.push(mc(3, q, a, ws, `Qisqa javob: ${a}.`));

  // E. for / since
  for (const s of SUBJ) {
    for (const [phrase] of shuffle(LIVE, r).slice(0, 2)) {
      const f = pick(FOR, r);
      pool.push(mc(4, `${s[0]} ${HAVE(s)} ${phrase} ___ ${f}.`, "for", uw("for", [
        ["since", `“${f}” — davomiylik (qancha vaqt) → for.`], ["ago", "ago — Past Simple bilan (two years ago)."], ["from", "Present Perfect’da muddat → for."],
      ]), `for + davomiylik (${f}).`));
      const si = pick(SINCE, r);
      pool.push(mc(4, `${s[0]} ${HAVE(s)} ${phrase} ___ ${si}.`, "since", uw("since", [
        ["for", `“${si}” — boshlanish nuqtasi → since.`], ["ago", "ago — Past Simple bilan."], ["from", "Present Perfect’da boshlanish nuqtasi → since."],
      ]), `since + boshlanish nuqtasi (${si}).`));
    }
  }

  return {
    code: "KG16",
    unit: 16,
    title: "16. Present Perfect Tense",
    title_uz: "Hozirgi tugallangan zamon · 200 ta test",
    seed: 16016,
    parts: PARTS,
    quotas: [[0, 40], [1, 35], [2, 50], [3, 35], [4, 40]],
    pool,
    intro: {
      what: "Present Perfect — o‘tmishda bo‘lgan, lekin natijasi hozir muhim bo‘lgan ish; vaqti aytilmaydi: I have lost my key.",
      when: [], structures: [], rules: [], signal_words: [],
      topics: [
        {
          name: "Present Perfect: form",
          name_uz: "Tuzilishi",
          summary: "have / has + V3 (fe’lning 3-shakli). I / you / we / they → have; he / she / it → has.",
          usage: [
            { text: "Natijasi hozir ko‘rinib turgan ish.", example: { en: "I have broken my pen.", uz: "Ruchkamni sindirib qo‘ydim (hozir sinik)." } },
            { text: "Hayotiy tajriba (qachonligi muhim emas).", example: { en: "She has been to Paris.", uz: "U Parijda bo‘lgan." } },
            { text: "Hozirgacha davom etayotgan holat (for / since).", example: { en: "We have lived here for five years.", uz: "Biz bu yerda besh yildan beri yashaymiz." } },
          ],
          structure: [
            { type: "+", formula: "subject + have / has + V3", example: { en: "He has finished his homework.", uz: "U uy vazifasini tugatdi." } },
            { type: "-", formula: "subject + haven’t / hasn’t + V3", example: { en: "I haven’t seen this film.", uz: "Men bu filmni ko‘rmaganman." } },
            { type: "?", formula: "Have / Has + subject + V3?", example: { en: "Have you done it?", uz: "Qildingmi?" } },
            { type: "short", formula: "Yes, I have. / No, she hasn’t.", example: { en: "Has he called? — No, he hasn’t.", uz: "U qo‘ng‘iroq qildimi? — Yo‘q." } },
          ],
          signals: [],
          tip: "V3 ni yodlang: go – went – gone, see – saw – seen, eat – ate – eaten.",
        },
        {
          name: "already, yet, just, ever, never",
          name_uz: "Signal so‘zlar",
          summary: "already, just, ever, never — have / has va V3 orasida. yet — gap oxirida (inkor va so‘roq).",
          usage: [
            { text: "already — allaqachon.", example: { en: "I have already eaten.", uz: "Men allaqachon ovqatlandim." } },
            { text: "just — hozirgina.", example: { en: "She has just arrived.", uz: "U hozirgina keldi." } },
            { text: "yet — hali (inkor / so‘roq oxirida).", example: { en: "Have you finished yet?", uz: "Tugatdingmi?" } },
            { text: "ever / never — hech / hech qachon.", example: { en: "Have you ever seen a lion? — I have never seen a lion.", uz: "Hech sher ko‘rganmisan? — Hech qachon ko‘rmaganman." } },
          ],
          structure: [],
          signals: [
            { en: "already", uz: "allaqachon" }, { en: "just", uz: "hozirgina" }, { en: "yet", uz: "hali" }, { en: "ever", uz: "hech (so‘roqda)" }, { en: "never", uz: "hech qachon" },
          ],
          tip: "never bilan fe’l inkor bo‘lmaydi: I have never seen (I haven’t never — XATO).",
        },
        {
          name: "for and since",
          name_uz: "for va since",
          summary: "for + davomiylik (for two years); since + boshlanish nuqtasi (since 2020, since Monday).",
          usage: [
            { text: "for — qancha vaqtdan beri.", example: { en: "I have known her for ten years.", uz: "Uni o‘n yildan beri taniyman." } },
            { text: "since — qachondan beri.", example: { en: "I have known her since 2015.", uz: "Uni 2015-yildan beri taniyman." } },
          ],
          structure: [],
          signals: [],
          tip: "Savol: How long have you lived here? — For 3 years. / Since 2022.",
        },
      ],
      mistakes: [
        { wrong: "He have finished.", right: "He has finished.", why: "he → has." },
        { wrong: "I have went there.", right: "I have gone there.", why: "have + V3 (gone)." },
        { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", why: "yesterday → Past Simple." },
        { wrong: "I haven’t finished already.", right: "I haven’t finished yet.", why: "Inkorda yet." },
        { wrong: "I have lived here since five years.", right: "I have lived here for five years.", why: "Davomiylik → for." },
      ],
    },
  };
}
