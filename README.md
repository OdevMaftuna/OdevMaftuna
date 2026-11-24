# Uyga vazifa

Ingliz tili o‘qituvchisi va uning o‘quvchilari uchun **yopiq** uyga vazifa topshirish tizimi.
O‘qituvchi 2–3 oylik vazifalarni oldindan yuklaydi, o‘quvchi har kuni ochilgan vazifani
muddatigacha topshiradi, sun’iy intellekt (Gemini) javobni tekshirib, xatolarni tushuntiradi.

- Ro‘yxatdan o‘tish yo‘q: hisobni faqat o‘qituvchi ochadi.
- O‘quvchi e’lon qilinmagan vazifani ko‘rmaydi, muddatdan keyin topshira olmaydi (server va baza tekshiradi).
- Interfeys o‘zbekcha, vaqtlar Toshkent vaqti bilan (`Asia/Tashkent`).

**Texnologiyalar:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth, Postgres, Storage, RLS), Google Gemini API, Vercel.

---

## 1. O‘rnatish

### 1.1. Talablar

- Node.js 20.9 yoki yangiroq
- [Supabase](https://supabase.com) hisobi (bepul tarif yetadi)
- [Google AI Studio](https://aistudio.google.com) dan Gemini API kaliti

```bash
npm install
```

### 1.2. Supabase loyihasi

1. Supabase’da yangi loyiha oching.
2. **Authentication → Sign In / Providers** bo‘limida **“Allow new users to sign up”** ni **o‘chiring**. Bu shart: tizim yopiq bo‘lishi shunga bog‘liq.
3. **SQL Editor** da quyidagi fayllarni **shu tartibda** birma-bir ishga tushiring:

   | Fayl | Nima qiladi |
   | --- | --- |
   | `supabase/migrations/0001_schema.sql` | Jadvallar, muddat triggeri, funksiyalar |
   | `supabase/migrations/0002_rls.sql` | Row Level Security qoidalari |
   | `supabase/migrations/0003_storage.sql` | Yopiq `submissions` ombori (rasmlar) |
   | `supabase/migrations/0004_ai_queue.sql` | AI tekshiruvi navbati |
   | `supabase/migrations/0005_courses.sql` | Kurslar (Beginner, Elementary, Pre-Intermediate) |

4. Tekshiring: **Table Editor** da to‘rt jadvalda ham RLS yoqilgan, **Storage** da `submissions` ombori “Private”.

### 1.3. Birinchi o‘qituvchi hisobi

1. **Authentication → Users → Add user → Create new user**: e-pochta va parol kiriting, “Auto Confirm User” belgilangan bo‘lsin.
2. `supabase/first_teacher.sql` faylida e-pochta va ism-familiyani o‘zgartirib, SQL Editor’da ishga tushiring. Natijada `role = teacher` bo‘lgan bitta qator qaytishi kerak.

### 1.4. Muhit o‘zgaruvchilari

`.env.example` faylini `.env.local` nomi bilan nusxalang va to‘ldiring:

| O‘zgaruvchi | Qayerdan olinadi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | o‘sha yerda, “anon public” kaliti |
| `SUPABASE_SERVICE_ROLE_KEY` | o‘sha yerda, “service_role” kaliti. **Maxfiy.** |
| `GEMINI_API_KEY` | Google AI Studio → API key. **Maxfiy.** |
| `GEMINI_MODEL` | Flash modeli nomi, masalan `gemini-3.8-flash` ([ro‘yxat](https://aistudio.google.com/docs/models)) |

`.env.local` git’ga tushmaydi. Maxfiy kalitlarni hech qachon `NEXT_PUBLIC_` bilan boshlamang.

### 1.5. Ishga tushirish

```bash
npm run dev
```

`http://localhost:3000` ni oching va o‘qituvchi hisobi bilan kiring.

---

## 2. Namuna ma’lumot (sinov uchun)

```bash
npm run seed
```

5 ta namuna o‘quvchi, 6 ta vazifa (ochiq, kech topshirsa bo‘ladigan, yopilgan, kelajakdagi) va bir nechta
javob qo‘shadi. Parol terminalda bir marta ko‘rsatiladi. Namuna yozuvlar `[Namuna]` (vazifa sarlavhasi) va
`@uyga-vazifa.test` (e-pochta) bilan belgilangan.

Haqiqiy foydalanishdan oldin o‘chiring (faqat namuna yozuvlar o‘chadi):

```bash
npm run seed -- --remove
```

---

## 3. Vercel’ga joylash

1. Loyihani GitHub’dagi **private** repozitoriyga yuklang.
2. [vercel.com](https://vercel.com) → **Add New → Project** → repozitoriyni tanlang. Framework: Next.js (o‘zi aniqlaydi).
3. **Environment Variables** ga `.env.local` dagi beshta o‘zgaruvchini kiriting (Production uchun).
4. **Deploy** ni bosing.
5. Joylangach tekshiring:
   - sayt manzilini inkognito oynada oching: faqat kirish sahifasi ko‘rinishi kerak;
   - `/robots.txt` da `Disallow: /` turishi kerak;
   - o‘qituvchi sifatida kirib, bitta o‘quvchi qo‘shing va u bilan boshqa qurilmadan kiring.
6. Supabase → **Authentication → URL Configuration → Site URL** ga Vercel manzilini yozing.

Eslatmalar:

- Sayt manzilini faqat o‘quvchilarga bering. Manzilni bilgan odam ham hisobsiz hech narsa ko‘ra olmaydi.
- AI tekshiruvi javob yuborilgandan keyin fonda ishlaydi va bitta chaqiruvda 60 soniyagacha davom etadi
  (`maxDuration = 60`). Navbatda qolgan javoblar o‘quvchi sahifasi yoki o‘qituvchining «Kuzatuv» sahifasi ochilganda davom etadi.
- Kalitni almashtirsangiz, Vercel’da o‘zgaruvchini yangilab, qayta deploy qiling.

---

## 4. Qanday ishlaydi

### Rollar va sahifalar

| Rol | Sahifalar |
| --- | --- |
| O‘qituvchi | `/oqituvchi/vazifalar` (qo‘shish, tahrirlash, Excel’dan yuklash), `/oqituvchi/kuzatuv`, `/oqituvchi/baholash/…`, `/oqituvchi/oquvchilar`, `/oqituvchi/sozlamalar` |
| O‘quvchi | `/oquvchi` (bugungi vazifalar), `/oquvchi/vazifa/…`, `/oquvchi/tarix` |
| Hamma | `/kirish`, `/parol` (parolni almashtirish) |

### Xavfsizlik qatlamlari

1. **Proxy** (`src/proxy.ts`, Next.js 16 da middleware shunday ataladi): kirmagan odam faqat `/kirish` ni ko‘radi; nofaol hisob chiqariladi; parolini almashtirmagan o‘quvchi boshqa sahifaga o‘tolmaydi; har kim faqat o‘z roli bo‘limiga kiradi.
2. **Sahifa va server action’lar**: har biri `requireTeacher()` / `requireStudent()` bilan o‘zi ham tekshiradi; hamma kiritilgan ma’lumot zod bilan tekshiriladi.
3. **Baza (RLS)**: o‘quvchi faqat e’lon qilingan vazifalarni va faqat o‘z javoblarini o‘qiydi. Javobni faqat `submit_assignment()` funksiyasi orqali yozadi.
4. **Muddat triggeri**: muddat o‘tgan va kech topshirish yopiq bo‘lsa, baza javobni rad etadi — brauzerdagi tugma holatidan qat’i nazar.
5. **Ombor**: rasmlar yopiq omborda, o‘quvchi faqat o‘z papkasiga yuklaydi; rasmlar 1 soatlik imzolangan havola bilan ko‘rsatiladi.

### Service role kaliti qayerda ishlatiladi

Faqat serverda va faqat quyidagi joylarda:

- o‘qituvchi amallari: o‘quvchi hisobini ochish, parolni tiklash, nofaol qilish, e-pochtalar ro‘yxati (`src/app/actions/students.ts`);
- AI natijasini yozish (`src/lib/ai/queue.ts`). O‘quvchi sessiyasi bilan yozilsa, o‘quvchi o‘z balini o‘zgartira olardi, shuning uchun natijani faqat server yozadi.

### AI tekshiruvi

- `ai_status = 'pending'` bo‘lgan javoblar navbat hisoblanadi; server ularni bittalab oladi (`claim_next_ai_job`).
- Gemini javobi JSON sxema bilan so‘raladi va zod bilan tekshiriladi. Noto‘g‘ri bo‘lsa bir marta qayta uriniladi, yana bo‘lmasa `ai_status = 'error'`.
- 429 (limit) kelsa kutib qayta uriniladi; vaqt yetmasa javob navbatda qoladi.
- Kech topshirilgan javobda `late_penalty_percent` AI baliga qo‘llanadi. O‘qituvchi qo‘ygan ball o‘zgarishsiz saqlanadi.
- O‘quvchiga ko‘rinadigan yakuniy ball: o‘qituvchi bali bo‘lsa o‘sha, bo‘lmasa AI bali.

### Papkalar

```
src/app/            sahifalar va server action'lar (actions/)
src/components/     umumiy komponentlar
src/lib/            yordamchilar: auth, sana, tekshiruv (zod), Excel, rasm siqish
src/lib/ai/         Gemini chaqiruvi va navbat
src/lib/supabase/   Supabase client'lari (brauzer, server, admin, proxy)
supabase/           SQL fayllar
scripts/seed.mjs    namuna ma'lumot
```

---

## 5. Ishga tushirishdan oldingi tekshiruv ro‘yxati

- [ ] Supabase’da “Allow new users to sign up” **o‘chirilgan**
- [ ] To‘rtala SQL fayl ishga tushirilgan, jadvallarda RLS yoqilgan
- [ ] `submissions` ombori “Private”
- [ ] O‘qituvchi hisobi ochilgan va `role = teacher`
- [ ] Vercel’da beshta muhit o‘zgaruvchisi kiritilgan
- [ ] Inkognito oynada sayt faqat kirish sahifasini ko‘rsatadi
- [ ] Sinov o‘quvchisi: birinchi kirishda parol almashtirish so‘raladi
- [ ] Sinov o‘quvchisi kelajakdagi vazifani ko‘rmaydi
- [ ] Muddati o‘tgan vazifaga javob yuborib bo‘lmaydi
- [ ] Matnli javob yuborilganda bir necha soniyada AI fikri chiqadi
- [ ] Telefondan daftar surati yuboriladi va AI qo‘lyozmani o‘qiydi
- [ ] O‘qituvchi «Kuzatuv» da kim topshirgani va topshirmaganini ko‘radi
- [ ] O‘qituvchi ball va izohni o‘zgartiradi, o‘quvchida ko‘rinadi
- [ ] Nofaol qilingan o‘quvchi kira olmaydi
- [ ] Namuna ma’lumot o‘chirilgan (`npm run seed -- --remove`)

## 6. Foydali buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Production uchun yig‘ish |
| `npm run lint` | Kod tekshiruvi |
| `npm run seed` | Namuna ma’lumot qo‘shish |
| `npm run seed -- --remove` | Namuna ma’lumotni o‘chirish |
