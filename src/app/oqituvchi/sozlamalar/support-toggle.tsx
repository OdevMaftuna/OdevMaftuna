"use client";

import { useState, useTransition } from "react";
import { setTeacherSupport } from "@/app/actions/teachers";

/** O'qituvchiga "Support" huquqini berish/olish (butun guruh natijalarini ko'rish). */
export function SupportToggle({ id, name, on }: { id: string; name: string; on: boolean }) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(on);
  const [error, setError] = useState<string | null>(null);
  const toggle = () => {
    const next = !value;
    if (next && !window.confirm(`${name} butun guruhning (barcha o‘qituvchilar o‘quvchilari) natijalarini ko‘radi. Ruxsat berasizmi?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await setTeacherSupport(id, next);
      if (r.error) setError(r.error);
      else setValue(next);
    });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={toggle}
        disabled={pending}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          value ? "border-[#F5C76A]/60 bg-[#3a2c12] text-[#F5C76A]" : "border-white/15 text-neutral-400 hover:text-white"
        }`}
      >
        <span className={`relative inline-block h-4 w-7 rounded-full transition ${value ? "bg-[#F5C76A]" : "bg-white/15"}`}>
          <span className={`absolute top-0.5 size-3 rounded-full bg-[#0d1512] transition-all ${value ? "left-3.5" : "left-0.5"}`} />
        </span>
        {pending ? "…" : value ? "🛟 Support" : "Support berish"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
