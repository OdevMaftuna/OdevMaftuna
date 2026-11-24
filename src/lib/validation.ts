import { z } from "zod";
import { isValidLocalDateTime } from "@/lib/datetime";

/**
 * Brauzerda (Excel oldindan ko'rish) ham, serverda (yakuniy tekshiruv) ham
 * ishlatiladigan yagona tekshiruv qoidalari.
 */

const localDateTime = (label: string) =>
  z
    .string()
    .refine(isValidLocalDateTime, `${label}: sana va vaqt noto‘g‘ri yoki bo‘sh`);

export const assignmentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Sarlavha bo‘sh")
      .max(200, "Sarlavha 200 belgidan oshmasin"),
    instructions: z.string().trim().max(10000, "Ko‘rsatma juda uzun"),
    submission_type: z.enum(
      ["text", "image", "both"],
      "Javob turi: text, image yoki both bo‘lishi kerak",
    ),
    rubric: z.string().trim().max(5000, "Baholash mezonlari juda uzun"),
    max_score: z
      .number("Maksimal ball son bo‘lishi kerak")
      .int("Maksimal ball butun son bo‘lishi kerak")
      .min(1, "Maksimal ball kamida 1")
      .max(1000, "Maksimal ball 1000 dan oshmasin"),
    publish_at: localDateTime("E’lon vaqti"),
    due_at: localDateTime("Topshirish muddati"),
    late_allowed: z.boolean("Kech topshirish: true yoki false bo‘lishi kerak"),
    late_penalty_percent: z
      .number("Jarima foizi son bo‘lishi kerak")
      .int("Jarima foizi butun son bo‘lishi kerak")
      .min(0, "Jarima 0 dan kam bo‘lmasin")
      .max(100, "Jarima 100 dan oshmasin"),
  })
  .refine((v) => v.due_at > v.publish_at, {
    message: "Topshirish muddati e’lon vaqtidan keyin bo‘lishi kerak",
    path: ["due_at"],
  });

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const studentSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Ism familiya bo‘sh")
    .max(120, "Ism familiya juda uzun"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("E-pochta noto‘g‘ri").max(254)),
});

export type StudentInput = z.infer<typeof studentSchema>;

export function issueMessages(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((issue) => issue.message))];
}

// ---------------------------------------------------------------------
// Excel/CSV kataklarini tozalash
// ---------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Excel katagidagi sana-vaqtni "YYYY-MM-DDTHH:mm" ga aylantiradi.
 * Qabul qilinadi: Excel sana katagi (son), "2026-12-01 09:00",
 * "2026-12-01T09:00", "01.12.2026 09:00", "01/12/2026 09:00" (kun/oy/yil).
 * Vaqt yozilmasa 00:00 olinadi. Tushunilmasa bo'sh satr qaytadi.
 */
export function parseCellDateTime(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 1) {
    // Excel seriya raqami: kunlar 1899-12-30 dan boshlab. Vaqt zonasiz hisoblanadi.
    const days = Math.floor(value);
    const minutes = Math.round((value - days) * 24 * 60);
    const d = new Date(Date.UTC(1899, 11, 30) + days * 86400000 + minutes * 60000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  const text = String(value ?? "").trim();
  if (!text) return "";

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(text);
  if (m) {
    return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}T${pad(+(m[4] ?? 0))}:${m[5] ?? "00"}`;
  }
  m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(text);
  if (m) {
    return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}T${pad(+(m[4] ?? 0))}:${m[5] ?? "00"}`;
  }
  return "";
}

function parseCellBoolean(value: unknown): boolean | string {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (["", "false", "0", "no", "yo'q", "yo‘q", "yoq"].includes(text)) return false;
  if (["true", "1", "yes", "ha"].includes(text)) return true;
  return text; // tekshiruvda xato bo'lib chiqadi
}

function parseCellNumber(value: unknown, fallback: number): number | string {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const n = Number(text.replace(",", "."));
  return Number.isNaN(n) ? text : n;
}

/** Excel qatorini (sarlavha → qiymat) tekshiruvga tayyor ko'rinishga keltiradi. */
export function normalizeAssignmentRow(row: Record<string, unknown>) {
  const text = (key: string) => String(row[key] ?? "").trim();
  return {
    title: text("title"),
    instructions: text("instructions"),
    submission_type: text("submission_type").toLowerCase() || "text",
    rubric: text("rubric"),
    max_score: parseCellNumber(row.max_score, 100),
    publish_at: parseCellDateTime(row.publish_at),
    due_at: parseCellDateTime(row.due_at),
    late_allowed: parseCellBoolean(row.late_allowed),
    late_penalty_percent: parseCellNumber(row.late_penalty_percent, 0),
  };
}

export const ASSIGNMENT_COLUMNS = [
  "title",
  "instructions",
  "submission_type",
  "rubric",
  "max_score",
  "publish_at",
  "due_at",
  "late_allowed",
  "late_penalty_percent",
] as const;

export const STUDENT_COLUMNS = ["full_name", "email"] as const;

export const MAX_BULK_ASSIGNMENTS = 300;
export const MAX_BULK_STUDENTS = 200;
