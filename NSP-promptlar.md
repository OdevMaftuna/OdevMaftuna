# NSP Language Center — sayt yaratishdagi barcha promptlar

Jami: 125 ta xabar · 17/11, 03:00 — 18/11, 23:32 (Toshkent vaqti)

Belgilar: 📎 — xabarga rasm/fayl biriktirilgan · ⏩ — ish paytida yozilgan xabar · 🅰 — Claude bergan savolga javob

---

## 17 November 2026

**1.** `03:00`

> Kurulum: Next.js + Supabase projesini açma, ayar dosyaları
> Veritabanı + güvenlik: Tablolar, öğrencinin sadece kendi ödevini görmesi
> Kapalı giriş sistemi: Kayıt yok, hoca öğrenci ekliyor, ilk girişte şifre değiştirme
> Hoca paneli, ödevler: Tek tek ekleme + Excel’den 3 aylık toplu yükleme
> Öğrenci paneli + saat kontrolü: Bugünkü ödev, geri sayım, süre bitince kapanma (sunucuda)
> Yapay zeka kontrolü: Gönderilen ödevi Gemini kontrol ediyor, hatalar + doğrusu + puan
> Hoca değerlendirme ekranı: Kim gönderdi/göndermedi, AI’ın yorumunu düzeltme, ilerleme
> Test + yayın: Birkaç öğrenciyle deneme, Vercel’e kapalı şekilde yükleme
> 
> Bir İngilizce öğretmeni ve öğrencileri için KAPALI bir ödev teslim + yapay zeka geri bildirim sistemi yapacağız. Halka açık değil; sadece öğretmenin eklediği öğrenciler kullanacak (~50 öğrenci). Arayüz dili Türkçe.
> 
> ## Teknoloji
> - Next.js (App Router, TypeScript) + Tailwind CSS
> - Supabase: Auth, Postgres, Storage, Row Level Security
> - Google Gemini API (ücretsiz kotadaki güncel Flash modeli; model adı GEMINI_MODEL env değişkeninden okunsun)
> - Yayın: Vercel
> - Tüm tarih/saat işlemleri Europe/Istanbul saat dilimine göre yapılsın.
> 
> ## Temel mantık
> Öğretmen 2-3 aylık ödevleri tek seferde sisteme yükler. Her ödevin bir yayın zamanı (publish_at) ve son teslim zamanı (due_at) vardır.
> - Öğrenci, publish_at geçmemiş ödevleri GÖREMEZ.
> - due_at geçtikten sonra GÖNDEREMEZ. Bu kontrol mutlaka SUNUCU tarafında (server action/API + veritabanı kuralı) yapılsın; sadece butonu gizlemek yetmez.
> - Öğretmen ödev bazında "geç teslime izin ver" seçeneğini açabilir (late_allowed + late_penalty_percent). Kapalıysa geç teslim kesinlikle reddedilir.
> 
> ## Roller
> 1. Öğretmen (teacher): her şeyi görür ve yönetir.
> 2. Öğrenci (student): sadece kendi ödevlerini ve kendi gönderimlerini görür.
> 
> ## Kapalı sistem gereksinimleri
> - Herkese açık kayıt (sign up) OLMAYACAK. Supabase'de public signup kapalı olsun.
> - Öğrenci hesaplarını sadece öğretmen oluşturur: tek tek veya Excel/CSV ile toplu (ad soyad, e-posta). Geçici şifre üretilsin, öğretmen ekranında gösterilsin.
> - Öğrenci ilk girişte şifresini değiştirmek zorunda olsun.
> - Giriş yapılmadan hiçbir sayfa açılmasın (middleware ile). Giriş sayfası hariç.
> - Tüm sayfalarda noindex/nofollow, robots.txt her şeyi engellesin.
> - Öğretmen bir öğrenciyi pasif yapabilsin (giriş yapamasın).
> 
> ## Veritabanı (RLS hepsinde açık)
> - profiles: id (auth.users ile bağlı), full_name, role ('teacher'|'student'), is_active, must_change_password, created_at
> - assignments: id, title, instructions (metin), submission_type ('text'|'image'|'both'), rubric (öğretmenin puanlama kriterleri, metin), max_score (varsayılan 100), publish_at, due_at, late_allowed, late_penalty_percent, created_at
> - submissions: id, assignment_id, student_id, text_content, image_paths (dizi), submitted_at, is_late, ai_status ('pending'|'done'|'error'), ai_feedback (jsonb), ai_score, teacher_score, teacher_comment, reviewed_at
>   - (assignment_id, student_id) benzersiz olsun; öğrenci süre dolmadan gönderimini güncelleyebilir, her güncellemede AI tekrar çalışır.
> - RLS: öğrenci sadece publish_at <= now() olan ödevleri ve sadece kendi submissions kayıtlarını okuyabilir/yazabilir. due_at kontrolü veritabanı tarafında da (trigger veya policy) zorunlu olsun. Öğretmen her şeye erişir.
> - Storage: "submissions" adında PRIVATE bucket. Öğrenci sadece kendi klasörüne yükler/okur; öğretmen hepsini okur. Görseller signed URL ile gösterilsin.
> 
> ## Öğretmen paneli
> 1. Ödevler: listeleme, ekleme, düzenleme, silme.
> 2. Excel/CSV toplu ödev yükleme (SheetJS). Sütunlar: title, instructions, submission_type, rubric, max_score, publish_at, due_at, late_allowed, late_penalty_percent. Yüklemeden önce önizleme tablosu göster, hatalı satırları kırmızıyla işaretle. İndirilebilir örnek şablon dosyası olsun.
> 3. Öğrenciler: ekleme, toplu ekleme, pasif yapma, şifre sıfırlama.
> 4. Takip ekranı: her ödev için kim gönderdi / kim göndermedi / kim geç gönderdi.
> 5. Değerlendirme: bir gönderimi açınca öğrencinin cevabı + AI geri bildirimi yan yana. Öğretmen puanı ve yorumu düzenleyebilir (teacher_score, teacher_comment). Öğrenciye gösterilen nihai puan: teacher_score varsa o, yoksa ai_score.
> 6. Öğrenci ilerleme sayfası: ortalama puan, kaçırılan ödev sayısı, ödev bazında puan listesi.
> 7. Ayarlar: AI geri bildiriminin açıklama dili (Türkçe/İngilizce) ve AI puanını öğrenciye hemen gösterme/göstermeme seçeneği.
> 
> ## Öğrenci paneli
> - Ana sayfa: bugün açık olan ödev(ler), son teslime geri sayım, yaklaşan ödev yok (gelecek ödevler gizli).
> - Ödev sayfası: talimatlar, submission_type'a göre metin kutusu ve/veya fotoğraf yükleme (telefondan kamera ile çekilebilsin, görseller yüklemeden önce sıkıştırılsın).
> - Gönderdikten sonra AI geri bildirimi birkaç saniye içinde aynı sayfada görünsün (yükleniyor durumu olsun).
> - Geçmiş: tüm eski ödevleri, puanları, AI ve öğretmen yorumları.
> - Telefonda rahat kullanılmalı (mobile-first).
> 
> ## Yapay zeka kontrolü
> - Gönderim kaydedilince sunucuda Gemini çağrılsın. API anahtarı ASLA istemciye gitmesin.
> - Gemini'ye gönderilecekler: ödev talimatı, rubric, max_score, öğrencinin metni ve/veya görselleri (el yazısı fotoğrafını okuyabilmeli).
> - Rol: deneyimli ve cesaretlendirici bir İngilizce öğretmeni. Öğrenci seviyesine uygun, net ve kısa açıklamalar.
> - Çıktı SADECE şu JSON şemasında olsun (Gemini'nin structured output / responseSchema özelliğini kullan):
>   {
>     "score": number,
>     "summary": string,
>     "mistakes": [ { "original": string, "correction": string, "explanation": string, "type": "grammar"|"vocabulary"|"spelling"|"punctuation"|"other" } ],
>     "strengths": [string],
>     "suggestions": [string]
>   }
> - JSON doğrulansın (zod). Hata olursa 1 kez tekrar denensin; yine olmazsa ai_status = 'error' yapılsın, öğrenci "Ödevin alındı, değerlendirme daha sonra gelecek" mesajı görsün ve öğretmen panelinden "AI'ı tekrar çalıştır" butonu olsun.
> - Ücretsiz kotaya takılmamak için istekler sırayla işlensin, 429 hatasında bekleyip tekrar denensin.
> - Geç teslimde late_penalty_percent puana uygulansın.
> 
> ## Güvenlik ve kalite
> - Tüm yazma işlemleri sunucuda doğrulansın (zod).
> - Dosya yükleme: sadece jpg/png/webp/heic, gönderim başına en fazla 5 görsel, her biri en fazla 5 MB.
> - .env.example dosyası: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GEMINI_MODEL.
> - Service role anahtarı sadece sunucu tarafında, sadece öğretmen işlemlerinde (hesap oluşturma) kullanılsın.
> 
> ## Çalışma şekli
> Projeyi şu 8 aşamada yap. HER aşamanın sonunda dur, ne yaptığını ve nasıl test edeceğimi kısaca yaz, benim onayımı bekle:
> 1. Kurulum (Next.js, Tailwind, Supabase client, klasör yapısı, .env.example)
> 2. Veritabanı: SQL migration dosyaları, RLS politikaları, due_at trigger'ı, storage bucket ve politikaları, ilk öğretmen hesabını oluşturma talimatı
> 3. Kapalı giriş sistemi (login, middleware, ilk girişte şifre değiştirme, rol bazlı yönlendirme)
> 4. Öğretmen paneli: ödevler + Excel toplu yükleme + öğrenci yönetimi
> 5. Öğrenci paneli + sunucu tarafı saat kontrolü
> 6. Gemini entegrasyonu ve geri bildirim ekranı
> 7. Öğretmen takip, değerlendirme ve ilerleme ekranları
> 8. Test için örnek veri (seed), README (kurulum + Vercel'e yayın adımları), son kontrol listesi
> 
> Bir şeyden emin değilsen tahmin etme, bana sor.
> knk herssey Ozbekce olcak 
> /stepbystep

**2.** 🅰 `03:02`

> "Arayüz Özbekçe olacak; hangi alfabe kullanılsın?"="Latin (Recommended)", "Spec'te saat dilimi Europe/Istanbul yazıyor. Her şey Özbekçe olacaksa saatler hangi dilime göre işlesin?"="xorazm", "Ayarlar'daki AI geri bildirim açıklama dili seçenekleri (spec'te Türkçe/İngilizce) ne olsun?"="Özbekçe / İngilizce"

**3.** `03:08`

> Onay, 2'ye geç

**4.** `03:15`

> Onay, 3'e geç

**5.** ⏩ `03:18`

> hamma narsani o'zbekcha tushuntr

**6.** `03:22`

> Tasdiq, 4 ga o‘t

**7.** `03:36`

> Tasdiq, 5 ga o‘t

**8.** `03:44`

> Tasdiq, 6 ga o‘t

**9.** `08:36`

> Try again

**10.** `08:41`

> Tasdiq, 7 ga o‘t

**11.** `08:47`

> Tasdiq, 8 ga o‘t

**12.** `08:51`

> Ha, ko‘chir

**13.** `08:52`

> ish stoli

**14.** `08:54`

> one drive dan tashqariga ko'chir

**15.** `09:00`

> nima qilay man

**16.** `09:12`

> 2 chini bajarolmayapman fayllarni topolmayapman manga tashlab ber shularni

**17.** `09:12`

> telegramdann tashlab ber

**18.** `09:14`

> yordim

**19.** `10:41`

> computerimmi boshqara olasanmi

**20.** `10:42`

> Afsus, buni bu yerdan o‘zim qila olmayman. Hozir men Chrome ichida ishlayapman: brauzerda sahifa ocha olaman, lekin kompyuteringizdagi papkalar va terminalga qo‘lim yetmaydi.
> Bu ishni sizning o‘rningizga qila oladigan joy bor. Loyihani dastlab qurgan Claude kompyuteringizga ulangan edi (“Now working in this computer · uyga-vazifa” yozuvi shundan qolgan). U papkani ham, terminalni ham o‘zi boshqara oladi:
> 
> 1. Kompyuteringizda Claude ilovasini oching. Bu brauzer emas, alohida dastur: Windows tugmasini bosib, “Claude” deb yozing.
> 2. Chap tomondagi ro‘yxatdan uyga-vazifa loyihasi ustida ishlagan suhbatni oching.
> 3. Unga shuni yozing:
> 
> 
> ```
> .env.local faylini tekshir, keyin npm run seed va npm run dev ni ishga tushir va localhost:3000 ni och
> ```
> 
> U hammasini o‘zi bajaradi. Sizdan biror narsani tasdiqlashni so‘rasa, Allow ni bosasiz.
> Agar Claude ilovasini topolmasangiz yoki u yerda ham tiqilib qolsangiz, ekran rasmini shu yerga yuboring. Har bir bosiladigan joyni rasm bo‘yicha birma-bir ko‘rsatib boraman.

**21.** `12:30`

> .env.local faylini tekshir, keyin npm run seed va npm run dev ni ishga tushir va localhost:3000 ni och

**22.** `13:30`

> Try again

## 18 November 2026

**23.** `03:14`

> Yozdim, davom et

**24.** `03:19`

> bak aga su an VS acildi su ana kadar yaptigin her seyi lazim olan seyler heosini C:\Users\user\OneDrive\Desktop\Odev su dosayaya koy eskileri ile karismasin ve bana sql i burdan ver tamam ve siradaki adimi ve su an nerdesiniz her seyi kisaca anlat uyguluama ozbekce ve inlizce olcak ama benim le turkce konus simdilik

**25.** `03:25`

> Yaptım, devam et

**26.** `03:28`

> dur once sql hata verdi Xato: SQL so'rovini ishga tushirishda xatolik yuz berdi: XATO: 42P07: "profillar" munosabati allaqachon mavjud

**27.** `03:32`

> tablo_sayisi,public_tablolar,fonksiyon_sayisi,public_policy,storage_policy,bucket_ozel,ai_kuyrugu,profiles_sutunlari,profil_sayisi
> 4,"app_settings, assignments, profiles, student_submissions, submissions",7,9,3,true,true,"id, full_name, role, is_active, must_change_password, created_at",1

**28.** `03:36`

> public ve secret key den mi bahsediyosun burda

**29.** `03:40`

> gemini api keyi one drive den mi aliyoz

**30.** `03:42`

> oldu devam eklendi

**31.** `04:09`

> bak aga sql e sacma sapan  meil ler eklemissin sql e onlari duzelte bilirsen duElt ve ssisteme 2 adim li giris eklemissin onu su an lik sil ve bana her seyi kontrol edib bana haberr ver ve ben sana neleri degistirip eklemen gerektigini filan soylerim ok baba

**32.** 📎 `04:32` · 1 ta rasm

> /stepbystep birinchi designni tuzatali chiroyli bir design qilib ber  manashu rasmga moslob bu logosi bo'ladi NSP LC deb chiroyli qilib ber

**33.** ⏩ `04:33`

> uzbekcha qil hammasini

**34.** 📎 `04:39` · 1 ta rasm

> orqa oq fonini ham o'zgartir

**35.** `04:42`

> shiorni englizcha qil va ko'zga qulay bo'lgan to'mniy qizilmi shunga o'shsh ranglardan chiroyli qilib ber kn kirish qismiga animatsiya ham qo'sh

**36.** ⏩ `04:48`

> to'q qizil  uncha mos mas ekn to'q yashilni qo'llab ko'rchi

**37.** 📎 `04:52` · 1 ta rasm

> birinchi NSP dagi LC ni olib tashla kn esa orqa qismdagi ari inidek katakchalarni olib tashla o'rniga boshqa mos keladigan narsa qo'y yoki kerakmaydi ko'r qaysi yaxshiroq didli qilib chiroyli qilib ber

**38.** `04:56`

> ajoyib endi har bir kurs uchun alohida vazifalar qismini ochish kerak , hozircha 3 ta beginner , elementary , pre - intermediate deganlarni tashkillashtir va man senga material tashab beraman shuni 2 yo3 oylik qilib joylab berasan keyin

**39.** `05:07`

> oldin bosh sahifadagi orqa fonni juda toq yashil qilib ber

**40.** 📎 `05:09` · 1 ta rasm

> manashu yerdagini to'q yashil qilib ber degandin boshqa tizimga kirish qismi yaxshi edi uni oldingi holiga qaytar

**41.** 📎 `05:11` · 1 ta rasm

> burchakdagi nur buzyapti uni o'zgartir yoki boshqa nimadir chiroyli qiladigan design qo'sh

**42.** `05:13`

> u yam tushmadi boshqa shu fonga tushadigan narsa qil judayam yarashib turadigan odamni o'ziga jalb qiladigan qilib chiroyli qilib ber

**43.** `05:16`

> endi kurslarga stepbystep vazifa joylab chiqamiz

**44.** 🅰 `05:18`

> "Qaysi kursdan boshlaymiz?"="Beginner", "Vazifalar haftaning qaysi kunlari beriladi?"="Har kuni (7 kun)", "Vazifa har kuni soat nechada ochilib, nechada yopilsin? (Toshkent vaqti)"="ertalabgi 7:00 dan tungi 3;00 gacha", "Qachondan boshlanadi va qancha davom etadi?"="20 - noyabr yanvarni 20 masigacha"

**45.** 📎 `05:23` · 1 ta rasm

> @"C:\Users\user\Downloads\Beginner Reading Book (Units 1–14).pdf" @"C:\Users\user\Downloads\Telegram Desktop\education (5).html"
> bu reading kitobi shunga moslab har kuni 3 ta reading bo'lish kerak readingdagi lug'atlar boyicha testmi kn manashu 2 chi saytga  o'xshastib bir reading tarjimasidan kn mashqlar ber unga doir va kn shu so'zlarni manolari lug'ati va shunga o'zlari gap tuzdirish ham bo'lsin 
> keyin 3 ta narsani ayting debsan 
> 1) ikkalasini ham qabul qil
> 2.shu standard 100 bo'lsin 
> 
> 3. ososan muddat 3 gacha bo'lsin lekin o'quvchi kechga qolsa uni ham ishlashiga imkon ber qandaydir qilib

**46.** `05:34`

> Ma’qul, qur

**47.** `08:28`

> I hit my usage limit while you were working, but it has reset now. Please continue from where you left off.

**48.** `08:33`

> Sen yordam ber

**49.** 📎 `08:38` · 1 ta rasm

> @"C:\Users\user\Downloads\beginner-speaking-book.pdf" @"C:\Users\user\Downloads\Telegram Desktop\Basic IELTS Listening (3).pdf"
> endi reading ketgan bo'lsa speaking va listening qismiga keldi speakingni manashu kitobdan qilasan, listeningni esa basic ieltdan qilsang ham bo'aldi listeningni hamma qismini olma kitobdan bazibir oson listeninglarni ol yoki headway beginner kitobidagi listeninglarga o'xshash listening qilib ber speaking esa har kuni 1 ta topicga 20 marta ovozli habar yuborishlari kerak bo'ladi har biri kamida 1 minute bo'lishi kerak sen qanday gaplash va shu topicga mos lug'atlar kn esa anashu lug;atlarni qatnashtirib gap tuz deganday qilib ber manga nima qilayotganingni ko'rsatib tur keyin manda ko'rinmayapti manashuyeri

**50.** 🅰 `08:43`

> "Speaking: kuniga nechta ovozli xabar yuborishsin?"="20 ta, 7 kundan keyin o‘chsin", "Ovozli xabarlar qanday baholansin?"="listeninglarini tashlab beraman hozr", "Listening qanday bo‘lsin?"="tashlab beraman", "Speaking va listening reading bilan qanday birlashsin?"="Har kuni bitta dars ichida"

**51.** ⏩ `08:43`

> @"C:\Users\user\Downloads\Telegram Desktop\Basic IELTS Listening CDs.zip"
> listening audiolari

**52.** ⏩ `08:45`

> etibor ber o'qiganda american accentda bo'lsin tushunadigan tilda bo'lsin manga parcha tashla eshitib ko'rib aytaman

**53.** `08:50`

> 3 kunda o'chiraver esa audioni , uni doimo saqlab qolish kerak lekin hamma bazani chunki bir kurs tugagandan kn o'quvchilar elemenrty darajaga o'tganda o'rniga boshqa beginner guruh ochiladi da shuning uchun doimiligi qolsin speaking homework qilib yaradigan ni audiolari esa teshkirilgandan kn o'chirib tashlasangham bo'ladi

**54.** ⏩ `09:04`

> qara manga o'qituvchi sifatida hamma vazifalar qayerdaligi vaqtidan oldin hammasi ko'rsaniladigan bo'lishi kerak shuni ham qil ohirda

**55.** `09:31`

> pullisi qancha

**56.** ⏩ `09:34`

> nima qilyapsan faqat puli ayt dedim

**57.** `09:36`

> shunda pullisi 65 to'lasa bo'ldimi bir marta

**58.** `09:38`

> bepul qilib ber https://dictation.ieltsbooster.uz manashunga o'xshatib

**59.** ⏩ `09:44`

> 2 yaxshi ekan

**60.** ⏩ `09:49`

> ajoyib endi joyla men hamma joylagan narsalaringni ko'rmoqchiman , keyin claudeni oylik to'lovini tugasa ham u sayt ishlayveradimi , manga shu tugasaham yuqorida tashlaganimdek ishlayveradigani kerak shunday ko'rinishda tayyorla hammasini

**61.** `09:59`

> Kirdim

**62.** `10:22`

> vercelni saxsiy foydalanishga tushurib ber

**63.** `10:27`

> endi o'qituvchini ismini Maftuna deb ber va saytga run by Maftuna Ismoilova degan yozuvni ham qo'y chiroyli qilib keyin o'quvchini o'sha saytdan qo'shamanmi yoki layoutdanmi yoki supabasedanmi manga shuni linkiniyam tashlab ber kn boshqa o'qituvchilarni ham qo'shsa bo'ladi ha

**64.** `10:31`

> yoriqomai telegramdan tashlab ber

**65.** `10:34`

> o'quvchi kirmoqchi bo'lganda qaysi linkni beraman shu saytga o'tadigan

**66.** `10:36`

> hozir bitta homeworkni probniy qil chi ishlab ko'rmoqchiman o'quvchi sifatinda teshkirmoqchiman

**67.** 📎 `10:42` · 1 ta rasm

> bunda run by deganlar sariqmas qizil bo'lib chiqyaptiku

**68.** `10:45`

> endi alohida beginner mavzular uchun mashqlar tayyorlash kerak unga vaqt belgilanmaydi man hozir mavzular ro'yhatini tashlayman shu bo'yicha test mashqlar tuzishni gaplashamiz

**69.** `10:52`

> @"C:\Users\user\OneDrive\Desktop\4th Headway Beginners SB (2).pdf" @"C:\Users\user\Downloads\There is _ There are_ 100 ta tarjima mashqi.pdf" @"C:\Users\user\Downloads\Telegram Desktop\Mixed_Grammar_Test_500_Units_1-15.pdf"
> grammar references 119 chi betdagilarga qara eding shu bo'yicha  har bir unitda berilgan mavzularga test tuzish kerak mana shularga o'xshastib har bir unitdagi mavzu boshda kirish qismi qilib mavzu tushuntirish ber va har bir unitdagi mavzuga doir shunga o'xshash mashqlarda 100 ta uzb tarjima qilish ham bo'lsin kn test ham bo'lsin testni tugatgandan kn boshida tushuntrb qo'yilgan qoida bo'yicha oxirida check qilingan dan kn tushuntrilsin shu sababli xato qilibsan shu kelganda bu qo'yilar edi deb buni beginner mavzulari deb ochasanmi boyagi homeworklar qismiga qo'shma o'zi asosiy dashboardmi asosiy bosh sahifa tashkil qil va u yerda beginner 
> elementary 
> pre- intermediate
> sefr
> ielts qismlari bo'lsin va ularga qaysidir qismiga kirganda homework boyicha, lug'at mashqlari va mavzu bo'yicha deb ochilgan bo'lsin shunga keragiga kirib ishlayveradi lek lug'at bn mavzuga muddat belgilanmaydi va javoblari saqlanishikerak

**70.** 🅰 `10:55`

> "Har bir grammatika mavzusidagi test qanday bo'lsin (tushuntirish + 100 ta tarjimadan tashqari)?"="30 savol, aralash (Tavsiya)", "100 ta tarjimani qanday tekshiramiz?"="Avtomatik + AI (Tavsiya)", "Bosh sahifadagi 5 bo'limni (Beginner, Elementary, Pre-Intermediate, CEFR, IELTS) o'quvchi qanday ko'rsin?"="Hammasini ko'radi (Tavsiya)", "Beginner'dagi 'Lug'at mashqlari' qismi nimadan tuzilsin?"="lug'at tashlab beraman boshta bularni tugat"

**71.** ⏩ `10:57`

> @"C:\Users\user\Downloads\Telegram Desktop\Beginner narrative  (6).pdf" @"C:\Users\user\Downloads\Telegram Desktop\Beginner Vocabulary 1-14 (7).docx"
> mana mavzular kitobchasi va lug'at lug'at qismiga shu lug'atladan foydalanib har bir unitga 100 ta qil

**72.** ⏩ `11:00`

> tarjimalar bularni darajasiga mos va biladigan oson boya tashagan lug'atlarimdan bo'lsin

**73.** ⏩ `11:09`

> boshida sahifalarni yaratiber

**74.** `13:21`

> I hit my usage limit while you were working, but it has reset now. Please continue from where you left off.

**75.** `13:32`

> endi barcha o'qituvchilarga asosiy bo'lim hammasi ko'rinadigan bo'lsin

**76.** `13:37`

> Ha, ertaga

**77.** `13:39`

> hozircha bu turib tursin kechroq davom ettiramiz endi manga boshqa masala bo'yicha yordaming kerak

**78.** 📎 `13:41` · 1 ta rasm

> manashu mavzuni bugun o'qituvchi sifatida dars qilib o'tishim kerak o'quvchilarga bu mavzuni qanday tushuntirish , darsdan qanday materiallardan qiziqarli activitilardan foydalansam bo'ladi univerda tushuntiraman hammasini inglizchalab shunga moslab stepbystep qilib ber 40 minute ichida hammasiga ulgurishim kerak yana kattalarga tushuntraman shularni darajasiga moslab qil

**79.** `13:48`

> qara boshida bitta boxsda kimni hikoyasi deb boshlanadiku oshanda aytgan ism bo'yicha o'quvchilarga o'zlari tushuntrganimga qarab tuzsalar bo'ladi ha , keyin manabu story mountaindagilarga yaxshi tushunmadim har birini alahida yaxshilab tushuntrb ber

**80.** `14:31`

> endi manga manashuni handout sifatida  har bir qismini structurani alohida misoliga azizni qilib lekin vaziyatni o'zgartir o'qish boyichamas azizning girlfiendi bn bo'lsin juda qiziq bo'lsin davomi o'quvchini intizorlik bn kutishga majburlasin ajoyib qilib ber shunaqa

**81.** `14:56`

> endi esa ishga boyagi websiteni rivojlantirishga qaratsak , u juda qotib ishlayapti bir narsaga kirish uchun taxminam 30 , 40 sec olyapti  sabab nimada shuni aniqlab muommoni hal qil

**82.** `15:16`

> Ha, tez

**83.** ⏩ `15:16`

> [object Object],[object Object]

**84.** 📎 `15:27` · 1 ta rasm

> bunga qara yuqoridagi logo uncha yaxshi ko'rinmayapti shuni ham chiroyli qilib ber

**85.** `15:29`

> endi manga manashu vebsaytni judayam ajoyib jozibali qilish uchun shunga mos animatsiyalar disignerlar va boshqalar taklif qilib ko'rsat

**86.** `15:36`

> Tavsiyangni qil

**87.** `15:46`

> @"C:\Users\user\Downloads\sticker.webm" @"C:\Users\user\Downloads\sticker.webm" @"C:\Users\user\Downloads\AnimatedSticker.tgs"
> manashularni ballarga qarab oxirida chiqarib ber 1 chini 100 ball olsa  2 chini 85 yoki 90 bo'lsa ,3 chisi 80 bo'lsa shunga o'xshashlarni ballariga qarab belgilab ber qiziqarlilarini

**88.** ⏩ `15:47`

> @"C:\Users\user\Downloads\sticker.webm"
> buniyam ol

**89.** `15:54`

> qani mangayam ko'rsatchi amalda oz'ing

**90.** ⏩ `15:56`

> [object Object],[object Object]

**91.** ⏩ `15:57`

> 30 dan 30 ga bunimas qora mushuknikini qo'y ikkalasini almashla va qolganlarini ham faqat shu joyini ketma ket ko'rsat

**92.** `16:05`

> hozircha bo'ladi , endi hammasini umumiy reytinglari chart qilib chiroyli qilib har bir testlarda vazifalarda ko'rsatkichlarini ko'rsatib bor va har oy oxirida eng oldindan ing yomon o'quvchi dars qilmagan o'quvchilarni ham ko'rsatadigan qil kn manga hammasini umumiy qilib ko'rsatadigan qil diamram chartlarda qanday ketib boryaptilar shular haqida

**93.** `16:19`

> Try again

**94.** `16:24`

> tayoqchalar bilan ham qilib ber chiroyli qilib pie chart , bar chartmi shularini ham chiroyli disignli qilib

**95.** `16:30`

> endi bitta o'quvchi teacherdan ruxsat so'rab boshqa qurslarda qatnashishini so'rash qilib ber

**96.** `18:50`

> I hit my usage limit while you were working, but it has reset now. Please continue from where you left off.

**97.** ⏩ `18:50`

> hozircha bo'ladi , endi hammasini umumiy reytinglari chart qilib chiroyli qilib har bir testlarda vazifalarda ko'rsatkichlarini ko'rsatib bor va har oy oxirida eng oldindan ing yomon o'quvchi dars qilmagan o'quvchilarni ham ko'rsatadigan qil kn manga hammasini umumiy qilib ko'rsatadigan qil diamram chartlarda qanday ketib boryaptilar shular haqida

**98.** `19:05`

> @"C:\Users\user\Downloads\Story Writing — The Story Mountain.pdf"
> manashuni qizni ismini ravshanoy qiz, joyni toshkentmas  urganch qil va cafeni tokya restaunat qil

**99.** ⏩ `19:07`

> tezlash

**100.** ⏩ `19:07`

> tezroq hikoyani qilibb ber

**101.** `21:44`

> qani endi websiteni davom ettirsak

**102.** `21:51`

> qani endi websiteni davom ettirsak

**103.** 🅰 `21:52`

> "Saytda keyin nima bilan shug'ullanamiz?"="boshida bir ajoyib qilib slide show qil qani hammasini qanday ketyotganligini nimalar borligini ko'rsatib"

**104.** ⏩ `21:55`

> bo'ldi buni to'xtat

**105.** `21:56`

> hozircha menga beginnerni homework qismidagi deadlineni ertadan qilib ber

**106.** ⏩ `21:57`

> va muddat 7 dan 7 gacha yani 1 kun bo'lsin to'liq

**107.** `22:00`

> endi bunga notepadmi shunga o'xshash joyni qo'sh birirta bo'limga kirgandan keyin bu yerda bunday qilasz oldin readingni ishlaysz kn listening mana bunda kn speaking speakingga mana shunday bo'lishi kerak deydigan qisqacha chatni to'lik malumotini bilmaydigan o'quvchilarga tushuntrsh uchun qollanma va saytni ingliz tilida qil va notepadni esa tilni tashlash imkonini ber uzb eng rus deb

**108.** 🅰 `22:01`

> "Saytni inglizchaga o'girishda qaysi qismini o'giray? (Kodda 600 dan ortiq o'zbekcha matn bor, o'qituvchi paneli ham shunchalik katta.)"="[No preference]", "AI tekshirgandan keyin xatolarni qaysi tilda tushuntirsin?"="O'zbekcha qolsin (Recommended)"

**109.** `22:19`

> @"C:\Users\user\OneDrive\Desktop\New Headway English Course - Beginner (Tests).pdf"
> endi har bir unit ni level testidan oldin qanday testlar tushushuga o'xshash qilib 14 ta va level test bilan 15 ta qilib alohida yasash kerak lekin bu platniy bo'lishi kerak man karta tashlayman o'shanga ishlamoqchi bo'lgan oq'uvchi 20 ming so'm o'tkazishi kerak bo'ladi yuqorida tashlagan faylimdaka qilasan lekin uni tog'ri o'zini bermaysan shunga o'xshash bo'lsin lek 100 % o'zini olma faqat qolib bir bo'lsin  qani qilib ko'rchi

**110.** ⏩ `22:22`

> @"C:\Users\user\OneDrive\Desktop\english\Beginner Final Exam Name.docx"
> bu esa level test qolganlari esa unit testlari shulardan faqat qolibini olib qil testlarni level test ni narxini esa 40 ming qilib qo'y va  shunday pullik testlarni jozibali va shunday so'zlar bilan yozki oq'uvchilar shuni sotib olishga majbur bo'lsin

**111.** ⏩ `22:33`

> 5614 6814 0409 8836
>  Ismoilova Maftuna karta

**112.** 📎 `22:40` · 1 ta rasm

> endi shu pullik testlarni manashunaqa qilish kerakmi o'zing takliflar bergin o'quvchilarni diqqatini dortadigan shularni xarid qilishga undaydigan qilib chiroyli qilib ber\

**113.** `22:44`

> kitob muqovasi ko'rinishida qilma boshqacharos qil

**114.** 📎 `22:46` · 1 ta rasm

> manashu yerga  bular yoniga qo'sh pullik testlarni o'ziga jalb qiladigan qilib qo'y

**115.** `22:48`

> bosh sahifada anavunaqa ko'rgazma qilmabsanku

**116.** `22:49`

> manga ham pullik testlarni ko'rinadigan qilib qo'y

**117.** ⏩ `22:51`

> level testni eng oxirida qo'y

**118.** `22:55`

> endi manga video qilib berolasanmi manashu hamma funksiyalari bir xator ko'rsatib  telegram storylarda yangillanish bo'ganda tushuntirb ko'rsatib video qilib beradiku oshanaqa qilib ajoyib designlar bilan

**119.** `23:00`

> video juda ham zo'r chiqsin yoritishlar animaltsiyalar bilan ko'rganlarni jalb qilsin  anavi stikerlari ni xam kirit

**120.** `23:06`

> qani ber tezroq'

**121.** `23:14`

> @"C:\Users\user\Videos\Screen Recordings\Screen Recording 2026-11-18 231220.mp4"
> saytimiz yangilandi deb emas ma tashlagan video kabi qil yani mahtash namoyish qilish uchun

**122.** ⏩ `23:20`

> keyin tushuntrish yani note ni rangini o'zgartir oq yarashmabdi tomniy yashilmi shunga o'xshash ranglardan qo'y

**123.** `23:25`

> be quick

**124.** `23:26`

> bo'ldimi

**125.** `23:32`

> hoziracha manashu vebsite yaratishdagi barcha hamma promptini ber bir narsayam qolmasin

