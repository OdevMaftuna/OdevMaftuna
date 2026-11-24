import type { Metadata } from "next";
import { CourseRequests } from "./course-requests";
import Link from "next/link";
import { CourseTabs } from "@/components/course-tabs";
import { Badge, PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { REQUIRE_PASSWORD_CHANGE } from "@/lib/config";
import { loadCourses, pickCourse } from "@/lib/courses";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/datetime";
import { AddStudentForm } from "./add-student-form";
import { BulkStudents } from "./bulk-students";
import { CourseSelect } from "./course-select";
import { ApproveButton } from "./approve-button";
import { StudentActions } from "./student-actions";
import { TeacherSelect } from "./teacher-select";

export const metadata: Metadata = { title: "O‘quvchilar" };

type StudentProfile = {
  id: string;
  full_name: string;
  is_active: boolean;
  must_change_password: boolean;
  course_id: string | null;
  teacher_id: string | null;
  self_registered: boolean;
  created_at: string;
  age: number | null;
};

type UserInfo = { email: string; lastSignIn: string | null; pendingApproval: boolean };

/** 7 kun oldingi vaqt (yangi ro‘yxatdan o‘tganlar uchun). */
function weekAgoMs() {
  return Date.now() - 7 * 864e5;
}

/** E-pochta auth.users jadvalida turadi, uni faqat server (service role) o'qiy oladi. */
async function loadEmails(): Promise<Map<string, UserInfo>> {
  const emails = new Map<string, UserInfo>();
  const admin = createAdminClient();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const user of data.users) emails.set(user.id, { email: user.email ?? "", lastSignIn: user.last_sign_in_at ?? null, pendingApproval: user.app_metadata?.pending_approval === true });
    if (data.users.length < 200) break;
  }
  return emails;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string; oqituvchi?: string }>;
}) {
  const me = await requireTeacher();
  const supabase = await createClient();

  const [{ data, error }, emails, courses, { kurs, oqituvchi }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, is_active, must_change_password, course_id, teacher_id, self_registered, created_at, age")
      .eq("role", "student")
      .order("full_name", { ascending: true }),
    loadEmails(),
    loadCourses(),
    searchParams,
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
  ]);
  const teachers = (teacherRows ?? []).map((t) => ({ id: t.id, name: t.full_name || "O‘qituvchi" }));
  const teacherName = new Map(teachers.map((t) => [t.id, t.name]));
  // O'qituvchi filtri: "" — hammasi, "none" — guruhsizlar, aks holda o'qituvchi id.
  const tf = oqituvchi === "none" || teacherName.has(oqituvchi ?? "") ? (oqituvchi as string) : "";
  // Oddiy o'qituvchi — faqat o'z guruhi va guruhsizlar; asosiy o'qituvchi — hammasi.
  // Hamma o'qituvchi (support teacher ham) barcha o'quvchilarni ko'radi.
  // O'zgartirish: asosiy o'qituvchi — hammasini; boshqalar — o'z guruhi va guruhsizlarni.
  const all = (data ?? []) as StudentProfile[];
  const canEdit = (s: StudentProfile) => me.isAdmin || !s.teacher_id || s.teacher_id === me.id;
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const weekAgo = weekAgoMs();
  const newcomers = all
    .filter((s) => s.self_registered && new Date(s.created_at).getTime() > weekAgo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  // Tasdiq kutayotganlar: o'zi ro'yxatdan o'tgan, hali o'qituvchi tasdiqlamagan.
  const awaiting = all
    .filter((s) => !s.is_active && emails.get(s.id)?.pendingApproval)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const visibleTeachers = me.isAdmin ? teachers : teachers.filter((t) => t.id === me.id);
  const filterTeachers = teachers;
  const selected = pickCourse(courses, kurs);
  const students = all
    .filter((s) => !selected || s.course_id === selected.id)
    .filter((s) => (tf === "" ? true : tf === "none" ? !s.teacher_id : s.teacher_id === tf));
  const qs = (t: string) => {
    const p = new URLSearchParams();
    if (selected) p.set("kurs", selected.id);
    if (t) p.set("oqituvchi", t);
    const str = p.toString();
    return `/oqituvchi/oquvchilar${str ? `?${str}` : ""}`;
  };
  const activeCount = students.filter((s) => s.is_active).length;
  const withoutCourse = all.filter((s) => !s.course_id).length;
  const counts = Object.fromEntries(
    courses.map((c) => [c.id, all.filter((s) => s.course_id === c.id).length]),
  );

  return (
    <section className="space-y-6">
      <CourseRequests
        isAdmin={me.isAdmin}
        students={all.filter((s) => s.is_active && canEdit(s)).map((s) => ({ id: s.id, name: s.full_name || "Ismsiz", courseId: s.course_id }))}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
      />
      {awaiting.length ? (
        <div className={`${card} border-amber-300/70 p-4`}>
          <h2 className="flex items-center gap-2 font-semibold">
            ⏳ Tasdiq kutayotganlar
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs tabular-nums text-amber-700">{awaiting.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">O‘zlari ro‘yxatdan o‘tgan. Tasdiqlamaguningizcha saytga kira olmaydi. Tanimagan odamni tasdiqlamang.</p>
          <ul className="mt-3 divide-y divide-neutral-200 text-sm">
            {awaiting.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="font-medium">{s.full_name || "Ismsiz"}</span>
                  <span className="block break-all text-xs text-neutral-500">{s.age ? `${s.age} yosh · ` : ""}{emails.get(s.id)?.email} · {formatDateTime(s.created_at)}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{(s.course_id && courseName.get(s.course_id)) || "Kurssiz"}</Badge>
                  {s.teacher_id ? <Badge tone="green">👩‍🏫 {teacherName.get(s.teacher_id)}</Badge> : <Badge tone="amber">Guruhsiz</Badge>}
                  {canEdit(s) ? <ApproveButton id={s.id} /> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {newcomers.length ? (
        <div className={`${card} border-emerald-300/60 p-4`}>
          <h2 className="flex items-center gap-2 font-semibold">
            ✨ Yangi ro‘yxatdan o‘tganlar
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs tabular-nums text-emerald-700">{newcomers.length}</span>
            <span className="text-xs font-normal text-neutral-500">· oxirgi 7 kun</span>
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">O‘zlari e-pochta va parol bilan kirib, kursini tanlagan o‘quvchilar. Guruhsiz bo‘lsa — guruhga biriktiring.</p>
          <ul className="mt-3 divide-y divide-neutral-200 text-sm">
            {newcomers.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0">
                  <Link href={`/oqituvchi/oquvchilar/${s.id}`} className="font-medium underline-offset-4 hover:underline">{s.full_name || "Ismsiz"}</Link>
                  <span className="block break-all text-xs text-neutral-500">{s.age ? `${s.age} yosh · ` : ""}{emails.get(s.id)?.email} · {formatDateTime(s.created_at)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone="brand">{(s.course_id && courseName.get(s.course_id)) || "Kurssiz"}</Badge>
                  {s.teacher_id ? <Badge tone="green">👩‍🏫 {teacherName.get(s.teacher_id)}</Badge> : <Badge tone="amber">Guruhsiz</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <PageHeader
        title={selected ? `O‘quvchilar · ${selected.name}` : "O‘quvchilar"}
        description={
          REQUIRE_PASSWORD_CHANGE
            ? "O‘quvchilar o‘zlari ro‘yxatdan o‘tadi (e-pochta, parol, kurs) yoki siz qo‘shasiz."
            : me.isAdmin
              ? "O‘quvchilar o‘zlari ro‘yxatdan o‘tadi (e-pochta, parol, kurs) yoki siz qo‘shasiz. Siz hamma o‘quvchilarni ko‘rasiz."
              : "Siz barcha o‘quvchilar va ularning natijalarini ko‘rasiz. O‘zgartirish — o‘z guruhingiz va guruhsiz o‘quvchilar uchun."
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${card} p-5`}>
          <h2 className="mb-4 font-semibold">Bitta o‘quvchi qo‘shish</h2>
          <AddStudentForm courses={courses} initialCourseId={selected?.id ?? ""} teachers={visibleTeachers} initialTeacherId={tf && tf !== "none" ? tf : me.id} />
        </div>
        <div className={`${card} p-5`}>
          <h2 className="mb-4 font-semibold">Excel/CSV orqali bir nechtasini qo‘shish</h2>
          <BulkStudents courses={courses} initialCourseId={selected?.id ?? ""} teachers={visibleTeachers} initialTeacherId={tf && tf !== "none" ? tf : me.id} />
        </div>
      </div>

      <div>
        <CourseTabs
          basePath="/oqituvchi/oquvchilar"
          courses={courses}
          selectedId={selected?.id ?? null}
          counts={counts}
          total={all.length}
        />
        <nav aria-label="O‘qituvchi bo‘yicha" className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ id: "", name: "Barcha o‘qituvchilar" }, ...filterTeachers, { id: "none", name: "Guruhsiz" }].map((t) => {
            const n = all.filter((s) => (!selected || s.course_id === selected.id) && (t.id === "" ? true : t.id === "none" ? !s.teacher_id : s.teacher_id === t.id)).length;
            return (
              <Link
                key={t.id || "all"}
                href={qs(t.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition ${
                  tf === t.id ? "border-sun-400 bg-sun-50 text-sun-700" : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300"
                }`}
              >
                {t.id && t.id !== "none" ? "👩‍🏫 " : ""}
                {t.name}
                <span className="rounded-full bg-neutral-100 px-1.5 text-[11px] tabular-nums text-neutral-500">{n}</span>
              </Link>
            );
          })}
        </nav>
        {!selected && withoutCourse > 0 ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            {withoutCourse} ta o‘quvchiga hali kurs biriktirilmagan. Ular hech qanday vazifani
            ko‘rmaydi — quyidagi ro‘yxatda kursini tanlang.
          </p>
        ) : null}
        <h2 className="mb-3 font-semibold">
          Ro‘yxat{" "}
          <span className="font-normal text-neutral-500">
            · {students.length} ta, shundan {activeCount} tasi faol
          </span>
        </h2>
        {error ? (
          <p className="text-sm text-red-700">
            Ro‘yxatni yuklab bo‘lmadi. Sahifani yangilab ko‘ring.
          </p>
        ) : students.length === 0 ? (
          <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>
            {selected ? `${selected.name} kursida hali o‘quvchi yo‘q.` : "Hali o‘quvchi qo‘shilmagan."}
          </div>
        ) : (
          <ul className={`${card} divide-y divide-neutral-200`}>
            {students.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/oqituvchi/oquvchilar/${s.id}`}
                      className={`truncate font-medium underline-offset-4 hover:underline ${s.is_active ? "" : "text-neutral-500"}`}
                    >
                      {s.full_name || "Ismsiz"}
                    </Link>
                    {!s.is_active && emails.get(s.id)?.pendingApproval ? (
                      <Badge tone="amber">Tasdiq kutmoqda</Badge>
                    ) : !s.is_active ? (
                      <Badge tone="red">Nofaol</Badge>
                    ) : REQUIRE_PASSWORD_CHANGE && s.must_change_password ? (
                      <Badge tone="amber">Hali kirmagan</Badge>
                    ) : (
                      <Badge tone="green">Faol</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-neutral-600">
                    {emails.get(s.id)?.email ?? ""}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {s.age ? `${s.age} yosh · ` : ""}
                    {s.self_registered ? "✍️ O‘zi ro‘yxatdan o‘tgan · " : ""}
                    {emails.get(s.id)?.lastSignIn ? `Oxirgi kirish: ${formatDateTime(emails.get(s.id)!.lastSignIn!)}` : "Hali kirmagan"}
                  </p>
                </div>
                {canEdit(s) ? (
                  <>
                    <CourseSelect studentId={s.id} courseId={s.course_id ?? ""} courses={courses} />
                    <TeacherSelect studentId={s.id} teacherId={s.teacher_id ?? ""} teachers={visibleTeachers} />
                    <StudentActions id={s.id} name={s.full_name} isActive={s.is_active} canDeactivate={me.isAdmin} />
                  </>
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{(s.course_id && courseName.get(s.course_id)) || "Kurssiz"}</Badge>
                    <Badge tone="green">👩‍🏫 {teacherName.get(s.teacher_id ?? "") ?? "—"}</Badge>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
