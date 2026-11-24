/**
 * SEFR (CEFR) MULTILEVEL WRITING — mock formatida. Hozircha faqat Task 1: 1.1 (informal) va 1.2 (formal).
 * Barcha mocklar, model javoblar, jadvallar va mashqlar NSP uchun ORIGINAL yozilgan (boshqa manbadan ko'chirilmagan).
 *
 * Model javobdagi belgilar: [l:...] linking · [v:...] topic vocabulary · [o:...] opinion / feelings ·
 * [p:...] fixed phrase · [g:...] greeting & sign-off / esse qolipi · [r:...] grammar structure.
 * Writing attempt card_id: `ml-<n>-t11`, `ml-<n>-t12`; mashq natijasi: `ml-<n>-quiz`.
 */

export type MlTaskKey = "t11" | "t12";

export type Row3 = { en: string; uz: string; ex: string };

export type MlTask = {
  key: MlTaskKey;
  label: string;
  kind: string;
  register: "informal" | "formal" | "neutral";
  words: [number, number];
  prompt: string;
  plan: string[];
  /** Har bir xatboshi: sarlavha (o'zbekcha) va belgilangan matn. */
  model: { title: string; text: string }[];
  collocations: Row3[];
  phrases: Row3[];
  grammar: { name: string; ex: string }[];
  upgrade: { b1: string; b2: string }[];
  mistakes: { wrong: string; right: string }[];
};

export type MlQuestion =
  | { type: "choice"; q: string; options: string[]; answer: number; explain: string; tag: string }
  | { type: "order"; q: string; words: string[]; explain: string; tag: string };

export type MlMock = {
  id: string;
  no: number;
  title: string;
  icon: string;
  color: string;
  context: string;
  letter: { greeting: string; body: string; from: string };
  tasks: [MlTask, MlTask];
  practice: MlQuestion[];
};

/** Multilevel writing qanday baholanadi (taxminiy, rasmiy shkala asosida). */
export const ML_CRITERIA = [
  { key: "Task achievement", uz: "Vazifani bajarish", text: "Savoldagi hamma narsaga javob berdingizmi? Maqsad aniqmi, fikrlar misol bilan rivojlanganmi, hajm to‘g‘rimi?" },
  { key: "Coherence & cohesion", uz: "Izchillik va bog‘lanish", text: "Xatboshilar mantiqiy ketma-ketmi? Linking so‘zlar (However, In addition, As a result…) to‘g‘ri va xilma-xilmi?" },
  { key: "Lexical resource", uz: "So‘z boyligi", text: "Mavzuga oid collocationlar, aniq so‘zlar, takrorlanmaslik, imlo." },
  { key: "Grammar range & accuracy", uz: "Grammatika", text: "Murakkab gaplar (relative clause, conditional, passive, perfect) va ulardagi aniqlik." },
];

/** Har bir task vazni (umumiy 75 ballga aylantirish uchun). */
/** Hozircha faqat Task 1 (1.1 + 1.2): rasmiy imtihondagi nisbat bo'yicha (15% : 35%). */
export const ML_WEIGHTS: Record<MlTaskKey, number> = { t11: 0.3, t12: 0.7 };

/** 75 ballik natija → CEFR daraja (Multilevel). */
export function mlLevel(score75: number): { level: string; color: string } {
  if (score75 >= 65) return { level: "C1", color: "#b388ff" };
  if (score75 >= 51) return { level: "B2", color: "#3ddc97" };
  if (score75 >= 38) return { level: "B1", color: "#F5C76A" };
  return { level: "B1 dan past", color: "#ff8a8a" };
}

export const ML_MARKS: Record<string, { label: string; cls: string }> = {
  l: { label: "linking", cls: "bg-[#F5C76A]/25 text-[#ffe3a3] rounded px-0.5" },
  v: { label: "topic vocabulary", cls: "text-[#5fe0a8] font-bold" },
  o: { label: "opinion / feelings", cls: "text-[#c9a7ff] italic font-bold" },
  p: { label: "fixed phrases", cls: "bg-[#ff7ab6]/20 text-[#ffc2dd] rounded px-0.5" },
  g: { label: "greeting / esse qolipi", cls: "bg-[#5ab0ff]/20 text-[#bfe0ff] rounded px-0.5" },
  r: { label: "grammar structures", cls: "underline decoration-[#F5C76A] decoration-2 underline-offset-4 font-semibold text-white" },
};

/** "[v:loyalty card]" belgilarini olib tashlab, toza matn qaytaradi. */
export const plainModel = (task: MlTask) => task.model.map((p) => p.text.replace(/\[[a-z]:([^\]]+)\]/g, "$1")).join("\n\n");

