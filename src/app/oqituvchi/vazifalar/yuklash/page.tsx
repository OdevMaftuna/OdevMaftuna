import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, btn } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses, pickCourse } from "@/lib/courses";
import { BulkUpload } from "./bulk-upload";

export const metadata: Metadata = { title: "Excel’dan yuklash" };

export default async function BulkUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string }>;
}) {
  await requireTeacher();
  const [courses, { kurs }] = await Promise.all([loadCourses(), searchParams]);
  const preselected = pickCourse(courses, kurs);

  return (
    <section>
      <PageHeader
        title="Vazifalarni Excel’dan yuklash"
        description="2–3 oylik vazifalarni bitta fayl bilan qo‘shing. Yuklashdan oldin hammasi shu yerda ko‘rsatiladi."
        actions={
          <Link
            href={`/oqituvchi/vazifalar${preselected ? `?kurs=${preselected.id}` : ""}`}
            className={btn.secondary}
          >
            Ro‘yxatga qaytish
          </Link>
        }
      />
      <BulkUpload courses={courses} initialCourseId={preselected?.id ?? ""} />
    </section>
  );
}
