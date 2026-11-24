/**
 * SEFR WRITING — Letter & Email (Pre-Intermediate).
 * Manba: "SEFR Writing — Letter & Email Guide" va "SEFR Writing 36 Cue Cards" (Maftuna Ismoilova).
 * 12 ta xat turi × 3 ta cue card = 36 ta topshiriq. Informal va Thank-you xatlari bu to'plamga kirmaydi.
 * Har bir cue card id'si: `${type}-${n}` (masalan "complaint-2") — writing_attempts.card_id.
 */

export type Tone = "formal" | "semi" | "informal";

export type CueCard = { n: 1 | 2 | 3; task: string; points: [string, string, string] };

export type WritingType = {
  id: string;
  no: number;
  title: string;
  /** Asosiy maqsad (o'zbekcha). */
  purpose: string;
  /** Qachon yoziladi? */
  when: string;
  icon: string;
  color: string;
  tone: Tone;
  structure: { label: string; hint: string }[];
  phrases: { group: string; list: string[] }[];
  sample: { question: string; answer: string };
  cards: [CueCard, CueCard, CueCard];
};

export const TONE_LABEL: Record<Tone, string> = { formal: "Formal", semi: "Semi-formal", informal: "Do‘stona" };

/** Tavsiya etiladigan hajm (Pre-Intermediate, CEFR letter). */
export const WORDS = { min: 80, ideal: 120, max: 180 };

