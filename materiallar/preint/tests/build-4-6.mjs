// Pre-Intermediate pullik testlari (Unit 4–6). node materiallar/preint/tests/build-4-6.mjs
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const T = (q, ...a) => ({ t: "text", q, a });
const M = (q, o, a) => ({ t: "mc", q, o, a });
// To'g'ri javob doim birinchi bo'lmasligi uchun variantlarni aylantiradi.
let rc = 0;
const MR = (q, o, a) => { const k = rc++ % o.length; const r = [...o.slice(k), ...o.slice(0, k)]; return M(q, r, r.indexOf(o[a])); };
const TF = (q, a) => ({ t: "tf", q, a });
function save(n, subtitle, sections) {
  const t = { code: `P${n}`, course: "Pre-Intermediate", kind: "unit", unit: n, price: 35000, title: `Unit ${n} Test`, subtitle, sections };
  fs.writeFileSync(path.join(dir, `u0${n}.json`), JSON.stringify(t, null, 1));
  console.log(`P${n}`, sections.reduce((s, x) => s + x.items.length, 0), "savol");
}

/* ================= UNIT 4 — Our planet ================= */
save(4, "Our planet · comparatives · too / enough", [
  { title: "A. Complete the sentences so that they are true. Use the comparative form + than.", items: [
    T("A car is ______ (fast) a bicycle.", "faster than"),
    T("Winter in Tashkent is ______ (cold) summer.", "colder than"),
    T("Breakfast is ______ (early) dinner.", "earlier than"),
    T("Mount Everest is ______ (high) Mont Blanc.", "higher than"),
    T("A diamond is ______ (expensive) a stone.", "more expensive than"),
    T("Fire is much ______ (hot) ice.", "hotter than"),
    T("Walking is ______ (good) for your health than sitting all day. (Write one word.)", "better"),
  ] },
  { title: "B. Complete the sentences with the superlative form of the adjectives in the box.", box: ["big", "deep", "dry", "fast", "high", "long", "old"], items: [
    T("The Atacama Desert in Chile is one of ______ places on Earth.", "the driest"),
    T("Jupiter is ______ planet in our solar system.", "the biggest"),
    T("The Nile is one of ______ rivers in the world.", "the longest"),
    T("Lake Baikal is ______ lake in the world.", "the deepest"),
    T("The cheetah is ______ land animal.", "the fastest"),
    T("Everest is ______ mountain in the world.", "the highest"),
    T("Samarkand is one of ______ cities in Central Asia.", "the oldest"),
  ] },
  { title: "C. Complete the answers. Use too or enough and the word in brackets.", items: [
    T("Why didn’t you make tea? — We didn’t have ______ (sugar).", "enough sugar"),
    T("Did you finish the test? — No, it was ______ (difficult).", "too difficult"),
    T("Can we swim today? — No, the water isn’t ______ (warm).", "warm enough"),
    T("Can I put the sofa here? — No, there isn’t ______ (space).", "enough space"),
    T("Why don’t we take the bus? — It’s ______ (slow). Let’s take a taxi.", "too slow"),
    T("Shall we walk to the lake? — No, I’m ______ (tired).", "too tired"),
  ] },
  { title: "D. Choose the correct answers.", items: [
    MR("It’s ___ today. Take your umbrella!", ["raining", "sunny", "dry"], 0),
    MR("There was a big ___ last night with lightning.", ["thunderstorm", "frost", "sunshine"], 0),
    MR("The car was covered with ___ this morning because it was so cold.", ["frost", "fog", "hail"], 0),
    MR("Small balls of ice fell from the sky. It was ___.", ["hail", "mist", "breeze"], 0),
    MR("Be careful! The road is covered with ___.", ["ice", "heat", "sun"], 0),
    MR("If there’s a ___, don’t go outside — the wind is very dangerous.", ["hurricane", "shower", "drizzle"], 0),
    MR("___ makes a lot of people feel happy.", ["Sunshine", "Fog", "Hail"], 0),
    MR("Children love playing in ___ weather — they can make a snowman.", ["snowy", "foggy", "windy"], 0),
    MR("It was hard to see the road in the ___.", ["fog", "sun", "heat"], 0),
    MR("Look at the ___ falling! Every one is different.", ["snowflakes", "raindrops", "rainbows"], 0),
  ] },
  { title: "E. Write the natural disaster.", items: [
    T("A big fire in a forest when it is very hot and dry. → a ______ fire", "forest", "wild", "bush"),
    T("The ground shakes and buildings fall down. → an ______", "earthquake"),
    T("A disease spreads quickly to many people. → an ______", "epidemic"),
    T("A giant wave from the sea destroys towns. → a ______", "tsunami"),
    T("Wet earth moves down a hill after heavy rain. → a ______", "landslide", "mudslide"),
  ] },
  { title: "F. Write the adjective for each temperature. There is one extra adjective.", box: ["boiling", "cold", "cool", "freezing", "mild", "warm"], items: [
    T("−10°C → ______", "freezing"),
    T("4°C → ______", "cold"),
    T("12°C → ______", "cool"),
    T("22°C → ______", "warm"),
    T("40°C → ______", "boiling"),
  ] },
  { title: "G. Complete the description of two photos with the words in the box.", box: ["Both", "common", "contrast", "difference", "first", "In", "see", "shows", "Unlike", "whereas"], items: [
    T("The ______ theme in the photos is the weather.", "common"),
    T("______ photos show people outside.", "Both"),
    T("You can ______ trees in both photos.", "see"),
    T("The first photo ______ a hot summer day.", "shows"),
    T("…, ______ the second photo shows a snowy street.", "whereas"),
    T("______ the first photo, people are wearing T-shirts.", "In"),
    T("One obvious ______ is the clothes.", "difference"),
    T("______ the first photo, the second photo is quite dark.", "Unlike"),
    T("In ______ to the first photo, the people in the second one look cold.", "contrast"),
    T("In the ______ photo the children are swimming.", "first"),
  ] },
  { title: "H. Read the text. Are the sentences true or false?", passage:
`Uzbekistan has a continental climate: summers are long, hot and dry, and winters can be surprisingly cold. In July, temperatures in Termez sometimes reach 45°C, while in January the mountains near Tashkent can be −20°C.

Spring is the shortest and the most beautiful season. For a few weeks the hills turn green and red with tulips, and families go on picnics. But spring also brings sudden storms, and in the mountain valleys heavy rain can cause mudslides.

The biggest environmental problem in the region is water. The Aral Sea was once the fourth largest lake in the world, but it lost most of its water in the 20th century because rivers were used for cotton farms. Today, scientists and local people are planting trees on the old sea bed to stop the dust storms.`, items: [
    TF("Summers in Uzbekistan are usually wet.", false),
    TF("It can be −20°C in the mountains near Tashkent.", true),
    TF("Spring is the longest season.", false),
    TF("Heavy rain in spring can cause mudslides.", true),
    TF("People are planting trees on the old bed of the Aral Sea.", true),
  ] },
]);

