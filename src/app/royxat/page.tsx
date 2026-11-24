import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROUTES } from "@/lib/routes";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage() {
  // Kirmagan foydalanuvchi kurslarni RLS orqali o'qiy olmaydi — server o'zi o'qiydi (faqat id va nom).
  const admin = createAdminClient();
  const [{ data }, { data: teacherRows }] = await Promise.all([
    admin.from("courses").select("id, name").eq("is_hidden", false).order("sort_order"),
    admin.from("profiles").select("id, full_name").eq("role", "teacher").eq("is_active", true).order("created_at"),
  ]);
  const courses = (data ?? []).map((c) => ({ id: c.id as string, name: c.name as string }));
  // Guruh = o'qituvchi (faqat ism ko'rsatiladi).
  const teachers = (teacherRows ?? []).map((t) => ({ id: t.id as string, name: (t.full_name as string) || "Teacher" }));

  return (
    <AuthShell title="Create account" description="Choose your course and set a password. Your teacher will approve your account — then you can start." greeting="Welcome to NSP! ✨">
      <SignUpForm courses={courses} teachers={teachers} />
      <p className="mt-5 text-center text-sm text-neutral-400">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-semibold text-[#F5C76A] underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
