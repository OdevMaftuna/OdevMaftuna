/**
 * Javoblarni solishtirish uchun normallashtirish: katta-kichik harf, tinish belgilari,
 * qisqartmalar (I'm = I am, isn't = is not, can't = cannot) va raqamlar (2 = two) farq qilmaydi.
 */

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, "i am"],
  [/\b(you|we|they|who|what)'re\b/g, "$1 are"],
  [/\b(he|she|it|that|there|what|where|who|how|this|here)'s\b/g, "$1 is"],
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bwon't\b/g, "will not"],
  [/\b(is|are|was|were|do|does|did|has|have|had|could|would|should)n't\b/g, "$1 not"],
  [/\b(i|you|he|she|it|we|they)'d\b/g, "$1 would"],
  [/\b(i|you|he|she|it|we|they)'ll\b/g, "$1 will"],
  [/\b(i|you|we|they)'ve\b/g, "$1 have"],
];

const NUMBERS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven",
  "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen", "14": "fourteen",
  "15": "fifteen", "16": "sixteen", "17": "seventeen", "18": "eighteen", "19": "nineteen", "20": "twenty",
  "30": "thirty", "40": "forty", "50": "fifty", "100": "a hundred",
};

export function normalizeAnswer(s: string): string {
  let t = s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”"]/g, " ")
    .replace(/[.,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [re, to] of CONTRACTIONS) t = t.replace(re, to);
  t = t.replace(/\b\d+\b/g, (n) => NUMBERS[n] ?? n);
  return t.replace(/\s+/g, " ").trim();
}

/** Javob kalitdagi variantlardan biriga to'liq mos keladimi (gap / grammatik shakl). */
export function matchesAny(answer: string | null | undefined, variants: string[]): boolean {
  const a = normalizeAnswer(answer ?? "");
  if (!a) return false;
  return variants.some((v) => normalizeAnswer(v) === a);
}

/**
 * Lug'at (bitta so'z/ibora) uchun yumshoqroq: "a / b" yoki "a, b" variantlaridan istalgani,
 * boshidagi to / a / an / the e'tiborga olinmaydi ("to live" = "live").
 */
export function matchesWord(answer: string | null | undefined, variants: string[]): boolean {
  const strip = (x: string) => x.replace(/^(to|a|an|the) /, "");
  const a = strip(normalizeAnswer(answer ?? ""));
  if (!a) return false;
  return variants.some((v) =>
    [v, ...v.split(/\s*[/;]\s*|,\s+/)].map((x) => strip(normalizeAnswer(x))).some((alt) => alt === a),
  );
}
