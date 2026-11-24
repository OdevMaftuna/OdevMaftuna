import type { Metadata } from "next";
import { requireSupport } from "@/lib/support";
import { loadDirectorExtras, loadGroupOverview, type Period } from "@/lib/group-overview";
import { SupportView, type SupportParams } from "./support-view";

export const metadata: Metadata = { title: "Support markazi" };

/** SUPPORT MARKAZI — butun guruh natijalari (asosiy o'qituvchi va "Support" huquqli o'qituvchilar). */
export default async function SupportPage({ searchParams }: { searchParams: Promise<SupportParams> }) {
  const me = await requireSupport();
  const sp = await searchParams;
  const period: Period = sp.davr === "oy" ? "oy" : "hafta";
  const [data, extras] = await Promise.all([loadGroupOverview(period), me.isAdmin ? loadDirectorExtras(period) : Promise.resolve(null)]);
  return <SupportView data={data} extras={extras} isAdmin={me.isAdmin} sp={sp} />;
}
