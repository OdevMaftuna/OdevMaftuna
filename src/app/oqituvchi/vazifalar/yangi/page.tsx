import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { AssignmentForm } from "../assignment-form";

export const metadata: Metadata = { title: "Yangi vazifa" };

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string }>;
}) {
  await requireTeacher();
  const [courses, { kurs }] = await Promise.all([loadCourses(), searchParams]);
  // Kurs sahifasidan kelgan bo'lsa, o'sha kurs oldindan tanlangan bo'ladi.
  const preselected = pickCourse(courses, kurs);

  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Yangi vazifa" />
      <AssignmentForm
        id={null}
        courses={courses}
        initial={{
          course_id: preselected?.id ?? "",
          title: "",
          instructions: "",
          submission_type: "text",
          rubric: "",
          max_score: "100",
          publish_at: "",
          due_at: "",
          late_allowed: false,
          late_penalty_percent: "0",
        }}
      />
    </section>
  );
}
