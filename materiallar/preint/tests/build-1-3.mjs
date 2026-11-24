// Pre-Intermediate pullik testlari (Unit 1–3) — Solutions progress test formatida, original matnlar.
// node materiallar/preint/tests/build-1-3.mjs
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
export const T = (q, ...a) => ({ t: "text", q, a });
export const M = (q, o, a) => ({ t: "mc", q, o, a });
export const TF = (q, a) => ({ t: "tf", q, a });
export function save(n, subtitle, sections) {
  const t = { code: `P${n}`, course: "Pre-Intermediate", kind: "unit", unit: n, price: 35000, title: `Unit ${n} Test`, subtitle, sections };
  fs.writeFileSync(path.join(dir, `u0${n}.json`), JSON.stringify(t, null, 1));
  console.log(`P${n}`, sections.reduce((s, x) => s + x.items.length, 0), "savol");
}
const PARA = ["A", "B", "C", "D", "E", "— (no paragraph)"];

/* ================= UNIT 1 — Feelings ================= */
save(1, "Feelings · past simple · injuries", [
  { title: "A. Complete the dialogue. Use the past simple form of the verbs in brackets.", items: [
    T("Nodir: ______ (you / go) to the concert on Saturday?", "Did you go"),
    T("Lola: No, I ______ (stay) at home with my little brother.", "stayed"),
    T("Nodir: Oh, I ______ (buy) two tickets, but my friend was ill.", "bought"),
    T("Lola: What a shame! I ______ (not know) about it.", "didn't know", "did not know"),
    T("Nodir: The band ______ (be) brilliant — they played for three hours!", "was", "were"),
    T("Lola: Lucky you! I ______ (watch) a boring film instead.", "watched"),
  ] },
  { title: "B. Look at Aziz’s week and complete the sentences. Use the past simple.", passage: "Monday: ride my bike / fall off · Tuesday: can’t go to school / sleep all morning · Wednesday: feel lonely / call my cousin · Thursday: play chess with my cousin / not finish my project", items: [
    T("On Monday, Aziz ______ his bike and fell off. (ride)", "rode"),
    T("On Monday, Aziz rode his bike and ______ off. (fall)", "fell"),
    T("On Tuesday, he ______ go to school. (can’t)", "couldn't", "could not"),
    T("On Tuesday, he couldn’t go to school and ______ all morning. (sleep)", "slept"),
    T("On Wednesday, he ______ lonely. (feel)", "felt"),
    T("On Wednesday, he felt lonely so he ______ his cousin. (call)", "called"),
    T("On Thursday, he ______ chess with his cousin. (play)", "played"),
    T("On Thursday, he played chess but he ______ his project. (not finish)", "didn't finish", "did not finish"),
  ] },
  { title: "C. Complete the questions. Use the past simple of the verbs in the box. There is one extra verb.", box: ["be", "buy", "cook", "go", "meet", "pay", "write"], items: [
    T("‘Where ______ you last night?’ — ‘At my grandma’s house.’", "were"),
    T("‘When ______ (you) your best friend?’ — ‘In 2019, at school.’", "did you meet"),
    T("‘Who ______ (you) the letter to?’ — ‘To my aunt in Bukhara.’", "did you write"),
    T("‘How much ______ (you) for those trainers?’ — ‘300,000 so‘m.’", "did you pay"),
    T("‘What ______ (your dad) for dinner?’ — ‘Plov, of course!’", "did your dad cook"),
    T("‘Where ______ (they) on holiday?’ — ‘To Samarkand.’", "did they go"),
  ] },
  { title: "D. How did the person feel? Write an adjective from the box.", box: ["ashamed", "bored", "confused", "cross", "embarrassed", "envious", "excited", "frightened", "relieved", "upset"], items: [
    T("I broke my sister’s phone and didn’t tell her. Then she blamed our little brother. I felt ______.", "ashamed"),
    T("My best friend moved to another city and I cried all evening. I was ______.", "upset"),
    T("My cousin got a new laptop for her birthday. I want one too! I’m ______.", "envious"),
    T("The lesson was two hours long and the teacher just read from the book. I was ______.", "bored"),
    T("The teacher explained the task three times, but I still didn’t understand it. I was ______.", "confused"),
    T("Tomorrow we’re flying to Istanbul for the first time! I’m so ______.", "excited"),
    T("I fell over in front of the whole class and everybody laughed. I was really ______.", "embarrassed"),
    T("I thought I had lost my passport, but it was in my bag. I felt ______.", "relieved"),
    T("I heard a strange noise in the dark kitchen at 3 a.m. I was ______.", "frightened"),
    T("My brother ate the cake that I made for my friend. I was very ______ with him.", "cross"),
  ] },
  { title: "E. Complete the sentences with the adverbs in the box, from the MOST happy (1) to the LEAST happy (5).", box: ["a bit", "a little bit", "extremely", "rather", "very"], items: [
    T("1. I won the national maths competition, so I’m ______ happy!", "extremely"),
    T("2. My parents bought me a new bike, so I’m ______ happy.", "very"),
    T("3. We have no homework this weekend, so I’m ______ happy.", "rather"),
    T("4. The rain stopped, so I’m ______ happy.", "a bit"),
    T("5. I found 1,000 so‘m in my pocket, so I’m ______ happy.", "a little bit"),
  ] },
  { title: "F. Complete the sentences. The first letter of each word is given.", items: [
    T("Don’t play with that knife — you’ll c___ your finger.", "cut"),
    T("She fell off her horse and b_____ her arm. It’s in plaster now.", "broke"),
    T("I’ve got a big b_____ on my leg. It’s purple and blue.", "bruise"),
    T("After the long run I had a terrible p___ in my knee.", "pain"),
    T("Be careful on the wet floor — you might s___ and fall.", "slip"),
  ] },
  { title: "G. Complete the dialogue with the words in the box.", box: ["awful", "envious", "how", "joking", "nightmare", "relief", "shame", "sounds", "thing", "what"], items: [
    T("Dilnoza: I’m going to London with my school next month! — Sevara: Really? ______ exciting!", "How"),
    T("Sevara: I’m so ______! I’ve never been abroad.", "envious"),
    T("Dilnoza: And we’re going to sleep in a tent! — Sevara: You’re ______! In a tent?", "joking"),
    T("Sevara: That sounds like a ______!", "nightmare"),
    T("Dilnoza: No, it’s a festival! It ______ great, doesn’t it?", "sounds"),
    T("Sevara: OK, what a cool ______ to do!", "thing"),
    T("Sevara: I failed my driving test yesterday. — Dilnoza: Oh no! What a ______!", "shame"),
    T("Sevara: But I can take it again next week. — Dilnoza: Really? What a ______!", "relief"),
    T("Sevara: The examiner shouted at me all the time. — Dilnoza: How ______!", "awful"),
    T("Sevara: And he didn’t even say goodbye. — Dilnoza: ______ a horrible man!", "What"),
  ] },
  { title: "H. Read the text. Match paragraphs A–E with questions 1–7. There are two extra questions.", passage:
`A  Some people love flying. Others hold the seat in front of them and close their eyes. Until last summer I was in the second group. Then my uncle, a pilot, invited me to fly with him in a tiny plane over the Aral Sea region.

B  The plane had only two seats and it was smaller than my dad’s car. The engine was very loud, so we spoke through headphones. But from the window, the views of the old sea bed and the desert were unforgettable.

C  I didn’t know that small planes move a lot in the wind. I thought it would feel like a big passenger jet. I was calm and even took selfies before we took off.

D  After twenty minutes, a strong wind started. The plane jumped up and down and my stomach jumped with it. Sand from the desert made the sky yellow, and for a few minutes we couldn’t see the ground at all.

E  When we landed, my legs were shaking, but I felt proud. My uncle laughed and said I was a better passenger than most adults. Now I’m not frightened of flying any more — well, only a little bit.`, items: [
    M("In which paragraph does the writer say something positive about the flight?", PARA, 1),
    M("…describe bad weather during the flight?", PARA, 3),
    M("…say that she didn’t expect the plane to move a lot?", PARA, 2),
    M("…explain how different people feel about flying?", PARA, 0),
    M("…say how she feels about flying now?", PARA, 4),
    M("…say how much the flight cost?", PARA, 5),
    M("…describe the food on the plane?", PARA, 5),
  ] },
]);

