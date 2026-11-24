// Pre-Intermediate umumiy (cumulative) testlari — Solutions cumulative test formatida, original matnlar.
//   Units 1–5 (80 000), Units 6–9 (80 000), Units 1–9 (150 000).
// node materiallar/preint/tests/build-cumulative.mjs
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const T = (q, ...a) => ({ t: "text", q, a });
const M = (q, o, a) => ({ t: "mc", q, o, a });
function save(file, code, title, subtitle, price, sort, sections) {
  const t = { code, course: "Pre-Intermediate", kind: "level", unit: null, price, sort, title, subtitle, sections };
  fs.writeFileSync(path.join(dir, file), JSON.stringify(t, null, 1));
  console.log(code, sections.reduce((s, x) => s + x.items.length, 0), "savol", price);
}
const GAPS7 = ["A", "B", "C", "D", "E", "F", "G"];

/* ================= UNITS 1–5 ================= */
save("level-1-5.json", "PC15", "Units 1–5 Test", "Cumulative · Units 1–5 · grammar, vocabulary, use of English, reading", 80000, 101, [
  { title: "A. Complete the sentences. Use the correct form of the verbs in brackets.", items: [
    T("Aziz ______ (buy) new trainers last Saturday.", "bought"),
    T("We ______ (watch) TV when the lights went out.", "were watching"),
    T("Careful! That glass is going to fall — you ______ (break) it!", "are going to break", "'re going to break", "will break", "'ll break"),
    T("Lola ______ (not go) to the party last night.", "didn't go", "did not go"),
    T("______ (you / see) the eclipse yesterday?", "Did you see"),
    T("I ______ (meet) my cousins at the airport at 6 p.m. tomorrow. It’s all arranged.", "am meeting", "'m meeting"),
    T("You look cold — I ______ (close) the window.", "will close", "'ll close"),
    T("The phone rang while I ______ (have) a shower.", "was having"),
    T("If it ______ (not rain) tomorrow, we’ll go to the mountains.", "doesn't rain", "does not rain"),
    T("Kamola loves animals, so she ______ (study) to be a vet. She has already decided.", "is going to study", "'s going to study"),
  ] },
  { title: "B. Choose the correct answers to complete the dialogue.", items: [
    M("Sardor: ___ you like to come to the cinema with me tonight?", ["Do", "Would", "Will"], 1),
    M("Malika: I’d love to, but I ___ finish my project first.", ["must", "mustn’t", "needn’t"], 0),
    M("Sardor: You ___ do it now — it’s due next week!", ["mustn’t", "needn’t", "must"], 1),
    M("Malika: OK. What ___ we see?", ["shall", "will", "do"], 0),
    M("Sardor: There aren’t ___ good comedies on at the moment.", ["some", "much", "any"], 2),
    M("Malika: Then let’s watch the new adventure film. It’s ___ than the comedy anyway.", ["more exciting", "most exciting", "excitinger"], 0),
    M("Sardor: Is it scary? I’m not old ___ for horror films!", ["too", "enough", "very"], 1),
    M("Malika: No, it isn’t. It’s ___ best film of the year!", ["a", "the", "—"], 1),
    M("Sardor: Great. If we ___ at 6, we’ll get good seats.", ["leave", "will leave", "left"], 0),
    M("Malika: Perfect. I ___ meet you outside the cinema.", ["’ll", "’m", "am going"], 0),
  ] },
  { title: "C. Choose the correct words.", items: [
    M("After two hours of studying, we ___ a break.", ["took", "did"], 0),
    M("The view from the top of the mountain was ___.", ["very amazing", "absolutely amazing"], 1),
    M("Grandma’s plov was absolutely ___!", ["delicious", "tasty"], 0),
    M("He fell off his bike and ___ his wrist.", ["sprained", "injured himself"], 0),
    M("Don’t go near the ___ — smoke is coming out of it!", ["volcano", "desert"], 0),
    M("This film is so ___ — I don’t understand who is who.", ["confusing", "confused"], 0),
    M("I need to ___ a decision about my university.", ["make", "have"], 0),
    M("Nurses often work very long ___.", ["hours", "times"], 0),
    M("My brother wants to ___ the school football team.", ["join", "send"], 0),
    M("It was a ___ day, so we stayed inside and watched a film.", ["foggy", "sunshine"], 0),
  ] },
  { title: "D. Complete the sentences with the words in the box.", box: ["anxious", "challenging", "gripping", "proud", "stormy"], items: [
    T("My parents were very ______ of me when I won the chess competition.", "proud"),
    T("You keep looking at the clock. Are you ______ about the exam?", "anxious"),
    T("This series is so ______ — I watched five episodes last night!", "gripping"),
    T("It was very ______ last night — the wind broke our window.", "stormy"),
    T("Learning to play the violin is ______, but I love it.", "challenging"),
  ] },
  { title: "E. Complete the sentences with the correct form of the words in brackets.", items: [
    T("Getting into university was a great ______ (achieve).", "achievement"),
    T("We need a lot of ______ (prepare) before the trip.", "preparation"),
    T("The 20 km walk was ______ (exhaust) — I fell asleep at once.", "exhausting"),
    T("The ______ (explore) of space is very expensive.", "exploration"),
    T("She was very ______ (surprise) when she saw the cake.", "surprised"),
  ] },
  { title: "F. Each sentence has one mistake. Write the correct word.", items: [
    T("Ali: Hi Bobur! What you did at the weekend? → correct: ______", "did"),
    T("Bobur: I go hiking in the mountains with my dad. → correct: ______", "went"),
    T("Ali: Really? How exciting! — Bobur: Yes, but it rained all the day. → correct word to remove: ______ (write the word)", "the"),
    T("Ali: What a shame! Were you cold? — Bobur: Yes, I was freezing. I was very relieved when we arrive home. → correct: ______", "arrived"),
    T("Ali: I’m going to Samarkand next week. Do you fancy to come? → correct: ______", "coming"),
    T("Bobur: I’d love to, but I must to study for my exam. → correct: ______", "study"),
    T("Ali: You needn’t worry. You’re cleverest student in our class! → correct: ______", "the"),
    T("Bobur: That’s kind. If I will pass, I’ll come with you next time. → correct: ______", "pass"),
    T("Ali: Great. I think you’ll pass easy. → correct: ______", "easily"),
    T("Bobur: Thanks! I’m going call you after the exam. → correct: ______", "to"),
  ] },
  { title: "G. Read the text. Choose the sentence (A–G) that fits each gap. There are two extra sentences.", passage:
`When Shahzoda was fifteen, she decided to cycle from Tashkent to Samarkand — about 300 kilometres. (1) ___ Her parents were worried, but her uncle, a professional cyclist, agreed to go with her.

They trained for three months. Every weekend they rode longer distances in the hills. (2) ___ By the end of the summer, she could cycle 100 km in a day.

On the first day of the trip, a strong wind blew against them for hours. (3) ___ On the second day, Shahzoda’s back wheel broke in a small village. Luckily, a mechanic there repaired it for free.

On the third evening they finally saw the blue domes of the Registan. (4) ___ ‘I was exhausted, but I was so proud of myself,’ she says.

Today Shahzoda is studying sports science at university. (5) ___

A  At first, she was so tired that she wanted to give up.
B  She had never cycled more than 20 kilometres before.
C  It was the most beautiful sight of her life.
D  She also wants to organise a cycling club for girls.
E  They travelled by train to save time.
F  They only covered 60 km instead of 100.
G  Her uncle bought her a new car.`, items: [
    M("Gap 1", GAPS7, 1),
    M("Gap 2", GAPS7, 0),
    M("Gap 3", GAPS7, 5),
    M("Gap 4", GAPS7, 2),
    M("Gap 5", GAPS7, 3),
  ] },
]);