export const WRITING_TYPES: WritingType[] = [
  {
    id: "formal",
    no: 2,
    title: "Formal letter / email",
    purpose: "Rasmiy murojaat",
    when: "Tashkilot, kompaniya, direktor, manager, maktab, universitet yoki boshqa rasmiy tashkilotga yozilganda.",
    icon: "🏛",
    color: "#5ab0ff",
    tone: "formal",
    structure: [
      { label: "Greeting", hint: "Dear Sir/Madam / Dear Mr Smith" },
      { label: "Introduction", hint: "I am writing to..." },
      { label: "Main purpose", hint: "Sababni tushuntiring." },
      { label: "Details", hint: "Muammo, sabab yoki kerakli ma’lumotlarni yozing." },
      { label: "Request / expected action", hint: "Nima qilishlarini xohlayotganingizni ayting." },
      { label: "Closing", hint: "I look forward to hearing from you. / Yours faithfully / Yours sincerely." },
    ],
    phrases: [
      { group: "Boshlash", list: ["I am writing to enquire about...", "I am writing regarding...", "I am writing to request...", "I am writing to inform you about..."] },
      { group: "Request", list: ["Could you please...?", "I would be grateful if you could...", "I would appreciate it if you could..."] },
      { group: "Tugatish", list: ["I look forward to hearing from you.", "Thank you for your attention."] },
    ],
    sample: {
      question: "You want to join an English course at a language centre. Write an email asking about the course.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to enquire about the English courses offered at your language centre. I am particularly interested in an intermediate-level course.\n\nCould you please provide me with some information about the course schedule and fees? I would also like to know how many students are usually in each class.\n\nI would be grateful if you could send me the course details as soon as possible.\n\nI look forward to hearing from you.\n\nYours faithfully,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You want to join an English course at a language centre. Write a formal email asking for information.", points: ["Introduce yourself and explain why you are writing.", "Ask about the course schedule and duration.", "Ask about the price and class size."] },
      { n: 2, task: "You recently bought a product online, but some important information was missing. Write a formal email to the company.", points: ["Explain what you bought and when you bought it.", "Explain what information is missing.", "Ask the company to provide the information."] },
      { n: 3, task: "You want to use a sports centre in your area. Write a formal email to the manager.", points: ["Explain why you are interested in the centre.", "Ask about membership fees and opening hours.", "Ask what facilities are available."] },
    ],
  },
  {
    id: "semi-formal",
    no: 3,
    title: "Semi-formal letter / email",
    purpose: "Tanish, lekin rasmiy munosabatdagi odamga yozish",
    when: "Tanish, lekin juda yaqin bo‘lmagan odamga: teacher, neighbour, colleague, course teacher, landlord va h.k.",
    icon: "🤝",
    color: "#3ddc97",
    tone: "semi",
    structure: [
      { label: "Greeting", hint: "Dear Mr Brown / Dear Mrs Smith" },
      { label: "Introduction", hint: "I am writing to..." },
      { label: "Body 1", hint: "Sabab." },
      { label: "Body 2", hint: "Tafsilotlar." },
      { label: "Body 3", hint: "Request / suggestion." },
      { label: "Closing", hint: "Best regards / Kind regards." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to ask about...", "I would like to inform you that...", "I was wondering if you could...", "Would it be possible to...?", "I would appreciate your help with...", "I hope you are well.", "Thank you for your understanding."] },
    ],
    sample: {
      question: "You are going to be late for a meeting with your teacher. Write an email explaining the situation.",
      answer:
        "Dear Mr Brown,\n\nI hope you are well. I am writing to let you know that I may be late for our meeting tomorrow.\n\nUnfortunately, I have an important appointment in the morning, and I am not sure when it will finish. I expect to arrive about 30 minutes late.\n\nI apologise for any inconvenience this may cause. Would it be possible to start the meeting a little later?\n\nThank you for your understanding.\n\nKind regards,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You need to change an appointment with your teacher. Write a semi-formal email.", points: ["Explain why you cannot attend the original appointment.", "Suggest another day or time.", "Ask if the new time is convenient."] },
      { n: 2, task: "Your neighbour has invited you to a small community event, but you need more information. Write a semi-formal email.", points: ["Thank them for the invitation.", "Ask when and where the event will take place.", "Ask if you need to bring anything."] },
      { n: 3, task: "You are taking a course with a teacher you know. Write a semi-formal email about a problem with the timetable.", points: ["Explain the timetable problem.", "Explain how it affects you.", "Suggest a possible solution."] },
    ],
  },
  {
    id: "application",
    no: 4,
    title: "Application letter",
    purpose: "Ish, kurs, dastur yoki imkoniyatga ariza",
    when: "Ish, kurs, scholarship, programme, volunteer position yoki internship uchun ariza yozilganda.",
    icon: "📝",
    color: "#F5C76A",
    tone: "formal",
    structure: [
      { label: "Greeting", hint: "Dear Sir/Madam" },
      { label: "Purpose", hint: "I am writing to apply for..." },
      { label: "Qualifications", hint: "Ta’lim, tajriba va skilllar." },
      { label: "Suitability", hint: "Nima uchun siz mos nomzodsiz?" },
      { label: "Closing", hint: "I look forward to hearing from you." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to apply for...", "I would like to apply for...", "I am interested in applying for...", "I have experience in...", "I have worked as...", "I am able to work independently.", "I am a hardworking and responsible person.", "Please do not hesitate to contact me."] },
    ],
    sample: {
      question: "You have seen an advertisement for an English teacher position. Write an application email.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to apply for the position of English teacher advertised on your website.\n\nI have a degree in English and several years of experience teaching English to young learners and adults. I am also confident in preparing lessons and creating educational materials.\n\nI believe I am suitable for this position because I am responsible, organised and enthusiastic about teaching. I also have excellent communication skills and enjoy working with students.\n\nI would be grateful for the opportunity to discuss my application in an interview.\n\nI look forward to hearing from you.\n\nYours faithfully,\nMaftuna Ismoilova",
    },
    cards: [
      { n: 1, task: "You have seen an advertisement for an English teacher position. Write an application letter.", points: ["Introduce the position you are applying for.", "Describe your education and experience.", "Explain why you are suitable for the job."] },
      { n: 2, task: "You want to apply for a summer English course. Write an application email.", points: ["Explain why you want to join the course.", "Describe your English-learning experience.", "Explain what you hope to achieve."] },
      { n: 3, task: "You are applying for a volunteer programme at a local organisation. Write an application email.", points: ["Say why you want to volunteer.", "Describe two useful skills you have.", "Explain how you can help the organisation."] },
    ],
  },
  {
    id: "request",
    no: 5,
    title: "Request letter / email",
    purpose: "Biror narsa so‘rash",
    when: "Biror odamdan yordam, ma’lumot, hujjat, permission, xizmat yoki boshqa narsani so‘raganda.",
    icon: "🙏",
    color: "#7DF0FF",
    tone: "formal",
    structure: [
      { label: "Greeting", hint: "Dear Sir/Madam / Dear Mr Smith" },
      { label: "Reason", hint: "I am writing to ask if..." },
      { label: "Explain your request", hint: "Nima kerakligini aniq yozing." },
      { label: "Give details", hint: "Qachon, qayerda, nima uchun." },
      { label: "Polite closing", hint: "Thank you for your help. I look forward to hearing from you." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to ask if...", "I would like to request...", "Could you please...?", "Would it be possible to...?", "I was wondering if you could...", "I would be grateful if you could...", "I would really appreciate your help."] },
    ],
    sample: {
      question: "You need some information about a course. Write an email to the course organiser.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to request some information about your summer English course.\n\nI would like to know when the course starts and how long it lasts. Could you also tell me how much the course costs and whether accommodation is available?\n\nI would be grateful if you could send me the full timetable and application details.\n\nThank you for your help. I look forward to hearing from you.\n\nYours faithfully,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You need a document from your university. Write a request email.", points: ["Explain which document you need.", "Explain why you need it.", "Ask when and how you can receive it."] },
      { n: 2, task: "You are organising a school event and need help from a local company. Write a request email.", points: ["Explain what event you are organising.", "Ask for a specific kind of help.", "Explain why their help would be useful."] },
      { n: 3, task: "You want to borrow something from a course teacher for a project. Write a request email.", points: ["Explain what you are working on.", "Say what you would like to borrow.", "Ask when you can collect and return it."] },
    ],
  },
  {
    id: "complaint",
    no: 6,
    title: "Complaint letter / email",
    purpose: "Shikoyat qilish",
    when: "Yomon xizmat, mahsulot muammosi, kechikish, noto‘g‘ri xizmat, shovqin, mehmonxona muammosi va h.k. haqida shikoyat qilganda.",
    icon: "😤",
    color: "#ff6a8a",
    tone: "formal",
    structure: [
      { label: "Introduction", hint: "Nima haqida shikoyat qilayotganingiz." },
      { label: "Explain the problem", hint: "Muammo nima?" },
      { label: "Give details / evidence", hint: "Qachon, qayerda, aniq misollar." },
      { label: "Say what you expect", hint: "Refund, almashtirish, uzr…" },
      { label: "Closing", hint: "I look forward to your response. / Yours faithfully" },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to complain about...", "I am writing to express my dissatisfaction with...", "Unfortunately,...", "I was disappointed with...", "The main problem was...", "I would like to point out that...", "I would appreciate it if you could...", "I would like to request a refund."] },
    ],
    sample: {
      question: "You stayed at a hotel but were unhappy with the service. Write a complaint email.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to complain about the service I received during my stay at your hotel last weekend.\n\nUnfortunately, my room was not clean when I arrived, and the air conditioning did not work properly. I reported the problem to reception, but it was not fixed during my stay.\n\nI was very disappointed because I expected a much better service from your hotel.\n\nI would appreciate it if you could investigate this matter and offer me an appropriate solution.\n\nI look forward to your response.\n\nYours faithfully,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You stayed at a hotel and were unhappy with the service. Write a complaint email.", points: ["Describe two problems you experienced.", "Explain how the problems affected your stay.", "Say what solution you expect."] },
      { n: 2, task: "You ordered a product online, but it arrived damaged. Write a complaint email.", points: ["Give details about the order.", "Describe the problem with the product.", "Request a replacement or another solution."] },
      { n: 3, task: "You joined a course but were unhappy with the organisation. Write a complaint email.", points: ["Explain what went wrong.", "Give specific examples.", "Suggest what the centre should do."] },
    ],
  },
  {
    id: "invitation",
    no: 7,
    title: "Invitation letter / email",
    purpose: "Taklif qilish",
    when: "Birthday, wedding, party, meeting, event yoki celebrationga taklif qilganda.",
    icon: "🎉",
    color: "#ffb347",
    tone: "informal",
    structure: [
      { label: "Greeting", hint: "Dear Ali / Hi Ali" },
      { label: "Invitation", hint: "I am writing to invite you to..." },
      { label: "Event details", hint: "What? When? Where?" },
      { label: "Additional information", hint: "Nima qilamiz, nima olib kelish kerak." },
      { label: "Ask for confirmation", hint: "Please let me know if you can come." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I would like to invite you to...", "I am writing to invite you to...", "We are having a...", "The event will take place on...", "It will be held at...", "I hope you can join us.", "Please let me know if you can come.", "I look forward to seeing you there."] },
    ],
    sample: {
      question: "Invite your friend to a birthday party.",
      answer:
        "Dear Ali,\n\nI am writing to invite you to my birthday party next Saturday.\n\nThe party will take place at my house and will start at 6 p.m. We are going to have dinner, listen to music and play some games.\n\nI really hope you can come because it would be great to celebrate together. Please let me know if you are able to join us.\n\nI look forward to seeing you!\n\nBest wishes,\nMaftuna",
    },
    cards: [
      { n: 1, task: "Invite a friend to your birthday party.", points: ["Give the date, time and place.", "Describe what you are planning to do.", "Ask your friend to confirm attendance."] },
      { n: 2, task: "Invite a classmate to a study group before an important exam.", points: ["Explain why you are organising the study group.", "Give the meeting time and place.", "Tell them what they should bring or prepare."] },
      { n: 3, task: "Invite a friend to a local cultural event.", points: ["Introduce the event.", "Give the date, time and location.", "Explain why you think your friend would enjoy it."] },
    ],
  },
  {
    id: "apology",
    no: 8,
    title: "Apology letter / email",
    purpose: "Uzr so‘rash",
    when: "Kech qolish, uchrashuvga bormaslik, xato qilish, biror narsani buzish yoki va’dani bajarmaslik kabi holatlarda.",
    icon: "🙇",
    color: "#b388ff",
    tone: "semi",
    structure: [
      { label: "Apology", hint: "Darhol uzr: I am writing to apologise for..." },
      { label: "Explain what happened", hint: "Nima bo‘ldi?" },
      { label: "Give reason", hint: "Nega shunday bo‘ldi?" },
      { label: "Offer solution", hint: "Qanday tuzatasiz?" },
      { label: "Promise", hint: "I promise that it will not happen again." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to apologise for...", "I am really sorry for...", "Please accept my sincere apologies.", "Unfortunately,...", "The reason was that...", "I hope you can understand.", "I promise that it will not happen again.", "I hope you will forgive me."] },
    ],
    sample: {
      question: "You missed an important meeting with your teacher. Write an email apologising.",
      answer:
        "Dear Mr Brown,\n\nI am writing to apologise for missing our meeting yesterday.\n\nUnfortunately, I had an unexpected problem at home and could not contact you in time. I understand that you were waiting for me, and I am really sorry for the inconvenience.\n\nWould it be possible to arrange another meeting? I am available any afternoon this week.\n\nPlease accept my sincere apologies. I promise to inform you in advance if I have any problems in the future.\n\nKind regards,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You missed an important meeting with your teacher. Write an apology email.", points: ["Apologise for missing the meeting.", "Explain what happened.", "Suggest another meeting time."] },
      { n: 2, task: "You promised to help a friend with a project but could not do it. Write an apology email.", points: ["Apologise for not helping.", "Explain the reason.", "Offer another way to help."] },
      { n: 3, task: "You returned something you borrowed later than you promised. Write an apology email.", points: ["Apologise for the delay.", "Explain why it happened.", "Promise to be more careful in the future."] },
    ],
  },
  {
    id: "advice",
    no: 10,
    title: "Advice letter / email",
    purpose: "Maslahat berish",
    when: "Kimdir sizga muammosi haqida yozadi va siz unga maslahat berasiz.",
    icon: "💡",
    color: "#ffe08a",
    tone: "informal",
    structure: [
      { label: "Greeting", hint: "Dear Ali" },
      { label: "React to the problem", hint: "I'm sorry to hear that..." },
      { label: "Advice 1", hint: "First of all, I suggest that you..." },
      { label: "Advice 2", hint: "Another good idea is to..." },
      { label: "Advice 3", hint: "Finally, ..." },
      { label: "Encouragement", hint: "I hope my advice helps!" },
    ],
    phrases: [
      { group: "Iboralar", list: ["I'm sorry to hear that...", "If I were you, I would...", "You should...", "You shouldn't...", "Why don't you...?", "I suggest that you...", "It would be a good idea to...", "You could try...", "I hope my advice helps."] },
    ],
    sample: {
      question: "Your friend wants to improve their English but does not know how. Give some advice.",
      answer:
        "Dear Ali,\n\nI'm sorry to hear that you are finding English difficult. Don't worry because there are several things you can do to improve.\n\nFirst of all, I suggest that you read something in English every day. You could also watch short English videos with subtitles and write down new words.\n\nAnother good idea is to practise speaking regularly. If I were you, I would find a speaking partner and practise for at least 15 minutes every day.\n\nFinally, don't be afraid of making mistakes. They are a natural part of learning a language.\n\nI hope my advice helps!\n\nBest wishes,\nMaftuna",
    },
    cards: [
      { n: 1, task: "Your friend wants to improve their English but does not know how. Write a reply giving advice.", points: ["Give advice about vocabulary and reading.", "Give advice about speaking and listening.", "Encourage your friend to practise regularly."] },
      { n: 2, task: "Your friend is worried about an upcoming English exam. Write a reply giving advice.", points: ["Suggest how to organise study time.", "Suggest ways to practise weak skills.", "Give some advice about staying calm and confident."] },
      { n: 3, task: "Your friend has recently moved to a new city and finds it difficult to make friends. Write a reply giving advice.", points: ["Suggest places where they can meet people.", "Suggest activities they could join.", "Give encouraging advice."] },
    ],
  },
  {
    id: "enquiry",
    no: 11,
    title: "Enquiry / Inquiry",
    purpose: "Ma’lumot so‘rash",
    when: "Asosiy maqsad — information olish: price, date, timetable, accommodation, facilities, requirements, availability, registration va h.k.",
    icon: "❓",
    color: "#6ee7f9",
    tone: "formal",
    structure: [
      { label: "Purpose", hint: "I am writing to enquire about..." },
      { label: "Question 1", hint: "I would like to know..." },
      { label: "Question 2", hint: "Could you also tell me...?" },
      { label: "Question 3", hint: "I would also like to know whether..." },
      { label: "Closing", hint: "I look forward to receiving your reply." },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to enquire about...", "I would like to know...", "Could you please tell me...?", "I would be grateful if you could provide information about...", "Could you give me some information about...?", "I would also like to know whether...", "Please let me know...", "I look forward to receiving your reply."] },
    ],
    sample: {
      question: "You are interested in a summer course abroad. Write an enquiry email.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to enquire about the summer English course advertised on your website.\n\nI would like to know when the course starts and how long it lasts. Could you also tell me how much the course costs?\n\nI would also like to know whether accommodation is available for students. In addition, could you provide information about the class size and timetable?\n\nI would be grateful if you could send me the relevant information.\n\nI look forward to receiving your reply.\n\nYours faithfully,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You are interested in a summer English course abroad. Write an enquiry email.", points: ["Ask when the course starts and how long it lasts.", "Ask about the price and accommodation.", "Ask about the class size and timetable."] },
      { n: 2, task: "You saw an advertisement for a weekend photography course. Write an enquiry email.", points: ["Ask about the course content.", "Ask about the price and equipment.", "Ask how to register."] },
      { n: 3, task: "You want to stay at a hotel during a holiday. Write an enquiry email.", points: ["Ask about available rooms and prices.", "Ask about hotel facilities.", "Ask about transport or location information."] },
    ],
  },
  {
    id: "reply",
    no: 12,
    title: "Reply / response letter",
    purpose: "Kelgan xatga javob berish",
    when: "Sizga kimdir xat/email yuboradi va siz uning savollariga yoki pointslariga javob berasiz.",
    icon: "↩️",
    color: "#3987E5",
    tone: "informal",
    structure: [
      { label: "Greeting", hint: "Dear Ali" },
      { label: "Thank them", hint: "Thanks for your email." },
      { label: "Answer point 1", hint: "You asked me about..." },
      { label: "Answer point 2", hint: "As for..." },
      { label: "Answer point 3", hint: "In answer to your question..." },
      { label: "Closing", hint: "Let me know if you need any more information." },
    ],
    phrases: [
      { group: "Iboralar", list: ["Thanks for your email.", "It was great to hear from you.", "I'm glad to hear that...", "Regarding your question about...", "As for...", "In answer to your question...", "I hope this answers your questions.", "Let me know if you need any more information."] },
    ],
    sample: {
      question: "Your friend has asked about your new English course. Reply to the email and give information about the course, teacher and classmates.",
      answer:
        "Dear Ali,\n\nThanks for your email. I'm glad to hear from you!\n\nYou asked me about my new English course. I started it two weeks ago, and I'm really enjoying it. The classes are held three times a week in the evening.\n\nMy teacher is very friendly and explains everything clearly. There are twelve students in my group, and most of them are around my age.\n\nI think the course is really useful because we practise speaking, listening and grammar in every lesson.\n\nLet me know if you want to join the course too!\n\nBest wishes,\nMaftuna",
    },
    cards: [
      { n: 1, task: "Your friend has asked about your new English course. Reply to the email.", points: ["Describe the course.", "Give information about the teacher and classmates.", "Say whether you recommend joining it and why."] },
      { n: 2, task: "A friend has asked you about your recent holiday. Write a reply.", points: ["Say where you went and who you went with.", "Describe two things you did.", "Say what you enjoyed most."] },
      { n: 3, task: "A classmate has asked for information about a school event. Write a reply.", points: ["Give the date and location.", "Explain what activities will take place.", "Tell them what they need to bring or do."] },
    ],
  },
  {
    id: "arrangement",
    no: 13,
    title: "Arrangement letter / email",
    purpose: "Uchrashuv, tadbir yoki rejani kelishish",
    when: "Uchrashuv, trip, event, appointment yoki activity uchun vaqt, joy va rejalarni kelishishda.",
    icon: "📅",
    color: "#0CA30C",
    tone: "informal",
    structure: [
      { label: "Greeting", hint: "Dear Ali" },
      { label: "Purpose", hint: "I am writing to arrange..." },
      { label: "Suggest time", hint: "How about meeting on...?" },
      { label: "Suggest place", hint: "We could meet at..." },
      { label: "Discuss details", hint: "Nima qilamiz?" },
      { label: "Ask for confirmation", hint: "Does that work for you?" },
    ],
    phrases: [
      { group: "Iboralar", list: ["I am writing to arrange...", "Shall we meet on...?", "How about...?", "Would ... be convenient for you?", "Are you available on...?", "We could meet at...", "Why don't we...?", "Does that work for you?", "Please let me know what you think."] },
    ],
    sample: {
      question: "You and your friend are planning a study session. Write an email to arrange the meeting.",
      answer:
        "Dear Ali,\n\nI am writing to arrange our study session for next week.\n\nHow about meeting on Saturday afternoon? We could meet at the library at around 2 p.m. I think it would be a quiet place for us to study.\n\nWe can spend the first hour preparing for the grammar test and then practise speaking together.\n\nDoes Saturday at 2 p.m. work for you? Please let me know if another time would be more convenient.\n\nLooking forward to seeing you.\n\nBest wishes,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You and your friend are planning a study session. Write an email to arrange it.", points: ["Suggest a day and time.", "Suggest a place.", "Explain what you will study together."] },
      { n: 2, task: "You are organising a small group trip. Write an email to a friend to arrange the plans.", points: ["Suggest the date and destination.", "Discuss transport.", "Ask your friend to confirm the plan."] },
      { n: 3, task: "You need to arrange a meeting with a course teacher. Write an email.", points: ["Suggest two possible times.", "Suggest where you can meet.", "Ask the teacher to confirm a convenient time."] },
    ],
  },
  {
    id: "feedback",
    no: 14,
    title: "Feedback letter / email",
    purpose: "Xizmat, kurs yoki tadbir haqida fikr bildirish",
    when: "Kurs, xizmat, event, hotel, restaurant, training yoki activity haqida fikr-mulohaza bildirganda. Feedback faqat shikoyat emas: yaxshi va yomon tomonlar hamda takliflar beriladi.",
    icon: "⭐",
    color: "#e0457b",
    tone: "formal",
    structure: [
      { label: "Purpose", hint: "I am writing to give you some feedback about..." },
      { label: "Positive points", hint: "I really enjoyed..." },
      { label: "Negative points", hint: "However, one thing that could be improved is..." },
      { label: "Suggestions", hint: "I would suggest..." },
      { label: "Overall comment", hint: "I hope my feedback will be helpful." },
    ],
    phrases: [
      { group: "Positive", list: ["I really enjoyed...", "I was particularly impressed by...", "I found ... very useful.", "The best thing about ... was..."] },
      { group: "Negative", list: ["However,...", "Unfortunately,...", "One thing that could be improved is...", "I was disappointed with..."] },
      { group: "Suggestion", list: ["I would suggest...", "It would be better if...", "You could consider...", "I recommend improving..."] },
    ],
    sample: {
      question: "You recently attended an English course. Write an email giving feedback about it.",
      answer:
        "Dear Sir/Madam,\n\nI am writing to give you some feedback about the English course I attended last month.\n\nOverall, I really enjoyed the course. The teacher was friendly and explained the grammar clearly. I also found the speaking activities particularly useful.\n\nHowever, I think there are a few things that could be improved. The classes were sometimes too large, so it was difficult for everyone to practise speaking.\n\nI would suggest having smaller groups or giving students more opportunities to speak in pairs.\n\nThank you for providing such a useful course. I hope my feedback will be helpful.\n\nYours faithfully,\nMaftuna",
    },
    cards: [
      { n: 1, task: "You recently attended an English course. Write an email giving feedback.", points: ["Mention two positive aspects.", "Explain one thing that could be improved.", "Give a practical suggestion."] },
      { n: 2, task: "You attended a local event and the organisers asked for feedback. Write an email.", points: ["Say what you enjoyed.", "Mention one problem or weakness.", "Suggest how the event could be improved."] },
      { n: 3, task: "You recently used a hotel or restaurant and were asked to give feedback. Write an email.", points: ["Describe what you liked.", "Describe one area for improvement.", "Give a suggestion for future customers or staff."] },
    ],
  },
];

