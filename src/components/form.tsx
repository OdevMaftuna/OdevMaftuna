"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";

// 16px shrift: iOS maydonga bosilganda sahifani kattalashtirmaydi.
const control =
  "block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 text-base outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15";

function Labeled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span>
      ) : null}
    </label>
  );
}

type Extra = { label: string; hint?: string };

export function Field({
  label,
  hint,
  ...props
}: Extra & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Labeled label={label} hint={hint}>
      <input {...props} className={`${control} h-12`} />
    </Labeled>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: Extra & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Labeled label={label} hint={hint}>
      <textarea {...props} className={`${control} py-3 leading-relaxed`} />
    </Labeled>
  );
}

export function Select({
  label,
  hint,
  children,
  ...props
}: Extra & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Labeled label={label} hint={hint}>
      <select {...props} className={`${control} h-12`}>
        {children}
      </select>
    </Labeled>
  );
}

/** Yuborilayotganda o'zi bloklanadigan tugma. */
export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "h-12 w-full rounded-xl bg-brand-700 px-4 text-base font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/30 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
    >
      {message}
    </p>
  );
}
