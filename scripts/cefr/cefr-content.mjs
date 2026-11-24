/**
 * CEFR (Multilevel) B2 — 22-noyabr … 15-dekabr kunlik plan mazmuni.
 * Har kuni: kun mavzusi (strategiya), Speaking (bitta part, navbat bilan) va Writing (Task 1 yoki Task 2, navbat bilan).
 * Reading / Listening mashqlari load-cefr-plan.mjs da Multilevel Master kitobidan tanlanadi.
 */

// Kun mavzusi: qaysi ko'nikmaga e'tibor va qisqa B2 maslahat (o'zbekcha).
export const FOCUS = [
  "Kirish kuni. Har bir part formatini eslang. Reading: avval savolni, keyin matnni o‘qing. Listening: audio boshlanishidan oldin savollarni ko‘zdan kechiring.",
  "Reading Part 3 (sarlavhalar): har xatboshining BIRINCHI va OXIRGI gapi asosiy fikrni beradi. Bir xil so‘z — tuzoq, ma’no bir xilligini qidiring.",
  "Listening Part 2 (bo‘sh joy): bo‘sh joydan oldingi va keyingi so‘zga qarab qaysi so‘z turkumi kerakligini taxmin qiling (ot? son? sifat?). Imloga e’tibor!",
  "Reading Part 4–5 (uzun matn): savollar matn tartibida keladi. Javob topilgan joyni belgilab boring — keyingi savol undan keyin.",
  "Listening Part 3 (gapiruvchilar): har bir gapiruvchining FIKRI yoki HIS-TUYG‘USIga quloq soling, ayrim so‘zlarga emas. Ortiqcha variant bor.",
  "Paraphrase kuni. Imtihon matndagi so‘zni savolda boshqa so‘z bilan beradi: expensive → cost a lot, began → started. Bugun 10 ta shunday juftlikni yozib oling.",
  "Reading Part 2 (matnlarni moslash): har bir odamning talabini (kim nimani xohlaydi) 2–3 kalit so‘z bilan yozib oling, keyin matnlarni ko‘ring.",
  "1-hafta yakuni. O‘tgan 7 kunning xatolarini ko‘rib chiqing: qaysi partda ko‘p xato? Ertadan o‘sha partga 10 daqiqa ko‘proq ajrating.",
  "Vaqt bilan ishlash: Reading — har bir mashqqa 10–12 daqiqadan ko‘p sarflamang. Bugun soat qo‘yib ishlang.",
  "Listening: B2 uchun 35 tadan taxminan 25+ to‘g‘ri javob kerak. Bilmagan savolni tashlab ketmang — taxmin qiling, jarima yo‘q.",
  "Reading Part 1 (matnga so‘z yozish): yozilgan so‘z gapga GRAMMATIK mos kelsin (ko‘plik -s, fe’l zamoni). Bitta harf xatosi — ball yo‘qoladi.",
  "Grammar for B2: Writing va Speakingda kamida bittadan conditional (If I were…), passive (It is believed…) va relative clause (…, which…) ishlating.",
  "Linking words kuni: However, Moreover, On the other hand, As a result, Although. Bugungi writingda kamida 5 tasini to‘g‘ri ishlating.",
  "Reading — T/F/NG: “Not Given” — matnda umuman yo‘q ma’lumot. Mantiqan to‘g‘ri tuyulsa ham, matnda yo‘q bo‘lsa — Not Given.",
  "Listening: ikkinchi eshitishda faqat ishonchsiz javoblarni tekshiring. Javob ko‘pincha “but”, “actually”, “in fact” dan keyin keladi.",
  "2-hafta yakuni. Shu kungacha eng yaxshi va eng yomon natijangizni solishtiring. Writingda AI izohidagi takrorlanuvchi xatolarni ro‘yxat qiling.",
  "Mini-mock kayfiyati: bugungi Reading va Listeningni to‘xtamasdan, imtihondagidek bir o‘tirishda bajaring.",
  "Vocabulary for B2: umumiy so‘zlar o‘rniga aniqrog‘ini ishlating: good → beneficial, bad → harmful, big → significant, very important → essential.",
  "Speaking fluency: 2 daqiqa to‘xtamasdan gapirish. Fikr topilmasa: “Let me think…”, “What I mean is…” — sukut qilmang.",
  "Writing Task 2 rejasi: 4 xatboshi — kirish (fikringiz), 2 ta asosiy xatboshi (sabab + misol), xulosa. 5 daqiqa rejaga sarflang.",
  "Takrorlash kuni: eng ko‘p xato qilgan partingizni qayta ishlang. Bugungi mashqlardan keyin xato sabablarini yozing.",
  "Mock kuni: Writing — to‘liq 60 daqiqa (Task 1.1 + 1.2 + Task 2) soat bilan. Reading/Listening — imtihondagidek.",
  "Yengil kun: yangi narsa o‘rganmang. Xatolar ro‘yxatini, linking so‘zlar va B2 iboralarni takrorlang. Erta uxlang.",
  "Oxirgi kun. Imtihon kuni: pasport, vaqtida boring, har bir partda vaqtni kuzating. Ishonch bilan! Siz tayyorsiz 💪",
];

