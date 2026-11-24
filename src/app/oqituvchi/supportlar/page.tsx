import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { loadSupportBoard } from "@/lib/support-team";
import { SupportBoardView } from "./board";

export const metadata: Metadata = { title: "Supportlar nazorati" };

/** SUPPORTLAR NAZORATI — faqat asosiy o'qituvchi: har bir support nima qilyapti, kim ishlayapti, kim yo'q. */
export default async function SupportTeamPage() {
  const me = await requireTeacher();
  if (!me.isAdmin) redirect(ROUTES.teacher);
  const board = await loadSupportBoard();
  return <SupportBoardView board={board} now={board.now} />;
}
