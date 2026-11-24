/** 85 → "85", 82.5 → "82,5" (o'zbekcha yozuvda kasr vergul bilan). */
export function formatScore(score: number | string): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n * 100) / 100).replace(".", ",");
}
