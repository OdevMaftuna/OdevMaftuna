// Kids grammatika (11–25) uchun umumiy fe'llar va egalar.
// [asos, 3-shaxs, -ing, V2 (past), V3 (participle), o'zbekcha, davomi (har qanday zamonga mos)]
const R = (b, s, ing, p, pp, uz, o) => ({ b, s, ing, p, pp, uz, o, irr: p !== `${b}ed` && p !== `${b}d` && !/ied$|pped$|lled$|tted$/.test(p) });

export const VERBS = [
  R("play", "plays", "playing", "played", "played", "o‘ynamoq", "football"),
  R("watch", "watches", "watching", "watched", "watched", "tomosha qilmoq", "a cartoon"),
  R("cook", "cooks", "cooking", "cooked", "cooked", "pishirmoq", "dinner"),
  R("clean", "cleans", "cleaning", "cleaned", "cleaned", "tozalamoq", "the room"),
  R("help", "helps", "helping", "helped", "helped", "yordam bermoq", "the teacher"),
  R("visit", "visits", "visiting", "visited", "visited", "ziyorat qilmoq", "the museum"),
  R("study", "studies", "studying", "studied", "studied", "o‘qimoq", "English"),
  R("carry", "carries", "carrying", "carried", "carried", "ko‘tarmoq", "a heavy bag"),
  R("wash", "washes", "washing", "washed", "washed", "yuvmoq", "the dishes"),
  R("listen", "listens", "listening", "listened", "listened", "tinglamoq", "to music"),
  R("paint", "paints", "painting", "painted", "painted", "bo‘yamoq", "a picture"),
  R("climb", "climbs", "climbing", "climbed", "climbed", "chiqmoq", "a tree"),
  R("open", "opens", "opening", "opened", "opened", "ochmoq", "the window"),
  R("finish", "finishes", "finishing", "finished", "finished", "tugatmoq", "the homework"),
  R("stop", "stops", "stopping", "stopped", "stopped", "to‘xtatmoq", "the car"),
  R("dance", "dances", "dancing", "danced", "danced", "raqsga tushmoq", "at the party"),
  R("go", "goes", "going", "went", "gone", "bormoq", "to the park"),
  R("eat", "eats", "eating", "ate", "eaten", "yemoq", "an apple"),
  R("drink", "drinks", "drinking", "drank", "drunk", "ichmoq", "coconut milk"),
  R("write", "writes", "writing", "wrote", "written", "yozmoq", "a letter"),
  R("read", "reads", "reading", "read", "read", "o‘qimoq", "a book"),
  R("swim", "swims", "swimming", "swam", "swum", "suzmoq", "in the river"),
  R("see", "sees", "seeing", "saw", "seen", "ko‘rmoq", "a big lion"),
  R("buy", "buys", "buying", "bought", "bought", "sotib olmoq", "some bread"),
  R("make", "makes", "making", "made", "made", "yasamoq", "a cake"),
  R("take", "takes", "taking", "took", "taken", "olmoq", "a photo"),
  R("sing", "sings", "singing", "sang", "sung", "kuylamoq", "a song"),
  R("ride", "rides", "riding", "rode", "ridden", "minmoq", "a bike"),
  R("run", "runs", "running", "ran", "run", "yugurmoq", "in the park"),
  R("do", "does", "doing", "did", "done", "qilmoq", "the homework"),
  R("speak", "speaks", "speaking", "spoke", "spoken", "gapirmoq", "English"),
  R("break", "breaks", "breaking", "broke", "broken", "sindirmoq", "a glass"),
  R("fly", "flies", "flying", "flew", "flown", "uchirmoq", "a kite"),
  R("drive", "drives", "driving", "drove", "driven", "haydamoq", "a car"),
  R("sleep", "sleeps", "sleeping", "slept", "slept", "uxlamoq", "in the garden"),
  R("find", "finds", "finding", "found", "found", "topmoq", "a coin"),
  R("lose", "loses", "losing", "lost", "lost", "yo‘qotmoq", "the key"),
  R("win", "wins", "winning", "won", "won", "yutmoq", "the game"),
  R("catch", "catches", "catching", "caught", "caught", "ushlamoq", "a fish"),
  R("meet", "meets", "meeting", "met", "met", "uchratmoq", "an old friend"),
  R("forget", "forgets", "forgetting", "forgot", "forgotten", "unutmoq", "her name"),
  R("teach", "teaches", "teaching", "taught", "taught", "o‘rgatmoq", "maths"),
  R("draw", "draws", "drawing", "drew", "drawn", "chizmoq", "a cat"),
  R("give", "gives", "giving", "gave", "given", "bermoq", "a present"),
  R("send", "sends", "sending", "sent", "sent", "yubormoq", "a message"),
  R("build", "builds", "building", "built", "built", "qurmoq", "a sandcastle"),
];

// [ega, 3-shaxs birlikmi, ko'plikmi (was/were uchun: 0 — I, 1 — he/she/it, 2 — you/we/they)]
export const SUBJ = [
  ["I", 0, 0], ["You", 0, 2], ["We", 0, 2], ["They", 0, 2], ["He", 1, 1], ["She", 1, 1],
  ["My brother", 1, 1], ["Ali", 1, 1], ["My mother", 1, 1], ["Malika", 1, 1], ["Mr Brown", 1, 1], ["Grandpa", 1, 1],
  ["My parents", 0, 2], ["The children", 0, 2], ["My friends", 0, 2], ["My sister and I", 0, 2], ["Ali and Vali", 0, 2],
];
export const lower = (s) => (["You", "We", "They", "He", "She"].includes(s) ? s.toLowerCase() : s.replace(/^(My|The) /, (m) => m.toLowerCase()));
export const BE = (k) => (k === 0 ? "am" : k === 1 ? "is" : "are");
export const WAS = (k) => (k === 2 ? "were" : "was");

/** Variantlarni tozalaydi: javobga teng yoki takrorlanganlarini olib tashlaydi. */
export function uw(answer, wrongs, max = 3) {
  const out = [];
  for (const w of wrongs) if (w && w[0] !== answer && !out.some((x) => x[0].toLowerCase() === w[0].toLowerCase())) out.push(w);
  return out.slice(0, max);
}

/** Davomli zamonlarga tabiiy mos keladigan fe'llar (qisqa, bir lahzalik fe'llarsiz). */
const SHORT = ["break", "lose", "find", "forget", "win", "stop", "open", "catch", "see", "meet", "finish", "send", "give", "take", "buy"];
export const CONT = VERBS.filter((v) => !SHORT.includes(v.b));

/** Ega o'rnidagi olmosh: I / you / he / she / we / they. */
export function pron(s) {
  const n = s[0];
  if (n === "I") return "I";
  if (n === "You") return "you";
  if (n === "He" || n === "She") return n.toLowerCase();
  if (s[1]) return /(mother|Malika|sister|aunt|Mrs|girl)/.test(n) ? "she" : "he";
  return /(and I|^We)$|^We/.test(n) || n === "My sister and I" ? "we" : "they";
}
