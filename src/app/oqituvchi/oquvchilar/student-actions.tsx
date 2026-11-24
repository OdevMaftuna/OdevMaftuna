"use client";

import { useState, useTransition } from "react";
import { resetStudentPassword, setStudentActive } from "@/app/actions/students";
import { btn } from "@/components/ui";

export function StudentActions({
  id,
  name,
  isActive,
  canDeactivate = true,
}: {
  id: string;
  name: string;
  isActive: boolean;
  /** Nofaol qilish — faqat asosiy o'qituvchi. */
  canDeactivate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const toggleActive = () => {
    if (
      isActive &&
      !window.confirm(`${name} nofaol qilinadi va tizimga kira olmaydi. Davom etasizmi?`)
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setStudentActive(id, !isActive);
      if (result.error) setError(result.error);
    });
  };

  const resetPassword = () => {
    if (
      !window.confirm(
        `${name} uchun yangi vaqtinchalik parol yaratiladi. Eski paroli ishlamay qoladi. Davom etasizmi?`,
      )
    ) {
      return;
    }
    setError(null);
    setPassword(null);
    startTransition(async () => {
      const result = await resetStudentPassword(id);
      if (result.error) setError(result.error);
      else setPassword(result.password ?? null);
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={resetPassword} disabled={pending} className={btn.small}>
        Parolni tiklash
      </button>
      {canDeactivate ? (
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={isActive ? btn.smallDanger : btn.small}
        >
          {isActive ? "Nofaol qilish" : "Faollashtirish"}
        </button>
      ) : null}
      {password ? (
        <p role="status" className="basis-full text-right text-sm text-emerald-800">
          Yangi vaqtinchalik parol:{" "}
          <span className="font-mono text-base font-semibold">{password}</span>
          <span className="block text-xs text-neutral-500">
            Faqat hozir ko‘rsatiladi. Yozib oling.
          </span>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="basis-full text-right text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
