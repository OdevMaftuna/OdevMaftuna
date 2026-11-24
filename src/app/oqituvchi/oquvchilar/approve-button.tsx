"use client";

import { useState, useTransition } from "react";
import { approveStudent } from "@/app/actions/students";
import { btn } from "@/components/ui";

/** O'zi ro'yxatdan o'tgan o'quvchini tasdiqlash tugmasi. */
export function ApproveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className={btn.small}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await approveStudent(id);
            if (result.error) setError(result.error);
          });
        }}
      >
        {pending ? "Tasdiqlanmoqda…" : "✅ Tasdiqlash"}
      </button>
      {error ? <span role="alert" className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
