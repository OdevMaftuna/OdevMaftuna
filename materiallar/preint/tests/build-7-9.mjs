// Pre-Intermediate pullik testlari (Unit 7–9). node materiallar/preint/tests/build-7-9.mjs
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const T = (q, ...a) => ({ t: "text", q, a });
const M = (q, o, a) => ({ t: "mc", q, o, a });
let rc = 0;
const MR = (q, o, a) => { const k = rc++ % o.length; const r = [...o.slice(k), ...o.slice(0, k)]; return M(q, r, r.indexOf(o[a])); };
function save(n, subtitle, sections) {
  const t = { code: `P${n}`, course: "Pre-Intermediate", kind: "unit", unit: n, price: 35000, title: `Unit ${n} Test`, subtitle, sections };
  fs.writeFileSync(path.join(dir, `u0${n}.json`), JSON.stringify(t, null, 1));
  console.log(`P${n}`, sections.reduce((s, x) => s + x.items.length, 0), "savol");
}
// "that" bilan va "that"siz variantlar.
const thatOpt = (...xs) => xs.flatMap((x) => (x.includes(" that ") ? [x, x.replace(" that ", " ")] : [x]));

/* ================= UNIT 7 — Money & shopping ================= */
save(7, "Shopping · second conditional · past perfect", [
  { title: "A. Complete the second conditional sentences.", items: [
    T("If I ______ (have) more money, I would buy a new phone.", "had"),
    T("If I had more money, I ______ (buy) a new phone.", "would buy", "'d buy"),
    T("If she ______ (not live) so far away, we would see her more often.", "didn't live", "did not live"),
    T("If we ______ (win) the lottery, we would travel around the world.", "won"),
    T("If I studied more, I ______ (get) better marks.", "would get", "'d get"),
    T("If you ______ (go) to bed earlier, you wouldn’t be so tired.", "went"),
    T("If I ______ (be) you, I would save some money.", "were", "was"),
    T("What ______ (you / do) if you found a wallet in the street?", "would you do"),
    T("If he ______ (know) the answer, he would tell you.", "knew"),
    T("If they ______ (not have) a car, they would take the bus.", "didn't have", "did not have"),
  ] },
  { title: "B. Complete the sentences with the past perfect.", items: [
    T("I paid for Aziz’s ticket because he ______ (lose) his wallet.", "had lost", "'d lost"),
    T("After Lola ______ (pass) her exams, she bought a new laptop.", "had passed", "'d passed"),
    T("I was upset because I ______ (spend) all my money.", "had spent", "'d spent"),
    T("When we arrived at the shop, it ______ (already / close).", "had already closed", "'d already closed"),
    T("The car didn’t start because Dad ______ (not put) any petrol in it.", "hadn't put", "had not put"),
    T("After she ______ (open) a bank account, she got a card in the post.", "had opened", "'d opened"),
    T("He bought a new ticket because he ______ (leave) his at home.", "had left", "'d left"),
    T("I couldn’t buy the phone because I ______ (not save) enough money.", "hadn't saved", "had not saved"),
    T("She exchanged the book because somebody ______ (already / give) her the same one.", "had already given", "'d already given"),
    T("After he ______ (look) in every shop, he decided to make a card himself.", "had looked", "'d looked"),
  ] },
  { title: "C. Write the shop or service. The first letter is given.", items: [
    T("Fresh bread and cakes: b______", "baker's", "bakery", "bakers"),
    T("Plants and flowers for your garden: g_____ c_____", "garden centre", "garden center"),
    T("Meat: b______", "butcher's", "butchers", "butcher"),
    T("They cook food and you eat it at home: t_______", "takeaway"),
    T("Rings and necklaces: j_______", "jeweller's", "jewellers", "jeweler's", "jewelry store"),
    T("Medicines and shampoo: c______", "chemist's", "chemist", "chemists"),
    T("Glasses and eye tests: o______", "optician's", "optician", "opticians"),
    T("Stamps and parcels: p___ o_____", "post office"),
    T("Boots and sandals: s___ s___", "shoe shop"),
    T("Pens, paper and notebooks: s_______", "stationer's", "stationery shop", "stationers", "stationery"),
  ] },
  { title: "D. Write the prices in words.", items: [
    T("£4.50 → ______", "four pounds fifty", "four pounds and fifty pence", "four pounds fifty pence"),
    T("$12 → ______", "twelve dollars"),
    T("€99 → ______", "ninety-nine euros", "ninety nine euros"),
    T("£0.75 → ______", "seventy-five pence", "seventy five pence", "seventy-five p"),
    T("$1.20 → ______", "one dollar twenty", "a dollar twenty", "one dollar and twenty cents", "one dollar twenty cents"),
  ] },
  { title: "E. Choose the correct words.", items: [
    MR("Shop assistant: Can I help you? — Customer: No thanks, I’m just ___.", ["looking", "seeing", "watching"], 0),
    MR("Customer: Can I ___ these jeans on?", ["try", "put", "wear"], 0),
    MR("Shop assistant: What ___ are you?", ["size", "number", "big"], 0),
    MR("Customer: They don’t ___ me. They’re too small.", ["fit", "suit", "match"], 0),
    MR("Customer: Can I pay by ___ card?", ["credit", "money", "cash"], 0),
  ] },
  { title: "F. Read the speech and choose the correct answer A, B or C.", passage: "Good morning. Today I’m going to talk about pocket money. (1) ___ of all, I’d like to look at how much teenagers get. (2) ___ , I’ll talk about how they spend it. (3) ___ , I’ll give my opinion. I’d like to start (4) ___ saying that most teenagers in our class get some money every week. Now I’d like to move (5) ___ to how they spend it. Most of them buy snacks, and this (6) ___ to my next point: health. There are a number of (7) ___ why I believe pocket money is useful. The main reason I (8) ___ this way is that it teaches us to plan. To (9) ___ up, I think every teenager should get pocket money. (10) ___ conclusion, thank you for listening.", items: [
    M("(1)", ["First", "Firstly", "At first"], 0),
    M("(2)", ["Finally", "Then", "To sum up"], 1),
    M("(3)", ["First", "Second", "Finally"], 2),
    M("(4)", ["by", "with", "for"], 0),
    M("(5)", ["in", "on", "up"], 1),
    M("(6)", ["leads", "takes", "goes"], 0),
    M("(7)", ["reason", "reasons", "reasoning"], 1),
    M("(8)", ["think", "feel", "say"], 1),
    M("(9)", ["sum", "summary", "summarise"], 0),
    M("(10)", ["At", "On", "In"], 2),
  ] },
  { title: "G. Read the text. Choose the sentence (A–G) that fits each gap. There are two extra sentences.", passage:
`Dilshod opened his first shop when he was nineteen. (1) ___ He sold phone cases and chargers from a small table at the Chorsu market.

At first, business was slow. (2) ___ So he started making short videos about his products and posting them online. Within three months, people were coming from other cities to buy from him.

(3) ___ He used the money to rent a real shop and hired two friends. But he made a big mistake: he bought too many cheap headphones, and most of them broke after a week. (4) ___

Today Dilshod has four shops. (5) ___ ‘Don’t worry about failing,’ he says. ‘Worry about not trying.’

A  Customers walked past without looking.
B  He had saved the money from a summer job.
C  He gave every customer their money back.
D  By the end of the year he had earned enough to grow.
E  He still works at the market every Saturday.
F  His parents had bought him a car.
G  Phones were very expensive at that time.`, items: [
    M("Gap 1", ["A", "B", "C", "D", "E", "F", "G"], 1),
    M("Gap 2", ["A", "B", "C", "D", "E", "F", "G"], 0),
    M("Gap 3", ["A", "B", "C", "D", "E", "F", "G"], 3),
    M("Gap 4", ["A", "B", "C", "D", "E", "F", "G"], 2),
    M("Gap 5", ["A", "B", "C", "D", "E", "F", "G"], 4),
  ] },
]);

