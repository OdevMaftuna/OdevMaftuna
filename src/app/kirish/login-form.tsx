"use client";

import { useActionState, useState } from "react";
import { signIn, type FormState } from "@/app/actions/auth";
import { FormError, SubmitButton } from "@/components/form";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, null);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-3.5">
      <label className="auth-field">
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Email</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="example@nsp.uz"
          defaultValue={state?.email ?? ""}
          required
          className="mt-0.5 h-7 placeholder:text-neutral-500/60"
        />
      </label>
      <div className="auth-field">
        <label htmlFor="login-password" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          Password
        </label>
        <div className="mt-0.5 flex items-center gap-2">
          <input
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="h-7 placeholder:text-neutral-500/60"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-neutral-500 transition hover:bg-white/5 hover:text-neutral-200"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {show ? null : <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>
      </div>
      <FormError message={state?.error} />
      <SubmitButton
        pendingText="Checking…"
        className="group mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-[#1d1608] shadow-[0_14px_30px_-12px_rgb(241_169_59/0.8)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f1a93b]/40 disabled:cursor-not-allowed disabled:opacity-60 [background:linear-gradient(135deg,#f5c76a,#f1a93b)]"
      >
        Log in <span aria-hidden className="transition group-hover:translate-x-1">→</span>
      </SubmitButton>
    </form>
  );
}
