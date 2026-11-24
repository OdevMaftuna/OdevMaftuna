import { Suspense, type ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import Link from "next/link";
import { LogoMark } from "@/components/brand";
import { OWNER_NAME } from "@/components/run-by";
import { getCurrentProfile } from "@/lib/auth";

async function UserName() {
  const profile = await getCurrentProfile();
  return <>{profile.fullName || profile.email}</>;
}

/** Panellarning yuqori qismi: brend, foydalanuvchi va chiqish tugmasi. */
export function AppHeader({
  roleLabel,
  width = "max-w-5xl",
  signOutLabel = "Chiqish",
  actions,
}: {
  roleLabel: string;
  signOutLabel?: string;
  /** Chiqish tugmasidan oldingi qo'shimcha tugmalar (masalan, o'quvchi qidiruvi). */
  actions?: ReactNode;
  /** Sahifa kontenti bilan bir xil kenglik (logo va menyu bir chiziqda turishi uchun). */
  width?: string;
}) {
  return (
    <header className="sticky top-0 z-10 bg-brand-700 bg-gradient-to-r from-brand-700 to-[#034a37] text-white shadow-[0_1px_0_rgb(0_0_0/0.4)]">
      <div className={`mx-auto flex h-16 w-full ${width} items-center justify-between gap-3 px-4`}>
        {/* Brend + imzo: har bir sahifada ko'rinadi */}
        <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label="NSP — bosh sahifa">
          <LogoMark size={36} tone="light" className="shrink-0 transition group-hover:scale-105" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[17px] font-bold tracking-tight text-white">NSP</span>
            <span lang="en" className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold" style={{ color: "#F5C76A" }}>
              <span className="font-normal italic text-white/60">by</span> {OWNER_NAME}
              <span aria-hidden className="text-[9px]">✦</span>
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-medium">
              <Suspense fallback="…">
                <UserName />
              </Suspense>
            </p>
            <p className="text-xs text-white/70">{roleLabel}</p>
          </div>
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 sm:hidden">
            {roleLabel}
          </span>
          {actions}
          <form action={signOut}>
            <button
              type="submit"
              className="h-9 shrink-0 rounded-lg border border-white/30 px-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function PageLoading() {
  return (
    // Skelet: sahifaning "shakli" yaltirab turadi — kutish qisqaroq tuyuladi.
    <div className="space-y-5" role="status" aria-label="Yuklanmoqda">
      <div className="space-y-2">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4">
          <div className="skeleton size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-3/5" />
            <div className="skeleton h-3 w-2/5" />
          </div>
        </div>
      ))}
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  );
}