/* ================= UNIT 8 — Crime ================= */
save(8, "Crime · reported speech", [
  { title: "A. Complete the reported speech.", items: [
    T("‘I am tired.’ → She said that she ______ tired.", "was"),
    T("‘We can’t find the key.’ → They said that they ______ find the key.", "couldn't", "could not"),
    T("‘I will call the police.’ → He said that he ______ call the police.", "would"),
    T("‘I have lost my bag.’ → She said that she ______ her bag.", "had lost"),
    T("‘I saw the thief.’ → He said that he ______ the thief.", "had seen", "saw"),
    T("‘We are watching the news.’ → They said that they ______ the news.", "were watching"),
    T("‘I don’t know him.’ → She said that she ______ him.", "didn't know", "did not know"),
  ] },
  { title: "B. Rewrite the direct speech as reported speech. Start with the words given.", items: [
    T("Witness: ‘I’m frightened.’ → The witness said ______", ...thatOpt("that he was frightened", "that she was frightened", "that they were frightened")),
    T("Victim (she): ‘Someone has stolen my car!’ → She said ______", ...thatOpt("that someone had stolen her car")),
    T("Police officer: ‘We will find the burglar.’ → The police officer said ______", ...thatOpt("that they would find the burglar")),
    T("Shop owner (he): ‘A boy took a phone yesterday.’ → He said ______", ...thatOpt("that a boy had taken a phone the day before", "that a boy had taken a phone the previous day", "that a boy took a phone the day before")),
    T("Teenager (he): ‘I can’t sleep at night.’ → He said ______", ...thatOpt("that he couldn't sleep at night", "that he could not sleep at night")),
    T("Judge: ‘The prisoner is guilty.’ → The judge said ______", ...thatOpt("that the prisoner was guilty")),
    T("Thief (she): ‘I won’t do it again.’ → She said ______", ...thatOpt("that she wouldn't do it again", "that she would not do it again")),
  ] },
  { title: "C. Read the dialogue. Then complete the summary with ONE word in each gap.", passage: "Nodir: I was at the bus stop. A man took my phone and ran away. — Police: Can you describe him? — Nodir: He was tall and he was wearing a red jacket. I will help you if I can.", items: [
    T("Nodir said that he ______ been at the bus stop.", "had"),
    T("He said that a man ______ taken his phone.", "had"),
    T("He said that the man ______ been tall.", "had"),
    T("He said that the man had been ______ a red jacket.", "wearing"),
    T("He said that he ______ help the police.", "would"),
    T("He said he would help if he ______.", "could"),
  ] },
  { title: "D. Complete the sentences. The first letter of each word is given.", items: [
    T("The r_____ took money from the bank.", "robber"),
    T("He was s_________ drugs across the border.", "smuggling"),
    T("The murderer k_____ two people before the police caught him.", "killed"),
    T("After the storm there was l_______ from empty shops.", "looting"),
    T("She was arrested for s__________ — she took a dress without paying.", "shoplifting"),
    T("V______ broke all the windows in the bus stop.", "vandals"),
    T("Someone is stealing money in the office. There’s a t____ here.", "thief"),
    T("An a______ started the fire on purpose.", "arsonist"),
    T("A m_____ took my bag in the street.", "mugger"),
    T("The b______ climbed in through the window at night.", "burglar"),
  ] },
  { title: "E. Complete the sentences with the words in the box. There are two extra words.", box: ["arrested", "charged", "commit", "court", "evidence", "fine", "guilty", "investigation", "prison", "sentenced", "witness", "jury"], items: [
    T("The police ______ him outside his house.", "arrested"),
    T("The police found important ______ — his fingerprints.", "evidence"),
    T("A ______ saw the accident and called the police.", "witness"),
    T("He was ______ with theft.", "charged"),
    T("The case went to ______ in March.", "court"),
    T("The ______ decided that the man was guilty.", "jury"),
    T("The judge ______ him to two years in prison.", "sentenced"),
    T("He spent two years in ______.", "prison"),
    T("For parking in the wrong place, you pay a ______.", "fine"),
    T("The police have started an ______ into the robbery.", "investigation"),
  ] },
  { title: "F. Complete the dialogue with ONE word in each gap.", items: [
    T("Ben: Should people go to prison for small crimes? — Anna: I don’t ______ so.", "think"),
    T("Ben: ______ my opinion, they should do community work.", "In"),
    T("Anna: I’m not ______ really. It depends on the crime.", "sure"),
    T("Anna: I agree ______ some extent.", "to"),
    T("Ben: I suppose it’s true ______ say that prisons are expensive.", "to"),
    T("Ben: M_______, they don’t always help people change.", "Moreover"),
    T("Anna: What ______ more, many people commit crimes again.", "is"),
    T("Ben: To ______ honest, I think education is the answer.", "be"),
    T("Anna: I ______ with you about that.", "agree"),
    T("Ben: That’s ______ I think too!", "what"),
  ] },
  { title: "G. Read the text and choose the correct answers.", passage:
`When I was a student, I wanted to be a detective. Instead, I became a teacher — but crime is still part of my job. Every year I organise a ‘murder mystery’ evening for my class.

Before the evening, each student gets a card with a secret: who they are, where they were at 9 p.m., and one lie they must tell. During the evening, they ask each other questions and try to find the ‘murderer’. Nobody is really hurt, of course!

The first time, I was nervous that the students would be bored. In fact, they loved it, especially the moment at the end when the murderer is revealed. The quiet students often become the best detectives because they listen carefully.

Now other teachers in my school use the idea. If you try it, my advice is simple: keep the rules short and let the students do the talking.`, items: [
    M("What did the writer want to be as a student?", ["A teacher", "A detective", "An actor"], 1),
    M("What does each student get before the evening?", ["A card with a secret", "A costume", "A list of questions"], 0),
    M("Which part do students enjoy most?", ["Writing the cards", "The end, when the murderer is revealed", "Telling lies"], 1),
    M("Why are quiet students often good detectives?", ["They know the answers.", "They listen carefully.", "They ask a lot of questions."], 1),
    M("What is the writer doing in this text?", ["Describing a classroom activity", "Reporting a real crime", "Complaining about students"], 0),
  ] },
]);

