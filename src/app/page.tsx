import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageLoading } from "@/components/app-header";
import { getCurrentProfile } from "@/lib/auth";
import { ROUTES, homeFor } from "@/lib/routes";

/**
 * "/" manzili: odatda proxy bu yerga yetmasdan rolga qarab yo'naltiradi.
 * Bu sahifa — zaxira tekshiruv.
 */
async function RedirectByRole(): Promise<never> {
  const profile = await getCurrentProfile();
  redirect(
    profile.mustChangePassword ? ROUTES.changePassword : homeFor(profile.role),
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RedirectByRole />
    </Suspense>
  );
}