/* ================= UNIT 2 — Adventure ================= */
save(2, "Adventure · past continuous · landscapes", [
  { title: "A. Complete the sentences. Use the past simple or past continuous.", items: [
    T("The girl ______ (wait) for the bus when it started to rain.", "was waiting"),
    T("The girl was waiting for the bus when it ______ (start) to rain.", "started"),
    T("Somebody ______ (steal) my bike while I was in the shop.", "stole"),
    T("While we ______ (walk) in the mountains, we saw a bear.", "were walking"),
    T("I ______ (cut) my finger while I was cooking dinner.", "cut"),
    T("What ______ (you / do) at 8 o’clock last night?", "were you doing"),
    T("The sun ______ (shine) and the birds were singing.", "was shining"),
    T("He ______ (not listen) when the guide explained the rules.", "wasn't listening", "was not listening"),
    T("When we ______ (reach) the top of the hill, we had lunch.", "reached"),
    T("They ______ (sail) across the lake when the storm began.", "were sailing"),
  ] },
  { title: "B. Each sentence has one mistake. Write the correct word.", items: [
    T("We was climbing the mountain when the snow started. → correct word: ______", "were"),
    T("I saw an eagle while I were walking. → correct word: ______", "was"),
    T("Did you saw the waterfall yesterday? → correct word: ______", "see"),
    T("She didn’t went to the camp last year. → correct word: ______", "go"),
    T("What you were doing when the phone rang? → correct word: ______", "were"),
    T("He falled into the river but he was OK. → correct word: ______", "fell"),
    T("They was sleeping when the bear came. → correct word: ______", "were"),
    T("While I was swimming, I loses my sunglasses. → correct word: ______", "lost"),
  ] },
  { title: "C. Complete the sentences. The first letter of each word is given.", items: [
    T("The Atlantic O_____ is between Europe and America.", "Ocean"),
    T("We climbed a small h___ behind the village to watch the sunset.", "hill"),
    T("Etna in Italy is an active v______ — it still erupts.", "volcano"),
    T("The Amudarya is the longest r____ in Central Asia.", "river"),
    T("It was dark in the f_____ because the trees were so tall.", "forest"),
    T("The street was so n_____ that the car couldn’t go down it.", "narrow"),
    T("Be careful — the lake is very d___ in the middle.", "deep"),
    T("The river is 500 metres w___ here, so we need a boat.", "wide"),
  ] },
  { title: "D. Complete the sentences with the words in the box. There are two extra words.", box: ["boots", "compass", "helmet", "life jacket", "paddle", "rope", "sleeping bag", "tent"], items: [
    T("We climbed down the cliff on a long ______.", "rope"),
    T("I lost my ______ in the river, so I couldn’t steer the canoe.", "paddle"),
    T("Always wear a ______ in the boat in case you fall in.", "life jacket"),
    T("Wear strong ______ when you walk in the mountains.", "boots"),
    T("Without a ______ we didn’t know which way was north.", "compass"),
    T("It was cold at night, but my ______ was very warm.", "sleeping bag"),
  ] },
  { title: "E. Replace the words in brackets with extreme adjectives. The first letter is given.", items: [
    T("The view from the top was f________ (very good).", "fantastic"),
    T("After the long walk we were s_______ (very hungry).", "starving"),
    T("The hostel was f_____ (very dirty).", "filthy"),
    T("Grandma’s soup was d________ (very tasty).", "delicious"),
    T("The elephant was e_______ (very big).", "enormous"),
    T("The news was a_______ (very surprising).", "amazing", "astonishing"),
  ] },
  { title: "F. Read the text and choose the correct answer A, B or C.", passage: "Last summer my friends and I (1) ___ a trip to the Chimgan mountains. (2) ___ morning we left very early. While we (3) ___ up the path, the weather changed. (4) ___ the foreground there were rocks, and in the background we could see dark clouds. It (5) ___ as if a storm was coming. Shall we go back? I asked. Let’s (6) ___ ,said Timur, (7) ___ we found a small cave. We waited there (8) ___ two hours. When the storm (9) ___ , we continued. It was the most (10) ___ day of my life!", items: [
    M("(1)", ["went", "made", "took"], 2),
    M("(2)", ["On the", "In the", "At"], 1),
    M("(3)", ["walked", "were walking", "are walking"], 1),
    M("(4)", ["On", "At", "In"], 2),
    M("(5)", ["looked", "saw", "watched"], 0),
    M("(6)", ["not", "no", "don't"], 0),
    M("(7)", ["but", "so", "because"], 0),
    M("(8)", ["since", "for", "during"], 1),
    M("(9)", ["was finishing", "finished", "finishes"], 1),
    M("(10)", ["exciting", "excited", "excitement"], 0),
  ] },
  { title: "G. Read the text and choose the correct answers.", passage:
`In 2016 a young Uzbek climber, Bobur, tried to climb Khan Tengri, a 7,010-metre mountain on the border of Kazakhstan and Kyrgyzstan. He trained for two years, running in the Chimgan hills every morning.

On the third day of the climb, while he was crossing a glacier, a snowstorm hit the mountain. Bobur couldn’t see more than two metres in front of him. Instead of continuing, he built a small wall of snow, got into his sleeping bag and waited. He spent eighteen hours there, eating chocolate and melting snow for water.

When the storm finished, he was cold and tired, and he decided to go down. ‘The mountain will still be there next year,’ he wrote in his diary. A year later he went back and reached the top. Today he gives talks at schools. ‘The most important skill in adventure,’ he tells students, ‘is knowing when to stop.’`, items: [
    M("What did Bobur do during the snowstorm?", ["He continued to the top.", "He stopped and waited in a snow shelter.", "He called for a helicopter."], 1),
    M("Why did Bobur go down after the storm?", ["He was injured.", "He was cold and tired.", "His guide told him to."], 1),
    M("What does Bobur tell students?", ["Adventure is too dangerous.", "You must always reach the top.", "It is important to know when to stop."], 2),
    M("What is the writer’s purpose?", ["To tell the story of a climber who made a good decision.", "To advertise a climbing school.", "To explain how glaciers are formed."], 0),
    TF("Bobur reached the top of Khan Tengri on his first attempt.", false),
  ] },
]);

