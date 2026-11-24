"use client";

import { useActionState, useState } from "react";
import { signUp, type SignUpState } from "@/app/actions/auth";
import { FormError, SubmitButton } from "@/components/form";

const ICON: Record<string, string> = {
  Beginner: "🌱",
  Elementary: "📗",
  "Pre-Intermediate": "🚀",
  IELTS: "🎓",
  CEFR: "🏅",
};

const label = "block text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500";

export function SignUpForm({ courses, teachers }: { courses: { id: string; name: string }[]; teachers: { id: string; name: string }[] }) {
  const [state, action] = useActionState<SignUpState, FormData>(signUp, null);
  const [show, setShow] = useState(false);
  const [course, setCourse] = useState(state?.values?.course_id ?? "");

  return (
    <form action={action} className="space-y-3.5">
      {/* Bot tuzog'i — ko'rinmaydi */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <label className="auth-field">
        <span className={label}>Full name</span>
        <input name="full_name" autoComplete="name" placeholder="Ism Familiya" defaultValue={state?.values?.full_name ?? ""} required className="mt-0.5 h-7 placeholder:text-neutral-500/60" />
      </label>
      <div className="grid grid-cols-[6rem_1fr] gap-3.5">
        <label className="auth-field">
          <span className={label}>Age</span>
          <input name="age" type="number" inputMode="numeric" min={5} max={99} placeholder="16" defaultValue={state?.values?.age ?? ""} required className="mt-0.5 h-7 w-full placeholder:text-neutral-500/60" />
        </label>
        <label className="auth-field">
          <span className={label}>Group (teacher)</span>
          <select name="teacher_id" defaultValue={state?.values?.teacher_id ?? ""} required className="mt-0.5 h-7 w-full bg-transparent text-sm outline-none [&>option]:bg-neutral-900">
            <option value="" disabled>Choose your teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="auth-field">
        <span className={label}>Phone (guruhingizni topamiz)</span>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" defaultValue={state?.values?.phone ?? ""} className="mt-0.5 h-7 placeholder:text-neutral-500/60" />
      </label>

      <label className="auth-field">
        <span className={label}>Email (Gmail)</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="example@gmail.com" defaultValue={state?.values?.email ?? ""} required className="mt-0.5 h-7 placeholder:text-neutral-500/60" />
      </label>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="auth-field">
          <span className={label}>Password</span>
          <input name="password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="8+ characters" minLength={8} required className="mt-0.5 h-7 placeholder:text-neutral-500/60" />
        </label>
        <label className="auth-field">
          <span className={label}>Repeat password</span>
          <input name="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" minLength={8} required className="mt-0.5 h-7 placeholder:text-neutral-500/60" />
        </label>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-neutral-400">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[#f1a93b]" />
        Show password
      </label>

      <fieldset>
        <legend className={label}>Your course</legend>
        <input type="hidden" name="course_id" value={course} />
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourse(c.id)}
              aria-pressed={course === c.id}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                course === c.id ? "border-[#f1a93b] bg-[#f1a93b]/15 text-[#F5C76A]" : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25"
              }`}
            >
              <span aria-hidden>{ICON[c.name] ?? "📘"}</span>
              <span className="min-w-0 truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <FormError message={state?.error} />
      <SubmitButton
        pendingText="Creating…"
        className="group mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-[#1d1608] shadow-[0_14px_30px_-12px_rgb(241_169_59/0.8)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f1a93b]/40 disabled:cursor-not-allowed disabled:opacity-60 [background:linear-gradient(135deg,#f5c76a,#f1a93b)]"
      >
        Create account <span aria-hidden className="transition group-hover:translate-x-1">→</span>
      </SubmitButton>
    </form>
  );
}