export const ML_MOCKS: MlMock[] = [
  /* =========================================================== MOCK 1 */
  {
    id: "ml-1",
    no: 1,
    title: "The Community Library",
    icon: "📚",
    color: "#5ab0ff",
    context: "You are a member of your town’s community library. The library has sent an email to all members.",
    letter: {
      greeting: "Dear Members,",
      body: "Fewer people have been visiting our library this year, and we may have to reduce our opening hours. Before we make a decision, we would like to hear from you. What new services, events or changes would encourage you to visit more often?",
      from: "The Library Manager",
    },
    tasks: [
      {
        key: "t11",
        label: "Task 1.1",
        kind: "Informal message · to a friend",
        register: "informal",
        words: [50, 70],
        prompt: "Write a message to a friend who is also a member of the library. Tell them about the email and share your ideas.",
        plan: ["1-band (~10 so‘z): salom + emailni eslatish", "2-band (~40 so‘z): his-tuyg‘u + 2–3 g‘oya", "3-band (~10 so‘z): taklif + xayrlashuv"],
        model: [
          { title: "Salom va kirish", text: "[g:Hi Kamola,]\n[p:Have you seen] the email from the library?" },
          { title: "His-tuyg‘u va g‘oyalar", text: "[o:It’s a real shame] that they [r:might have to] close earlier. [l:If you ask me,] they need more for young people. [v:A weekend book club] [l:and] [v:a quiet study room] with [v:fast Wi-Fi] [r:would bring] students back. [l:Also,] [v:a coffee corner] [p:wouldn’t hurt!]" },
          { title: "Yakun", text: "[p:Shall we reply] together after class?\n[g:Speak soon,]\nNodira" },
        ],
        collocations: [
          { en: "a book club", uz: "kitobxonlar klubi", ex: "A weekend book club would be fun." },
          { en: "a quiet study room", uz: "sokin o‘qish xonasi", ex: "Students need a quiet study room." },
          { en: "fast Wi-Fi", uz: "tez internet", ex: "Fast Wi-Fi keeps people longer." },
          { en: "opening hours", uz: "ish vaqti", ex: "They may cut the opening hours." },
          { en: "to close earlier", uz: "erta yopilmoq", ex: "The library might close earlier." },
          { en: "a coffee corner", uz: "qahva burchagi", ex: "A coffee corner wouldn’t hurt." },
        ],
        phrases: [
          { en: "Have you seen …?", uz: "… ni ko‘rdingmi?", ex: "Have you seen the email from the library?" },
          { en: "It’s a real shame that …", uz: "… juda achinarli", ex: "It’s a real shame that they might close." },
          { en: "If you ask me, …", uz: "Menimcha, …", ex: "If you ask me, they need more events." },
          { en: "… wouldn’t hurt!", uz: "… zarar qilmaydi!", ex: "A coffee corner wouldn’t hurt!" },
          { en: "Shall we …?", uz: "… qilamizmi?", ex: "Shall we reply together?" },
          { en: "Speak soon,", uz: "Tez gaplashamiz,", ex: "Speak soon, Nodira" },
        ],
        grammar: [
          { name: "Modal of possibility (might have to)", ex: "They might have to close earlier." },
          { name: "Second conditional idea (would + verb)", ex: "A quiet study room would bring students back." },
          { name: "Suggestion question (Shall we…?)", ex: "Shall we reply together after class?" },
        ],
        upgrade: [
          { b1: "Did you read the library email?", b2: "Have you seen the email from the library?" },
          { b1: "It is bad that they close early.", b2: "It’s a real shame that they might have to close earlier." },
          { b1: "I think they need things for young people.", b2: "If you ask me, they need more for young people." },
          { b1: "A coffee place is good too.", b2: "Also, a coffee corner wouldn’t hurt!" },
        ],
        mistakes: [
          { wrong: "They might to close earlier.", right: "They might close earlier." },
          { wrong: "I am agree with you.", right: "I agree with you." },
          { wrong: "Let’s to reply together.", right: "Let’s reply together." },
        ],
      },
      {
        key: "t12",
        label: "Task 1.2",
        kind: "Formal letter · to the manager",
        register: "formal",
        words: [120, 150],
        prompt: "Write a letter to the library manager. Give your suggestions and explain how they could help the library.",
        plan: ["1-band (~25 so‘z): murojaat + xat sababi", "2-band (~40 so‘z): 1-taklif + sababi", "3-band (~45 so‘z): 2- va 3-taklif + natijasi", "4-band (~25 so‘z): yakun + rasmiy imzo"],
        model: [
          { title: "Murojaat va xat sababi", text: "[g:Dear Sir or Madam,]\n[p:I am writing in response to] your email about the future of the library. [o:I was sorry to learn] that visitor numbers [r:have fallen] this year." },
          { title: "Birinchi taklif", text: "[l:Firstly,] I [o:would suggest] opening [v:a quiet study room] with [v:reliable Wi-Fi]. Many students in our town [r:have nowhere to revise] at home, [l:so] they [r:would come] every evening [l:if] such a room [r:were available]." },
          { title: "Boshqa takliflar", text: "[l:In addition,] [v:a monthly book club] and [v:reading sessions for children] at weekends [p:would attract] families. [p:It might also be worth] [r:inviting] local writers [r:to give] short talks, [r:which would] bring the library some [v:free publicity]." },
          { title: "Yakun va imzo", text: "[p:I am confident that] these changes [r:would help] the library to stay open longer. [p:I would be happy to] help as a volunteer.\n[p:I look forward to hearing from you.]\n[g:Yours faithfully,]\nNodira Karimova" },
        ],
        collocations: [
          { en: "visitor numbers", uz: "tashrif buyuruvchilar soni", ex: "Visitor numbers have fallen." },
          { en: "reliable Wi-Fi", uz: "ishonchli internet", ex: "Reliable Wi-Fi is essential for students." },
          { en: "a monthly book club", uz: "oylik kitob klubi", ex: "A monthly book club would attract adults." },
          { en: "reading sessions for children", uz: "bolalar uchun o‘qish mashg‘ulotlari", ex: "Reading sessions for children attract families." },
          { en: "free publicity", uz: "bepul reklama", ex: "Talks by writers bring free publicity." },
          { en: "to revise for exams", uz: "imtihonga tayyorlanmoq", ex: "Students have nowhere to revise." },
        ],
        phrases: [
          { en: "I am writing in response to …", uz: "… ga javoban yozyapman", ex: "I am writing in response to your email." },
          { en: "I was sorry to learn that …", uz: "… ni bilib afsuslandim", ex: "I was sorry to learn that numbers have fallen." },
          { en: "I would suggest + -ing", uz: "… ni taklif qilardim", ex: "I would suggest opening a study room." },
          { en: "It might also be worth + -ing", uz: "… ham arzirdi", ex: "It might also be worth inviting local writers." },
          { en: "I am confident that …", uz: "… ga ishonchim komil", ex: "I am confident that these changes would help." },
          { en: "I would be happy to …", uz: "… dan xursand bo‘lardim", ex: "I would be happy to help as a volunteer." },
        ],
        grammar: [
          { name: "Second conditional", ex: "They would come every evening if such a room were available." },
          { name: "Present perfect", ex: "Visitor numbers have fallen this year." },
          { name: "Relative clause (which)", ex: "…short talks, which would bring the library free publicity." },
          { name: "Gerund after suggest / worth", ex: "I would suggest opening… / It might be worth inviting…" },
        ],
        upgrade: [
          { b1: "I read your email about the library.", b2: "I am writing in response to your email about the future of the library." },
          { b1: "You should open a room for students.", b2: "I would suggest opening a quiet study room with reliable Wi-Fi." },
          { b1: "Families will like a book club.", b2: "A monthly book club and reading sessions for children would attract families." },
          { b1: "Writers can come and speak.", b2: "It might also be worth inviting local writers to give short talks." },
        ],
        mistakes: [
          { wrong: "I suggest to open a study room.", right: "I suggest opening a study room." },
          { wrong: "If the room will be available, students would come.", right: "If the room were available, students would come." },
          { wrong: "Yours faithfully, (after Dear Mr Brown)", right: "Yours sincerely, (after Dear Mr Brown)" },
        ],
      },
    ],
    practice: [
      { type: "choice", tag: "Informal", q: "Do‘stga xat boshi qaysi?", options: ["Dear Sir or Madam,", "Hi Kamola,", "To whom it may concern,"], answer: 1, explain: "Task 1.1 — do‘stga: Hi / Dear + ism." },
      { type: "choice", tag: "Phrase", q: "“___ the email from the library?” (do‘stga)", options: ["Have you seen", "I am writing in response to", "I look forward to"], answer: 0, explain: "Have you seen …? — norasmiy, savol bilan boshlash." },
      { type: "choice", tag: "Feelings", q: "“It’s a real ___ that they might close earlier.”", options: ["shame", "pity of", "sad"], answer: 0, explain: "It’s a real shame that … = juda achinarli." },
      { type: "choice", tag: "Grammar", q: "They might ___ close earlier.", options: ["to have to", "have to", "having to"], answer: 1, explain: "might + infinitive (to’siz): might have to." },
      { type: "choice", tag: "Formal", q: "Rasmiy xat boshida xat sababi:", options: ["Have you seen your email?", "I am writing in response to your email.", "Guess what happened!"], answer: 1, explain: "Formal: I am writing in response to …" },
      { type: "choice", tag: "Grammar", q: "I would suggest ___ a quiet study room.", options: ["to open", "open", "opening"], answer: 2, explain: "suggest + -ing." },
      { type: "choice", tag: "Grammar", q: "Students would come every evening if such a room ___ available.", options: ["will be", "were", "is being"], answer: 1, explain: "Second conditional: if + past (were), would + verb." },
      { type: "choice", tag: "Phrase", q: "“It might also be worth ___ local writers.”", options: ["invite", "to invite", "inviting"], answer: 2, explain: "be worth + -ing." },
      { type: "choice", tag: "Sign-off", q: "“Dear Sir or Madam” bilan boshlangan xat qanday tugaydi?", options: ["Yours faithfully,", "Speak soon,", "Love,"], answer: 0, explain: "Dear Sir/Madam → Yours faithfully. Dear Mr Brown → Yours sincerely." },
      { type: "choice", tag: "Vocabulary", q: "“A quiet study room with ___ Wi-Fi.”", options: ["reliable","trustful","strong-minded"], answer: 0, explain: "reliable Wi-Fi — ishonchli internet." },
      { type: "choice", tag: "Linking", q: "Many students have nowhere to revise, ___ they would come every evening.", options: ["so","because","although"], answer: 0, explain: "so — natija (shuning uchun)." },
      { type: "choice", tag: "Phrase", q: "Rasmiy xatda yordam taklif qilish:", options: ["I would be happy to help as a volunteer.","Ping me if you need help!","Help? Sure, why not."], answer: 0, explain: "I would be happy to … — rasmiy va odobli." },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["They might to close earlier.","They might close earlier.","They might closing earlier."], answer: 1, explain: "might + verb (to’siz)." },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["I suggest to open a study room.","I suggest opening a study room.","I suggest open a study room."], answer: 1, explain: "suggest + -ing." },
      { type: "choice", tag: "Register", q: "Qaysi biri RASMIY xatga mos?", options: ["I was sorry to learn that visitor numbers have fallen.","It’s a real shame, honestly!","OMG the library is dying!"], answer: 0, explain: "Formal: I was sorry to learn that …" },
      { type: "choice", tag: "Closing", q: "Rasmiy xatning yakuniy jumlasi:", options: ["I look forward to hearing from you.","Speak soon!","See ya!"], answer: 0, explain: "I look forward to hearing from you. → Yours faithfully," },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["I", "am", "writing", "in", "response", "to", "your", "email."], explain: "Rasmiy xatning eng xavfsiz boshlanishi." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["A", "quiet", "study", "room", "would", "bring", "students", "back."], explain: "would + verb — taklifning natijasi." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["It", "might", "be", "worth", "inviting", "local", "writers."], explain: "It might be worth + -ing." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["Have","you","seen","the","email","from","the","library?"], explain: "Norasmiy xatning tabiiy boshlanishi." },
    ],
  },

  /* =========================================================== MOCK 2 */
  {
    id: "ml-2",
    no: 2,
    title: "The Sports Centre",
    icon: "🏋️",
    color: "#3ddc97",
    context: "You are a member of a sports centre in your city. The centre has sent this notice to all members.",
    letter: {
      greeting: "Dear Members,",
      body: "From next month, our membership fee will rise by 20% and the swimming pool will be closed on weekday mornings for repairs. We understand this may cause some difficulties. Please tell us how these changes affect you and what we could do to keep you as a member.",
      from: "The Centre Manager",
    },
    tasks: [
      {
        key: "t11",
        label: "Task 1.1",
        kind: "Informal message · to a friend",
        register: "informal",
        words: [50, 70],
        prompt: "Write a message to a friend who goes to the same sports centre. Tell them how you feel about the changes and what you plan to do.",
        plan: ["1-band (~10 so‘z): salom + xabarni eslatish", "2-band (~40 so‘z): his-tuyg‘u + reja", "3-band (~10 so‘z): taklif + xayrlashuv"],
        model: [
          { title: "Salom va kirish", text: "[g:Hey Sardor,]\n[p:Did you get] the notice from the sports centre?" },
          { title: "His-tuyg‘u va reja", text: "[o:I’m so annoyed!] Twenty per cent more [l:and] [r:no morning swimming] — [p:that’s not fair]. [l:Still,] I [r:don’t want to] quit. [o:I think] we [r:should ask] for [v:a student discount] [l:or] [v:a free month]. [l:If they say no,] [r:we could try] [v:the new gym] near the park." },
          { title: "Yakun", text: "[p:Let’s talk about it] at training.\n[g:See you,]\nJasur" },
        ],
        collocations: [
          { en: "a membership fee", uz: "a’zolik to‘lovi", ex: "The membership fee will rise." },
          { en: "a student discount", uz: "talabalar chegirmasi", ex: "Let’s ask for a student discount." },
          { en: "a free month", uz: "bepul oy", ex: "They could offer a free month." },
          { en: "morning swimming", uz: "ertalabki suzish", ex: "There will be no morning swimming." },
          { en: "to quit the gym", uz: "sportzalni tashlamoq", ex: "I don’t want to quit." },
          { en: "a training session", uz: "mashg‘ulot", ex: "See you at the training session." },
        ],
        phrases: [
          { en: "Did you get …?", uz: "… ni oldingmi?", ex: "Did you get the notice?" },
          { en: "I’m so annoyed!", uz: "Jahlim chiqdi!", ex: "I’m so annoyed about the price." },
          { en: "That’s not fair.", uz: "Bu adolatdan emas.", ex: "Twenty per cent more — that’s not fair." },
          { en: "Still, …", uz: "Shunday bo‘lsa ham, …", ex: "Still, I don’t want to quit." },
          { en: "Let’s talk about it …", uz: "Bu haqda gaplashaylik …", ex: "Let’s talk about it at training." },
          { en: "See you,", uz: "Ko‘rishguncha,", ex: "See you, Jasur" },
        ],
        grammar: [
          { name: "should for advice", ex: "We should ask for a student discount." },
          { name: "First conditional", ex: "If they say no, we could try the new gym." },
          { name: "want + to-infinitive", ex: "I don’t want to quit." },
        ],
        upgrade: [
          { b1: "Did you see the paper from the gym?", b2: "Did you get the notice from the sports centre?" },
          { b1: "I am angry.", b2: "I’m so annoyed! That’s not fair." },
          { b1: "I want to stay but it is expensive.", b2: "Still, I don’t want to quit." },
          { b1: "Maybe we go to another gym.", b2: "If they say no, we could try the new gym near the park." },
        ],
        mistakes: [
          { wrong: "I don’t want quit.", right: "I don’t want to quit." },
          { wrong: "We should to ask for a discount.", right: "We should ask for a discount." },
          { wrong: "If they will say no, …", right: "If they say no, …" },
        ],
      },
      {
        key: "t12",
        label: "Task 1.2",
        kind: "Formal letter · to the manager",
        register: "formal",
        words: [120, 150],
        prompt: "Write a letter to the centre manager. Explain how the changes affect you and suggest what the centre could do.",
        plan: ["1-band (~25 so‘z): murojaat + xat sababi", "2-band (~40 so‘z): o‘zgarishlar sizga qanday ta’sir qiladi", "3-band (~45 so‘z): 2–3 taklif", "4-band (~25 so‘z): yakun + imzo"],
        model: [
          { title: "Murojaat va xat sababi", text: "[g:Dear Sir or Madam,]\n[p:I am writing regarding] the recent notice about [v:the membership fee] and the pool timetable. [p:I have been a member for] three years and [o:I am concerned about] these changes." },
          { title: "Ta’siri", text: "[l:Firstly,] as a university student on [v:a limited budget], I [r:will find it difficult to pay] twenty per cent more. [l:Moreover,] I usually swim [v:before lectures], [l:so] [r:closing the pool] on weekday mornings [p:means that] I [r:will have to] change my whole routine." },
          { title: "Takliflar", text: "[p:I would therefore like to suggest] two solutions. [l:First,] the centre [r:could introduce] [v:a reduced fee for students], [r:which would] keep younger members. [l:Second,] [r:if the repairs were done] in the evenings [l:instead], [v:morning swimmers] [r:would not lose] their sessions." },
          { title: "Yakun va imzo", text: "[p:I hope you will consider] these ideas. [p:Thank you for your time.]\n[g:Yours faithfully,]\nJasur Aliyev" },
        ],
        collocations: [
          { en: "a limited budget", uz: "cheklangan mablag‘", ex: "I am a student on a limited budget." },
          { en: "a reduced fee", uz: "kamaytirilgan to‘lov", ex: "A reduced fee for students would help." },
          { en: "the pool timetable", uz: "basseyn jadvali", ex: "The pool timetable has changed." },
          { en: "a daily routine", uz: "kun tartibi", ex: "I will have to change my routine." },
          { en: "to carry out repairs", uz: "ta’mir ishlarini olib bormoq", ex: "Repairs could be carried out at night." },
          { en: "a loyal member", uz: "sodiq a’zo", ex: "Loyal members deserve a discount." },
        ],
        phrases: [
          { en: "I am writing regarding …", uz: "… yuzasidan yozyapman", ex: "I am writing regarding the recent notice." },
          { en: "I have been a member for …", uz: "… dan beri a’zoman", ex: "I have been a member for three years." },
          { en: "I am concerned about …", uz: "… meni xavotirga solmoqda", ex: "I am concerned about these changes." },
          { en: "… means that …", uz: "… degani …", ex: "Closing the pool means that I will lose my sessions." },
          { en: "I would therefore like to suggest …", uz: "Shu sababli … ni taklif qilmoqchiman", ex: "I would therefore like to suggest two solutions." },
          { en: "I hope you will consider …", uz: "… ni ko‘rib chiqasiz degan umiddaman", ex: "I hope you will consider these ideas." },
        ],
        grammar: [
          { name: "Present perfect with for", ex: "I have been a member for three years." },
          { name: "Gerund as subject", ex: "Closing the pool on weekday mornings means that…" },
          { name: "Second conditional (passive)", ex: "If the repairs were done in the evenings, swimmers would not lose their sessions." },
          { name: "Relative clause (which)", ex: "…a reduced fee for students, which would keep younger members." },
        ],
        upgrade: [
          { b1: "I am writing about your letter.", b2: "I am writing regarding the recent notice about the membership fee." },
          { b1: "I don’t have much money.", b2: "As a university student on a limited budget, I will find it difficult to pay more." },
          { b1: "Please make it cheaper for students.", b2: "The centre could introduce a reduced fee for students." },
          { b1: "Do the repairs in the evening.", b2: "If the repairs were done in the evenings, morning swimmers would not lose their sessions." },
        ],
        mistakes: [
          { wrong: "I am a member since three years.", right: "I have been a member for three years." },
          { wrong: "It will be difficult for me paying more.", right: "It will be difficult for me to pay more." },
          { wrong: "I hope you will consider about these ideas.", right: "I hope you will consider these ideas." },
        ],
      },
    ],
    practice: [
      { type: "choice", tag: "Informal", q: "Do‘stga xabarni boshlash uchun eng tabiiy savol:", options: ["Did you get the notice from the sports centre?", "I am writing regarding the notice.", "Please find attached the notice."], answer: 0, explain: "Norasmiy: savol bilan boshlash (Did you get …?)." },
      { type: "choice", tag: "Feelings", q: "Norasmiy xatda jahl chiqqanini ifodalash:", options: ["I am concerned about this matter.", "I’m so annoyed!", "I wish to express my dissatisfaction."], answer: 1, explain: "Do‘stga — I’m so annoyed! / That’s not fair." },
      { type: "choice", tag: "Grammar", q: "I don’t want ___ the gym.", options: ["quit", "to quit", "quitting"], answer: 1, explain: "want + to-infinitive." },
      { type: "choice", tag: "Grammar", q: "If they ___ no, we could try the new gym.", options: ["will say", "say", "would say"], answer: 1, explain: "If-gapda kelasi zamon ishlatilmaydi: If they say…" },
      { type: "choice", tag: "Formal", q: "Rasmiy xatda: “I ___ a member for three years.”", options: ["am", "have been", "was being"], answer: 1, explain: "for + davr → present perfect." },
      { type: "choice", tag: "Phrase", q: "“I am writing ___ the recent notice.”", options: ["regarding", "about of", "for regarding"], answer: 0, explain: "I am writing regarding … = … yuzasidan." },
      { type: "choice", tag: "Grammar", q: "If the repairs ___ in the evenings, swimmers would not lose their sessions.", options: ["are done", "were done", "will be done"], answer: 1, explain: "Second conditional passive: if + were + V3." },
      { type: "choice", tag: "Vocabulary", q: "As a student on a ___ budget, I cannot pay more.", options: ["limited", "narrow", "few"], answer: 0, explain: "a limited budget — cheklangan mablag‘." },
      { type: "choice", tag: "Formal", q: "Rasmiy xatning yakunida:", options: ["Catch you later!", "Thank you for your time.", "Bye for now!"], answer: 1, explain: "Thank you for your time. → Yours faithfully," },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["I hope you will consider about these ideas.", "I hope you will consider these ideas.", "I hope you consider to these ideas."], answer: 1, explain: "consider + ob’ekt (about’siz)." },
      { type: "choice", tag: "Formal", q: "Rasmiy xatda xavotirni bildirish:", options: ["I am concerned about these changes.","I’m so annoyed!","This is crazy!"], answer: 0, explain: "Formal: I am concerned about …" },
      { type: "choice", tag: "Linking", q: "I usually swim before lectures, ___ closing the pool in the mornings affects me.", options: ["so","but","unless"], answer: 0, explain: "so — natija." },
      { type: "choice", tag: "Vocabulary", q: "The centre could introduce a ___ fee for students.", options: ["reduced","smaller-sized","decreased-down"], answer: 0, explain: "a reduced fee — kamaytirilgan to‘lov." },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["I am a member since three years.","I have been a member for three years.","I was a member for three years now."], answer: 1, explain: "for + davr → present perfect." },
      { type: "choice", tag: "Informal", q: "Do‘stga taklif bilan yakunlash:", options: ["Let’s talk about it at training.","I look forward to your reply.","Yours faithfully,"], answer: 0, explain: "Norasmiy: Let’s … / See you," },
      { type: "choice", tag: "Sign-off", q: "Do‘stga xatni qanday tugatasiz?", options: ["See you, Jasur","Yours sincerely, Jasur Aliyev","Respectfully yours,"], answer: 0, explain: "Norasmiy: See you / Speak soon / Take care." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["I", "have", "been", "a", "member", "for", "three", "years."], explain: "Present perfect + for." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["I", "would", "therefore", "like", "to", "suggest", "two", "solutions."], explain: "Rasmiy taklif iborasi." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["Did","you","get","the","notice","from","the","sports","centre?"], explain: "Norasmiy boshlanish." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["I","hope","you","will","consider","these","ideas."], explain: "Rasmiy yakun oldidan." },
    ],
  },

  /* =========================================================== MOCK 3 */
  {
    id: "ml-3",
    no: 3,
    title: "The End-of-Year Trip",
    icon: "🚌",
    color: "#ffb347",
    context: "You are a student at a language centre. The trip organiser has sent this email to all students.",
    letter: {
      greeting: "Dear Students,",
      body: "We are planning an end-of-year trip for all groups. We have two options: a day in the mountains with hiking and a picnic, or a visit to the city museums followed by a dinner. The trip must not cost more than 150,000 som per person. Please tell us which option you prefer and why.",
      from: "Dilfuza Rahimova, Trip Organiser",
    },
    tasks: [
      {
        key: "t11",
        label: "Task 1.1",
        kind: "Informal message · to a classmate",
        register: "informal",
        words: [50, 70],
        prompt: "Write a message to a classmate. Tell them which option you prefer and try to persuade them to choose it too.",
        plan: ["1-band (~10 so‘z): salom + emailni eslatish", "2-band (~40 so‘z): tanlov + 2 sabab", "3-band (~10 so‘z): ishontirish + xayrlashuv"],
        model: [
          { title: "Salom va kirish", text: "[g:Hi Malika,]\n[p:Guess what?] The trip email [r:has finally arrived]!" },
          { title: "Tanlov va sabablar", text: "[o:I’m definitely voting for] the mountains. [l:After] a whole year [r:sitting] in class, we [v:need fresh air]! Hiking [r:is more fun than] [v:staring at old paintings], [l:and] [v:a picnic by the river] [p:sounds amazing]. [l:Besides,] it’s [r:cheaper], [l:so] we [r:could spend] the rest on snacks." },
          { title: "Yakun", text: "[p:Come on, say yes!]\n[g:Talk later,]\nAziza" },
        ],
        collocations: [
          { en: "fresh air", uz: "toza havo", ex: "We need fresh air after classes." },
          { en: "a picnic by the river", uz: "daryo bo‘yida piknik", ex: "A picnic by the river sounds amazing." },
          { en: "to go hiking", uz: "piyoda sayrga chiqmoq", ex: "Let’s go hiking in the mountains." },
          { en: "old paintings", uz: "eski rasmlar", ex: "Museums are full of old paintings." },
          { en: "to vote for", uz: "… ga ovoz bermoq", ex: "I’m voting for the mountains." },
          { en: "the rest of the money", uz: "qolgan pul", ex: "We could spend the rest on snacks." },
        ],
        phrases: [
          { en: "Guess what?", uz: "Bilasanmi nima bo‘ldi?", ex: "Guess what? The email has arrived!" },
          { en: "I’m definitely voting for …", uz: "Men albatta … ga ovoz beraman", ex: "I’m definitely voting for the mountains." },
          { en: "… sounds amazing.", uz: "… ajoyib eshitiladi.", ex: "A picnic sounds amazing." },
          { en: "Besides, …", uz: "Buning ustiga, …", ex: "Besides, it’s cheaper." },
          { en: "Come on, say yes!", uz: "Qani, rozi bo‘l!", ex: "Come on, say yes!" },
          { en: "Talk later,", uz: "Keyin gaplashamiz,", ex: "Talk later, Aziza" },
        ],
        grammar: [
          { name: "Present perfect + finally", ex: "The trip email has finally arrived!" },
          { name: "Comparative (more fun than / cheaper)", ex: "Hiking is more fun than staring at old paintings." },
          { name: "Gerund as subject", ex: "Hiking is more fun than…" },
        ],
        upgrade: [
          { b1: "The trip email came.", b2: "Guess what? The trip email has finally arrived!" },
          { b1: "I want the mountains.", b2: "I’m definitely voting for the mountains." },
          { b1: "Museums are boring.", b2: "Hiking is more fun than staring at old paintings." },
          { b1: "Please choose the mountains.", b2: "Come on, say yes!" },
        ],
        mistakes: [
          { wrong: "Hiking is more funnier than museums.", right: "Hiking is more fun than museums." },
          { wrong: "The email has arrived yesterday.", right: "The email arrived yesterday." },
          { wrong: "I’m voting to the mountains.", right: "I’m voting for the mountains." },
        ],
      },
      {
        key: "t12",
        label: "Task 1.2",
        kind: "Formal email · to the organiser",
        register: "formal",
        words: [120, 150],
        prompt: "Write an email to the trip organiser. Say which option you prefer, explain why, and make one suggestion to improve the trip.",
        plan: ["1-band (~25 so‘z): murojaat + xat sababi", "2-band (~45 so‘z): tanlov + 2 sabab", "3-band (~40 so‘z): bitta taklif", "4-band (~20 so‘z): yakun + imzo"],
        model: [
          { title: "Murojaat va xat sababi", text: "[g:Dear Ms Rahimova,]\n[p:Thank you for your email about] the end-of-year trip. [p:I would like to express my preference for] the day in the mountains." },
          { title: "Tanlov va sabablar", text: "[l:Firstly,] after a long year of study, students [r:would benefit from] [v:physical activity] and [v:fresh air]. [l:Secondly,] [r:this option is likely to be] [v:more affordable], [l:as] [v:transport] and [v:a picnic] [r:cost much less than] a restaurant dinner. [l:This means that] [r:no one would be left out] because of the price." },
          { title: "Taklif", text: "[p:If I may make a suggestion,] it [r:would be a good idea to] organise [v:team games] during the picnic. [l:In this way,] students from different groups [r:could get to know] each other, [r:which] rarely happens in class." },
          { title: "Yakun va imzo", text: "[p:Thank you for organising this event.] [p:I look forward to] [r:hearing] your decision.\n[g:Yours sincerely,]\nAziza Toshpulatova" },
        ],
        collocations: [
          { en: "physical activity", uz: "jismoniy faollik", ex: "Students need physical activity." },
          { en: "more affordable", uz: "arzonroq, hamyonbop", ex: "The mountain trip is more affordable." },
          { en: "team games", uz: "jamoaviy o‘yinlar", ex: "Team games would bring groups together." },
          { en: "to be left out", uz: "chetda qolmoq", ex: "No one would be left out because of the price." },
          { en: "to get to know each other", uz: "bir-birini tanimoq", ex: "Students could get to know each other." },
          { en: "an end-of-year trip", uz: "yil yakuni sayohati", ex: "We are planning an end-of-year trip." },
        ],
        phrases: [
          { en: "Thank you for your email about …", uz: "… haqidagi xatingiz uchun rahmat", ex: "Thank you for your email about the trip." },
          { en: "I would like to express my preference for …", uz: "Men … ni afzal ko‘raman", ex: "I would like to express my preference for the mountains." },
          { en: "… is likely to be …", uz: "… bo‘lishi ehtimoli katta", ex: "This option is likely to be cheaper." },
          { en: "This means that …", uz: "Bu degani …", ex: "This means that no one would be left out." },
          { en: "If I may make a suggestion, …", uz: "Taklif bildirsam, …", ex: "If I may make a suggestion, team games would help." },
          { en: "In this way, …", uz: "Shu tarzda, …", ex: "In this way, students could meet." },
        ],
        grammar: [
          { name: "Passive with would", ex: "No one would be left out because of the price." },
          { name: "be likely to", ex: "This option is likely to be more affordable." },
          { name: "Comparative with much", ex: "Transport and a picnic cost much less than a restaurant dinner." },
          { name: "Relative clause (which = butun gap)", ex: "…get to know each other, which rarely happens in class." },
        ],
        upgrade: [
          { b1: "I want to go to the mountains.", b2: "I would like to express my preference for the day in the mountains." },
          { b1: "It is cheap.", b2: "This option is likely to be more affordable." },
          { b1: "Everybody can come.", b2: "This means that no one would be left out because of the price." },
          { b1: "Make some games.", b2: "If I may make a suggestion, it would be a good idea to organise team games." },
        ],
        mistakes: [
          { wrong: "I prefer mountains than museums.", right: "I prefer the mountains to the museums." },
          { wrong: "Students would benefit of fresh air.", right: "Students would benefit from fresh air." },
          { wrong: "I look forward to hear your decision.", right: "I look forward to hearing your decision." },
        ],
      },
    ],
    practice: [
      { type: "choice", tag: "Informal", q: "Do‘stga hayajon bilan boshlash:", options: ["Guess what?", "I am writing to inform you…", "With reference to…"], answer: 0, explain: "Guess what? — norasmiy, jonli boshlanish." },
      { type: "choice", tag: "Grammar", q: "The trip email ___ finally arrived!", options: ["was", "has", "have"], answer: 1, explain: "Present perfect: has + V3 (has arrived)." },
      { type: "choice", tag: "Grammar", q: "Hiking is ___ fun than staring at old paintings.", options: ["more", "most", "much"], answer: 0, explain: "fun → more fun than." },
      { type: "choice", tag: "Phrase", q: "“A picnic by the river ___ amazing.”", options: ["sounds", "listens", "hears"], answer: 0, explain: "… sounds amazing = ajoyib eshitiladi." },
      { type: "choice", tag: "Formal", q: "Rasmiy tanlovni bildirish:", options: ["I’m definitely voting for…", "I would like to express my preference for…", "Mountains, 100%!"], answer: 1, explain: "Formal: I would like to express my preference for …" },
      { type: "choice", tag: "Grammar", q: "Students would benefit ___ fresh air.", options: ["of", "from", "with"], answer: 1, explain: "benefit from — doimiy birikma." },
      { type: "choice", tag: "Grammar", q: "This option is likely ___ more affordable.", options: ["being", "to be", "be"], answer: 1, explain: "be likely to + verb." },
      { type: "choice", tag: "Passive", q: "No one would ___ out because of the price.", options: ["leave", "be left", "been left"], answer: 1, explain: "Passive: would be + V3 (be left out)." },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["I look forward to hear your decision.", "I look forward to hearing your decision.", "I look forward hearing your decision."], answer: 1, explain: "look forward to + -ing." },
      { type: "choice", tag: "Sign-off", q: "“Dear Ms Rahimova” bilan boshlangan xat:", options: ["Yours faithfully,", "Yours sincerely,", "Cheers,"], answer: 1, explain: "Ism bilan murojaat → Yours sincerely." },
      { type: "choice", tag: "Informal", q: "Do‘stni ishontirish uchun:", options: ["Come on, say yes!","I would be grateful if you agreed.","Kindly confirm your choice."], answer: 0, explain: "Norasmiy: Come on, say yes!" },
      { type: "choice", tag: "Phrase", q: "Rasmiy taklif boshlash:", options: ["If I may make a suggestion, …","Hey, how about …","Wanna try …?"], answer: 0, explain: "If I may make a suggestion, … — rasmiy va odobli." },
      { type: "choice", tag: "Vocabulary", q: "Students from different groups could get to ___ each other.", options: ["know","meet with","learn"], answer: 0, explain: "to get to know each other — bir-birini tanimoq." },
      { type: "choice", tag: "Error", q: "Qaysi gap TO‘G‘RI?", options: ["I prefer mountains than museums.","I prefer the mountains to the museums.","I prefer the mountains from the museums."], answer: 1, explain: "prefer A to B." },
      { type: "choice", tag: "Grammar", q: "Transport and a picnic cost ___ less than a restaurant dinner.", options: ["much","many","more"], answer: 0, explain: "much + comparative (much less)." },
      { type: "choice", tag: "Linking", q: "___ this way, students could get to know each other.", options: ["In","On","By"], answer: 0, explain: "In this way — shu tarzda." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["Thank", "you", "for", "your", "email", "about", "the", "trip."], explain: "Javob xatining odobli boshlanishi." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["This", "means", "that", "no", "one", "would", "be", "left", "out."], explain: "Natijani tushuntirish + passive." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["I’m","definitely","voting","for","the","mountains."], explain: "Norasmiy tanlov." },
      { type: "order", tag: "Gap tuzing", q: "So‘zlarni to‘g‘ri tartibda bosing:", words: ["If","I","may","make","a","suggestion,","let’s","add","team","games."], explain: "Rasmiy taklif." },
    ],
  },
];

