"use client";

import { useState, useTransition } from "react";
import { setGroupStart } from "@/app/actions/groups";

const DAY = 86_400_000;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
/** "2026-11-19" yoki ISO vaqt → "19-noyabr" (Toshkent vaqti). */
const fmt = (iso: string) => {
  const d = new Date(Date.parse(iso.length === 10 ? `${iso}T00:00:00+05:00` : iso) + 5 * 3_600_000);
  return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}`;
};

/**
 * Guruh boshlanish sanasi. Kursdagi vazifalar asosiy jadval bo'yicha yozilgan; guruh keyinroq boshlansa,
 * uning o'quvchilari uchun barcha muddatlar shuncha kunga suriladi. Faqat asosiy o'qituvchi o'zgartiradi.
 */
export function StartDateCard({
  groupId,
  startDate,
  scheduleStart,
  canEdit,
  preview,
}: {
  groupId: string;
  startDate: string | null;
  scheduleStart: string | null;
  canEdit: boolean;
  /** Asosiy jadvaldagi dastlabki vazifalar (siljishni ko'rsatish uchun). */
  preview: { title: string; due_at: string }[];
}) {
  const [value, setValue] = useState(startDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const shiftDays = value && scheduleStart ? Math.max(0, Math.round((Date.parse(value) - Date.parse(scheduleStart)) / DAY)) : 0;
  const dirty = value !== (startDate ?? "");

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-black text-white">📅 Guruh boshlangan sana</p>
          <p className="mt-0.5 text-xs text-[#9aa5a0]">
            Kursdagi vazifalar muddati shu sanadan hisoblanadi.
            {scheduleStart ? ` Asosiy jadval: ${fmt(scheduleStart)}.` : " Kursda hali vazifa yo‘q — birinchi sana asos bo‘ladi."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value}
            min={scheduleStart ?? undefined}
            disabled={!canEdit || pending}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#22c55e] focus:outline-none disabled:opacity-60"
          />
          {canEdit && dirty ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await setGroupStart(groupId, value || null);
                  if (r.error) setError(r.error);
                  else setSaved(true);
                })
              }
              className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-black text-[#062a20] disabled:opacity-50"
            >
              {pending ? "…" : "Saqlash"}
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-white">
        {shiftDays > 0 ? (
          <>
            ⏩ Bu guruh uchun barcha muddatlar <b className="text-[#F5C76A]">{shiftDays} kunga</b> keyin suriladi.
          </>
        ) : (
          <>✅ Bu guruh asosiy jadval bo‘yicha ketyapti (muddatlar o‘zgarmaydi).</>
        )}
        {saved ? <span className="ml-2 text-[#22c55e]">✓ Saqlandi</span> : null}
      </p>
      {error ? <p className="mt-1 text-sm text-[#ff8a8a]">{error}</p> : null}

      {shiftDays > 0 && preview.length ? (
        <ul className="mt-3 space-y-1 text-xs text-[#cfd6d2]">
          {preview.map((a) => (
            <li key={a.title + a.due_at} className="flex flex-wrap gap-x-2">
              <span className="font-bold text-white">{a.title}</span>
              <span className="text-[#9aa5a0] line-through">{fmt(a.due_at)}</span>
              <span>→ {fmt(new Date(Date.parse(a.due_at) + shiftDays * DAY).toISOString())}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
