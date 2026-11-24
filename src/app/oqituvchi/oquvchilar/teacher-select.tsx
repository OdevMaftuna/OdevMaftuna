"use client";

import { useState, useTransition } from "react";
import { setStudentTeacher } from "@/app/actions/students";

/** Ro'yxatning o'zida o'quvchining o'qituvchisini (guruhini) almashtirish. */
export function TeacherSelect({
  studentId,
  teacherId,
  teachers,
}: {
  studentId: string;
  teacherId: string;
  teachers: { id: string; name: string }[];
}) {
  const [value, setValue] = useState(teacherId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="flex shrink-0 flex-col">
      <span className="sr-only">O‘qituvchi</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await setStudentTeacher(studentId, next);
            if (result.error) {
              setValue(previous);
              setError(result.error);
            }
          });
        }}
        className={`h-9 rounded-lg border bg-surface px-2.5 text-sm outline-none transition focus:border-brand-500 disabled:opacity-60 ${
          value ? "border-sun-400/50 text-sun-700" : "border-neutral-300 text-neutral-500"
        }`}
      >
        <option value="">👤 Guruhsiz</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            👩‍🏫 {t.name}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
