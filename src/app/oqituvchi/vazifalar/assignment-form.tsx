"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveAssignment } from "@/app/actions/assignments";
import { Field, FormError, Select, SubmitButton, TextArea } from "@/components/form";
import { btn, card } from "@/components/ui";
import type { ActionState } from "@/lib/types";

export type AssignmentFormValues = {
  course_id: string;
  title: string;
  instructions: string;
  submission_type: string;
  rubric: string;
  max_score: string;
  /** Toshkent vaqti bilan "YYYY-MM-DDTHH:mm". */
  publish_at: string;
  due_at: string;
  late_allowed: boolean;
  late_penalty_percent: string;
};

export function AssignmentForm({
  id,
  initial,
  courses,
}: {
  /** null — yangi vazifa. */
  id: string | null;
  initial: AssignmentFormValues;
  courses: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    saveAssignment.bind(null, id),
    null,
  );

  // Xato chiqsa, foydalanuvchi kiritgan qiymatlar saqlanib qoladi.
  const v = state?.values;
  const value = (key: keyof AssignmentFormValues) =>
    v ? (v[key] ?? "") : String(initial[key]);
  const [lateAllowed, setLateAllowed] = useState(initial.late_allowed);

  return (
    <form action={action} className={`${card} space-y-5 p-5`}>
      <Select label="Kurs" name="course_id" defaultValue={value("course_id")} required>
        <option value="" disabled>
          Kursni tanlang
        </option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Field
        label="Sarlavha"
        name="title"
        defaultValue={value("title")}
        maxLength={200}
        required
      />
      <TextArea
        label="Ko‘rsatma"
        name="instructions"
        defaultValue={value("instructions")}
        rows={6}
        maxLength={10000}
        hint="O‘quvchi vazifa sahifasida aynan shu matnni ko‘radi."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Javob turi"
          name="submission_type"
          defaultValue={value("submission_type")}
        >
          <option value="text">Matn</option>
          <option value="image">Rasm (daftar surati)</option>
          <option value="both">Matn va rasm</option>
        </Select>
        <Field
          label="Maksimal ball"
          name="max_score"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          step={1}
          defaultValue={value("max_score")}
          required
        />
      </div>
      <TextArea
        label="Baholash mezonlari"
        name="rubric"
        defaultValue={value("rubric")}
        rows={4}
        maxLength={5000}
        hint="Sun’iy intellekt ballni shu mezonlar bo‘yicha qo‘yadi. Masalan: grammatika 40, so‘z boyligi 30, mazmun 30."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="E’lon qilinadigan vaqt"
          name="publish_at"
          type="datetime-local"
          defaultValue={value("publish_at")}
          required
          hint="Toshkent vaqti. Shu vaqtgacha o‘quvchi vazifani ko‘rmaydi."
        />
        <Field
          label="Topshirish muddati"
          name="due_at"
          type="datetime-local"
          defaultValue={value("due_at")}
          required
          hint="Toshkent vaqti. Shundan keyin javob qabul qilinmaydi."
        />
      </div>

      <div className="rounded-xl border border-neutral-200 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="late_allowed"
            // Boshqarilmaydigan (defaultChecked): React formani tozalaganda
            // belgi yuborilgan qiymatga qaytadi, o'chib qolmaydi.
            defaultChecked={v ? v.late_allowed === "on" : initial.late_allowed}
            onChange={(e) => setLateAllowed(e.target.checked)}
            className="mt-0.5 size-5 accent-brand-700"
          />
          <span>
            <span className="block text-sm font-medium">
              Kech topshirishga ruxsat berish
            </span>
            <span className="block text-xs text-neutral-500">
              O‘chirilgan bo‘lsa, muddatdan keyin javob umuman qabul qilinmaydi.
            </span>
          </span>
        </label>
        {lateAllowed ? (
          <div className="mt-4 max-w-48">
            <Field
              label="Kech topshirish jarimasi, %"
              name="late_penalty_percent"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              defaultValue={value("late_penalty_percent") || "0"}
            />
          </div>
        ) : null}
      </div>

      <FormError message={state?.error} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingText="Saqlanmoqda…" className={btn.primary}>
          {id === null ? "Vazifani qo‘shish" : "O‘zgarishlarni saqlash"}
        </SubmitButton>
        <Link href={`/oqituvchi/vazifalar${initial.course_id ? `?kurs=${initial.course_id}` : ""}`} className={btn.secondary}>
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
