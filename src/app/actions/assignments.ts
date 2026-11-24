"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { SUBMISSIONS_BUCKET } from "@/lib/config";
import { localInputToIso } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import {
  MAX_BULK_ASSIGNMENTS,
  assignmentSchema,
  issueMessages,
  type AssignmentInput,
} from "@/lib/validation";

const LIST_PATH = "/oqituvchi/vazifalar";

/** Tekshirilgan qiymatlarni bazaga yoziladigan ko'rinishga keltiradi (Toshkent vaqti → UTC). */
function toRow(input: AssignmentInput, courseId: string) {
  return {
    ...input,
    course_id: courseId,
    publish_at: localInputToIso(input.publish_at),
    due_at: localInputToIso(input.due_at),
    late_penalty_percent: input.late_allowed ? input.late_penalty_percent : 0,
  };
}

/** Kurs mavjudligini tekshiradi (noto'g'ri id bilan vazifa yaratilmasin). */
async function courseExists(courseId: string): Promise<boolean> {
  if (!z.uuid().safeParse(courseId).success) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id").eq("id", courseId).maybeSingle();
  return Boolean(data);
}

/** Yangi vazifa (id = null) yoki mavjudini tahrirlash. */
export async function saveAssignment(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const get = (key: string) => String(formData.get(key) ?? "");
  const values = {
    course_id: get("course_id"),
    title: get("title"),
    instructions: get("instructions"),
    submission_type: get("submission_type"),
    rubric: get("rubric"),
    max_score: get("max_score"),
    publish_at: get("publish_at"),
    due_at: get("due_at"),
    late_allowed: get("late_allowed"),
    late_penalty_percent: get("late_penalty_percent"),
  };

  if (!(await courseExists(values.course_id))) {
    return { error: "Kursni tanlang.", values };
  }

  const parsed = assignmentSchema.safeParse({
    ...values,
    max_score: Number(values.max_score),
    late_allowed: values.late_allowed === "on",
    late_penalty_percent: Number(values.late_penalty_percent || 0),
  });
  if (!parsed.success) {
    return { error: issueMessages(parsed.error).join(". "), values };
  }
  if (id !== null && !z.uuid().safeParse(id).success) {
    return { error: "Vazifa topilmadi.", values };
  }

  const supabase = await createClient();
  const row = toRow(parsed.data, values.course_id);
  const { error } =
    id === null
      ? await supabase.from("assignments").insert(row)
      : await supabase.from("assignments").update(row).eq("id", id);

  if (error) {
    return { error: "Saqlab bo‘lmadi. Qaytadan urinib ko‘ring.", values };
  }
  redirect(`${LIST_PATH}?kurs=${values.course_id}`);
}

export async function deleteAssignment(id: string): Promise<{ error?: string }> {
  await requireTeacher();
  if (!z.uuid().safeParse(id).success) return { error: "Vazifa topilmadi." };

  const supabase = await createClient();

  // Avval shu vazifaga yuklangan rasmlarni o'chiramiz (yetim fayl qolmasin).
  const { data: submissions } = await supabase
    .from("submissions")
    .select("image_paths")
    .eq("assignment_id", id);
  const paths = (submissions ?? []).flatMap((s) => s.image_paths as string[]);
  if (paths.length > 0) {
    await supabase.storage.from(SUBMISSIONS_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { error: "O‘chirib bo‘lmadi. Qaytadan urinib ko‘ring." };

  refresh();
  return {};
}

/** Excel'dan o'qilgan qatorlarni serverda QAYTA tekshirib, tanlangan kursga hammasini birdan qo'shadi. */
export async function bulkCreateAssignments(
  courseId: string,
  rows: unknown,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireTeacher();

  if (!(await courseExists(courseId))) {
    return { ok: false, error: "Kursni tanlang." };
  }

  const parsed = z
    .array(assignmentSchema)
    .min(1, "Yuklash uchun qator yo‘q")
    .max(MAX_BULK_ASSIGNMENTS, `Bir martada ${MAX_BULK_ASSIGNMENTS} tadan ko‘p vazifa yuklab bo‘lmaydi`)
    .safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: issueMessages(parsed.error).slice(0, 3).join(". ") };
  }

  const supabase = await createClient();
  // Bitta so'rov: yo hammasi qo'shiladi, yo hech biri.
  const { error } = await supabase
    .from("assignments")
    .insert(parsed.data.map((row) => toRow(row, courseId)));
  if (error) {
    return { ok: false, error: "Vazifalarni saqlab bo‘lmadi. Hech biri qo‘shilmadi." };
  }

  refresh();
  return { ok: true, count: parsed.data.length };
}