/* ================= UNIT 5 — Ambition ================= */
save(5, "Ambition · will / going to · first conditional · jobs", [
  { title: "A. Choose the correct words.", items: [
    M("Look at those black clouds! It ___ rain.", ["will", "is going to"], 1),
    M("I think robots ___ do many jobs in the future.", ["will", "are going to"], 0),
    M("I’ve decided. I ___ study medicine.", ["will", "am going to"], 1),
    M("The phone is ringing. — I ___ answer it!", ["’ll", "’m going to"], 0),
    M("What ___ do after school? Have you got any plans?", ["will you", "are you going to"], 1),
    M("I promise I ___ tell anyone.", ["won’t", "am not going to"], 0),
    M("That box looks heavy. I ___ carry it for you.", ["’ll", "’m going to"], 0),
  ] },
  { title: "B. Complete the first conditional sentences.", items: [
    T("If I don’t pass my exams, I ______ (not go) to university.", "won't go", "will not go"),
    T("If you ______ (save) money, you’ll buy a car.", "save"),
    T("If it ______ (rain) tomorrow, we’ll stay at home.", "rains"),
    T("If she gets the job, she ______ (move) to Tashkent.", "will move", "'ll move"),
    T("You’ll be tired if you ______ (not sleep) enough.", "don't sleep", "do not sleep"),
    T("If we ______ (be) late, the boss will be angry.", "are"),
    T("If you become a pilot, you ______ (travel) all over the world.", "will travel", "'ll travel"),
  ] },
  { title: "C. Each sentence has one mistake. Write the correct word.", items: [
    T("If I will get the job, I’ll buy you dinner. → correct: ______", "get"),
    T("I’m going be a doctor one day. → correct: ______", "to"),
    T("If you won’t hurry, you’ll miss the bus. → correct: ______", "don't"),
    T("She will to call you later. → correct: ______", "call"),
    T("If it’s sunny, we going to the beach. → correct: ______", "will", "'ll"),
    T("I think he’ll becomes a famous singer. → correct: ______", "become"),
  ] },
  { title: "D. Match the jobs with the definitions. There are two extra jobs.", box: ["architect", "builder", "delivery driver", "estate agent", "IT specialist", "mechanic", "pilot", "police officer", "receptionist", "shop assistant", "waiter", "vet"], items: [
    T("This person is an expert with computers. → ______", "IT specialist"),
    T("This person welcomes guests at a hotel. → ______", "receptionist"),
    T("This person flies planes. → ______", "pilot"),
    T("This person repairs cars and machines. → ______", "mechanic"),
    T("This person helps you in a shop. → ______", "shop assistant"),
    T("This person brings food to your table in a restaurant. → ______", "waiter"),
    T("You talk to this person if you see a crime. → ______", "police officer"),
    T("This person designs new buildings. → ______", "architect"),
    T("This person brings parcels to your home. → ______", "delivery driver"),
    T("This person sells houses and flats. → ______", "estate agent"),
  ] },
  { title: "E. Complete the words that describe jobs. The first letter is given.", items: [
    T("Doctors earn a lot — it’s a w___-paid job.", "well"),
    T("Waiters often have a b___-paid job.", "badly", "low"),
    T("Firefighters have a d________ job.", "dangerous"),
    T("I want to work o______, not in an office.", "outdoors", "outside"),
    T("Teachers work with p_____ every day.", "people"),
    T("Nurses often work long h____.", "hours"),
    T("Being a pilot can be very s________ — you can’t make mistakes.", "stressful"),
    T("I’d like a c_______ job where I can draw and design.", "creative"),
    T("A p___-time job is good for students.", "part"),
    T("A job in a bank can be r_______ — you do the same things every day.", "repetitive", "routine"),
  ] },
  { title: "F. Join the two sentences with the word in brackets. Write ONE sentence (although / even though) or TWO sentences (however / nevertheless).", items: [
    T("The job is well paid. I don’t like it. (although)", "Although the job is well paid, I don't like it", "I don't like the job although it is well paid", "I don't like it although the job is well paid", "Although the job is well-paid, I don't like it"),
    T("It was raining. We went for a walk. (even though)", "We went for a walk even though it was raining", "Even though it was raining, we went for a walk"),
    T("He works long hours. He’s always happy. (nevertheless)", "He works long hours. Nevertheless, he's always happy", "He works long hours. Nevertheless he's always happy"),
    T("The hotel was expensive. It wasn’t very nice. (however)", "The hotel was expensive. However, it wasn't very nice", "The hotel was expensive. However it wasn't very nice"),
    T("She’s very young. She’s an excellent manager. (although)", "Although she's very young, she's an excellent manager", "She's an excellent manager although she's very young"),
    T("I studied a lot. I failed the exam. (even though)", "I failed the exam even though I studied a lot", "Even though I studied a lot, I failed the exam"),
    T("The bus is slow. It’s cheap. (however)", "The bus is slow. However, it's cheap", "The bus is slow. However it's cheap"),
    T("He didn’t get the job. He tried again next year. (nevertheless)", "He didn't get the job. Nevertheless, he tried again next year", "He didn't get the job. Nevertheless he tried again next year"),
  ] },
  { title: "G. Read the text. Match paragraphs A–E with questions 1–7. There are two extra questions.", passage:
`A  When Malika was eight, she watched a documentary about elephants and decided she wanted to be a vet. Her family laughed — nobody in her village had ever been to university.

B  At school she worked harder than anyone. Although her parents couldn’t pay for extra lessons, she studied biology from old books at the library every evening.

C  She failed her university exam the first time. ‘I cried for a week,’ she remembers. ‘Then I made a new plan.’ She worked in a pet shop for a year and studied at night.

D  The second time, she passed with one of the highest scores in the country. Five years later she qualified as a vet and opened a small clinic in her village.

E  Today Malika visits schools to talk to girls about science. ‘If you have a dream,’ she tells them, ‘don’t let anybody laugh at it.’`, items: [
    M("In which paragraph … does Malika give advice to young people?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 4),
    M("… do we learn how her dream started?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 0),
    M("… do we learn what she did after failing?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 2),
    M("… do we learn how she studied without money for lessons?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 1),
    M("… do we learn where she works now?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 3),
    M("… do we learn how much she earns?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 5),
    M("… does she describe her favourite animal?", ["A", "B", "C", "D", "E", "— (no paragraph)"], 5),
  ] },
]);

/* ================= UNIT 6 — Tourism ================= */
save(6, "Tourism · present perfect · places", [
  { title: "A. Complete the sentences. Use the past simple or present perfect.", items: [
    T("I ______ (visit) Khiva three times.", "have visited", "'ve visited"),
    T("We ______ (not see) our cousins since 2020.", "haven't seen", "have not seen"),
    T("She ______ (go) to Istanbul last summer.", "went"),
    T("______ (you / ever / try) Indian food?", "Have you ever tried"),
    T("Timur ______ (never fly) in a plane, but he wants to.", "has never flown"),
    T("When ______ (you / arrive) in Bukhara?", "did you arrive"),
    T("They ______ (live) here for ten years. They still live here.", "have lived", "'ve lived"),
    T("Dad ______ (buy) me a camera for my birthday last week.", "bought"),
  ] },
  { title: "B. Complete the postcard with the past simple or present perfect of the verbs in the box. There is one extra verb.", box: ["be", "climb", "eat", "meet", "see", "swim", "take"], items: [
    T("Hi Aziza! We’re in Antalya. We ______ here since Monday.", "have been", "'ve been"),
    T("Yesterday we ______ in the sea all day.", "swam"),
    T("I ______ lots of new friends this week.", "have met", "'ve met"),
    T("On Tuesday we ______ a boat trip to an island.", "took"),
    T("I ______ (never / eat) such delicious fish!", "have never eaten", "'ve never eaten"),
    T("This morning we ______ up a hill to the old castle.", "climbed"),
  ] },
  { title: "C. Choose the correct words.", items: [
    M("Where’s Dad? — He’s ___ to the bank. He’ll be back soon.", ["been", "gone"], 1),
    M("Have you ___ been to Paris?", ["ever", "never"], 0),
    M("___ have you had your bike?", ["When", "How long"], 1),
    M("I’ve known her ___ five years.", ["for", "since"], 0),
    M("We ___ to the museum last Sunday.", ["have gone", "went"], 1),
    M("They’ve lived here ___ 2015.", ["for", "since"], 1),
  ] },
  { title: "D. Match the places with the definitions. There is one extra place.", box: ["aquarium", "castle", "harbour", "market", "monument", "mosque", "museum", "palace", "square", "statue", "tower"], items: [
    T("Boats stay here, safe from the sea. → ______", "harbour"),
    T("A religious building for Muslims. → ______", "mosque"),
    T("A king or queen lives here. → ______", "palace"),
    T("You can see fish and sea animals here. → ______", "aquarium"),
    T("A tall, narrow building. → ______", "tower"),
    T("A figure of a person, made of stone or metal. → ______", "statue"),
    T("You can learn about history or science here. → ______", "museum"),
    T("You can buy fruit, clothes and souvenirs here. → ______", "market"),
    T("It helps people remember an important event or person. → ______", "monument"),
    T("An open area in the centre of a town, with four sides. → ______", "square"),
  ] },
  { title: "E. Choose the correct words.", items: [
    MR("The museum was small and not very ___.", ["impressive", "crowded", "spectacular"], 0),
    MR("We couldn’t see anything because it was so ___.", ["crowded", "quiet", "empty"], 0),
    MR("The café was ___, so there were no free tables.", ["busy", "peaceful", "boring"], 0),
    MR("The old castle in the fog looked ___.", ["atmospheric", "modern", "touristy"], 0),
    MR("Everyone said the waterfall was amazing, but I thought it was ___.", ["disappointing", "breathtaking", "stunning"], 0),
  ] },
  { title: "F. Complete the email with the words in the box. There are two extra words.", box: ["accommodation", "brochure", "guided", "luggage", "sightseeing", "souvenirs", "trip"], items: [
    T("We went on a ______ tour of the old city with a local guide.", "guided"),
    T("Our ______ was a small family hotel near the centre.", "accommodation"),
    T("On the second day we went ______ and saw all the famous places.", "sightseeing"),
    T("I bought some ______ for my friends at the market.", "souvenirs"),
    T("At the airport, they lost my ______! All my clothes were in it.", "luggage"),
  ] },
  { title: "G. Complete the dialogue with the words in the box.", box: ["Either", "fancy", "keen", "Let's", "not", "plan", "Shall", "sure", "What", "Why"], items: [
    T("Ali: ______ we visit the Registan first?", "Shall"),
    T("Lola: I’m not ______ about that. It’s very hot at midday.", "sure"),
    T("Lola: ______ about going to the museum first?", "What"),
    T("Ali: ______ suggestion is fine by me.", "Either"),
    T("Lola: ______ don’t we have lunch after the museum?", "Why"),
    T("Ali: Good idea. Do you ______ trying the local plov?", "fancy"),
    T("Lola: I’m not very ______ on plov. I’d prefer soup.", "keen"),
    T("Ali: OK. Then a walk in the old town? — Lola: That’s a really good ______.", "plan"),
    T("Ali: Shall we take a taxi back? — Lola: I’d rather ______. Let’s walk.", "not"),
    T("Ali: OK. ______ do that.", "Let's"),
  ] },
  { title: "H. Read the posts. Who says each sentence? Choose the person.", passage:
`Kamola: I’ve visited twelve countries, but my favourite trip was to the mountains near my home. We stayed with a family and helped them with their animals.

Rustam: I love big cities. Last year I went to Istanbul and spent every day in museums. I didn’t go to the beach once!

Nigora: I’ve never been abroad. This summer I travelled around Uzbekistan by train with my sister. It was cheap and we met lots of friendly people.

Jasur: I went on a cruise with my parents. The ship was fantastic, but I got seasick and stayed in my cabin for two days.`, items: [
    M("Who was ill during the holiday?", ["Kamola", "Rustam", "Nigora", "Jasur"], 3),
    M("Who has never left their country?", ["Kamola", "Rustam", "Nigora", "Jasur"], 2),
    M("Who enjoyed culture more than the sea?", ["Kamola", "Rustam", "Nigora", "Jasur"], 1),
    M("Who did some work during the holiday?", ["Kamola", "Rustam", "Nigora", "Jasur"], 0),
    M("Who says the trip didn’t cost much?", ["Kamola", "Rustam", "Nigora", "Jasur"], 2),
  ] },
]);