/** Eng muhim farqlar (o'xshash turlar). */
export const DIFFERENCES: { a: string; b: string; text: string }[] = [
  { a: "Request", b: "Enquiry", text: "Request — biror narsa qilishni so‘raysiz: “Could you please send me the application form?” Enquiry — ma’lumot so‘raysiz: “Could you please tell me when the course starts?”" },
  { a: "Complaint", b: "Feedback", text: "Complaint — asosiy maqsad muammodan shikoyat qilish. Feedback — umumiy fikr + yaxshi/yomon tomonlar + taklif." },
  { a: "Formal", b: "Semi-formal", text: "Formal: Dear Sir/Madam → I am writing to... → Yours faithfully. Semi-formal: Dear Mr Brown → I hope you are well. → Kind regards." },
  { a: "Application", b: "Request", text: "Application: “I am writing to apply for...” — o‘zingizni nomzod sifatida ko‘rsatasiz. Request: “I am writing to request...” — biror narsa so‘raysiz." },
];

/** Universal xat formulasi. */
export const FORMULA: { label: string; text: string }[] = [
  { label: "Greeting", text: "Dear Sir/Madam / Dear Mr Smith / Dear Ali" },
  { label: "Purpose", text: "I am writing to..." },
  { label: "Details", text: "Firstly,... / In addition,... / Furthermore,..." },
  { label: "Action / Request / Suggestion", text: "I would appreciate it if... / I suggest that... / Could you please...?" },
  { label: "Closing", text: "I look forward to hearing from you. / Kind regards / Yours faithfully / Best wishes" },
];

