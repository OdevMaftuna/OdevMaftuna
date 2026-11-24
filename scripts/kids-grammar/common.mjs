// Kids grammatika generatorlari uchun umumiy yordamchilar.

/** Deterministik tasodif (har safar bir xil test chiqadi). */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Bitta test savoli (variantli).
 * wrongs: [[variant, nega noto'g'ri], ...]
 */
export function mc(part, q, answer, wrongs, explain) {
  return { part, q, answer, wrongs, explain };
}

/**
 * Bo'limlar bo'yicha kvotani oladi, variantlarni aralashtiradi va tekshiradi.
 * quotas: [[partIndex, count], ...]
 */
export function assemble(pool, quotas, seed, total = 200) {
  const r = rng(seed);
  const seen = new Set();
  const uniq = pool.filter((x) => {
    const k = [x.q, x.answer, ...x.wrongs.map((w) => w[0]).sort()].join("|").toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const out = [];
  for (const [part, n] of quotas) {
    const items = shuffle(uniq.filter((x) => x.part === part), r);
    if (items.length < n) throw new Error(`Bo'lim ${part}: ${items.length} ta bor, ${n} ta kerak`);
    out.push(...items.slice(0, n));
  }
  if (out.length !== total) throw new Error(`Jami ${out.length} ta, ${total} kerak`);
  const test = [];
  const key = [];
  for (const it of out) {
    const opts = shuffle([it.answer, ...it.wrongs.map((w) => w[0])], r);
    if (new Set(opts).size !== opts.length) throw new Error(`Takroriy variant: ${it.q} → ${opts.join(" | ")}`);
    if (opts.length < 3) throw new Error(`Variant kam: ${it.q}`);
    test.push({ type: "mc", q: it.q, options: opts, part: it.part });
    const wrong = {};
    for (const [w, why] of it.wrongs) wrong[w] = why;
    key.push({ answer: it.answer, explain: it.explain, wrong });
  }
  return { test, key };
}
