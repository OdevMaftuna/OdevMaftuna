import type { Metadata } from "next";
import { ChatView } from "@/components/chat-view";
import { requireStudent } from "@/lib/auth";
import { loadThread } from "@/lib/chat";

export const metadata: Metadata = { title: "Chat" };

/** O'quvchi: ustozlar bilan chat (savol, stiker, vazifa bajarilmagan sabab). */
export default async function StudentChatPage() {
  const me = await requireStudent();
  const messages = await loadThread(me.id);
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Ustozlar bilan chat 💬</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Savolingizni yozing yoki stiker yuboring — Maftuna Ismoilova va yordamchi ustozlar javob beradi.</p>
      </div>
      <ChatView messages={messages} meId={me.id} mode="student" />
    </section>
  );
}
