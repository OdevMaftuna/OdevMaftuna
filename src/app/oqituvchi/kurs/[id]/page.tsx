import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { LEVEL_INFO, loadTopics } from "@/lib/practice/data";
import { createClient } from "@/lib/supabase/server";
import { PaidTestsCard } from "@/components/paid-tests-card";

export const metadata: Metadata = { title: "Bo‘lim" };

function SectionCard({ href, icon, title, text, meta }: { href: string; icon: string; title: string; text: string; meta: string }) {
  return (
    <Link href={href} className={`${card} group flex items-center gap-3 p-4 transition hover:border-brand-300`}>
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-neutral-600">{text}</p>
        <p className="mt-1 text-xs text-sun-400">{meta}</p>
      </div>
      <span className="text-neutral-400 transition group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

export default async function TeacherCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [courses, topics, { count: assignments }, { count: open }, { count: sold }, { count: waiting }] = await Promise.all([
    loadCourses(),
    loadTopics({ courseId: id }),
    supabase.from("assignments").select("id", { count: "exact", head: true }).eq("course_id", id),
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id)
      .lte("publish_at", new Date().toISOString()),
    supabase.from("test_purchases").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("test_purchases").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();
  const info = LEVEL_INFO[course.name];
  const g = topics.filter((t) => t.kind === "grammar").length;
  const v = topics.filter((t) => t.kind === "vocab").length;
  const ph = topics.filter((t) => t.kind === "phrasal").length;

  return (
    <section className="space-y-5">
      <Link href="/oqituvchi" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Bosh sahifa
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{course.name}</h1>
        {info ? <Badge tone="brand">{info.level}</Badge> : null}
      </div>
      {course.name === "Beginner" ? (
        <PaidTestsCard
          href="/oqituvchi/testlar"
          title="Pullik imtihon testlari"
          text="14 ta unit testi va yakuniy Level test — kitobdagi imtihon formatida. O‘quvchi kartangizga to‘laydi."
          meta={`${sold ?? 0} ta sotilgan · ${waiting ?? 0} ta chek kutilmoqda`}
          cta={waiting ? "Cheklarni ko‘rish" : "Boshqarish"}
          badge={waiting ? `${waiting} YANGI CHEK` : "DAROMAD"}
        />
      ) : course.name === "Pre-Intermediate" ? (
        <PaidTestsCard
          href="/oqituvchi/testlar"
          title="Pullik imtihon testlari"
          text="9 ta unit testi + 3 ta umumiy test (Units 1–5 · 80 000, Units 6–9 · 80 000, Final 1–9 · 150 000) — kitobdagi imtihon formatida."
          meta={`${sold ?? 0} ta sotilgan · ${waiting ?? 0} ta chek kutilmoqda`}
          cta={waiting ? "Cheklarni ko‘rish" : "Boshqarish"}
          badge={waiting ? `${waiting} YANGI CHEK` : "DAROMAD"}
          course="Pre-Intermediate"
        />
      ) : null}
      <div className="space-y-3">
        <SectionCard
          href={`/oqituvchi/vazifalar?kurs=${id}`}
          icon="📅"
          title="Uy vazifalari"
          text="Har kungi darslar — ochilmaganlari ham. “Ko‘rish” bilan darsni va javoblar kalitini ko‘rasiz."
          meta={assignments ? `${assignments} ta dars · ${open ?? 0} tasi ochilgan` : "Hali dars yo‘q"}
        />
        <SectionCard
          href={`/oqituvchi/kurs/${id}/lugat`}
          icon="📚"
          title="Lug‘at mashqlari"
          text="Har bir unit so‘zlari va mashqlar. Natijalar va kalit."
          meta={v ? `${v} ta unit` : "Hali yo‘q"}
        />
        <SectionCard
          href={`/oqituvchi/kurs/${id}/mavzular`}
          icon="🧩"
          title="Mavzu bo‘yicha (grammatika)"
          text="Qoida va mashqlar. Natijalar va kalit."
          meta={g ? `${g} ta mavzu` : "Hali yo‘q"}
        />
        <SectionCard
          href={`/oqituvchi/kurs/${id}/phrasal`}
          icon="🔗"
          title="Useful phrases"
          text="Unitlarning foydali iboralari (Functions Bank): ma’nosi, misollar va mashqlar. Natijalar va kalit."
          meta={ph ? `${ph} ta to‘plam` : "Hali yo‘q"}
        />
      </div>
    </section>
  );
}
