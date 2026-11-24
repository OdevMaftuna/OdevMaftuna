import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/form";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<{ xato?: string }>;

async function Notice({ searchParams }: { searchParams: SearchParams }) {
  const { xato } = await searchParams;
  if (xato === "kutish") {
    return (
      <div
        role="status"
        className="mb-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
      >
        ✅ Your account has been created. Your teacher will approve it soon — then you can log in here.
      </div>
    );
  }
  if (xato !== "nofaol") return null;
  return (
    <div className="mb-4">
      <FormError message="Your account is not active. Please contact your teacher." />
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthShell
      title="Log in"
      description="Log in with your email and password."
    >
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
      <div className="mt-5 flex items-center gap-3 text-[11px] text-neutral-500">
        <span className="h-px flex-1 bg-white/10" />
        New student?
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <Link
        href="/royxat"
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#f1a93b]/50 text-sm font-bold text-[#F5C76A] transition hover:bg-[#f1a93b]/10"
      >
        Create an account — choose your course ✨
      </Link>
    </AuthShell>
  );
}