export const findMock = (id: string) => ML_MOCKS.find((m) => m.id === id) ?? null;

/** "ml-2-t12" → mock va task. */
export function findMlTask(cardId: string): { mock: MlMock; task: MlTask } | null {
  const m = /^(ml-\d+)-(t11|t12)$/.exec(cardId);
  if (!m) return null;
  const mock = findMock(m[1]);
  const task = mock?.tasks.find((t) => t.key === m[2]);
  return mock && task ? { mock, task } : null;
}

/** Task to'liq topshiriq matni (vaziyat + xat + vazifa). */
export function mlInstructions(mock: MlMock, task: MlTask): string {
  return [mock.context, `${mock.letter.greeting}\n${mock.letter.body}\n${mock.letter.from}`, `${task.label} — ${task.kind} (${task.words[0]}–${task.words[1]} words).`, task.prompt].join("\n\n");
}

/** Task 1.1 va 1.2 bahosi (0–20) → umumiy foiz (0–100) va 75 ballik taxminiy shkala. */
export function mlTotal(scores: Partial<Record<MlTaskKey, number | null>>): { pct: number; of75: number } | null {
  if (scores.t11 == null || scores.t12 == null) return null;
  const pct = ((scores.t11 / 20) * ML_WEIGHTS.t11 + (scores.t12 / 20) * ML_WEIGHTS.t12) * 100;
  return { pct: Math.round(pct), of75: Math.round((pct / 100) * 75) };
}
