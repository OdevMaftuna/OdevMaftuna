import type { Metadata } from "next";
import Link from "next/link";
import { CourseTabs } from "@/components/course-tabs";
import { Badge, PageHeader, btn, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { ASSIGNMENT_LIST_COLUMNS, SUBMISSION_TYPE_LABELS, type Assignment } from "@/lib/types";
import { DeleteAssignmentButton } from "./delete-button";

export const metadata: Metadata = { title: "Vazifalar" };

type Status = "scheduled" | "open" | "closed";

/** Vazifalarni o'qiydi va har biriga joriy vaqtga nisbatan holat qo'yadi. */
async function loadAssignments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_LIST_COLUMNS)
    .order("publish_at", { ascending: true })
    .order("due_at", { ascending: true });

  const now = Date.now();
  const assignments = ((data ?? []) as unknown as Assignment[]).map((a) => {
    const status: Status =
      new Date(a.publish_at).getTime() > now
        ? "scheduled"
        : new Date(a.due_at).getTime() > now
          ? "open"
          : "closed";
    return { ...a, status };
  });
  return { assignments, failed: Boolean(error) };
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "scheduled") return <Badge tone="brand">Rejalashtirilgan</Badge>;
  if (status === "open") return <Badge tone="green">Ochiq</Badge>;
  return <Badge>Yopilgan</Badge>;
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string }>;
}) {
  await requireTeacher();
  const [{ assignments: all, failed }, courses, { kurs }] = await Promise.all([
    loadAssignments(),
    loadCourses(),
    searchParams,
  ]);

  const selected = pickCourse(courses, kurs);
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const counts = Object.fromEntries(
    courses.map((c) => [c.id, all.filter((a) => a.course_id === c.id).length]),
  );
  const assignments = selected ? all.filter((a) => a.course_id === selected.id) : all;
  const query = selected ? `?kurs=${selected.id}` : "";
  // Hozir ochiq (yoki eng yaqin rejalashtirilgan) dars — ro'yxatda belgilanadi.
  const currentId =
    assignments.find((a) => a.status === "open")?.id ??
    assignments.find((a) => a.status === "scheduled")?.id ??
    null;

  return (
    <section>
      <PageHeader
        title={selected ? `Vazifalar · ${selected.name}` : "Vazifalar"}
        description={
          assignments.length > 0
            ? `Jami ${assignments.length} ta. Vaqtlar Toshkent vaqti bilan ko‘rsatilgan.`
            : undefined
        }
        actions={
          <>
            <Link href={`/oqituvchi/vazifalar/yuklash${query}`} className={btn.secondary}>
              Excel’dan yuklash
            </Link>
            <Link href={`/oqituvchi/vazifalar/yangi${query}`} className={btn.primary}>
              Yangi vazifa
            </Link>
          </>
        }
      />

      <CourseTabs
        basePath="/oqituvchi/vazifalar"
        courses={courses}
        selectedId={selected?.id ?? null}
        counts={counts}
        total={all.length}
      />

      {currentId && assignments.length > 5 ? (
        <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
          <span>
            Rejalashtirilgan: <b className="tabular-nums">{assignments.filter((a) => a.status === "scheduled").length}</b> ·
            Ochiq: <b className="tabular-nums">{assignments.filter((a) => a.status === "open").length}</b> ·
            Yopilgan: <b className="tabular-nums">{assignments.filter((a) => a.status === "closed").length}</b>
          </span>
          <a href="#bugun" className="font-medium text-brand-800 hover:underline">
            Hozirgi darsga o‘tish ↓
          </a>
        </p>
      ) : null}

      {failed ? (
        <p className="text-sm text-red-700">
          Vazifalarni yuklab bo‘lmadi. Sahifani yangilab ko‘ring.
        </p>
      ) : assignments.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center`}>
          <p className="font-medium">
            {selected ? `${selected.name} kursida hali vazifa yo‘q` : "Hali vazifa yo‘q"}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Bitta vazifa qo‘shing yoki 2–3 oylik rejani Excel fayl orqali yuklang.
          </p>
        </div>
      ) : (
        <ul className={`${card} divide-y divide-neutral-200`}>
          {assignments.map((a) => (
            <li
              key={a.id}
              id={a.id === currentId ? "bugun" : undefined}
              className={`flex scroll-mt-24 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 ${
                a.id === currentId ? "bg-brand-50" : ""
              }`}
            >
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{a.title}</p>
                  <StatusBadge status={a.status} />
                  {a.id === currentId ? <Badge tone="sun">{a.status === "open" ? "Hozir" : "Keyingisi"}</Badge> : null}
                  {selected ? null : <Badge tone="sun">{courseName.get(a.course_id) ?? "—"}</Badge>}
                  {a.late_allowed ? (
                    <Badge tone="amber">
                      Kech topshirish: −{a.late_penalty_percent}%
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatDateTime(a.publish_at)} → {formatDateTime(a.due_at)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {a.lesson_kind ? "Interaktiv dars" : SUBMISSION_TYPE_LABELS[a.submission_type]} · {a.max_score} ball
                </p>
                {a.lesson_kind && a.instructions ? (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                    {a.instructions.replace(/^Bugungi dars\.\s*/, "")}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                {a.lesson_kind ? (
                  <Link href={`/oqituvchi/vazifalar/${a.id}/korish`} className={btn.small}>
                    Ko‘rish
                  </Link>
                ) : null}
                <Link href={`/oqituvchi/vazifalar/${a.id}`} className={btn.small}>
                  Tahrirlash
                </Link>
                <DeleteAssignmentButton id={a.id} title={a.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
