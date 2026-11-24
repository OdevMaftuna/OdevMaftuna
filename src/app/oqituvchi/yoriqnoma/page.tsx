import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireTeacher } from "@/lib/auth";
import { SupportDeskSection } from "@/components/support-desk-section";
import { createAdminClient } from "@/lib/supabase/admin";
import { CopyText } from "./copy-text";

export const metadata: Metadata = { title: "Yo‘riqnoma" };

/* ---------------- kichik bloklar ---------------- */
function Section({ id, n, icon, title, children }: { id: string; n: number; icon: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[26px] border border-white/[0.08] bg-[#101714] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#F5C76A]/15 text-2xl">{icon}</span>
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">{n}-QISM</p>
          <h2 className="text-[20px] font-black leading-tight tracking-tight text-white">{title}</h2>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#cfd6d2]">{children}</div>
    </section>
  );
}

function Step({ n, title, children, tone = "#F5C76A" }: { n: number | string; title: string; children: ReactNode; tone?: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-black text-[#0d1512]" style={{ background: tone }}>
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <b className="block text-white">{title}</b>
        <div className="text-[13.5px] text-[#cfd6d2]">{children}</div>
      </div>
    </div>
  );
}

function Go({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-[#7ddc5a] underline decoration-[#7ddc5a]/40 underline-offset-2 hover:decoration-[#7ddc5a]">
      {children}
    </Link>
  );
}

function Note({ tone = "gold", children }: { tone?: "gold" | "red" | "green"; children: ReactNode }) {
  const c = { gold: "border-[#F5C76A]/40 bg-[#F5C76A]/[0.07] text-[#ffe9b0]", red: "border-[#ff6a5a]/40 bg-[#ff6a5a]/[0.07] text-[#ffc2b8]", green: "border-[#22c55e]/40 bg-[#22c55e]/[0.07] text-[#c4f5c9]" }[tone];
  return <div className={`rounded-2xl border px-4 py-3 text-[13.5px] ${c}`}>{children}</div>;
}

const TOC = [
  ["vazifa", "🎯", "Sizning vazifangiz"],
  ["kun", "🗓", "Kunlik ish tartibi"],
  ["yuz", "💯", "100/100 qoidasi"],
  ["majbur", "🔥", "Ishlashga undash"],
  ["sayt", "🧭", "Sayt bo‘limlari"],
  ["guruh", "👥", "Guruh va checklist"],
  ["xabar", "💬", "Tayyor xabarlar"],
  ["checklist", "✅", "Kunlik checklist"],
  ["savol", "❓", "Ko‘p beriladigan savollar"],
] as const;

/** YO'RIQNOMA: yordamchi (support) o'qituvchilar uchun — vazifalar, kunlik tartib, 100/100 qoidasi va saytdan foydalanish. */
export default async function GuidePage() {
  const me = await requireTeacher();
  // Kim qaysi guruhga mas'ul (0023) — jonli ro'yxat.
  const admin = createAdminClient();
  const [{ data: groupRows }, { data: teacherRows }] = await Promise.all([
    admin.from("class_groups").select("name, support_id, sort").not("support_id", "is", null).order("sort"),
    admin.from("profiles").select("id, full_name").eq("role", "teacher"),
  ]);
  const tName = new Map(((teacherRows ?? []) as { id: string; full_name: string }[]).map((t) => [t.id, t.full_name]));
  const owners = new Map<string, string[]>();
  for (const g of (groupRows ?? []) as { name: string; support_id: string }[]) owners.set(g.support_id, [...(owners.get(g.support_id) ?? []), g.name]);
  const myGroups = owners.get(me.id) ?? [];

  return (
    <section className="mx-auto max-w-3xl space-y-5 pb-6">
      {/* HERO */}
      <div className="relative overflow-clip rounded-[30px] border border-[#F5C76A]/30 p-6" style={{ background: "radial-gradient(120% 120% at 100% 0%, #3a2c10 0%, #16201b 50%, #0b110f 100%)" }}>
        <span aria-hidden className="sc-glow sc-glow-1" />
        <span aria-hidden className="wr-env absolute -right-2 top-2 text-[90px] opacity-20">
          📘
        </span>
        <p className="relative text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">🛟 SUPPORT O‘QITUVCHI UCHUN</p>
        <h1 className="relative mt-1 text-[30px] font-black leading-tight tracking-tight text-white sm:text-[36px]">Yo‘riqnoma</h1>
        <p className="relative mt-2 max-w-xl text-[15px] text-[#e9ecea]">
          Siz — o‘quvchilarning <b className="text-[#F5C76A]">natijasi uchun mas’ul</b> odamsiz. Har bir o‘quvchi <b className="text-white">har kuni ishlashi</b> va har bir testdan <b className="text-white">100/100</b> olishi — sizning ishingiz.
        </p>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["📋", "Har kuni", "kim ishladi — tekshiring"],
            ["📣", "Undang", "ishlamaganni ishlating"],
            ["💯", "100/100", "tushuntiring, qayta ishlating"],
          ].map(([i, a, b]) => (
            <div key={a} className="rounded-2xl border border-white/10 bg-black/25 px-2 py-3">
              <p className="text-2xl">{i}</p>
              <b className="block text-[14px] text-white">{a}</b>
              <span className="text-[11px] text-[#a3ada8]">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SHAXSIY: mas'ul guruhlar va bugungi ish */}
      {myGroups.length ? (
        <SupportDeskSection supportId={me.id} name={me.fullName} />
      ) : null}

      {owners.size ? (
        <div className="rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4">
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">👥 KIM NIMAGA MAS’UL</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {[...owners].map(([id, names]) => (
              <li key={id} className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 ${id === me.id ? "bg-[#F5C76A]/10" : "bg-white/[0.03]"}`}>
                <b className="text-white">🛟 {tName.get(id) ?? "Support"}</b>
                <span className="text-[#cfd6d2]">→ {names.join(", ")}</span>
                {id === me.id ? <span className="rounded-full bg-[#F5C76A] px-2 py-0.5 text-[10px] font-black text-[#1d1608]">SIZ</span> : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-[#a3ada8]">Mas’ul support o‘z guruhidagi har bir o‘quvchi <b className="text-white">vazifani bajarishi</b> va <b className="text-white">natijasi</b> uchun javob beradi. Har bir qilgan ishingizni tugma bilan belgilang (📩 eslatma, 📞 qo‘ng‘iroq, 📚 tushuntirdim, 💯 100 oldi) — asosiy o‘qituvchi har kuni ko‘rib boradi.</p>
        </div>
      ) : null}

      {/* MUNDARIJA */}
      <nav className="rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4">
        <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#a3ada8]">MUNDARIJA</p>
        <ol className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {TOC.map(([id, i, t], k) => (
            <li key={id}>
              <a href={`#${id}`} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-[#e9ecea] hover:bg-white/[0.05]">
                <span className="text-[#808a85]">{k + 1}.</span> {i} {t}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1 */}
      <Section id="vazifa" n={1} icon="🎯" title="Sizning vazifangiz">
        <p>Support o‘qituvchi — dars bermaydi, lekin <b className="text-white">har bir o‘quvchining ishlashini kuzatadi va natijaga olib chiqadi</b>. Sizning 4 ta asosiy vazifangiz:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["👀", "Kuzatish", "Har kuni kim uy vazifasini bajardi, kim bajarmadi — bilib turish."],
            ["📣", "Ishlatish", "Bajarmaganlarga eslatish, yozish, kerak bo‘lsa qo‘ng‘iroq qilish — bajarguncha."],
            ["🧑‍🏫", "Tushuntirish", "Past ball olganga mavzuni tushuntirish (chatda yoki yuzma-yuz)."],
            ["💯", "100/100 ga yetkazish", "Tushuntirgandan keyin testni qayta ishlatish — 100/100 bo‘lguncha."],
          ].map(([i, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
              <p className="text-2xl">{i}</p>
              <b className="mt-1 block text-white">{t}</b>
              <span className="text-[13px]">{d}</span>
            </div>
          ))}
        </div>
        <Note tone="red">
          <b>Asosiy qoida:</b> o‘quvchi ishlamasa yoki past ball olsa — bu sizning ham natijangiz. “Ishlamadi” deb qoldirmang — <b>sababini bilib, ishlating</b>.
        </Note>
      </Section>

      {/* 2 */}
      <Section id="kun" n={2} icon="🗓" title="Kunlik ish tartibi">
        <p>Har kuni shu tartibda ishlang (taxminan 30–60 daqiqa):</p>
        <Note tone="green">
          <b>🎯 “Sizning bugungi ishingiz”</b> kartasi (Bosh sahifa va shu sahifaning tepasida) — faqat <b>sizga biriktirilgan guruh</b>. U yerda: kim bajarmagan (📩 Eslatma yuborish / 📞 Qo‘ng‘iroq qildim) va kim past ball olgan (📚 Mavzuni tushuntirdim / 💯 Qayta ishlab 100 oldi). Har bir ishni shu tugmalar bilan belgilang — <b>belgilanmagan ish qilinmagan hisoblanadi</b>.
        </Note>
        <div className="space-y-3">
          <Step n="1" title="Ertalab — kechagi natija" tone="#5ab0ff">
            <Go href="/oqituvchi">Bosh sahifa</Go> → <b>“📋 Kunlik nazorat”</b>. Har bir guruh kartasida pastda <b>“Kechagi: …”</b> — kecha bajarmaganlar ro‘yxati. Ularning har biriga yozing: nega bajarmadi, qachon bajaradi.
          </Step>
          <Step n="2" title="Kun davomida — bugungi vazifa" tone="#F5C76A">
            Yashil ✓ — bajardi, qizil ✗ — hali bajarmagan. Qizil ismni bossangiz — o‘sha o‘quvchi bilan <b>chat</b> ochiladi. Vaqt qancha qolgani ham yozilgan (masalan “⏰ 5 soat 20 daqiqa qoldi”).
          </Step>
          <Step n="3" title="Muddatga 4 soat qolganda — eslatma" tone="#ff8a5a">
            <b>“⚠️ Bajarmagan N kishiga eslatma yuborish”</b> tugmasini bosing — har biriga chatda eslatma boradi. Pastdan chiqadigan qizil ogohlantirish ham shuni eslatadi.
          </Step>
          <Step n="4" title="Past natija — darhol ishlang" tone="#ff6a5a">
            “⚠️ Past natija — shu o‘quvchilar bilan ishlang” — 60% dan past olganlar. Ular bilan <Go href="#yuz">100/100 qoidasi</Go> bo‘yicha ishlang.
          </Step>
          <Step n="5" title="Kechqurun — umumiy holat" tone="#22c55e">
            <Go href="/oqituvchi/support">🛟 Support markazi</Go> → <b>“Kim bilan shug‘ullanish kerak”</b>: ko‘p vazifa qoldirgan, uzoq vaqt kirmagan, natijasi tushganlar. Ertangi rejangizni shunga qarab tuzing.
          </Step>
        </div>
        <Note>
          💡 Ogohlantirishlar telefoningizga ham kelsin: ogohlantirish oynasidagi <b>“🔔 Bildirishnomalarni yoqish”</b> ni bir marta bosing. Saytni telefoningizga ilova qilib ham o‘rnating (bosh sahifadagi “📲 Bosh ekranga qo‘shish”).
        </Note>
      </Section>

      {/* 3 */}
      <Section id="yuz" n={3} icon="💯" title="100/100 qoidasi">
        <p>
          Har bir test, mashq va uy vazifasining maqsadi — <b className="text-[#F5C76A]">100 dan 100</b>. Kam ball — o‘quvchi mavzuni hali tushunmagani. Sizning ishingiz — tushuntirib, qayta ishlatish.
        </p>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="mb-3 text-[11px] font-extrabold tracking-[0.2em] text-[#a3ada8]">4 QADAM — HAR BIR PAST NATIJA UCHUN</p>
          <div className="space-y-3">
            <Step n={1} title="Xatolarni ko‘ring">
              <Go href="/oqituvchi/oquvchilar">O‘quvchilar</Go> → o‘quvchi → <b>Natijalari</b>. Qaysi savollarda xato qilgani, nima yozgani — hammasi ko‘rinadi (har xatoga izoh bilan).
            </Step>
            <Step n={2} title="Mavzuni tushuntiring">
              Xatolar qaysi qoidaga tegishli bo‘lsa — o‘shani tushuntiring: chatda qisqa yozib yoki darsdan keyin yuzma-yuz. Saytdagi mavzu sahifasidagi qoida (Rule) va misollardan foydalaning.
            </Step>
            <Step n={3} title="Qayta ishlating">
              O‘quvchi mashq sahifasida <b>“↻ Qayta ishlash”</b> tugmasini bosib qaytadan ishlaydi. Eng yaxshi natija saqlanadi — oldingi urinish ham ko‘rinib turadi.
            </Step>
            <Step n={4} title="100/100 bo‘lguncha takrorlang" tone="#22c55e">
              Natijani tekshiring. 100 bo‘lmasa — qolgan xatolarni tushuntirib, yana ishlating. <b>100/100 bo‘lgandagina</b> bu o‘quvchi bilan bu mavzu yopiladi. Maqtashni unutmang! 🎉
            </Step>
          </div>
        </div>
        <Note tone="green">
          <b>Nima hisoblanadi:</b> uy vazifalari (har kungi), lug‘at va grammatika mashqlari, Writing (AI bahosi), pullik imtihon testlari. Hammasida o‘quvchi xatosini va to‘g‘ri javob izohini ko‘radi.
        </Note>
      </Section>

      {/* 4 */}
      <Section id="majbur" n={4} icon="🔥" title="O‘quvchini ishlashga undash">
        <p>Ishlamayotgan o‘quvchiga bosqichma-bosqich yondashing:</p>
        <ol className="space-y-2">
          {[
            ["1-kun", "Chatda iliq eslatma (pastdagi tayyor xabarlar). Ko‘pincha shu yetadi."],
            ["2-kun", "Yana yozing + sababini so‘rang: vaqt yo‘qmi, tushunmayaptimi, telefoni yo‘qmi? Muammoni birga hal qiling."],
            ["3-kun", "Qo‘ng‘iroq qiling yoki darsda alohida gaplashing. Kerak bo‘lsa — ota-onaga xabar bering."],
            ["Hali ham", "Asosiy o‘qituvchiga (Maftuna) xabar bering — birga hal qilamiz."],
          ].map(([d, t]) => (
            <li key={d} className="flex gap-3 rounded-2xl bg-white/[0.03] px-3.5 py-2.5">
              <b className="w-16 shrink-0 text-[#F5C76A]">{d}</b>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <p className="pt-1 font-bold text-white">Motivatsiya uchun nimalardan foydalaning:</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["🚗", "Wanderland", "Har ishlagan kuni mashinasi yuradi. Bir kun qoldirsa — halokat va boshidan. “Seriyangni uzma!” deng."],
            ["👫", "Do‘stlar bilan bellashuv", "ID orqali do‘st qo‘shib, kim oldinda — ko‘rinadi. Raqobat ishlatadi!"],
            ["⭐", "Maqtov", "Support markazidagi “Yulduzlar” ni guruhda maqtang — boshqalar ham intiladi."],
          ].map(([i, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-2xl">{i}</p>
              <b className="block text-white">{t}</b>
              <span className="text-[13px]">{d}</span>
            </div>
          ))}
        </div>
        <Note tone="red">
          ❌ <b>Qilmang:</b> o‘quvchi o‘rniga test ishlamang, javobni aytib bermang, parolini so‘ramang, qo‘pol gapirmang. Maqsad — o‘quvchi <b>o‘zi tushunib</b> 100 olsin.
        </Note>
      </Section>

      {/* 5 */}
      <Section id="sayt" n={5} icon="🧭" title="Sayt bo‘limlari — qayerda nima">
        <div className="grid gap-2">
          {[
            ["🏠", "Bosh sahifa", "/oqituvchi", "Kunlik nazorat: bugungi vazifa kim bajardi / bajarmadi, qancha vaqt qoldi, eslatma tugmasi, past natijalar."],
            ["🛟", "Support markazi", "/oqituvchi/support", "Butun guruh natijasi: kim bilan shug‘ullanish kerak (sabablari bilan), trendlar, davomat xaritasi, yulduzlar."],
            ["✅", "Guruhlar", "/oqituvchi/guruhlar", "Guruh checklisti (offline mavzu/lug‘at), o‘quvchi qo‘shish/chiqarish, kim saytga kirmagan."],
            ["💬", "Chat", "/oqituvchi/chat", "Har o‘quvchi bilan yozishma. Barcha o‘qituvchilar ko‘radi va javob beradi."],
            ["👤", "O‘quvchilar", "/oqituvchi/oquvchilar", "Har o‘quvchining natijalari, xatolari, mashqlari — 100/100 ishi shu yerdan boshlanadi."],
            ["✍️", "Writing", "/oqituvchi/writing", "O‘quvchilar yozgan xatlar, AI bahosi va izohi."],
            ["📚", "Mashqlar", "/oqituvchi/mashqlar", "Barcha mavzu va lug‘at mashqlari — o‘quvchi nimani ko‘rishini oldindan ko‘rish."],
            ["📊", "Hisobot / Seriyalar", "/oqituvchi/hisobot", "Oylik hisobot va Wanderland seriyalari."],
          ].map(([i, t, h, d]) => (
            <Link key={t} href={h} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-[#7ddc5a]/50">
              <span className="text-2xl">{i}</span>
              <span className="min-w-0">
                <b className="block text-white">{t} →</b>
                <span className="text-[13px]">{d}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* 6 */}
      <Section id="guruh" n={6} icon="👥" title="Guruh va checklist bilan ishlash">
        <div className="space-y-3">
          <Step n="✓" title="Offline topshirganini belgilash" tone="#22c55e">
            Guruh sahifasida <b>Mavzular</b> yoki <b>Lug‘atlar</b> jadvalidagi katakchani bosing — ✓ qo‘yiladi (yana bossangiz — olib tashlanadi). Test natijalari o‘zi tushadi.
          </Step>
          <Step n="➕" title="Yangi o‘quvchi keldi" tone="#5ab0ff">
            Guruh sahifasining pastida <b>“Yangi o‘quvchi qo‘shish”</b>: ism familiya + telefon. O‘quvchi saytda shu telefon bilan ro‘yxatdan o‘tsa — o‘zi guruhga bog‘lanadi va “Siz shu guruhdasiz” deb ko‘radi.
          </Step>
          <Step n="🚪" title="O‘quvchi ketdi" tone="#ff8a5a">
            Ism yonidagi <b>✕</b> ni bosing — o‘quvchi “Ketganlar” ro‘yxatiga o‘tadi (o‘chirilmaydi, qaytarish mumkin).
          </Step>
          <Step n="⛔" title="“Hisob yo‘q” deb turibdi" tone="#ff6a5a">
            O‘quvchi saytda ro‘yxatdan o‘tmagan. Unga yordam bering: telefonida saytni ochib, <b>Ro‘yxatdan o‘tish</b> → Gmail, parol va <b>telefon raqamini</b> yozdiring. Shundan keyin u guruhga o‘zi bog‘lanadi.
          </Step>
        </div>
      </Section>

      {/* 7 */}
      <Section id="xabar" n={7} icon="💬" title="Tayyor xabarlar (nusxa olib ishlating)">
        <div className="grid gap-2.5">
          <CopyText title="⏰ Vazifa eslatmasi" text={"Assalomu alaykum! 😊 Bugungi uy vazifasi hali topshirilmagan. Muddat tugashiga oz qoldi — hozir 20–30 daqiqa ajratib bajarib qo‘ying. Savol bo‘lsa yozing, yordam beraman!"} />
          <CopyText title="❓ Kecha bajarmagan" text={"Salom! Kechagi vazifa bajarilmay qoldi. Nima bo‘ldi — vaqt bo‘lmadimi yoki biror joyi tushunarsiz bo‘ldimi? Yozing, birga hal qilamiz. Bugungisini esa albatta bajaring 💪"} />
          <CopyText title="💯 Past natija — qayta ishlash" text={"Testni ko‘rdim — yaxshi harakat! 👏 Lekin bir nechta xato bor. Keling, qoidani qisqa tushuntiraman, keyin “Qayta ishlash” tugmasini bosib yana ishlang. Maqsad — 100/100! 🎯"} />
          <CopyText title="🚗 Seriya (Wanderland)" text={"Wanderland’dagi mashinangiz to‘xtab qoldi! 🚗 Bugun bitta vazifa yoki mashq ishlasangiz — yana yo‘lga chiqadi. Seriyangizni uzmang! 🔥"} />
          <CopyText title="🎉 Maqtov" text={"Barakalla! 🎉 Bugungi vazifa 100/100! Siz guruhdagi eng yaxshilardansiz ⭐ Shu tempda davom eting!"} />
          <CopyText title="📱 Saytga kirmagan (hisob yo‘q)" text={"Assalomu alaykum! NSP saytida hali ro‘yxatdan o‘tmagansiz. Iltimos: nsp-language-center.vercel.app → “Ro‘yxatdan o‘tish”. Gmail, parol va telefon raqamingizni yozing — guruhingiz o‘zi chiqadi. Qiyin bo‘lsa, darsda yordam beraman 😊"} />
          <CopyText title="👪 Ota-onaga" text={"Assalomu alaykum! NSP o‘quv markazidan bezovta qilyapmiz. Farzandingiz so‘nggi kunlarda uy vazifalarini bajarmayapti. Iltimos, uyda har kuni 30 daqiqa ajratishiga yordam bering. Natijalarini birga kuzatib boramiz. Rahmat!"} />
        </div>
      </Section>

      {/* 8 */}
      <Section id="checklist" n={8} icon="✅" title="Kunlik checklist">
        <ul className="space-y-1.5">
          {[
            "Bosh sahifa → “Kechagi” bajarmaganlarga yozdim",
            "Bugungi vazifa holatini ko‘rdim (✓ / ✗)",
            "Muddatga 4 soat qolganda “Eslatma yuborish”ni bosdim",
            "Past natija olganlarga mavzuni tushuntirdim",
            "Ularni qayta ishlatdim — 100/100 ga yetkazdim (yoki ertaga davom)",
            "Offline topshirganlarni Guruhlar checklistida belgiladim",
            "Yangi kelgan / ketgan o‘quvchilarni guruhda yangiladim",
            "Support markazi → “Kim bilan shug‘ullanish kerak” ni ko‘rdim",
            "Yaxshi ishlaganlarni maqtadim ⭐",
          ].map((t) => (
            <li key={t} className="flex gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2">
              <span className="text-[#22c55e]">☐</span>
              {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* 9 */}
      <Section id="savol" n={9} icon="❓" title="Ko‘p beriladigan savollar">
        {[
          ["O‘quvchi parolini unutdi.", "O‘quvchilar sahifasidan unga yangi parol bera olasiz (yoki asosiy o‘qituvchiga ayting)."],
          ["O‘quvchi vazifani bajardi, lekin ro‘yxatda ✗ turibdi.", "Saytdagi hisobi guruhga bog‘lanmagan bo‘lishi mumkin (“hisob yo‘q”). Guruh sahifasida 🔗 orqali bog‘lang yoki o‘quvchi bosh sahifasida telefon raqamini kiritsin."],
          ["Muddat o‘tib ketdi — endi nima qilamiz?", "O‘quvchi sabab yozadi (sayt o‘zi so‘raydi). Siz baribir mavzuni ishlatib, keyingi vazifani o‘z vaqtida bajarishini nazorat qiling."],
          ["AI bahosi noto‘g‘riga o‘xshaydi.", "Asosiy o‘qituvchiga ayting — bahoni qo‘lda tuzatish mumkin."],
          ["Eslatma yubordim, lekin o‘quvchi ko‘rmayapti.", "O‘quvchi saytga kirganda bosh sahifada yangi xabar belgisini ko‘radi. Telegram yoki qo‘ng‘iroq orqali ham eslating."],
        ].map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <summary className="cursor-pointer list-none font-bold text-white">
              <span className="mr-2 text-[#F5C76A] transition group-open:rotate-90">›</span>
              {q}
            </summary>
            <p className="mt-2 text-[13.5px]">{a}</p>
          </details>
        ))}
      </Section>

      <div className="rounded-[22px] border border-[#22c55e]/30 bg-[#22c55e]/[0.06] p-5 text-center">
        <p className="text-3xl">💪</p>
        <p className="mt-1 text-[17px] font-black text-white">Har bir o‘quvchi — har kuni — 100/100.</p>
        <p className="text-sm text-[#cfd6d2]">Savol bo‘lsa — asosiy o‘qituvchiga yozing. Omad!</p>
      </div>
    </section>
  );
}
