/**
 * SAYTDAGI YANGILIKLAR (changelog).
 * Har safar yangi funksiya qo'shilganda yoki o'zgarganda — shu ro'yxatning BOSHIGA yozuv qo'shing.
 * Ular avtomatik chiqadi:
 *  - o'qituvchining "Yangiliklar" sahifasida (/oqituvchi/yangiliklar) va bosh sahifasida;
 *  - storylardagi "Yangi" story'sida (o'qituvchi va o'quvchi uchun — `audience` ga qarab).
 * Yangi yozuv qo'shilsa, "Yangi" story halqasi yana rangli bo'lib yonadi.
 */

export type UpdateArea = "wanderland" | "homework" | "tests" | "chat" | "stories" | "teacher" | "profile" | "practice";
export type Update = {
  /** YYYY-MM-DD (Toshkent vaqti). */
  date: string;
  icon: string;
  area: UpdateArea;
  title: string;
  text: string;
  /** "all" — o'quvchilar ham ko'radi; "teacher" — faqat o'qituvchilar. */
  audience: "all" | "teacher";
  /** Qayerda ko'rish mumkin (ixtiyoriy). */
  href?: { teacher?: string; student?: string };
  /** Story'dagi jonli sahna (berilmasa — katta belgi). */
  scene?: UpdateScene;
};

/** "Yangi" story'dagi maxsus jonli sahnalar (src/components/stories.tsx → MockView). */
export type UpdateScene = "stats" | "wander" | "route" | "weather" | "crew" | "crash" | "nudge" | "chat" | "reason" | "zumi";

export const AREA_LABEL: Record<UpdateArea, string> = {
  wanderland: "Wanderland",
  homework: "Uy vazifa",
  tests: "Pullik testlar",
  chat: "Chat",
  stories: "Story",
  teacher: "O‘qituvchi",
  profile: "Kabinet",
  practice: "Mashqlar",
};

