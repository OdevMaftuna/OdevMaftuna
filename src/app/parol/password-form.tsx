"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(
    changePassword,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        hint="At least 8 characters."
      />
      <Field
        label="Repeat the new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
      />
      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">Save password</SubmitButton>
    </form>
  );
}
