"use client";

import { useState, useTransition } from "react";
import { deleteAssignment } from "@/app/actions/assignments";
import { btn } from "@/components/ui";

export function DeleteAssignmentButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    const ok = window.confirm(
      `“${title}” vazifasi va unga yuborilgan barcha javoblar o‘chiriladi. Buni ortga qaytarib bo‘lmaydi. Davom etasizmi?`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAssignment(id);
      if (result.error) setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={btn.smallDanger}
      >
        {pending ? "O‘chirilmoqda…" : "O‘chirish"}
      </button>
      {error ? (
        <span role="alert" className="basis-full text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </>
  );
}