/* ================= UNIT 3 — On screen ================= */
save(3, "On screen · quantifiers · must / needn’t", [
  { title: "A. Choose the correct words.", items: [
    M("We only have ___ time before the film starts.", ["a few", "a little"], 1),
    M("How ___ episodes are there in this series?", ["much", "many"], 1),
    M("I think ___ cartoons are better for adults than for children.", ["some", "any"], 0),
    M("There aren’t ___ good programmes on TV tonight.", ["some", "any"], 1),
    M("Did you do ___ homework last night?", ["much", "many"], 0),
    M("Is there ___ popcorn left?", ["some", "any"], 1),
    M("We haven’t got ___ milk, but we’ve got lots of juice.", ["much", "many"], 0),
    M("Quick! There are only ___ seats left in the cinema.", ["a few", "a little"], 0),
  ] },
  { title: "B. Rewrite the rules for a film club. Use must, mustn’t or needn’t.", items: [
    T("It is necessary to arrive on time. → You ______ arrive on time.", "must"),
    T("You are not allowed to eat during the film. → You ______ eat during the film.", "mustn't", "must not"),
    T("It isn’t necessary to bring your own snacks. → You ______ bring your own snacks.", "needn't", "need not", "don't have to"),
    T("You are not allowed to use your phone. → You ______ use your phone.", "mustn't", "must not"),
    T("Members are obliged to show their card. → Members ______ show their card.", "must"),
    T("It isn’t necessary to book a seat. → You ______ book a seat.", "needn't", "need not", "don't have to"),
    T("You are not allowed to talk loudly. → You ______ talk loudly.", "mustn't", "must not"),
  ] },
  { title: "C. Complete the advert with the words in the box.", box: ["any", "few", "little", "lot", "much"], items: [
    T("Do you spend a ______ of time watching series?", "lot"),
    T("Don’t have ______ friends who like the same films?", "any"),
    T("We meet a ______ times a month.", "few"),
    T("It costs very ______ — only 10,000 so‘m.", "little"),
    T("You don’t need ______ money to have fun!", "much"),
  ] },
  { title: "D. Write the type of film or TV programme.", items: [
    T("It tells you if it will rain tomorrow. → the weather ______", "forecast"),
    T("A film with drawn or computer-made characters, often for children. → an ______", "animation", "animated film", "cartoon"),
    T("A programme about real animals, places or events. → a ______", "documentary"),
    T("Ordinary people compete, and viewers vote for the winner. → a reality ______", "show"),
    T("A funny series about the same characters in the same place. → a ______", "sitcom"),
    T("A host talks to famous guests about their lives. → a ______ show", "chat", "talk"),
  ] },
  { title: "E. Complete the adjectives. The first and last letters are given.", items: [
    T("The film was so g______g that I couldn’t stop watching.", "gripping"),
    T("Too many characters made the story c_______g.", "confusing"),
    T("The s________k has some great songs.", "soundtrack"),
    T("The ending was so p_______e — I knew what would happen.", "predictable"),
    T("The jokes were really a_____g; we laughed all the time.", "amusing"),
    T("The special effects were i________e.", "impressive"),
  ] },
  { title: "F. Complete the sentences with the words in the box. There is one extra word.", box: ["benefits", "conduct", "express", "get", "make", "play", "problems", "views", "effects"], items: [
    T("My brother likes to ______ video games after school.", "play"),
    T("It is hard to ______ a decision when you’re tired.", "make"),
    T("Too much screen time causes ______ for young children.", "problems"),
    T("We should be free to ______ our opinions.", "express"),
    T("Social media can have good and bad ______ on teenagers.", "effects"),
    T("Scientists ______ experiments to find answers.", "conduct"),
    T("If you study hard, you will ______ good marks.", "get"),
    T("Sport has many health ______.", "benefits"),
  ] },
  { title: "G. Each sentence has one mistake. Write the correct word.", items: [
    T("Shall we watch a film tonight? — I’m not sure of that. → correct: ______", "about"),
    T("I quite fancy to watch a comedy. → correct: ______", "watching"),
    T("I’m not keen in horror films. → correct: ______", "on"),
    T("I’d rather to stay at home. → correct: ______", "stay"),
    T("I prefer comedies than dramas. → correct: ______", "to"),
    T("I’m big fan of science fiction. → correct: ______", "a"),
    T("Shall we settle in the new action film? → correct: ______", "on"),
    T("OK, I’m agree. → correct: ______", "agree"),
    T("That’s agree, then. → correct: ______", "agreed"),
    T("I can’t stand watch sad films. → correct: ______", "watching"),
  ] },
  { title: "H. Read the text and choose the correct answers.", passage:
`Have you ever wanted to be in a film? Every year, film companies need hundreds of ‘extras’ — the people you see walking in the street or sitting in a café behind the main actors.

You don’t need acting experience, but you do need patience. A day on a film set can last twelve hours, and you might spend ten of them waiting. Experienced extras always take a book or some music. Directors prefer people who are calm and follow instructions; if you complain or are late, they won’t call you again.

The pay is not high — about the same as working in a shop — and you will probably never see your face clearly on screen. So why do people do it? Many say it’s the experience: you see how films are made, you meet interesting people and, sometimes, you stand two metres from a star.`, items: [
    M("According to the writer, you are more likely to work as an extra again if you", ["have acting experience.", "are calm and follow instructions.", "talk to the director."], 1),
    M("The writer suggests taking a book because", ["there is a lot of waiting.", "extras must learn their lines.", "it helps you look natural."], 0),
    M("What does the writer say about the pay?", ["It is very good.", "It is similar to shop work.", "There is no pay."], 1),
    M("What is a benefit for extras?", ["They become famous.", "They see how films are made.", "They always appear clearly on screen."], 1),
    M("The best title for the article is", ["How to become a star", "Life as a film extra", "The history of cinema"], 1),
  ] },
]);
