"use client";

import { useActionState } from "react";
import { createTeacher, type TeacherFormState } from "@/app/actions/teachers";
import { Field, FormError, SubmitButton } from "@/components/form";
import { Notice, btn } from "@/components/ui";

export function AddTeacherForm() {
  const [state, action] = useActionState<TeacherFormState, FormData>(createTeacher, null);
  const created = state?.created;

  return (
    <form action={action} className="space-y-4">
      <Field label="Ism familiya" name="full_name" autoComplete="off" defaultValue={state?.values?.full_name ?? ""} maxLength={120} required />
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
          <p className="font-semibold">{created.full_name} — o‘qituvchi hisobi ochildi.</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-emerald-800/80">E-pochta:</dt>
            <dd className="break-all font-mono">{created.email}</dd>
            <dt className="text-emerald-800/80">Vaqtinchalik parol:</dt>
            <dd className="font-mono text-base font-semibold">{created.password}</dd>
          </dl>
          <p className="mt-2 text-xs">Parol faqat hozir ko‘rsatiladi. Yozib oling va o‘qituvchiga bering.</p>
        </Notice>
      ) : null}
      <SubmitButton pendingText="Qo‘shilmoqda…" className={btn.primary}>
        O‘qituvchini qo‘shish
      </SubmitButton>
    </form>
  );
}
