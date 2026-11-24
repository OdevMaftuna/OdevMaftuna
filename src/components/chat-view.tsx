"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markStudentRead, markTeacherRead, sendStudentMessage, sendTeacherMessage } from "@/app/actions/chat";
import { Sticker } from "@/components/score-sticker";
import type { ChatMessage } from "@/lib/chat";
import { STICKERS, stickerById } from "@/lib/stickers";

const time = (iso: string) =>
  new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(iso));

/**
 * Chat: xabarlar, stikerlar va "sabab" kartalari + yozish maydoni va stiker tanlagich.
 * Har 10 soniyada yangilanadi (yangi xabarlar o'zi chiqadi).
 */
export function ChatView({ messages, meId, mode, studentId }: { messages: ChatMessage[]; meId: string; mode: "student" | "teacher"; studentId?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (mode === "student" ? markStudentRead() : markTeacherRead(studentId!));
    const id = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(id);
  }, [mode, studentId, router]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = (sticker: string | null = null) =>
    start(async () => {
      setError(null);
      const r = mode === "student" ? await sendStudentMessage(sticker ? "" : text, sticker) : await sendTeacherMessage(studentId!, sticker ? "" : text, sticker);
      if (!r.ok) return setError(r.error);
      if (!sticker) setText("");
      setPicker(false);
      router.refresh();
    });

  return (
    <div className="flex min-h-[60vh] flex-col rounded-[24px] border border-white/[0.08] bg-[#0f1714]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {mode === "student" ? "Ustozlaringizga savol yozing yoki stiker yuboring 👋" : "Hali xabar yo‘q."}
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.sender.id === meId || (mode === "teacher" && m.sender.teacher);
          const st = stickerById(m.stickerId);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[11px] font-bold text-white/80">
                {m.sender.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.sender.avatar} alt="" className="size-full object-cover" />
                ) : (
                  m.sender.name.slice(0, 1)
                )}
              </span>
              <div className={`max-w-[78%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                <span className="mb-0.5 px-1 text-[10px] text-white/40">
                  {m.sender.teacher ? `👩‍🏫 ${m.sender.name}` : m.sender.name} · {time(m.createdAt)}
                </span>
                {st ? (
                  <Sticker def={st} size={128} />
                ) : m.kind === "excuse" ? (
                  <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-3 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-300">📝 Vazifa bajarilmadi — sabab</p>
                    {m.assignmentTitle ? <p className="mt-0.5 text-xs text-white/55">{m.assignmentTitle}</p> : null}
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-white">{m.body}</p>
                  </div>
                ) : (
                  <p
                    className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm ${
                      mine ? "rounded-br-md bg-gradient-to-b from-[#14a67a] to-[#0b7a59] text-white" : "rounded-bl-md bg-white/[0.07] text-white/90"
                    }`}
                  >
                    {m.body}
                  </p>
                )}
                {mine && m.readAt ? <span className="mt-0.5 px-1 text-[10px] text-emerald-400/70">✓✓ o‘qildi</span> : null}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      {picker ? (
        <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto border-t border-white/[0.06] p-3 sm:grid-cols-6">
          {STICKERS.map((s) => (
            <button key={s.id} type="button" disabled={pending} onClick={() => send(s.id)} className="grid place-items-center rounded-xl p-1 transition hover:bg-white/[0.06]" aria-label={`Stiker ${s.emoji}`}>
              <Sticker def={s} size={64} />
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2 border-t border-white/[0.06] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send();
        }}
      >
        <button type="button" onClick={() => setPicker((v) => !v)} aria-label="Stikerlar" className={`grid size-11 shrink-0 place-items-center rounded-2xl text-xl transition ${picker ? "bg-[#F5C76A]/20" : "bg-white/[0.06] hover:bg-white/10"}`}>
          😊
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Xabar yozing…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f1a93b]"
        />
        <button type="submit" disabled={pending || !text.trim()} className="h-11 shrink-0 rounded-2xl px-4 text-sm font-bold text-[#1d1608] disabled:opacity-40 [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
          {pending ? "…" : "Yuborish"}
        </button>
      </form>
      {error ? <p className="px-4 pb-3 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
