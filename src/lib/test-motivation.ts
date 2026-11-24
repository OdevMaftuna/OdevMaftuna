/** Pre-Intermediate unit testlari uchun motivatsion gaplar (har bir unitga alohida, narx qiyosi bilan). */
const PREINT: Record<number, { short: string; long: string }> = {
  1: { short: "Bitta tushlik narxida — bitta unit 🍽️", long: "Bir marta tushlik qilish puliga butun unitdagi xatolaringizni topasiz. Tushlik 2 soatda unutiladi, bilim esa umrbod qoladi." },
  2: { short: "Bir taksi yo‘li narxida 🚕", long: "Taksi sizni manzilga 15 daqiqada olib boradi — bu test esa maqsadingizga bir qadam yaqinlashtiradi. Qaysi biri muhimroq?" },
  3: { short: "Bir pitsa narxida — butun unit 🍕", long: "Pitsa 10 daqiqada tugaydi, bu testdan olgan saboqlaringiz esa imtihonda, ishda, sayohatda asqatadi." },
  4: { short: "Bir kino chiptasi narxida 🎬", long: "Kino 2 soat zavq beradi. Bu test esa ingliz tilidagi kinolarni tarjimasiz tushunishga bir qadam yaqinlashtiradi." },
  5: { short: "Ikki chashka qahva narxida ☕☕", long: "Ikki chashka qahva — bir necha soat tetiklik. Bitta unit testi — imtihonda ishonch va yuqori ball." },
  6: { short: "Bir burger-kombo narxida 🍔", long: "Fast-food tez tugaydi, bilim esa sekin, lekin abadiy yig‘iladi. Ikkinchi yarmini kuchli boshlang!" },
  7: { short: "Bir haftalik mobil internet narxida 📱", long: "Bir hafta internetga sarflagan pulingizga butun unit bilimini mustahkamlaysiz. Telefonda emas — o‘zingizga sarmoya qiling." },
  8: { short: "Bir do‘st bilan choyxona narxida 🫖", long: "Choyxonadagi suhbat bir kechada tugaydi. Bu test esa sizni ingliz tilida bemalol suhbatlashadigan qiladi." },
  9: { short: "Bitta kitob narxida — final unit 📕", long: "Bitta kitob puliga butun kursning oxirgi unitini isbotlaysiz. Marraga yetdingiz — o‘zingizga isbotlang!" },
};

export function testMotivation(course: string, unit: number | null) {
  if (course !== "Pre-Intermediate" || !unit) return null;
  return PREINT[unit] ?? null;
}
