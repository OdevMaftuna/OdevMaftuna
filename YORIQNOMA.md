# NSP — Uyga vazifa tizimi: yo'riqnoma

**Sayt:** https://nsp-language-center.vercel.app
(O'quvchilar ham, o'qituvchi ham shu manzildan kiradi.)

## Sayt Claude'siz ishlaydimi?
**Ha.** Sayt uchta bepul xizmatda ishlaydi. Ularning hech biri Claude'ga bog'liq emas:

| Xizmat | Vazifasi | Narxi |
|---|---|---|
| **Vercel** (akkaunt: goodgamesggg-3867) | Saytning o'zi | Bepul (Hobby) |
| **Supabase** (loyiha "Homework") | O'quvchilar, darslar, ballar, audiolar | Bepul |
| **Google Gemini** (sizning API kalitingiz) | AI tekshiruvi (yozma ish, speaking) | Bepul tarif |

Claude obunasi tugasa ham darslar har kuni 07:00 da o'zi ochiladi. O'quvchilar topshiradi, AI tekshiradi, siz ballarni ko'rasiz.

## Har kuni nima bo'ladi (avtomatik)
- **07:00** — o'sha kunning darsi ochiladi (Reading 2 matn + Listening + Speaking).
- **Ertasi kuni 03:00** — muddat tugaydi. Kechikib topshirish mumkin, lekin balldan **20%** ayiriladi.
- Testlar darhol tekshiriladi. Yozma ish va speaking'ni AI bir necha daqiqada baholaydi.
- O'quvchi 20 ta ovoz yozadi (har biri ≥ 1 daqiqa). AI tasodifiy 2 tasini tinglaydi, keyin barcha ovozlar o'chiriladi. Ovoz tekshirilmay qolsa ham 3 kundan keyin o'chadi. Ball va izohlar saqlanib qoladi.

## O'qituvchi sifatida
- **Vazifalar** — hamma darslar sanasi bilan. Har bir darsdagi **"Ko'rish"** tugmasi darsni oldindan to'liq ko'rsatadi: matnlar, audio va **javoblar kaliti**.
- **Kuzatuv** — kim topshirdi, kim topshirmadi.
- **O'quvchilar** — yangi o'quvchi qo'shish, kursini (Beginner / Elementary / Pre-Intermediate) belgilash, parolni yangilash.
- **Baholash** — AI bergan ballni o'zgartirish va izoh yozish.
- **Sozlamalar** — AI izohlarining tili, AI balini o'quvchiga darhol ko'rsatish. Shu yerda **yangi o'qituvchi qo'shiladi** (ism va e-pochta, vaqtinchalik parol beriladi). Har bir o'qituvchi hamma kurs va o'quvchilarni ko'radi.

O'quvchilar ham, o'qituvchilar ham **saytning o'zidan** qo'shiladi. Supabase'ga kirish shart emas.
- O'quvchi qo'shish: https://nsp-language-center.vercel.app/oqituvchi/oquvchilar
- O'qituvchi qo'shish: https://nsp-language-center.vercel.app/oqituvchi/sozlamalar

## Bosh sahifa va muddatsiz mashqlar
O'quvchi kirganda **bosh sahifa** ochiladi. Unda bugungi uy vazifasi va 5 ta bo'lim bor: Beginner, Elementary, Pre-Intermediate, CEFR, IELTS. Har bir bo'lim ichida 3 qism:
- **Uy vazifalari** — har kungi dars, muddati bor. Faqat o'z kursidagilarga ochiq.
- **Lug'at mashqlari** — har bir unit so'zlari (fleshkarta, tinglash) va 100 ta mashq. Muddat yo'q.
- **Mavzu bo'yicha** — grammatika: qoida (kitobchangiz uslubida), 100 ta tarjima, 30 ta test. Tekshirilgach har bir xato qoida bo'yicha tushuntiriladi. Muddat yo'q.

Javoblar o'z-o'zidan saqlanadi. O'quvchi istagancha qayta ishlay oladi, eng yaxshi natija saqlanib qoladi. Tarjimalar avval avtomatik tekshiriladi, mos kelmaganlarini AI ko'rib chiqadi.

O'qituvchi **Mashqlar** bo'limida har bir mavzuni, javoblar kalitini va har bir o'quvchining natijasini ko'radi.

Mazmunni yangilash yoki qo'shish (kompyuterda):
```
npm run load-practice
```

## Limitlar (bepul tariflarda)
- **Gemini:** kunlik bepul limit bor. Limit tugasa, baholar o'chmaydi: navbatda kutib, keyinroq tekshiriladi.
- **Supabase:** loyiha **1 hafta umuman ishlatilmasa**, to'xtatib qo'yiladi. Har kuni dars bo'lgani uchun bu xavf yo'q. Uzoq ta'tildan oldin bitta o'quvchi sifatida kirib chiqing yoki supabase.com da "Restore" tugmasini bosing.
- **Vercel Hobby:** shaxsiy foydalanish uchun bepul. O'quv markazi tijorat sifatida ishlasa, Vercel shartlariga ko'ra Pro tarif (oyiga $20) talab qilinishi mumkin.

## Audiolar
Barcha audiolar (60 ta listening dialogi, 100 ta reading matni, 60 ta speaking namunasi) **bepul** yaratilgan: Kokoro, kompyuterning o'zida ishlaydi. Ular Supabase'da **doimiy** saqlanadi.

## Yangi Beginner guruhi (kurs tugagach)
Hamma material saqlanib qoladi, darslar faqat yangi sanaga ko'chiriladi. Bu ish uchun kompyuterda bitta buyruq kerak (dasturchi yoki Claude bajaradi):

```
npm run load-lessons -- materiallar/beginner Beginner --start 2027-02-01
```

Eslatma: hozircha bitta kursda bir vaqtda bitta guruh bo'ladi. Ikki guruh parallel o'qisa, ular uchun alohida kurs ochish kerak.

## Muhim fayllar (shu papkada)
- `.env.local` — maxfiy kalitlar. **Hech kimga yubormang.** Shu kalitlar Vercel'da ham saqlangan.
- `materiallar/` — kurs materiallari va audiolar (zaxira nusxa).
- `supabase/HEPSI_BIR_ARADA.sql` — bazani noldan qayta qurish uchun.
