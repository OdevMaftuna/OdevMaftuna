import type { Metadata } from "next";
import { signOut } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      greeting="One last step 🔐"
      description="To continue, replace the temporary password with a new one you will remember."
    >
      <PasswordForm />
      <form action={signOut} className="mt-4 text-center">
        <button
          type="submit"
          className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-800"
        >
          Tizimdan chiqish
        </button>
      </form>
    </AuthShell>
  );
}
