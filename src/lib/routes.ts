/** Ilovadagi asosiy yo'llar. */
export const ROUTES = {
  login: "/kirish",
  signup: "/royxat",
  changePassword: "/parol",
  teacher: "/oqituvchi",
  student: "/oquvchi",
} as const;

export type Role = "teacher" | "student";

export function homeFor(role: Role): string {
  return role === "teacher" ? ROUTES.teacher : ROUTES.student;
}

/** path shu bo'limning o'zi yoki uning ichidagi sahifami? */
export function isUnder(path: string, section: string): boolean {
  return path === section || path.startsWith(`${section}/`);
}
