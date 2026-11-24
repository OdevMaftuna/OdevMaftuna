import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { isoToLocalInput } from "@/lib/datetime";
import { loadCourses } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";
import type { Assignment } from "@/lib/types";
import { AssignmentForm } from "../assignment-form";

export const metadata: Metadata = { title: "Vazifani tahrirlash" };

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data }, courses] = await Promise.all([
    supabase.from("assignments").select("*").eq("id", id).maybeSingle(),
    loadCourses(),
  ]);
  if (!data) notFound();
  const a = data as Assignment;

  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Vazifani tahrirlash" />
      <AssignmentForm
        id={a.id}
        courses={courses}
        initial={{
          course_id: a.course_id,
          title: a.title,
          instructions: a.instructions,
          submission_type: a.submission_type,
          rubric: a.rubric,
          max_score: String(a.max_score),
          publish_at: isoToLocalInput(a.publish_at),
          due_at: isoToLocalInput(a.due_at),
          late_allowed: a.late_allowed,
          late_penalty_percent: String(a.late_penalty_percent),
        }}
      />
    </section>
  );
}
