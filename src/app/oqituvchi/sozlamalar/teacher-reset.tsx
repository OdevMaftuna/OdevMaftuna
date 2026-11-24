"use client";

import { useState, useTransition } from "react";
import { resetTeacherPassword } from "@/app/actions/teachers";
import { btn } from "@/components/ui";

/** O'qituvchi parolini tiklash — yangi parol faqat bir marta ko'rsatiladi. */
export function TeacherReset({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    if (!window.confirm(`${name} uchun yangi parol yaratiladi. Eski paroli ishlamay qoladi. Davom etasizmi?`)) return;
    setError(null);
    setPassword(null);
    startTransition(async () => {
      const r = await resetTeacherPassword(id);
      if (r.error) setError(r.error);
      else setPassword(r.password ?? null);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={reset} disabled={pending} className={btn.small}>
        {pending ? "…" : "🔑 Parolni tiklash"}
      </button>
      {password ? (
        <p role="status" className="text-right text-sm text-emerald-800">
          Yangi parol: <span className="font-mono text-base font-semibold">{password}</span>{" "}
          <button
            type="button"
            className="text-xs underline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(password);
                setCopied(true);
              } catch {}
            }}
          >
            {copied ? "✓ nusxa olindi" : "nusxa olish"}
          </button>
          <span className="block text-xs text-neutral-500">Faqat hozir ko‘rsatiladi — o‘qituvchiga yuboring.</span>
        </p>
      ) : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
