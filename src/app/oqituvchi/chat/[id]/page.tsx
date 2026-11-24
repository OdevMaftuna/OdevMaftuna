import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatView } from "@/components/chat-view";
import { requireTeacher } from "@/lib/auth";
import { loadThread } from "@/lib/chat";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Chat" };

/** O'qituvchi: bitta o'quvchi bilan chat. */
export default async function TeacherChatThread({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: st } = await createAdminClient().from("profiles").select("full_name, role").eq("id", id).maybeSingle();
  if (!st || st.role !== "student") notFound();
  const messages = await loadThread(id);
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <Link href="/oqituvchi/chat" className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Barcha chatlar
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">{st.full_name}</h1>
        <Link href={`/oqituvchi/oquvchilar/${id}`} className="text-sm text-[#F5C76A] hover:underline">
          Natijalari →
        </Link>
      </div>
      <ChatView messages={messages} meId={me.id} mode="teacher" studentId={id} />
    </section>
  );
}
