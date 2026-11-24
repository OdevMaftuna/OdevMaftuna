import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, card } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { loadInbox } from "@/lib/chat";
import { formatDateTime } from "@/lib/datetime";

export const metadata: Metadata = { title: "Chat" };

const preview = (kind: string, body: string) => (kind === "sticker" ? "🖼 Stiker" : kind === "excuse" ? `📝 Sabab: ${body}` : body);

/** O'qituvchi: o'quvchilar bilan chatlar ro'yxati (o'qilmaganlar tepada). */
export default async function TeacherChatInbox() {
  await requireTeacher();
  const rows = await loadInbox();
  return (
    <section className="space-y-5">
      <PageHeader title="Chat" description="O‘quvchilar savollari va vazifani nega bajarmaganlari haqidagi sabablar shu yerda. Javob yozing yoki stiker yuboring." />
      {rows.length === 0 ? (
        <div className={`${card} px-5 py-10 text-center text-sm text-neutral-600`}>Hali xabar yo‘q.</div>
      ) : (
        <ul className={`${card} divide-y divide-neutral-200`}>
          {rows.map((r) => (
            <li key={r.studentId}>
              <Link href={`/oqituvchi/chat/${r.studentId}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-bold">
                  {r.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar} alt="" className="size-full object-cover" />
                  ) : (
                    r.name.slice(0, 1)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{r.name}</b>
                  <span className={`block truncate text-sm ${r.unread ? "text-white" : "text-neutral-500"}`}>
                    {r.fromStudent ? "" : "Siz: "}
                    {preview(r.lastKind, r.last)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-neutral-500">{formatDateTime(r.lastAt)}</span>
                  {r.unread ? <span className="rounded-full bg-[#F5C76A] px-2 text-xs font-bold text-[#1d1608]">{r.unread}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