/** Topshirishdan oldingi tezkor tekshiruv ro'yxati. */
export const CHECKLIST = [
  "Savolning barcha pointslariga javob berdimmi?",
  "Writing turi va tone (formal / semi-formal / informal) to‘g‘rimi?",
  "To‘g‘ri greeting ishlatdimmi?",
  "Introductionda writing purpose aniqmi?",
  "Har bir bullet point uchun yetarli detail berdimmi?",
  "Bog‘lovchi so‘zlardan foydalandimmi? (Firstly, However, In addition...)",
  "Closing writing turiga mosmi?",
  "Grammar, spelling va punctuationni tekshirdimmi?",
  `Word limitga rioya qildimmi? (${WORDS.min}–${WORDS.max} so‘z)`,
];

export const ALL_CARD_IDS = WRITING_TYPES.flatMap((t) => t.cards.map((c) => `${t.id}-${c.n}`));

export function findCard(cardId: string): { type: WritingType; card: CueCard } | null {
  const m = /^(.+)-([123])$/.exec(cardId);
  if (!m) return null;
  const type = WRITING_TYPES.find((t) => t.id === m[1]);
  const card = type?.cards.find((c) => c.n === Number(m[2]));
  return type && card ? { type, card } : null;
}

export const countWords = (text: string) => (text.trim().match(/[A-Za-z0-9'’-]+/g) ?? []).length;

/** Writing bo'limi faqat shu kursda. */
export const WRITING_COURSE = "Pre-Intermediate";