// Speaking: 24 ta topshiriq, partlar navbat bilan (1.1 → 1.2 → 2 → 3).
export const SPEAKING = [
  { part: "Part 1.1", text: "Javob bering (har biriga 30 soniya):\n1) Where do you live and what do you like about it?\n2) How do you usually spend your weekends?\n3) What kind of music do you enjoy and why?" },
  { part: "Part 1.2", text: "Ikki rasmni solishtiring (har biri 45 soniya):\nRasm A: a family cooking dinner together at home.\nRasm B: a family eating at a busy restaurant.\n1) What can you see in the pictures? Compare them.\n2) Which do you prefer and why?\n3) Why do some families eat out more often nowadays?" },
  { part: "Part 2", text: "1 daqiqa tayyorlaning, 2 daqiqa gapiring:\nDescribe a person who has influenced you.\n— Who is this person?\n— How do you know them?\n— What did they do?\n— Why were they important to you?" },
  { part: "Part 3", text: "1 daqiqa tayyorlaning, 2 daqiqa gapiring. Ikkala tomonni ham ayting va o‘z fikringizni bildiring:\n“Students should be allowed to use phones in class.”\nFOR: quick access to information · learning apps\nAGAINST: distraction · less real communication" },
  { part: "Part 1.1", text: "1) What do you do in your free time?\n2) Do you prefer studying alone or with others? Why?\n3) What was the last book or film you enjoyed?" },
  { part: "Part 1.2", text: "Rasm A: a student studying in a quiet library.\nRasm B: students studying together in a café.\n1) Compare the two places.\n2) Where do you study better and why?\n3) How has technology changed the way young people study?" },
  { part: "Part 2", text: "Describe a place you would like to visit in the future.\n— Where is it?\n— How did you learn about it?\n— What would you do there?\n— Why do you want to go there?" },
  { part: "Part 3", text: "“Online learning is better than learning in a classroom.”\nFOR: flexible time · cheaper · learn at your own speed\nAGAINST: less motivation · no face-to-face contact · technical problems" },
  { part: "Part 1.1", text: "1) What is your favourite season and why?\n2) How do you usually travel to school or work?\n3) What would you like to change in your daily routine?" },
  { part: "Part 1.2", text: "Rasm A: people shopping in a traditional bazaar.\nRasm B: a person shopping online at home.\n1) Compare the two ways of shopping.\n2) Which one do you use more often?\n3) Will traditional markets disappear in the future?" },
  { part: "Part 2", text: "Describe a skill you learned that is useful in your life.\n— What is the skill?\n— When and how did you learn it?\n— Was it difficult?\n— How does it help you now?" },
  { part: "Part 3", text: "“Young people should do sports every day.”\nFOR: better health · less stress · teamwork\nAGAINST: not enough time · expensive clubs · some people don’t enjoy sport" },
  { part: "Part 1.1", text: "1) What do you usually do on your birthday?\n2) Do you like cooking? Why / why not?\n3) Which website or app do you use most often?" },
  { part: "Part 1.2", text: "Rasm A: a young person working in an office.\nRasm B: a young person working from home on a laptop.\n1) Compare the two working situations.\n2) Which would you choose and why?\n3) What are the disadvantages of working from home?" },
  { part: "Part 2", text: "Describe a time when you helped someone.\n— Who did you help?\n— What was the problem?\n— How did you help?\n— How did you feel afterwards?" },
  { part: "Part 3", text: "“Tourism brings more advantages than disadvantages to a city.”\nFOR: jobs · money for the city · cultural exchange\nAGAINST: pollution · higher prices · crowded streets" },
  { part: "Part 1.1", text: "1) Who is your best friend and how did you meet?\n2) Do you prefer the city or the countryside?\n3) What job would you like to have in ten years?" },
  { part: "Part 1.2", text: "Rasm A: children playing outside in a park.\nRasm B: children playing video games at home.\n1) Compare the two activities.\n2) Which is better for children and why?\n3) How much screen time is healthy for children?" },
  { part: "Part 2", text: "Describe an important decision you made.\n— What was the decision?\n— When did you make it?\n— Who helped you?\n— Do you think it was the right decision?" },
  { part: "Part 3", text: "“Everyone should learn a foreign language at school.”\nFOR: better jobs · travel · understanding other cultures\nAGAINST: too much pressure · translation apps · not everyone needs it" },
  { part: "Part 1.1", text: "1) What do you like most about learning English?\n2) How do you relax after a long day?\n3) What is a tradition in your family?" },
  { part: "Barcha partlar (Mock)", text: "To‘liq Speaking mock (taxminan 15 daqiqa):\nPart 1.1: Tell me about your hometown. / What do you do in the evenings? / Do you like reading?\nPart 1.2: Rasm A — people using public transport; Rasm B — people driving their own cars. Compare and answer: Which is better for the environment?\nPart 2: Describe a memorable trip you took.\nPart 3: “Cities should ban cars from the city centre.” (FOR / AGAINST)" },
  { part: "Part 2 + Part 3", text: "Part 2: Describe a goal you hope to achieve in the future.\nPart 3: “Money is the most important thing when choosing a job.”\nFOR: comfortable life · family support\nAGAINST: job satisfaction · health · free time" },
  { part: "Part 1.1 (yengil)", text: "Imtihondan oldin dam oling. Faqat 3 ta savolga javobni ovoz chiqarib takrorlang:\n1) Can you introduce yourself?\n2) What are you studying or doing now?\n3) What are your plans for the future?" },
];