export const UPDATES: Update[] = [
  {
    date: "2026-11-20",
    icon: "📋",
    area: "teacher",
    title: "Kunlik nazorat, guruhlar va past natija ogohlantirishi",
    text: "Bosh sahifada har bir guruh bo‘yicha bugungi vazifani kim bajardi / bajarmadi va qancha vaqt qoldi; bir tugma bilan bajarmaganlarga eslatma. Past natija (60% dan kam) olganlar haqida darhol ogohlantirish. Support o‘qituvchi o‘quvchini guruhga qo‘shadi/chiqaradi, ketganlar tarixda qoladi.",
    audience: "teacher",
    href: { teacher: "/oqituvchi" },
  },
  {
    date: "2026-11-20",
    icon: "🎓",
    area: "practice",
    title: "SEFR Multilevel Writing — Task 1.1 va 1.2",
    text: "Writing bo‘limida imtihon formatidagi 3 ta mock: vaziyat va kelgan xat, Task 1.1 (do‘stga) va Task 1.2 (rasmiy). Reja, rangli model javob, collocations, iboralar, B1→B2 va tipik xatolar. Har bir mockda 20 savollik iboralar mashqi; AI 20 ballik Multilevel mezonlari bilan tekshiradi.",
    audience: "all",
    href: { teacher: "/oqituvchi/writing", student: "/oquvchi/writing/multilevel" },
  },
  {
    date: "2026-11-20",
    icon: "✍️",
    area: "practice",
    title: "Writing — Letter & Email (Pre-Intermediate)",
    text: "Yangi bo‘lim: 12 ta xat turi (formal, complaint, invitation, advice…) — tuzilma, kalit iboralar va namuna. 36 ta cue card'ga xat yozasiz, AI 10 ballik baho va xatolar izohini beradi. Muddat yo‘q, istalgancha qayta yozish mumkin.",
    audience: "all",
    href: { teacher: "/oqituvchi/writing", student: "/oquvchi/writing" },
  },
  {
    date: "2026-11-20",
    icon: "🛟",
    area: "teacher",
    title: "Support markazi — butun guruh natijalari",
    text: "Barcha guruhlar bir sahifada: kim bajarmagan, kim bilan shug‘ullanish kerak (sabablari bilan), bugungi vazifani topshirmaganlar, guruh va kurslar solishtiruvi, davomat xaritasi va yulduzlar. Asosiy o‘qituvchi Sozlamalar’da istalgan o‘qituvchiga “Support” huquqini beradi; o‘ziga esa qo‘shimcha Direktor paneli (tushum, yangi o‘quvchilar, o‘qituvchilar reytingi).",
    audience: "teacher",
    href: { teacher: "/oqituvchi/support" },
  },
  {
    date: "2026-11-20",
    icon: "📊",
    area: "profile",
    title: "Natijalarim — haftalik va oylik statistika",
    scene: "stats",
    text: "Kabinetda yangi “Natijalarim” kartasi: hafta, oy va umumiy natijangiz grafikda, uy vazifa, grammatika, lug‘at, iboralar va imtihonlar bo‘yicha foizlar, eng yaxshi natija va faol kunlar.",
    audience: "all",
    href: { student: "/oquvchi/kabinet" },
  },
  {
    date: "2026-11-20",
    icon: "⏰",
    area: "homework",
    title: "Vazifa eslatmasi — har 30 daqiqada",
    scene: "nudge",
    text: "Bajarilmagan vazifa bo‘lsa, “Vazifani qildingmi?” eslatmasi saytga har kirganda, kurslarni ko‘rayotganda va sayt ochiq turganda har 30 daqiqada chiqadi.",
    audience: "all",
    href: { student: "/oquvchi/vazifalar" },
  },
  {
    date: "2026-11-20",
    icon: "🛣",
    area: "wanderland",
    title: "Sizning yo‘lingiz: 3 ta mashhur yo‘l",
    scene: "route",
    text: "Route 66 → Pacific Coast → Lincoln Highway. Har kuni ishlasangiz — mashina bir kun oldinga, har 5 kunda yangi shahar ochiladi.",
    audience: "all",
    href: { teacher: "/oqituvchi/namuna", student: "/oquvchi" },
  },
  {
    date: "2026-11-20",
    icon: "👾",
    area: "stories",
    title: "Yangi yo‘lboshchi — Zumi",
    scene: "zumi",
    text: "Sova o‘rniga endi kosmik do‘stimiz Zumi: bir ko‘zli, nurli antennali, reaktiv ryukzakli. Yangiliklar ham endi alohida “Yangiliklar” story’sida — xohlagan payt qayta ko‘ring.",
    audience: "all",
  },
  {
    date: "2026-11-20",
    icon: "🗺",
    area: "teacher",
    title: "O‘quvchilar seriyasi — kim qayerda",
    text: "Yangi “Seriyalar” sahifasi: har bir o‘quvchining kunlik seriyasi, Wanderland’dagi yo‘li va hozir turgan shahri, bugun ishlaganmi — hammasi bitta ro‘yxatda.",
    audience: "teacher",
    href: { teacher: "/oqituvchi/seriyalar" },
  },
  {
    date: "2026-11-20",
    icon: "📰",
    area: "stories",
    title: "“Yangi” story va Yangiliklar sahifasi",
    text: "Saytga nima qo‘shilsa, endi “Yangi” story’sida chiqadi. O‘qituvchilar uchun barcha yangiliklar bitta sahifada.",
    audience: "all",
    href: { teacher: "/oqituvchi/yangiliklar" },
  },
  {
    date: "2026-11-20",
    icon: "🎧",
    area: "tests",
    title: "Pre-Intermediate testlarida Listening",
    text: "P1–P8 imtihon testlariga AI ovozli Listening bo‘limi qo‘shildi (har birida 5 ta savol). Qolganlari tez orada.",
    audience: "all",
    href: { teacher: "/oqituvchi/testlar", student: "/oquvchi/testlar" },
  },
  {
    date: "2026-11-20",
    icon: "🚗",
    area: "wanderland",
    title: "Your Wanderland — Amerika bo‘ylab sayohat",
    scene: "wander",
    text: "Har kuni ishlagan o‘quvchining mashinasi bir kun oldinga yuradi: Route 66, Pacific Coast va Lincoln Highway. Har 5 kunda yangi shahar.",
    audience: "all",
    href: { teacher: "/oqituvchi/namuna", student: "/oquvchi" },
  },
  {
    date: "2026-11-20",
    icon: "⛅",
    area: "wanderland",
    title: "Haqiqiy ob-havo va kun/tun",
    scene: "weather",
    text: "Osmon Toshkent vaqtiga mos: quyosh chiqadi-botadi, tunda yulduzlar. Ob-havo — mashina turgan shaharning haqiqiy ob-havosi (yomg‘ir, qor, tuman…).",
    audience: "all",
  },
  {
    date: "2026-11-20",
    icon: "👫",
    area: "wanderland",
    title: "Sayohat do‘stlari",
    scene: "crew",
    text: "O‘quvchilar ID orqali do‘st qo‘shadi (10 tagacha) va kim oldinda ketayotganini reytingda ko‘radi.",
    audience: "all",
  },
  {
    date: "2026-11-20",
    icon: "💥",
    area: "wanderland",
    title: "Seriya uzilsa — halokat sahnasi",
    scene: "crash",
    text: "Kun o‘tkazib yuborilsa, ertasi kuni mashina halokatga uchraydi va sayohat boshidan boshlanadi. Zanjirni uzmaslikka undaydi.",
    audience: "all",
  },
  {
    date: "2026-11-20",
    icon: "😡",
    area: "homework",
    title: "Bajarilmagan vazifa — sabab so‘raladi",
    scene: "reason",
    text: "Muddati o‘tgan vazifa uchun o‘quvchiga “jahli chiqqan” stiker chiqadi, u sababini yozadi va bu ustozlar chatiga boradi.",
    audience: "all",
    href: { teacher: "/oqituvchi/chat" },
  },
  {
    date: "2026-11-20",
    icon: "💬",
    area: "chat",
    title: "O‘quvchi ↔ ustoz chati",
    scene: "chat",
    text: "Har o‘quvchining bitta chati bor — barcha o‘qituvchilar ko‘radi va javob yozadi. Stikerlar ham yuborsa bo‘ladi.",
    audience: "all",
    href: { teacher: "/oqituvchi/chat", student: "/oquvchi/chat" },
  },
  {
    date: "2026-11-20",
    icon: "🎉",
    area: "homework",
    title: "Natija stikerlari",
    text: "Vazifa va test natijasida ballga qarab jonli stiker chiqadi: a’lo natijaga — bayram, pastiga — dalda.",
    audience: "all",
  },
];

/** Eng yangi sana — "Yangi" story ko'rilgan-ko'rilmaganini aniqlash uchun. */
export const updatesVersion = (list: Update[]) => `${list[0]?.date ?? "0"}-${list.length}`;

export const updatesFor = (who: "teacher" | "student") => (who === "teacher" ? UPDATES : UPDATES.filter((u) => u.audience === "all"));

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** "2026-11-20" → "20-noyabr, 2026" (brauzerlar uz lokalini to'liq bilmaydi — "M11" chiqib qolardi). */
export function formatUpdateDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d}-${MONTHS[(m || 1) - 1]}, ${y}`;
}
