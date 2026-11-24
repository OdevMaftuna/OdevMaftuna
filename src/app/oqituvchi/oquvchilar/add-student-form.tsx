"use client";

import { useActionState } from "react";
import { createStudent, type StudentFormState } from "@/app/actions/students";
import { Field, FormError, Select, SubmitButton } from "@/components/form";
import { Notice, btn } from "@/components/ui";

export function AddStudentForm({
  courses,
  initialCourseId,
  teachers,
  initialTeacherId,
}: {
  courses: { id: string; name: string }[];
  initialCourseId: string;
  teachers: { id: string; name: string }[];
  initialTeacherId: string;
}) {
  const [state, action] = useActionState<StudentFormState, FormData>(
    createStudent,
    null,
  );
  const created = state?.created;

  return (
    <form action={action} className="space-y-4">
      <Select
        label="Kurs"
        name="course_id"
        defaultValue={state?.values?.course_id ?? initialCourseId}
        required
      >
        <option value="" disabled>
          Kursni tanlang
        </option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        label="O‘qituvchi (guruh)"
        name="teacher_id"
        defaultValue={state?.values?.teacher_id ?? initialTeacherId}
      >
        <option value="">Guruhsiz</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Field
        label="Ism familiya"
        name="full_name"
        autoComplete="off"
        defaultValue={state?.values?.full_name ?? ""}
        maxLength={120}
        required
      />
      <Field
        label="E-pochta"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        autoCapitalize="none"
        defaultValue={state?.values?.email ?? ""}
        required
      />
      <FormError message={state?.error} />
      {created ? (
        <Notice tone="success">
          <p className="font-semibold">{created.full_name} uchun hisob ochildi.</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-emerald-800/80">E-pochta:</dt>
            <dd className="break-all font-mono">{created.email}</dd>
            <dt className="text-emerald-800/80">Vaqtinchalik parol:</dt>
            <dd className="font-mono text-base font-semibold">{created.password}</dd>
          </dl>
          <p className="mt-2 text-xs">
            Parol faqat hozir ko‘rsatiladi. Yozib oling va o‘quvchiga bering.
          </p>
        </Notice>
      ) : null}
      <SubmitButton pendingText="Qo‘shilmoqda…" className={btn.primary}>
        O‘quvchini qo‘shish
      </SubmitButton>
    </form>
  );
}