// Writing: 1-kun Task 1, 2-kun Task 2, … (navbat bilan). 22-kun — to'liq mock.
const T1 = (context, letter, t11, t12) => ({ kind: "t1", context, letter, t11, t12 });
const T2 = (topic) => ({ kind: "t2", topic });
export const WRITING = [
  T1(
    "You are a member of an English language club. You received this email from the club manager:",
    "Dear members, next month the club will organise a weekend event. We are thinking of a film night, a trip to a museum or a speaking competition. Which would you prefer and why? Do you have any other ideas?",
    "Write a message to your friend who is also a member. Tell them which event you like and why.",
    "Write a letter to the club manager. Say which event you prefer, explain why, and suggest how to make it successful.",
  ),
  T2("Some people believe that students should wear school uniforms, while others think they should be free to wear what they want. Discuss both views and give your own opinion."),
  T1(
    "You recently bought a pair of headphones from an online shop. You received this email:",
    "Dear customer, thank you for your order. We would like to know about your experience. Was the delivery on time? Are you happy with the product? Please let us know.",
    "Write a message to your friend. Tell them about your experience with the shop.",
    "Write a letter to the shop. The headphones stopped working after a week and the delivery was late. Describe the problem and say what you want them to do.",
  ),
  T2("Nowadays many young people spend several hours a day on social media. Is this a positive or a negative development? Give reasons and examples."),
  T1(
    "You live in a city where the local council wants to improve a park near your home. You received this email:",
    "Dear residents, we have money to improve the park. We could build a playground, a sports area or a quiet garden with benches. What do you think we should do?",
    "Write a message to your neighbour. Tell them about the email and what you think.",
    "Write a letter to the council. Say which option you prefer, explain why, and add one more suggestion.",
  ),
  T2("Some people think that it is better to work for a big company, while others prefer to work for a small company. Discuss both views and give your opinion."),
  T1(
    "You attended a three-day English course at a training centre. You received this email:",
    "Dear student, thank you for joining our course. To make our courses better, please tell us what you liked, what you did not like and what we should change.",
    "Write a message to your friend who wants to join the next course. Tell them about your experience.",
    "Write a letter to the training centre. Give your opinion about the course and suggest improvements.",
  ),
  T2("Many people believe that the government should spend more money on public transport instead of building new roads. To what extent do you agree or disagree?"),
  T1(
    "Your college is planning to change the time of classes. You received this email from the director:",
    "Dear students, we are planning to start classes at 7:30 instead of 8:30 next term, and finish earlier. We would like to hear your opinion before we decide.",
    "Write a message to your classmate. Tell them about the plan and how you feel about it.",
    "Write a letter to the director. Explain how this change would affect you and suggest an alternative.",
  ),
  T2("Some people say that children should start learning a foreign language at primary school. Others think it is better to start in secondary school. Discuss both views and give your opinion."),
  T1(
    "You stayed at a hotel during a holiday. You received this email from the hotel:",
    "Dear guest, thank you for staying with us. We would be grateful if you could tell us about your stay: the room, the staff and the food.",
    "Write a message to your friend who is planning to stay at the same hotel. Give them advice.",
    "Write a letter to the hotel manager. Describe what you liked and one serious problem during your stay, and suggest how to solve it.",
  ),
  T2("Some people think that famous sportspeople and actors earn too much money. Do you agree or disagree? Give reasons and examples."),
  T1(
    "Your local library is looking for volunteers. You saw this message on its website:",
    "We need volunteers to help children with reading on Saturday mornings. If you are interested, please write to us and tell us about yourself and why you would like to help.",
    "Write a message to your friend. Invite them to volunteer with you and explain why it is a good idea.",
    "Write a letter to the library. Introduce yourself, explain why you want to volunteer and what experience or skills you have.",
  ),
  T2("In many countries, people are living longer than before. What problems does this cause, and what can be done to solve them?"),
  T1(
    "A new gym has opened in your area. You received this email:",
    "Dear neighbour, our gym is now open! We would like to know what classes and services you would be interested in, and what time is best for you.",
    "Write a message to your friend. Tell them about the new gym and suggest going together.",
    "Write a letter to the gym manager. Say what classes you are interested in, what time suits you, and ask about student prices.",
  ),
  T2("Some people believe that homework should be banned in schools. Others think it is necessary for learning. Discuss both views and give your opinion."),
  T1(
    "You recently took part in a city festival as a visitor. You received this email from the organisers:",
    "Dear visitor, thank you for coming to our festival. We are planning next year’s festival and we would like to hear your opinion. What did you enjoy and what should we improve?",
    "Write a message to your friend who missed the festival. Tell them about it.",
    "Write a letter to the organisers. Give your opinion and make suggestions for next year.",
  ),
  T2("Online shopping is becoming more popular than shopping in traditional shops. Do the advantages of this trend outweigh the disadvantages?"),
  T1(
    "Your university wants to open a new student café. You received this email:",
    "Dear students, we are opening a new café on campus. What kind of food and drinks would you like? What should the café look like? Please send us your ideas.",
    "Write a message to your friend. Tell them about the café and share your ideas.",
    "Write a letter to the university. Describe what kind of café students need and explain why.",
  ),
  T2("Some people think that the best way to reduce traffic in cities is to make public transport free. To what extent do you agree or disagree?"),
  T1(
    "You booked a ticket for a concert, but the concert was cancelled. You received this email:",
    "Dear customer, we are sorry to tell you that the concert has been cancelled. You can choose a ticket for another concert or get your money back. Please tell us what you would like.",
    "Write a message to your friend who was going to come with you. Tell them the news and what you plan to do.",
    "Write a letter to the ticket company. Say how you feel, what you would like them to do, and ask about any extra costs you had.",
  ),
  { kind: "mock" },
  T2("Many people believe that technology has made our lives more complicated, not easier. Do you agree or disagree? (Bugun tayyor essaylaringizdan birini qayta yozing — xatolarni tuzatib.)"),
  { kind: "rest" },
];
