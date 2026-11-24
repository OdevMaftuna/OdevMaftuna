/**
 * NSP STIKERLARI (Telegramdagi "sayt uchun kerakli narsalar" chatidan).
 * Har biri kayfiyat bo'yicha turkumlangan — natija, eslatma va "jahli chiqqan" xabarlar shu yerdan
 * tasodifiy tanlanadi, shuning uchun har safar boshqa stiker chiqadi.
 * Fayllar: public/stickers/<id>.(webm | json (Lottie) | webp)
 */

export type Mood = "great" | "good" | "meh" | "low" | "angry" | "nudge";
export type StickerKind = "video" | "lottie" | "image";
export type StickerDef = { id: string; kind: StickerKind; emoji: string; moods: Mood[] };

const V = (id: string, emoji: string, ...moods: Mood[]): StickerDef => ({ id, kind: "video", emoji, moods });
const L = (id: string, emoji: string, ...moods: Mood[]): StickerDef => ({ id, kind: "lottie", emoji, moods });
const I = (id: string, emoji: string, ...moods: Mood[]): StickerDef => ({ id, kind: "image", emoji, moods });

export const STICKERS: StickerDef[] = [
  // Jahli chiqqan — vazifa bajarilmaganda
  L("1896515373021265924", "😡", "angry"),
  V("5235748112315743085", "👿", "angry"),
  L("5861598377183021684", "👊", "angry"),
  L("5902109303287843975", "👊", "angry"),
  L("5837190885493710941", "👊", "angry"),
  I("5472031387303304124", "🤬", "angry"),
  V("5850297214420655819", "😾", "angry", "nudge"),
  V("5771582751786407777", "😾", "angry"),
  L("1896515373021265921", "🙅‍♂️", "angry"),
  V("5343650996599939301", "🦶", "angry"),
  // Eslatma — "hali qilmadingmi?"
  V("5881708333185897309", "🤨", "nudge", "meh"),
  I("6174687916669797992", "🤨", "nudge"),
  I("6249157152024298675", "👀", "nudge"),
  V("5767361254200971290", "🥸", "nudge"),
  V("5458411191309190894", "🖐", "nudge"),
  V("5897999002405704030", "👻", "nudge"),
  V("5978703606856029624", "🫢", "nudge", "low"),
  V("5280616995706929574", "🙄", "nudge", "meh"),
  V("5273978788743513358", "🙄", "meh"),
  L("6001425749083428679", "🫤", "meh"),
  L("2193800188773011597", "😐", "meh", "nudge"),
  V("5345992299237117493", "😐", "meh"),
  V("6208766725521936775", "😐", "meh", "nudge"),
  V("5861909916930806716", "😐", "meh"),
  V("5859571028065258891", "😐", "meh", "nudge"),
  V("5445080317197044968", "😏", "nudge", "good"),
  // Past natija — xafa, dalda
  V("5364329803841313977", "😭", "low"),
  V("5447227465837593489", "🥺", "low"),
  I("5253673755326052457", "🤲", "low"),
  L("1896515373021265935", "😱", "low"),
  // Yaxshi natija
  V("5381964879429128784", "❤", "good", "great"),
  I("6251439841242780570", "💫", "good"),
  V("5445097535720935873", "🤪", "good"),
  V("5357115933821275153", "😌", "good"),
  // A'lo natija
  L("1896515373021265922", "👏", "great"),
  V("5399932518629675736", "👏", "great"),
  V("5398043407329302126", "💃", "great"),
  V("5201861352926245840", "🥳", "great"),
  V("5461177313456575418", "🪩", "great"),
];

export const stickerSrc = (s: StickerDef) => `/stickers/${s.id}.${s.kind === "video" ? "webm" : s.kind === "lottie" ? "json" : "webp"}`;
export const stickerById = (id: string | null | undefined) => STICKERS.find((s) => s.id === id) ?? null;

/** Kayfiyatga mos stiker. seed (0..1) — har safar boshqasi chiqishi uchun. */
export function pickSticker(mood: Mood, seed: number, opts?: { soft?: boolean }): StickerDef {
  // Yumshoq rejim: "jahli chiqqan" turkumidagi stikerlar chiqmaydi.
  const all = STICKERS.filter((s) => s.moods.includes(mood) && !(opts?.soft && s.moods.includes("angry")));
  const list = all.length ? all : STICKERS.filter((s) => s.moods.includes("meh"));
  return list[Math.floor(Math.abs(seed) * list.length) % list.length];
}