/* ================= UNITS 6–9 ================= */
save("level-6-9.json", "PC69", "Units 6–9 Test", "Cumulative · Units 6–9 · grammar, vocabulary, use of English, reading", 80000, 102, [
  { title: "A. Complete the sentences. Use the correct form of the verbs in brackets.", items: [
    T("I ______ (never / be) to London, but I’d love to go.", "have never been", "'ve never been"),
    T("After Nodir ______ (finish) his homework, he played football.", "had finished", "'d finished"),
    T("This bridge ______ (build) in 1965.", "was built"),
    T("If I ______ (have) more time, I would learn Japanese.", "had"),
    T("Timur ______ (visit) Istanbul last year and loved it.", "visited"),
    T("She said that she ______ (be) tired.", "was"),
    T("We ______ (live) in this flat since 2018.", "have lived", "'ve lived"),
    T("Paper ______ (make) from wood.", "is made"),
    T("He told me he ______ (lose) his keys the day before.", "had lost"),
    T("If everyone ______ (recycle), the planet would be cleaner.", "recycled"),
  ] },
  { title: "B. Complete the second sentence so that it means the same as the first. Use 1–3 words.", items: [
    T("Someone stole my bike. → My bike ______ stolen.", "was"),
    T("‘I am hungry,’ said Ali. → Ali said that ______ hungry.", "he was"),
    T("I don’t have a car, so I can’t drive to work. → If I ______ a car, I could drive to work.", "had"),
    T("I started learning English three years ago. → I ______ English for three years.", "have learned", "have learnt", "'ve learned", "'ve learnt", "have been learning"),
    T("They will open a new museum next year. → A new museum ______ next year.", "will be opened"),
    T("‘We can’t come,’ they said. → They said that they ______ come.", "couldn't", "could not"),
    T("First I did my homework. Then I watched TV. → After I ______ my homework, I watched TV.", "had done"),
    T("Is this your first visit to Bukhara? → ______ you been to Bukhara before?", "Have"),
    T("I’m not tall, so I can’t reach the shelf. → If I ______ taller, I could reach the shelf.", "were", "was"),
    T("People speak French in Canada. → French ______ in Canada.", "is spoken"),
  ] },
  { title: "C. Choose the correct words.", items: [
    M("We visited a beautiful ___ where the king used to live.", ["palace", "harbour"], 0),
    M("The museum was so ___ that we couldn’t see the paintings.", ["crowded", "deserted"], 0),
    M("Can I pay by ___ card?", ["credit", "cash"], 0),
    M("The ___ broke into the house at night and stole a TV.", ["burglar", "shoplifter"], 0),
    M("Most bottles are made of ___.", ["glass", "cotton"], 0),
    M("My phone has run out of battery. Where’s my ___?", ["charger", "headphones"], 0),
    M("The police found the thief’s ___ on the window.", ["fingerprints", "footprints"], 0),
    M("I can’t afford this jacket — it’s a ___ expensive.", ["bit too", "too much"], 0),
  ] },
  { title: "D. Complete the compound nouns with the words in the box. There is one extra word.", box: ["code", "glasses", "investigation", "pack", "prints", "site", "car"], items: [
    T("The message was written in a secret ______.", "code"),
    T("It’s very sunny — take your sun______.", "glasses"),
    T("The police have started a murder ______.", "investigation"),
    T("Put your water bottle in your back______.", "pack"),
    T("The detective found finger______ on the glass.", "prints"),
    T("I booked the hotel on a travel web______.", "site"),
  ] },
  { title: "E. Complete the sentences with the correct form of the verbs in brackets (to + verb or -ing).", items: [
    T("She offered ______ (help) me with my homework.", "to help"),
    T("I don’t mind ______ (go) by train.", "going"),
    T("He forgot ______ (lock) the door.", "to lock"),
    T("We’re thinking of ______ (visit) Khiva in May.", "visiting"),
    T("They decided ______ (buy) a new car.", "to buy"),
    T("I’m looking forward to ______ (see) you.", "seeing"),
  ] },
  { title: "F. Complete the dialogue with the words in the box.", box: ["agree", "extent", "Furthermore", "more", "opinion", "say", "sure", "think", "true", "What"], items: [
    T("Dilnoza: Do you think prisons help criminals change? — Rustam: I don’t ______ so.", "think"),
    T("Rustam: In my ______, education works better.", "opinion"),
    T("Dilnoza: I’m not ______ really. Some people need to be punished.", "sure"),
    T("Rustam: I ______ to some extent.", "agree"),
    T("Rustam: …to some ______, but not completely.", "extent"),
    T("Dilnoza: I suppose it’s ______ to say that prisons are expensive.", "true"),
    T("Rustam: ______, they don’t always work.", "Furthermore"),
    T("Dilnoza: What is ______, many people commit crimes again.", "more"),
    T("Rustam: ______ a shame! We need better ideas.", "What"),
    T("Dilnoza: I wouldn’t ______ that it’s hopeless, though.", "say"),
  ] },
  { title: "G. Read the posts. Who says each sentence? Choose the person.", passage:
`Nilufar: Last year I travelled to Japan. Everything was so clean, and the trains were never late. I bought too many souvenirs and had to buy a new suitcase!

Doniyor: I’m studying engineering. My dream is to invent a robot that sorts plastic for recycling. I’ve already built a small model.

Gulnora: Someone stole my phone on the bus last month. The police found it two weeks later because the thief had tried to sell it online.

Otabek: I think shopping online is better than going to shops. It’s cheaper, and I can compare prices. But I once ordered shoes that were two sizes too small!`, items: [
    M("Who had a problem with something they bought?", ["Nilufar", "Doniyor", "Gulnora", "Otabek"], 3),
    M("Who wants to help the environment?", ["Nilufar", "Doniyor", "Gulnora", "Otabek"], 1),
    M("Who was a victim of a crime?", ["Nilufar", "Doniyor", "Gulnora", "Otabek"], 2),
    M("Who spent too much money on a trip?", ["Nilufar", "Doniyor", "Gulnora", "Otabek"], 0),
    M("Who explains the advantages of something?", ["Nilufar", "Doniyor", "Gulnora", "Otabek"], 3),
  ] },
]);

