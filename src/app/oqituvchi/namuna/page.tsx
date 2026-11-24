import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { TripPreview } from "./trip-preview";

export const metadata: Metadata = { title: "Namuna: seriya" };

/** O'qituvchi uchun: o'quvchilar ko'radigan "Amerikaga sayohat" seriyasining jonli namunasi. */
export default async function StreakPreviewPage() {
  await requireTeacher();
  return (
    <section className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title="Namuna: Your Wanderland"
        description="O‘quvchilar bosh sahifasida olovcha o‘rniga shu chiqadi. Kun, soat va ob-havoni o‘zgartirib ko‘ring (o‘quvchida ob-havo — shaharning haqiqiy ob-havosi)."
      />
      <TripPreview />
    </section>
  );
}