/* ================= UNIT 9 — Science ================= */
save(9, "Science · the passive · materials · gadgets", [
  { title: "A. Rewrite the sentences in the passive. Do not include the agent.", items: [
    T("People make bottles from glass. → Bottles ______", "are made from glass"),
    T("Someone stole my bike yesterday. → My bike ______", "was stolen yesterday"),
    T("They will build a new school next year. → A new school ______", "will be built next year"),
    T("People speak Uzbek in Uzbekistan. → Uzbek ______", "is spoken in Uzbekistan"),
    T("Someone has broken the window. → The window ______", "has been broken"),
    T("They invented the telephone in 1876. → The telephone ______", "was invented in 1876"),
    T("People grow cotton in this region. → Cotton ______", "is grown in this region"),
  ] },
  { title: "B. Write questions in the passive.", items: [
    T("When / the light bulb / invent? → ______", "When was the light bulb invented"),
    T("Where / tea / grow? → ______", "Where is tea grown"),
    T("How many languages / speak / in India? → ______", "How many languages are spoken in India"),
    T("Who / the Mona Lisa / paint / by? → ______", "Who was the Mona Lisa painted by"),
    T("Where / the first computer / build? → ______", "Where was the first computer built"),
  ] },
  { title: "C. Choose the correct answers.", items: [
    M("This bridge ___ in 1990.", ["built", "was built", "is building"], 1),
    M("English ___ all over the world.", ["is spoken", "speaks", "is speaking"], 0),
    M("The results ___ tomorrow.", ["will announce", "will be announced", "are announce"], 1),
    M("My phone ___ — I can’t find it anywhere!", ["has been stolen", "has stolen", "was steal"], 0),
    M("Paper ___ from wood.", ["makes", "is made", "made"], 1),
    M("The robot was designed ___ a team of students.", ["from", "by", "with"], 1),
    M("Many emails ___ every second.", ["are sent", "send", "are sending"], 0),
    M("When ___ the radio invented?", ["is", "was", "did"], 1),
  ] },
  { title: "D. Complete the materials. The first letter is given.", items: [
    T("Most boxes are made of c________.", "cardboard"),
    T("Roads and buildings are made of c_______.", "concrete"),
    T("Bank cards are made of p______.", "plastic"),
    T("Windows are made of g____.", "glass"),
    T("Shoes and bags are often made of l______.", "leather"),
    T("Coins are usually made of m____.", "metal"),
    T("My favourite T-shirt is 100% c_____.", "cotton"),
    T("Tables and chairs are often made of w___.", "wood"),
  ] },
  { title: "E. Choose the correct words.", items: [
    MR("Turn up the ___ — I can’t hear the music.", ["volume control", "power lead"], 0),
    MR("My phone is dead. Where’s my ___?", ["charger", "keyboard"], 0),
    MR("Press the ___ button to turn it on.", ["power", "volume"], 0),
    MR("Plug the cable into the ___.", ["USB port", "screen"], 0),
    MR("Type your password on the ___.", ["keyboard", "speaker"], 0),
    MR("Put on your ___ so you don’t disturb anyone.", ["headphones", "batteries"], 0),
    MR("Touch the ___ to open the app.", ["screen", "plug"], 0),
  ] },
  { title: "F. Complete the sentences with the words in the box. There is one extra word.", box: ["design", "discovery", "experiment", "invention", "research", "scientists"], items: [
    T("The internet is the most important ______ of the last fifty years.", "invention"),
    T("The ______ of penicillin saved millions of lives.", "discovery"),
    T("In the lab, we did an ______ with water and salt.", "experiment"),
    T("______ are trying to find a cure for the disease.", "Scientists"),
    T("The university is doing ______ into clean energy.", "research"),
  ] },
  { title: "G. Each sentence has one mistake. Write the correct word.", items: [
    T("Customer: Hi. There has a problem with my new tablet. → correct: ______", "is", "'s"),
    T("Assistant: When did you bought it? → correct: ______", "buy"),
    T("Customer: Last week. It stopped work yesterday. → correct: ______", "working"),
    T("Assistant: What’s wrong of it? → correct: ______", "with"),
    T("Customer: The screen is broke. → correct: ______", "broken"),
    T("Assistant: We can to repair it. → correct: ______", "repair"),
    T("Customer: Can I have my money return? → correct: ______", "back"),
    T("Assistant: Have you got the recipe? → correct: ______", "receipt"),
    T("Customer: Can I speak at the manager? → correct: ______", "to"),
    T("Assistant: Sorry, the manager is at lunch on the moment. → correct: ______", "at"),
  ] },
  { title: "H. Read the forum posts. Which person (A–D) says each thing? One person matches two questions.", passage:
`A — Madina: I can’t live without my smartwatch. It counts my steps and reminds me to drink water. My grandmother thinks it’s silly!

B — Otabek: I think the best invention is the washing machine. Before it, people spent a whole day washing clothes by hand.

C — Zarina: Phones are useful, but I’m worried about how much time we spend on them. Last month I turned mine off every evening, and I slept much better.

D — Bekzod: My dream is to design robots that help old people at home. I’m studying engineering now, and I’ve already built a small robot that can carry a cup of tea.`, items: [
    M("Who wants to invent something?", ["A", "B", "C", "D"], 3),
    M("Who chose an old invention as the most important?", ["A", "B", "C", "D"], 1),
    M("Who changed a habit?", ["A", "B", "C", "D"], 2),
    M("Whose relative doesn’t understand their gadget?", ["A", "B", "C", "D"], 0),
    M("Who has already made something?", ["A", "B", "C", "D"], 3),
  ] },
]);
