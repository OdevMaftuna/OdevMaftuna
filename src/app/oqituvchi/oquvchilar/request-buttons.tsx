"use client";

import { useState, useTransition } from "react";
import { decideCourseRequest, grantCourseFree, removeEnrollment } from "@/app/actions/course-requests";
import { btn } from "@/components/ui";

export function DecideButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const decide = (approve: boolean) =>
    startTransition(async () => {
      const r = await decideCourseRequest(requestId, approve);
      if (r.error) setError(r.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn.primary} disabled={pending} onClick={() => decide(true)}>
        ✓ Ruxsat berish
      </button>
      <button type="button" className={btn.danger} disabled={pending} onClick={() => decide(false)}>
        Rad etish
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}

export function RemoveEnrollmentButton({ studentId, courseId, label }: { studentId: string; courseId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button type="button" className={btn.smallDanger} onClick={() => setConfirm(true)}>
        Kursdan chiqarish
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-neutral-600">{label} kursidan chiqarilsinmi? Topshirgan javoblari o‘chmaydi.</span>
      <button
        type="button"
        className={btn.smallDanger}
        disabled={pending}
        onClick={() => startTransition(async () => void (await removeEnrollment(studentId, courseId)))}
      >
        Ha, chiqarish
      </button>
      <button type="button" className={btn.small} disabled={pending} onClick={() => setConfirm(false)}>
        Yo‘q
      </button>
    </span>
  );
}

/** O'qituvchi: o'quvchiga qo'shimcha kursni bepul ochish. */
export function GrantFree({
  students,
  courses,
}: {
  students: { id: string; name: string; courseId: string | null }[];
  courses: { id: string; name: string }[];
}) {
  const [student, setStudent] = useState("");
  const [course, setCourse] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const own = students.find((s) => s.id === student)?.courseId ?? null;
  const select = "h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-surface px-2.5 text-sm outline-none focus:border-brand-500";
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <select value={student} onChange={(e) => setStudent(e.target.value)} className={select} aria-label="O‘quvchi">
          <option value="">O‘quvchini tanlang</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className={select} aria-label="Kurs">
          <option value="">Kursni tanlang</option>
          {courses.filter((c) => c.id !== own).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="button"
          className={btn.primary}
          disabled={pending || !student || !course}
          onClick={() =>
            startTransition(async () => {
              const r = await grantCourseFree(student, course);
              setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "✓ Kurs bepul ochildi" });
            })
          }
        >
          🎁 Bepul ochish
        </button>
      </div>
      {msg ? <p className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p> : null}
    </div>
  );
}
