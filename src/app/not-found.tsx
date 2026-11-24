import Link from "next/link";
import { btn } from "@/components/ui";
import { SiteFooter } from "@/components/run-by";

export default function NotFound() {
  return (
    <>
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Sahifa topilmadi</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Bu sahifa mavjud emas yoki hali ochilmagan.
      </p>
      <Link href="/" className={`${btn.primary} mt-6`}>
        Bosh sahifaga qaytish
      </Link>
    </main>
    <SiteFooter width="max-w-sm" />
    </>
  );
}
