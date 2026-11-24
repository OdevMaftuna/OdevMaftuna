"use client";

import { useState, useTransition } from "react";
import { setStudentCourse } from "@/app/actions/students";

/** Ro'yxatning o'zida o'quvchining kursini almashtirish. */
export function CourseSelect({
  studentId,
  courseId,
  courses,
}: {
  studentId: string;
  courseId: string;
  courses: { id: string; name: string }[];
}) {
  const [value, setValue] = useState(courseId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="flex shrink-0 flex-col">
      <span className="sr-only">Kurs</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await setStudentCourse(studentId, next);
            if (result.error) {
              setValue(previous);
              setError(result.error);
            }
          });
        }}
        className={`h-9 rounded-lg border bg-surface px-2.5 text-sm outline-none transition focus:border-brand-500 disabled:opacity-60 ${
          value ? "border-neutral-300 text-neutral-800" : "border-amber-200 text-amber-800"
        }`}
      >
        <option value="">Kurs tanlanmagan</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
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
