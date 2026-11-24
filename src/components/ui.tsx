import type { ReactNode } from "react";

/** Tugma va havolalar uchun umumiy ko'rinishlar. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

export const btn = {
  primary: `${base} h-11 bg-brand-700 text-white hover:bg-brand-600 focus-visible:ring-brand-700/30`,
  secondary: `${base} h-11 border border-brand-200 bg-surface text-brand-800 hover:bg-brand-50 focus-visible:ring-brand-700/20`,
  danger: `${base} h-11 border border-red-200 bg-surface text-red-700 hover:bg-red-50 focus-visible:ring-red-500/30`,
  small: "inline-flex h-9 items-center justify-center rounded-lg border border-brand-200 bg-surface px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60",
  smallDanger: "inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-surface px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60",
};

export const card =
  "rounded-2xl border border-brand-100/80 bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.15),0_4px_16px_-8px_rgb(0_0_0/0.36)]";

const BADGE_TONES = {
  neutral: "bg-neutral-100 text-neutral-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  brand: "bg-brand-50 text-brand-800",
  sun: "bg-sun-50 text-sun-700",
} as const;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-neutral-200 bg-neutral-50 text-neutral-700",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
