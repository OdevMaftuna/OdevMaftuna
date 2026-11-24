"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGroup } from "@/app/actions/groups";

const DEFAULT_UNITS: Record<string, string> = {
  Beginner: "1 2 3 4 5 6 7 8 9 10 11 12 13 14",
  "Pre-Intermediate": "I 1 2 3 4 5 6 7 8 9",
};

/** Yangi guruh ochish (faqat asosiy o'qituvchi). */
export function CreateGroupForm({ courses, teachers }: { courses: { id: string; name: string }[]; teachers: { id: string; name: string }[] }) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const router = useRouter();
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState(courses.find((c) => c.name === "Pre-Intermediate")?.id ?? courses[0]?.id ?? "");
  const [schedule, setSchedule] = useState("");
  // Bugungi sana (Toshkent) — yangi guruh odatda bugun boshlanadi.
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10));
  const [units, setUnits] = useState(DEFAULT_UNITS["Pre-Intermediate"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22c55e] focus:outline-none";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createGroup({ name, courseId, teacherId, schedule, units, startDate });
          if (r.error) setError(r.error);
          else if (r.id) router.push(`/oqituvchi/guruhlar/${r.id}`);
        });
      }}
      className="space-y-3 rounded-[22px] border border-white/[0.08] bg-[#121a17] p-4"
    >
      <p className="text-[15px] font-black">➕ Yangi guruh</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nomi: Pre-Intermediate 16:00 Juft kunlar" className={field} />
        <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Vaqti: Du-Chor-Ju 16:00 (ixtiyoriy)" className={field} />
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            const n = courses.find((c) => c.id === e.target.value)?.name ?? "";
            if (DEFAULT_UNITS[n]) setUnits(DEFAULT_UNITS[n]);
          }}
          className={field}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={field}>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              👩‍🏫 {t.name}
            </option>
          ))}
        </select>
        <input value={units} onChange={(e) => setUnits(e.target.value)} placeholder="Unitlar: I 1 2 3 …" className={field} />
        <label className="flex items-center gap-2 text-xs text-white/60">
          <span className="shrink-0">📅 Boshlanish sanasi</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
        </label>
      </div>
      <p className="text-xs text-white/50">Vazifa muddatlari shu sanadan hisoblanadi — kursdagi vazifalar bu guruh uchun avtomatik joylashadi.</p>
      {error ? <p className="text-sm text-[#ff8a8a]">{error}</p> : null}
      <button type="submit" disabled={pending} className="rounded-2xl bg-[#22c55e] px-5 py-2.5 text-sm font-black text-[#062a20] disabled:opacity-50">
        {pending ? "…" : "Guruh ochish"}
      </button>
    </form>
  );
}
