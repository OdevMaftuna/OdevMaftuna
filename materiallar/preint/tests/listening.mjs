// Pre-Intermediate pullik testlari uchun ORIGINAL listening: skript (AI ovozi bilan o'qiladi) + 5 ta savol.
// clips: har biri alohida audio bo'lagi. speakers: {Ism: ovoz}. 2 kishilik bo'lak — bitta so'rovda (multi-speaker).
// Ovozlar (Gemini TTS): Kore, Aoede, Leda (ayol) · Puck, Charon, Fenrir (erkak).
const T = (q, a) => ({ t: "tf", q, a });
const M = (q, o, a) => ({ t: "mc", q, o, a });
const SPK = ["Speaker 1", "Speaker 2", "Speaker 3", "Speaker 4"];

export const LISTENING = {
  /* ---------- Unit 1: Feelings ---------- */
  P1: {
    title: "Listening. Listen to four people talking about events in the past. Which speaker …?",
    clips: [
      { speakers: { Narrator: "Charon" }, text: "Speaker one." },
      { speakers: { Speaker: "Aoede" }, text: "Last month I had my first driving lesson. I was so nervous that I forgot which pedal was the brake! The instructor was very patient, but I felt really embarrassed when we nearly hit a rubbish bin. Now I can laugh about it." },
      { speakers: { Narrator: "Charon" }, text: "Speaker two." },
      { speakers: { Speaker: "Puck" }, text: "In the football final I hurt my ankle in the first half. It was painful, but I didn't tell the coach because I didn't want to leave the team. I played until the end, and we won. The next day I couldn't walk at all!" },
      { speakers: { Narrator: "Charon" }, text: "Speaker three." },
      { speakers: { Speaker: "Leda" }, text: "My best friend got the part I wanted in the school play. I was a bit envious at first, to be honest. But on the night of the show she was brilliant, and I was really proud of her. Now I'm helping her learn her lines." },
      { speakers: { Narrator: "Charon" }, text: "Speaker four." },
      { speakers: { Speaker: "Fenrir" }, text: "I broke my brother's new headphones and I told him the cat did it. He believed me, but I felt terrible all week. In the end I told him the truth and bought him new ones with my own money. What a relief!" },
    ],
    items: [
      M("Which speaker kept doing something with an injury?", SPK, 1),
      M("Which speaker didn't tell the truth at first?", SPK, 3),
      M("Which speaker was jealous of a friend?", SPK, 2),
      M("Which speaker made a mistake while learning something new?", SPK, 0),
      M("Which speaker spent their own money to fix a problem?", SPK, 3),
    ],
  },

  /* ---------- Unit 2: Adventure ---------- */
  P2: {
    title: "Listening. Listen to Dilnoza talking to her friend about a trip. Choose the correct answers.",
    clips: [
      {
        speakers: { Jasur: "Puck", Dilnoza: "Kore" },
        text: `Jasur: Hi Dilnoza! How was your trip to the mountains?
Dilnoza: Amazing, but also a bit frightening! We were climbing to a lake at about three thousand metres.
Jasur: Wow. Did you get there?
Dilnoza: Yes, in the end. But while we were walking up the last part, a thick fog came down. We couldn't see more than five metres.
Jasur: That sounds dangerous. What did you do?
Dilnoza: Our guide told us to stop and wait. We sat on our rucksacks for about an hour and drank hot tea from a flask.
Jasur: Were you cold?
Dilnoza: Freezing! I had a warm jacket, but I forgot my gloves.
Jasur: And then?
Dilnoza: The fog disappeared and suddenly we saw the lake. It was absolutely stunning — bright blue, like a mirror.
Jasur: Would you go again?
Dilnoza: Definitely. But next time I'll pack better!`,
      },
    ],
    items: [
      M("Where was Dilnoza going?", ["To a lake in the mountains", "To a waterfall", "To the top of a volcano"], 0),
      M("What was the problem during the climb?", ["A storm", "Thick fog", "Heavy snow"], 1),
      M("What did the group do?", ["They went back down.", "They waited for about an hour.", "They called a helicopter."], 1),
      M("What did Dilnoza forget?", ["Her jacket", "Her flask", "Her gloves"], 2),
      M("How did she feel when she saw the lake?", ["Disappointed", "Amazed", "Frightened"], 1),
    ],
  },

  /* ---------- Unit 3: On screen ---------- */
  P3: {
    title: "Listening. Listen to an interview with a young film-maker. Are the sentences true or false?",
    clips: [
      {
        speakers: { Host: "Charon", Sevara: "Leda" },
        text: `Host: Today I'm talking to Sevara, who is only seventeen but has already made three short films. Sevara, how did you start?
Sevara: I started with my phone when I was thirteen. I made funny videos about my cat. My friends loved them, so I tried to tell real stories.
Host: What is your new film about?
Sevara: It's about a grandmother who teaches her grandson to cook. It's quite emotional — some people cry at the end!
Host: Was it expensive to make?
Sevara: Not at all. We didn't have much money, so my family were the actors and we filmed everything in our kitchen.
Host: What's the hardest part of making a film?
Sevara: Editing. It takes much longer than filming. For a ten-minute film, I spent about forty hours on the computer.
Host: And what's next?
Sevara: A film festival in Tashkent has chosen my film, so I'm going there next month. I'm really nervous!`,
      },
    ],
    items: [
      { t: "tf", q: "Sevara started making videos with a professional camera.", a: false },
      { t: "tf", q: "Her first videos were about her cat.", a: true },
      { t: "tf", q: "She paid professional actors for her new film.", a: false },
      { t: "tf", q: "She thinks editing takes more time than filming.", a: true },
      { t: "tf", q: "She has already been to the film festival.", a: false },
    ],
  },

  /* ---------- Unit 4: Our planet ---------- */
  P4: {
    title: "Listening. Listen to five short recordings about weather and nature. Choose the correct answers.",
    clips: [
      { speakers: { Narrator: "Charon" }, text: "One." },
      { speakers: { Speaker: "Kore" }, text: "Good morning. Today will be dry and sunny in the south, but in the north there will be heavy snow this afternoon, so please drive carefully." },
      { speakers: { Narrator: "Charon" }, text: "Two." },
      { speakers: { Speaker: "Puck" }, text: "After the earthquake, most buildings in the town were fine. The biggest problem was the water — the pipes broke and people had no clean water for three days." },
      { speakers: { Narrator: "Charon" }, text: "Three." },
      { speakers: { Speaker: "Aoede" }, text: "I usually paint in the garden, but at the moment it's far too windy. Yesterday my painting flew over the fence into my neighbour's garden!" },
      { speakers: { Narrator: "Charon" }, text: "Four." },
      { speakers: { Speaker: "Fenrir" }, text: "I couldn't sleep last night. It wasn't the heat — it was the thunder. It was so loud that the windows were shaking." },
      { speakers: { Narrator: "Charon" }, text: "Five." },
      { speakers: { Speaker: "Leda" }, text: "Our holiday was lovely, although the weather was a bit disappointing. It was cloudy almost every day, but at least it didn't rain." },
    ],
    items: [
      M("1. Where will it snow today?", ["In the south", "In the north", "Everywhere"], 1),
      M("2. What was the biggest problem after the earthquake?", ["Broken buildings", "No clean water", "No electricity"], 1),
      M("3. Why isn't the woman painting outside?", ["It's too windy.", "It's too hot.", "It's raining."], 0),
      M("4. The man couldn't sleep because of", ["the heat.", "the thunder.", "his neighbour."], 1),
      M("5. What was the weather like on the woman's holiday?", ["Rainy", "Sunny", "Cloudy"], 2),
    ],
  },

  /* ---------- Unit 5: Ambition ---------- */
  P5: {
    title: "Listening. Listen to a careers adviser talking to students. Are the sentences true or false?",
    clips: [
      {
        speakers: { Adviser: "Aoede" },
        text: `Hello everyone. Today I want to give you some advice about your first job interview. First, don't think only about money. Research shows that people who enjoy their work are often happier than people with very high salaries.
Second, prepare. Read about the company before the interview, and think of two or three questions you can ask them. Interviewers love students who are curious.
Third, you don't always need a university degree. For many jobs, companies are more interested in your skills — for example, if you can work well in a team or speak foreign languages.
And finally, don't be afraid of failure. My first three interviews went badly. But I learned something every time, and the fourth one was successful. So if you don't get a job, it isn't the end of the world — it's practice!`,
      },
    ],
    items: [
      T("The adviser says money is the most important thing in a job.", false),
      T("She says you should prepare some questions for the interviewer.", true),
      T("She says you always need a university degree.", false),
      T("She thinks languages can be a useful skill.", true),
      T("Her first job interview was successful.", false),
    ],
  },

  /* ---------- Unit 6: Tourism ---------- */
  P6: {
    title: "Listening. Listen to Aziz talking about a holiday. Are the sentences true or false?",
    clips: [
      {
        speakers: { Lola: "Kore", Aziz: "Fenrir" },
        text: `Lola: Aziz, you've just come back from Turkey, haven't you?
Aziz: Yes! We went by train and bus because my dad doesn't like flying. It took two days, but we saw so many places on the way.
Lola: Two days! Weren't you bored?
Aziz: Not really. We stopped in three cities and did some sightseeing. But I didn't prepare well — I forgot to take a power bank, so my phone was always dead.
Lola: Where did you stay?
Aziz: In a small hotel near the sea. The staff were really friendly. The receptionist even taught me some Turkish words.
Lola: Have you ever been abroad before?
Aziz: No, this was my first time. The most useful thing I took was my sister's phrase book — I used it every day!`,
      },
    ],
    items: [
      T("Aziz's family travelled by plane.", false),
      T("They visited other cities on the way.", true),
      T("Aziz was well prepared for the journey.", false),
      T("Aziz enjoyed talking to the hotel staff.", true),
      T("Aziz thinks the phrase book was the most useful thing.", true),
    ],
  },

  /* ---------- Unit 7: Shopping ---------- */
  P7: {
    title: "Listening. Listen to a conversation in a shop. Choose the correct answers.",
    clips: [
      {
        speakers: { Assistant: "Leda", Customer: "Puck" },
        text: `Assistant: Good afternoon. Can I help you?
Customer: Yes, please. I bought this jacket here last week, but there's a problem with it. The zip is broken.
Assistant: Oh, I'm sorry to hear that. Have you got the receipt?
Customer: Yes, here it is. I paid by card.
Assistant: Thank you. Would you like us to repair it, or would you prefer to exchange it?
Customer: Hmm. If you had the same jacket in black, I'd exchange it. But I'd rather have my money back, to be honest.
Assistant: That's fine. We can give you a full refund. It'll go back onto your card in about three days.
Customer: Great. And are those trainers in the sale?
Assistant: Yes, they're half price — only twenty-five dollars.
Customer: In that case, I'll try them on!`,
      },
    ],
    items: [
      M("What is wrong with the jacket?", ["It's the wrong size.", "The zip is broken.", "It's dirty."], 1),
      M("How did the customer pay?", ["In cash", "By card", "With a voucher"], 1),
      M("What does the customer finally decide?", ["To exchange the jacket", "To get the jacket repaired", "To get his money back"], 2),
      M("When will the money go back onto his card?", ["Today", "In about three days", "Next month"], 1),
      M("How much are the trainers now?", ["$25", "$50", "$15"], 0),
    ],
  },

  /* ---------- Unit 8: Crime ---------- */
  P8: {
    title: "Listening. Listen to a radio interview with a crime writer. Choose the correct answers.",
    clips: [
      {
        speakers: { Presenter: "Charon", Madina: "Kore" },
        text: `Presenter: My guest today is Madina Karimova, who writes detective stories. Madina, where do your ideas come from?
Madina: Mostly from real life. I'm interested in why people commit crimes — not how. Usually they're ordinary people who make one bad decision.
Presenter: Do you meet real criminals?
Madina: Sometimes. I once interviewed a man who had been a pickpocket for twenty years. He told me that everybody thinks they would notice a thief, but nobody does.
Presenter: Were you nervous?
Madina: A little! We met in a café, and he could see my bag on the chair the whole time. I kept my hand on it!
Presenter: Your books are very popular now. Why do you think that is?
Madina: I think it's because the detective is a normal schoolteacher, not a police officer. Readers say she reminds them of someone they know.`,
      },
    ],
    items: [
      M("Madina is most interested in", ["how criminals commit crimes.", "why people commit crimes.", "how the police catch criminals."], 1),
      M("The pickpocket told her that", ["most people notice thieves.", "nobody notices thieves.", "he had stopped stealing."], 1),
      M("Madina felt nervous in the café because", ["the man could see her bag.", "the café was empty.", "the man was angry."], 0),
      M("Who is the detective in her books?", ["A police officer", "A schoolteacher", "A journalist"], 1),
      M("Madina thinks her books are popular because", ["they are very short.", "readers recognise the detective.", "they are based on films."], 1),
    ],
  },

  /* ---------- Unit 9: Science ---------- */
  P9: {
    title: "Listening. Listen to five people talking about a science project. What is each speaker's main aim?",
    clips: [
      { speakers: { Narrator: "Charon" }, text: "One. The teacher." },
      { speakers: { Speaker: "Aoede" }, text: "This year I want my students to stop just reading about science. I want them to design something real that solves a problem at our school." },
      { speakers: { Narrator: "Charon" }, text: "Two. The girl." },
      { speakers: { Speaker: "Leda" }, text: "Our team is making a machine that sorts plastic bottles from paper. I really hope we win the competition, because the prize is a trip to a science museum in Moscow." },
      { speakers: { Narrator: "Charon" }, text: "Three. The man." },
      { speakers: { Speaker: "Fenrir" }, text: "I work for a recycling company. I'm here to find young engineers — maybe one of these students will work for us one day." },
      { speakers: { Narrator: "Charon" }, text: "Four. The woman." },
      { speakers: { Speaker: "Kore" }, text: "I'm a journalist. I'm writing an article about how schools teach science differently today, so I'm interviewing teachers and students." },
      { speakers: { Narrator: "Charon" }, text: "Five. The boy." },
      { speakers: { Speaker: "Puck" }, text: "Honestly, I just want to learn how to use the 3D printer. Winning doesn't matter to me — I want to make my own phone case!" },
    ],
    items: [
      M("1. The teacher's main aim is to", ["win a prize.", "help students solve a real problem.", "write an article."], 1),
      M("2. The girl's main aim is to", ["win the competition.", "find a job.", "make a phone case."], 0),
      M("3. The man's main aim is to", ["sell machines.", "find future workers.", "judge the competition."], 1),
      M("4. The woman's main aim is to", ["teach science.", "write about science education.", "start a company."], 1),
      M("5. The boy's main aim is to", ["learn a new skill.", "win the trip.", "interview teachers."], 0),
    ],
  },

  /* ---------- Cumulative 1–5 ---------- */
  PC15: {
    title: "Listening. Listen to a radio programme about a young athlete. Choose the correct answers.",
    clips: [
      {
        speakers: { Presenter: "Charon", Nigora: "Aoede" },
        text: `Presenter: Nigora is sixteen and she's the national junior champion in rock climbing. Nigora, how did you start?
Nigora: My uncle took me to a climbing wall when I was ten. I was terrified at first, but by the end of the day I didn't want to go home!
Presenter: How often do you train?
Nigora: Five days a week, after school. At weekends I go to real mountains near Chimgan, if the weather is good enough.
Presenter: Have you ever been injured?
Nigora: Yes, last year I sprained my wrist and couldn't climb for two months. That was really frustrating.
Presenter: What are your plans?
Nigora: Next spring I'm going to compete in Kazakhstan. And in the future I'd like to become a climbing instructor, so I can teach other girls.`,
      },
    ],
    items: [
      M("How did Nigora feel the first time she climbed?", ["Bored", "Terrified at first", "Disappointed"], 1),
      M("When does she climb real mountains?", ["After school", "At weekends, if the weather is good", "Only in summer"], 1),
      M("What happened last year?", ["She sprained her wrist.", "She broke her leg.", "She lost a competition."], 0),
      M("Where is she going to compete next spring?", ["In Kyrgyzstan", "In Kazakhstan", "In Turkey"], 1),
      M("What job would she like in the future?", ["A sports journalist", "A climbing instructor", "A mountain guide"], 1),
    ],
  },

  /* ---------- Cumulative 6–9 ---------- */
  PC69: {
    title: "Listening. Listen to a museum guide talking to visitors. Choose the correct answers.",
    clips: [
      {
        speakers: { Guide: "Fenrir" },
        text: `Welcome to the Museum of Inventions. Before we start, a few rules: please don't touch the exhibits, and photos are allowed, but without flash.
Our tour takes about an hour. We'll begin in the Hall of Materials, where you'll see how glass and paper were made hundreds of years ago. Then we'll move on to the Gadget Room. Many visitors say it's their favourite part, because you can try some of the old telephones and radios.
Last year something unusual happened here. A small statue was stolen from the entrance. The police found it three weeks later in a local market — the thief had tried to sell it for just ten dollars!
At the end of the tour, you can visit our gift shop. And if you show your ticket, you'll get a ten per cent discount on everything.`,
      },
    ],
    items: [
      M("What are visitors NOT allowed to do?", ["Take photos", "Touch the exhibits", "Visit the shop"], 1),
      M("How long does the tour take?", ["About an hour", "About two hours", "Thirty minutes"], 0),
      M("Why do many visitors like the Gadget Room?", ["It's the biggest room.", "They can try old gadgets.", "It has a café."], 1),
      M("Where did the police find the stolen statue?", ["At the airport", "In a local market", "In the thief's house"], 1),
      M("What do you get if you show your ticket in the shop?", ["A free gift", "A 10% discount", "A free coffee"], 1),
    ],
  },

  /* ---------- Cumulative 1–9 (Final) ---------- */
  PC19: {
    title: "Listening. Listen to two friends talking about their plans after school. Choose the correct answers.",
    clips: [
      {
        speakers: { Bekzod: "Puck", Zarina: "Leda" },
        text: `Bekzod: Zarina, have you decided what you're going to do after school?
Zarina: I think so. I'm going to apply to a university in Tashkent to study tourism. I'd love to work as a tour guide in Samarkand.
Bekzod: That sounds great. Your English is really good, too.
Zarina: Thanks! I've been studying for six years. What about you?
Bekzod: I'm not sure really. My parents want me to be a doctor, but I'm not very keen on biology. If I could choose anything, I'd study computer science.
Zarina: Why don't you talk to them? They might understand.
Bekzod: Maybe. Although they're strict, they always listen in the end.
Zarina: And you've already built that app for our school library. That's real experience!
Bekzod: You're right. OK — I'll talk to them this weekend.`,
      },
    ],
    items: [
      M("What does Zarina want to study?", ["Medicine", "Tourism", "Computer science"], 1),
      M("How long has Zarina been studying English?", ["Two years", "Four years", "Six years"], 2),
      M("What do Bekzod's parents want him to be?", ["A doctor", "A tour guide", "An engineer"], 0),
      M("What has Bekzod already made?", ["A website for a hotel", "An app for the school library", "A robot"], 1),
      M("What does Bekzod decide to do?", ["Study biology", "Talk to his parents this weekend", "Find a job"], 1),
    ],
  },
};
