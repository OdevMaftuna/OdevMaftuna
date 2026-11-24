// Export the Beginner plan to an Excel file the teacher can review.
const path = require("path");
const fs = require("fs");
const XLSX = require(path.join("C:/Users/user/OneDrive/Desktop/Odev/node_modules/xlsx"));
const { days } = JSON.parse(fs.readFileSync(path.join(__dirname, "lessons.json"), "utf8"));
const keys = JSON.parse(fs.readFileSync(path.join(__dirname, "keys.json"), "utf8"));

const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const uzDate = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return `${d}-${UZ_MONTHS[m - 1]} ${y}`; };
const nextDay = (ymd) => { const t = new Date(ymd + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };

// 1) Jadval
const plan = [["Kun", "Sana", "Hafta kuni", "Ochiladi", "Yopiladi", "Turi", "Unit", "1-matn", "2-matn"]];
for (const d of days) {
  plan.push([
    d.day,
    uzDate(d.date),
    d.weekday,
    "07:00",
    `${uzDate(nextDay(d.date))}, 03:00`,
    d.kind === "reading" ? "Reading" : d.kind === "final" ? "Yakuniy test" : "Takrorlash",
    d.readings ? [...new Set(d.readings.map((r) => r.unit))].join("–") : d.review.units.length > 4 ? "1–14" : `${d.review.units[0]}–${d.review.units.at(-1)}`,
    d.readings ? `${d.readings[0].id.replace("U", "Unit ").replace("R", ", Reading ")}: ${d.readings[0].title}` : `${d.review.vocabQuiz.length} ta lug'at testi`,
    d.readings ? `${d.readings[1].id.replace("U", "Unit ").replace("R", ", Reading ")}: ${d.readings[1].title}` : `${d.review.wordTr.length} ta so'z tarjimasi, ${d.review.sentences.length} ta gap${d.review.writing ? ", insho" : ""}`,
  ]);
}

// 2) Namuna dars (1-kun)
const d1 = days[0];
const k1 = keys[0];
const ex = [["1-KUN NAMUNASI", d1.title], ["Ochiladi", `${uzDate(d1.date)}, 07:00`], ["Yopiladi", `${uzDate(nextDay(d1.date))}, 03:00 (keyin ham topshirsa bo'ladi, −20%)`], [], ["Har bir matn uchun o'quvchi quyidagilarni bajaradi:"]];
d1.readings.forEach((r, ri) => {
  const k = k1.readings[ri];
  ex.push([], [`MATN ${ri + 1}`, `${r.title} (Unit ${r.unit})`], ["Matn", r.text.join("\n\n")], [], ["LUG'AT", `${r.vocab.length} ta so'z (tinglash va fleshkarta bilan)`]);
  r.vocab.forEach((v) => ex.push(["", `${v.en} — ${v.uz}`]));
  ex.push([], ["A. True / False", "avtomatik tekshiriladi"]);
  r.tf.forEach((q, i) => ex.push([`${i + 1}.`, q.q, k.tf[i] ? "True" : "False"]));
  ex.push([], ["B. To'g'ri javob", "avtomatik tekshiriladi"]);
  r.mc.forEach((q, i) => ex.push([`${i + 1}.`, `${q.q}  (A ${q.options[0]} / B ${q.options[1]} / C ${q.options[2]})`, "ABC"[k.mc[i]]]));
  ex.push([], ["C. Bo'sh joy", `So'zlar: ${r.fill.box.join(", ")}`]);
  r.fill.items.forEach((q, i) => ex.push([`${i + 1}.`, q.q, k.fill[i]]));
  if (r.wordTr.length) {
    ex.push([], ["D. Inglizchaga tarjima", "avtomatik tekshiriladi"]);
    r.wordTr.forEach((q, i) => ex.push([`${i + 1}.`, q.uz, k.wordTr[i]]));
  }
  ex.push([], ["Lug'at testi", "inglizcha so'z → 4 variant (avtomatik)"]);
  r.vocabQuiz.forEach((q, i) => ex.push([`${i + 1}.`, `${q.q}:  ${q.options.join(" / ")}`, q.options[k.vocabQuiz[i]]]));
  ex.push([], ["Tarjima", "o'zbekchaga tarjima qiling (AI tekshiradi)"]);
  r.translate.forEach((q, i) => ex.push([`${i + 1}.`, q.en]));
  ex.push([], ["Gap tuzish", "shu so'zlar bilan o'z gapingizni yozing (AI tekshiradi)"]);
  r.sentences.forEach((q, i) => ex.push([`${i + 1}.`, `${q.en} — ${q.uz}`]));
});
ex.push([], ["BALL", "Avtomatik qismlar 60 ball + tarjima va gap tuzish (AI) 40 ball = 100"]);

// 3) Takrorlash namunasi
const rv = days[50];
const rk = keys[50].review;
const rev = [["TAKRORLASH NAMUNASI", rv.title], [], ["Lug'at testi", `${rv.review.vocabQuiz.length} ta savol`]];
rv.review.vocabQuiz.forEach((q, i) => rev.push([`${i + 1}.`, `${q.q}:  ${q.options.join(" / ")}`, q.options[rk.vocabQuiz[i]]]));
rev.push([], ["So'z tarjimasi", "o'zbekchadan inglizchaga yozing"]);
rv.review.wordTr.forEach((q, i) => rev.push([`${i + 1}.`, q.uz, rk.wordTr[i]]));
rev.push([], ["Gap tuzish", "AI tekshiradi"]);
rv.review.sentences.forEach((q, i) => rev.push([`${i + 1}.`, `${q.en} — ${q.uz}`]));

const wb = XLSX.utils.book_new();
const s1 = XLSX.utils.aoa_to_sheet(plan);
s1["!cols"] = [6, 18, 12, 9, 22, 13, 7, 52, 52].map((wch) => ({ wch }));
const s2 = XLSX.utils.aoa_to_sheet(ex);
s2["!cols"] = [{ wch: 22 }, { wch: 100 }, { wch: 26 }];
const s3 = XLSX.utils.aoa_to_sheet(rev);
s3["!cols"] = [{ wch: 22 }, { wch: 90 }, { wch: 26 }];
XLSX.utils.book_append_sheet(wb, s1, "62 kunlik jadval");
XLSX.utils.book_append_sheet(wb, s2, "Namuna - 1-kun");
XLSX.utils.book_append_sheet(wb, s3, "Namuna - takrorlash");
const out = "C:/Users/user/OneDrive/Desktop/Odev/materiallar/Beginner-jadval.xlsx";
fs.mkdirSync(path.dirname(out), { recursive: true });
XLSX.writeFile(wb, out);
console.log("saved", out);
