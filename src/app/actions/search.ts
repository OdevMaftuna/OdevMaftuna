"use server";

import { requireStudent } from "@/lib/auth";
import { loadMyCourseAccess } from "@/lib/course-access";
import { loadCourses } from "@/lib/courses";
import { loadMyTests } from "@/lib/paid-tests";
import { KIND_PATH, type TopicKind } from "@/lib/practice/data";
import type { SearchItem } from "@/lib/search";
import { loadStudentAssignments } from "@/lib/student-data";
import { createClient } from "@/lib/supabase/server";

const SECTIONS: SearchItem[] = [
  { kind: "section", title: "Home", sub: "Bosh sahifa", href: "/oquvchi", extra: "bosh sahifa main" },
  { kind: "section", title: "Homework", sub: "Uy vazifalari", href: "/oquvchi/vazifalar", extra: "uy vazifasi vazifalar" },
  { kind: "section", title: "Exam tests", sub: "Imtihon testlari", href: "/oquvchi/testlar", extra: "test imtihon exam" },
  { kind: "section", title: "History", sub: "Natijalar tarixi", href: "/oquvchi/tarix", extra: "tarix natija results" },
  { kind: "section", title: "Writing", sub: "Yozma ishlar", href: "/oquvchi/writing", extra: "yozish essay" },
  { kind: "section", title: "Chat with teachers", sub: "Ustozlar bilan chat", href: "/oquvchi/chat", extra: "chat ustoz teacher xabar" },
  { kind: "section", title: "Profile", sub: "Profil, parol, eslatmalar", href: "/oquvchi/kabinet", extra: "profil kabinet parol password reminders eslatma" },
];

const KIND_NAME: Record<TopicKind, string> = { grammar: "Grammar", vocab: "Vocabulary", phrasal: "Useful phrases", reading: "Reading" };

/**
 * O'quvchi qidiruvi uchun indeks — qidiruv oynasi birinchi ochilganda bir marta yuklanadi.
 * Faqat o'quvchiga ochiq kurslarning mavzulari va so'zlari kiradi (RLS ham qo'shimcha himoya).
 */
export async function loadSearchIndex(): Promise<SearchItem[]> {
  const profile = await requireStudent();
  const supabase = await createClient();
  const [courses, access, assignments, tests] = await Promise.all([
    loadCourses(),
    loadMyCourseAccess(profile.id),
    loadStudentAssignments().catch(() => ({ items: [] as { id: string; title: string; due_at: string }[] })),
    loadMyTests(profile.id).catch(() => []),
  ]);
  const open = new Set(access.all);
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const items: SearchItem[] = [...SECTIONS];

  for (const c of courses) {
    if (c.is_hidden && !open.has(c.id)) continue;
    items.push({ kind: "course", title: c.name, sub: open.has(c.id) ? "My course" : "🔒 Preview", href: `/oquvchi/kurs/${c.id}` });
  }

  if (open.size) {
    const ids = [...open];
    const [{ data: topics }, { data: vocab }] = await Promise.all([
      supabase.from("practice_topics").select("id, course_id, kind, unit, code, title, title_uz").in("course_id", ids).order("sort_order"),
      supabase.from("practice_topics").select("id, course_id, unit, title, words:content->words").in("course_id", ids).eq("kind", "vocab"),
    ]);
    for (const t of topics ?? []) {
      const kind = t.kind as TopicKind;
      items.push({
        kind: "topic",
        title: t.title as string,
        sub: [courseName.get(t.course_id as string), KIND_NAME[kind], t.title_uz].filter(Boolean).join(" · "),
        href: `/oquvchi/mashq/${t.id}`,
        extra: `${t.code} unit ${t.unit} ${KIND_PATH[kind]}`,
      });
    }
    const seen = new Set<string>();
    for (const t of vocab ?? []) {
      const words = Array.isArray(t.words) ? (t.words as { en?: string; uz?: string }[]) : [];
      for (const w of words) {
        if (!w?.en) continue;
        const key = `${w.en}|${t.course_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          kind: "word",
          title: w.en,
          sub: `${w.uz ?? ""} · ${courseName.get(t.course_id as string) ?? ""}, ${t.title as string}`,
          href: `/oquvchi/mashq/${t.id}`,
          extra: w.uz ?? "",
        });
      }
    }
  }

  for (const a of assignments.items) {
    items.push({ kind: "homework", title: a.title, sub: `Due ${new Date(a.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Tashkent" })}`, href: `/oquvchi/vazifa/${a.id}` });
  }
  for (const { test } of tests) {
    items.push({ kind: "test", title: test.title, sub: [test.course, test.subtitle].filter(Boolean).join(" · "), href: `/oquvchi/testlar/${test.id}`, extra: test.code });
  }
  return items;
}
