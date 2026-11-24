import type { Metadata } from "next";
import Link from "next/link";
import { CourseTabs } from "@/components/course-tabs";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { formatDateTime } from "@/lib/datetime";
import { TRIPS } from "@/lib/road-trips";
import { loadStudentTrips, type StudentTrip } from "@/lib/teacher-streaks";

export const metadata: Metadata = { title: "Seriyalar" };

const TRIP_COLOR = ["#e0962e", "#1fa2ff", "#14a67a"];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function Avatar({ s, size = 28, ring }: { s: StudentTrip; size?: number; ring?: string }) {
  return (
    <span
      title={`${s.name} — ${s.count} kun`}
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-800 text-[10px] font-bold text-white"
      style={{ width: size, height: size, boxShadow: `0 0 0 2px ${ring ?? "transparent"}` }}
    >
      {s.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.avatar} alt="" className="size-full object-cover" />
      ) : (
        initials(s.name)
      )}
    </span>
  );
}

/** Bitta sayohat yo'li: shaharlar va ustida o'quvchilar (kim qayerda). */
function TripTrack({ index, students }: { index: number; students: StudentTrip[] }) {
  const trip = TRIPS[index];
  const color = TRIP_COLOR[index];
  // Bir kunda turganlar ustma-ust taxlanadi.
  const byDay = new Map<number, StudentTrip[]>();
  for (const s of students) byDay.set(s.inTrip, [...(byDay.get(s.inTrip) ?? []), s]);
  const tallest = Math.max(1, ...[...byDay.values()].map((l) => Math.min(l.length, 4)));
  return (
    <div className={`${card} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md text-xs font-black text-white" style={{ background: color }}>
            {trip.badge}
          </span>
          {trip.title}
        </p>
        <span className="text-xs text-neutral-500">{students.length} ta o‘quvchi yo‘lda · 30 kun</span>
      </div>
      <div className="overflow-x-auto">
        <div className="relative mx-3 mt-3 min-w-[520px]" style={{ height: 34 + tallest * 22 + 40 }}>
          {/* yo'l */}
          <span className="absolute inset-x-0 h-1.5 rounded-full" style={{ top: 34 + tallest * 22, background: `${color}55` }} />
          {trip.stops.map((st) => (
            <span key={st.name} className="absolute -translate-x-1/2 text-center" style={{ left: `${(st.day / 30) * 100}%`, top: 30 + tallest * 22 }}>
              <span className="mx-auto block size-3.5 rounded-full border-2 border-white" style={{ background: color }} />
              <span className="mt-1 block whitespace-nowrap text-[10px] text-neutral-500">{st.name}</span>
            </span>
          ))}
          {[...byDay.entries()].map(([day, list]) => (
            <span key={day} className="absolute flex -translate-x-1/2 flex-col-reverse items-center gap-0.5" style={{ left: `${(day / 30) * 100}%`, bottom: 40 + 6 }}>
              {list.slice(0, 4).map((s) => (
                <Avatar key={s.id} s={s} size={22} ring={s.today ? "#22c55e" : "#a3a3a3"} />
              ))}
              {list.length > 4 ? <span className="text-[10px] font-bold text-neutral-600">+{list.length - 4}</span> : null}
              <span className="text-[10px] font-semibold tabular-nums text-neutral-600">{day}-kun</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function StreaksPage({ searchParams }: { searchParams: Promise<{ kurs?: string; guruh?: string }> }) {
  const me = await requireTeacher();
  const [all, courses, { kurs, guruh }] = await Promise.all([loadStudentTrips(), loadCourses(), searchParams]);
  const selected = pickCourse(courses, kurs);
  const mine = guruh === "men";
  const inGroup = all.filter((s) => (mine ? s.teacherId === me.id : true));
  const rows = inGroup.filter((s) => (selected ? s.courseId === selected.id : true));
  const counts = Object.fromEntries(courses.map((c) => [c.id, inGroup.filter((s) => s.courseId === c.id).length]));
  const courseName = new Map(courses.map((c) => [c.id, c.name]));

  const onRoad = rows.filter((s) => s.count > 0);
  const todayN = rows.filter((s) => s.today).length;
  const atRisk = rows.filter((s) => s.count > 0 && !s.today);
  const crashed = rows.filter((s) => s.lost > 0);
  const garage = rows.filter((s) => s.count === 0);
  const best = onRoad[0];
  const q = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const v = { kurs: selected?.id, guruh: mine ? "men" : undefined, ...extra };
    for (const [k, val] of Object.entries(v)) if (val) p.set(k, val);
    const s = p.toString();
    return `/oqituvchi/seriyalar${s ? `?${s}` : ""}`;
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title={selected ? `Seriyalar · ${selected.name}` : "Seriyalar"}
        description="Your Wanderland: har bir o‘quvchining kunlik seriyasi va sayohatda hozir qayerda ekani. Yashil halqa — bugun ishlagan."
        actions={
          <div className="flex rounded-xl border border-brand-100 p-0.5 text-sm">
            <Link href={q({ guruh: undefined })} className={`rounded-lg px-3 py-1.5 ${!mine ? "bg-brand-700 text-white" : "text-neutral-600"}`}>
              Hammasi
            </Link>
            <Link href={q({ guruh: "men" })} className={`rounded-lg px-3 py-1.5 ${mine ? "bg-brand-700 text-white" : "text-neutral-600"}`}>
              Mening guruhim
            </Link>
          </div>
        }
      />

      <CourseTabs basePath="/oqituvchi/seriyalar" extraQuery={mine ? "guruh=men" : undefined} courses={courses} selectedId={selected?.id ?? null} counts={counts} total={inGroup.length} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["🚗 Yo‘lda", onRoad.length, "seriyasi bor"],
          ["✅ Bugun", todayN, "bugun ishladi"],
          ["⚠️ Xavfda", atRisk.length, "bugun hali ishlamagan"],
          ["🏆 Eng uzun", best ? best.count : 0, best ? best.name : "—"],
        ].map(([label, value, sub]) => (
          <div key={label as string} className={`${card} p-3`}>
            <dt className="text-xs text-neutral-500">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
            <p className="truncate text-xs text-neutral-500">{sub}</p>
          </div>
        ))}
      </dl>

      {onRoad.length ? (
        <div className="space-y-3">
          {TRIPS.map((_, i) => {
            const list = onRoad.filter((s) => s.tripIndex === i);
            return list.length ? <TripTrack key={i} index={i} students={list} /> : null;
          })}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>Bu bo‘limda faol o‘quvchi yo‘q.</div>
      ) : (
        <ul className={`${card} divide-y divide-neutral-200`}>
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/oqituvchi/oquvchilar/${s.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
                <Avatar s={s} size={36} ring={s.today ? "#22c55e" : s.count > 0 ? "#f59e0b" : "#d4d4d4"} />
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{s.name}</p>
                    {selected ? null : s.courseId ? <Badge tone="sun">{courseName.get(s.courseId) ?? "—"}</Badge> : null}
                    {s.today ? <Badge tone="green">Bugun ✓</Badge> : s.count > 0 ? <Badge tone="amber">Bugun hali yo‘q</Badge> : null}
                    {s.lost > 0 ? <Badge tone="red">💥 {s.lost} kunlik seriya uzildi</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    {s.count > 0 ? (
                      <>
                        {s.tripTitle} · {s.inTrip}/30-kun · 📍 {s.city}
                        {s.cycle > 1 ? ` · ${s.cycle}-sayohat` : ""}
                      </>
                    ) : (
                      "Garajda — hali yo‘lga chiqmagan"
                    )}
                    {s.lastActive ? <span className="text-neutral-400"> · oxirgi faollik {formatDateTime(s.lastActive)}</span> : null}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold tabular-nums">🔥 {s.count}</p>
                  <p className="text-xs text-neutral-500">kun</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {crashed.length || garage.length ? (
        <p className="text-xs text-neutral-500">
          {crashed.length ? `${crashed.length} ta o‘quvchining seriyasi kecha uzildi. ` : ""}
          {garage.length ? `${garage.length} ta o‘quvchi hali yo‘lga chiqmagan.` : ""}
        </p>
      ) : null}
    </section>
  );
}
