import type { Metadata } from "next";
import Link from "next/link";
import { CourseTabs } from "@/components/course-tabs";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { formatDateTime } from "@/lib/datetime";
import { loadTracking } from "@/lib/teacher-data";

export const metadata: Metadata = { title: "Kuzatuv" };

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-16 text-center">
      <p className={`text-lg font-semibold tabular-nums ${value > 0 && tone ? tone : ""}`}>
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string }>;
}) {
  await requireTeacher();
  const [{ rows: all, activeStudents, activeByCourse }, courses, { kurs }] = await Promise.all([
    loadTracking(),
    loadCourses(),
    searchParams,
  ]);

  const selected = pickCourse(courses, kurs);
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const rows = selected ? all.filter((r) => r.assignment.course_id === selected.id) : all;
  const counts = Object.fromEntries(
    courses.map((c) => [c.id, all.filter((r) => r.assignment.course_id === c.id).length]),
  );
  const studentCount = selected ? (activeByCourse[selected.id] ?? 0) : activeStudents;

  return (
    <section>
      <PageHeader
        title={selected ? `Kuzatuv · ${selected.name}` : "Kuzatuv"}
        description={`E’lon qilingan vazifalar bo‘yicha kim topshirgani. Faol o‘quvchilar: ${studentCount} ta.`}
      />

      <CourseTabs
        basePath="/oqituvchi/kuzatuv"
        courses={courses}
        selectedId={selected?.id ?? null}
        counts={counts}
        total={all.length}
      />

      {rows.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>
          {selected
            ? `${selected.name} kursida hali e’lon qilingan vazifa yo‘q.`
            : "Hali e’lon qilingan vazifa yo‘q."}
        </div>
      ) : (
        <ul className={`${card} divide-y divide-neutral-200`}>
          {rows.map(({ assignment: a, closed, submitted, late, missing, unreviewed, aiProblems }) => (
            <li key={a.id}>
              <Link
                href={`/oqituvchi/kuzatuv/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 transition hover:bg-neutral-50"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{a.title}</p>
                    {selected ? null : <Badge tone="sun">{courseName.get(a.course_id) ?? "—"}</Badge>}
                    {closed ? <Badge>Yopilgan</Badge> : <Badge tone="green">Ochiq</Badge>}
                    {unreviewed > 0 ? (
                      <Badge tone="brand">{unreviewed} ta tekshirilmagan</Badge>
                    ) : null}
                    {aiProblems > 0 ? <Badge tone="red">AI xatosi: {aiProblems}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Muddat: {formatDateTime(a.due_at)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Stat label="Topshirdi" value={submitted} />
                  <Stat label="Kech" value={late} tone="text-amber-700" />
                  <Stat
                    label={closed ? "Topshirmadi" : "Hali yo‘q"}
                    value={missing}
                    tone={closed ? "text-red-700" : undefined}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