/** Ball (foiz) → kayfiyat. */
export function moodForPercent(p: number): Mood {
  if (p >= 85) return "great";
  if (p >= 65) return "good";
  if (p >= 45) return "meh";
  return "low";
}

/** Har kayfiyat uchun bir nechta matn — ular ham almashib turadi. */
export const MOOD_TEXT: Record<Mood, { title: string; text: string }[]> = {
  great: [
    { title: "Zo‘r! 🔥", text: "Deyarli mukammal — siz haqiqiy yulduzsiz!" },
    { title: "Perfect!", text: "Bunday natija bilan imtihon ham qo‘rqinchli emas." },
    { title: "Barakalla!", text: "Mehnatingiz ko‘rinib turibdi — shu ruhda davom eting!" },
  ],
  good: [
    { title: "Yaxshi!", text: "Bir oz ko‘proq e’tibor — va 100 sizniki." },
    { title: "Ajoyib harakat!", text: "Xatolaringizni ko‘rib chiqing — keyingisi yanada zo‘r bo‘ladi." },
    { title: "Yomon emas!", text: "Siz to‘g‘ri yo‘ldasiz. To‘xtamang!" },
  ],
  meh: [
    { title: "Hmm… o‘rtacha 😐", text: "Qoidani yana bir bor o‘qing va qayta urinib ko‘ring." },
    { title: "Bundan yaxshiroq qila olasiz", text: "Xatolar ustida ishlang — natija tez o‘sadi." },
    { title: "Yarim yo‘ldasiz", text: "Biroz diqqat — va natija keskin ko‘tariladi." },
  ],
  low: [
    { title: "Taslim bo‘lmang!", text: "Har bir xato — o‘rganish imkoniyati. Qayta urinib ko‘ring." },
    { title: "Bugun og‘ir bo‘ldi 🥺", text: "Mavzuni qayta ko‘rib chiqing — ertaga yaxshiroq bo‘ladi." },
    { title: "Hali hammasi oldinda", text: "Izohlarni o‘qing va yana bir marta ishlang." },
  ],
  angry: [
    { title: "Nima qilib o‘tiribsan?! 😡", text: "Tur, dars qil!" },
    { title: "Vazifa qani?!", text: "Hamma ishlayapti — sen-chi?" },
    { title: "Bu nima bo‘ldi?!", text: "Vazifa bajarilmay qoldi. Sababini yoz!" },
  ],
  nudge: [
    { title: "Hali qilmadingmi? 🤨", text: "Vazifa seni kutyapti." },
    { title: "Eslatma ⏰", text: "Vaqt ketyapti — bugungi vazifani bajaring." },
    { title: "Hoy! 👀", text: "Bir 20 daqiqa ajrat — va bugun tayyor." },
    { title: "Unutmadingmi?", text: "Muddat tugashidan oldin topshir." },
  ],
};

/** Yumshoq (kattalar uchun) matnlar: "jahli chiqqan" va "nudge" o'rniga. */
export const SOFT_TEXT: Partial<Record<Mood, { title: string; text: string }[]>> = {
  angry: [
    { title: "Vazifa bajarilmay qoldi", text: "Hech gap yo‘q — sababini qisqacha yozib qoldiring." },
    { title: "Bu safar ulgurmadingiz", text: "Ustozga sababini yozing, keyingisini birga uddalaymiz." },
  ],
  nudge: [
    { title: "Eslatma ⏰", text: "Bugungi vazifa sizni kutyapti." },
    { title: "Vazifa bor", text: "Muddat tugashidan oldin topshirib qo‘ying." },
    { title: "Bir oz vaqt topilsa", text: "20 daqiqa — va bugungi vazifa tayyor." },
  ],
};

export const pickText = (mood: Mood, seed: number, opts?: { soft?: boolean }) => {
  const list = (opts?.soft && SOFT_TEXT[mood]) || MOOD_TEXT[mood];
  return list[Math.floor(Math.abs(seed * 7.13) * list.length) % list.length];
};

/** Har so'rovda yangi tasodifiy son (stiker va matn almashib turishi uchun). */
export function freshSeed() {
  return Math.random();
}