/* ================= UNITS 1–9 ================= */
save("level-1-9.json", "PC19", "Pre-Intermediate Final Test", "Cumulative · Units 1–9 · the whole course in one exam", 150000, 103, [
  { title: "A. Complete the sentences with the correct form of the verbs in brackets.", items: [
    T("I ______ (go) to the dentist yesterday.", "went"),
    T("We ______ (play) chess when Mum came home.", "were playing"),
    T("If I won a lot of money, I ______ (buy) a house for my parents.", "would buy", "'d buy"),
    T("I ______ (meet) Sara at 5 p.m. today — we arranged it yesterday.", "am meeting", "'m meeting"),
    T("She ______ (already / finish) her project.", "has already finished", "'s already finished"),
    T("The pyramids ______ (build) thousands of years ago.", "were built"),
    T("When I arrived, the film ______ (already / start).", "had already started"),
    T("If Aziz passes the test, his parents ______ (be) very happy.", "will be", "'ll be"),
  ] },
  { title: "B. Choose the correct words.", items: [
    M("There isn’t ___ milk in the fridge.", ["many", "much", "a few"], 1),
    M("You ___ use your phone during the exam. It’s against the rules.", ["mustn’t", "needn’t", "don’t have to"], 0),
    M("This is the ___ day of the year!", ["hotter", "hottest", "most hot"], 1),
    M("Look at those clouds! It ___ rain.", ["will", "is going to", "would"], 1),
    M("He said he ___ come to the party.", ["will", "would", "can"], 1),
  ] },
  { title: "C. Complete the second sentence so that it has the same meaning. Use 1–3 words.", items: [
    T("It isn’t necessary to bring food. → You ______ bring food.", "needn't", "don't have to", "do not have to", "need not"),
    T("The bag is too heavy for me to carry. → The bag isn’t light ______ me to carry.", "enough for"),
    T("No mountain in Uzbekistan is higher than this one. → This is ______ mountain in Uzbekistan.", "the highest"),
    T("People grow cotton here. → Cotton ______ here.", "is grown"),
    T("I don’t know her number, so I can’t call her. → If I ______ her number, I could call her.", "knew"),
    T("‘I’m busy,’ said Lola. → Lola said she ______ busy.", "was"),
    T("I moved here in 2019. → I ______ here since 2019.", "have lived", "'ve lived", "have been"),
  ] },
  { title: "D. Match the words with the definitions. There are two extra words.", box: ["avalanche", "burglar", "cardboard", "chemist’s", "delicious", "documentary", "ruins", "shoplifter", "volcano", "waiter"], items: [
    T("A lot of snow falls down a mountain very fast. → ______", "avalanche"),
    T("A programme with facts about real life. → ______", "documentary"),
    T("You can buy medicine here. → ______", "chemist's", "chemists", "chemist"),
    T("This person serves food in a restaurant. → ______", "waiter"),
    T("A mountain with hot rock and smoke coming out of it. → ______", "volcano"),
    T("What is left of old buildings that were destroyed. → ______", "ruins"),
    T("This person takes things from shops without paying. → ______", "shoplifter"),
    T("Boxes are usually made of this. → ______", "cardboard"),
  ] },
  { title: "E. Make compound nouns. Use one word from A and one from B. (A: ice, seat, boarding, sun, murder, renewable · B: burn, pass, caps, investigation, energy, belt)", items: [
    T("Put on your ______ before the car moves.", "seat belt", "seatbelt"),
    T("Show your ______ at the gate before you get on the plane.", "boarding pass"),
    T("I stayed in the sun too long and got ______.", "sunburn"),
    T("Global warming is melting the polar ______.", "ice caps"),
    T("Wind and solar power are types of ______.", "renewable energy"),
    T("The detective is leading a ______.", "murder investigation"),
  ] },
  { title: "F. Choose the correct words.", items: [
    M("I was ___ when I saw a snake in my tent.", ["terrified", "terrifying"], 0),
    M("Kayaking is great fun, but don’t forget your ___.", ["life jacket", "sleeping bag"], 0),
    M("The pay is good. ___, the hours are long.", ["However", "Although"], 0),
    M("Can I ___ these shoes on?", ["try", "put"], 0),
    M("The police ___ him for stealing a car.", ["arrested", "sentenced"], 0),
    M("There’s something wrong ___ my laptop.", ["with", "of"], 0),
  ] },
  { title: "G. Rewrite the sentences. Use the word in brackets. Write only the missing part.", items: [
    T("I’m tired because I worked all day. → I worked all day, ______ tired. (so)", "so I'm", "so I am"),
    T("It was raining. We played football. → ______ it was raining, we played football. (although)", "Although"),
    T("Let’s go to the park. → ______ going to the park? (How about)", "How about"),
    T("I think you should rest. → Why ______ rest? (don’t)", "don't you"),
    T("I prefer to stay at home. → I’d ______ stay at home. (rather)", "rather"),
    T("‘I’ll call you,’ he said. → He said he ______ me. (would)", "would call"),
    T("The museum was crowded. We enjoyed it. → The museum was crowded. ______, we enjoyed it. (nevertheless)", "Nevertheless"),
    T("She’s very rich. She isn’t happy. → ______ she’s very rich, she isn’t happy. (even though)", "Even though"),
    T("Can you repair my phone? → Can my phone ______? (be)", "be repaired"),
    T("I agree with you up to a point. → I agree to some ______. (extent)", "extent"),
  ] },
  { title: "H. Read the text and choose the correct answers.", passage:
`Wanted: Young Guides for Summer Tours in Khiva

Are you 16–19, friendly and good at English? Every summer thousands of tourists visit the old city of Khiva, and we need young people to show them around.

You don’t need any experience — we will give you two weeks of training in history and guiding. However, you must be able to speak English confidently, and a second foreign language is a big advantage.

Guides work four days a week, from 8 a.m. to 1 p.m., because the afternoons are too hot for walking tours. You will earn a good salary, plus tips from tourists, and the best guide of the summer will win a trip to Istanbul.

To apply, send a short video in English (no longer than two minutes) telling us why you love Khiva. Applications close on 1 May.`, items: [
    M("Who is the advert for?", ["Experienced tour guides", "Young people who speak English", "Tourists visiting Khiva"], 1),
    M("What will the company give new guides?", ["Two weeks of training", "A free trip to Istanbul", "A second language course"], 0),
    M("Why do the tours finish at 1 p.m.?", ["The guides need to study.", "It is too hot in the afternoon.", "The museums close."], 1),
    M("What must you send to apply?", ["A letter in English", "A short video", "Your exam results"], 1),
    M("What can the best guide win?", ["A higher salary", "Tips from tourists", "A trip to Istanbul"], 2),
  ] },
]);
