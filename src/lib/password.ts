import "server-only";
import { randomInt } from "node:crypto";

// Chalkashtiradigan belgilarsiz (0/O, 1/l/I): o'qituvchi parolni og'zaki ayta olsin.
const LETTERS = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";

/** Vaqtinchalik parol, masalan "kemu-tavo-58". Kriptografik tasodifiy. */
export function generateTempPassword(): string {
  const pick = (alphabet: string, count: number) =>
    Array.from({ length: count }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${pick(LETTERS, 4)}-${pick(LETTERS, 4)}-${pick(DIGITS, 2)}`;
}
