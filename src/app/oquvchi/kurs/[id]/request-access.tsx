"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestCourseAccess } from "@/app/actions/course-requests";
import { Notice, btn } from "@/components/ui";
import { prepareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

const formatCard = (c: string) => c.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();

/**
 * Boshqa kurs — faqat ko'rish. Ochish: kartaga to'lov → chek → asosiy o'qituvchi tasdiqlaydi.
 * (O'qituvchi o'quvchini boshqa kursga bepul ham o'tkaza oladi.)
 */
export function RequestAccess({
  courseId,
  courseName,
  status,
  userId,
  priceText,
  card: cardNumber,
  holder,
}: {
  courseId: string;
  courseName: string;
  status: "pending" | "rejected" | null;
  userId: string;
  priceText: string;
  card: string;
  holder: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cardNumber.replace(/\D/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const send = async () => {
    setError(null);
    if (!file) {
      setError("Upload a screenshot of your payment receipt.");
      return;
    }
    try {
      setBusy("Preparing…");
      const img = await prepareImage(file);
      setBusy("Uploading the receipt…");
      const path = `${userId}/course-${courseId}-${crypto.randomUUID()}.${img.ext}`;
      const { error: upErr } = await createClient().storage.from("receipts").upload(path, img.blob, { contentType: img.contentType });
      if (upErr) throw new Error("Couldn’t upload the receipt. Check your internet and try again.");
      setBusy("Sending…");
      const r = await requestCourseAccess(courseId, note, path);
      if (!r.ok) throw new Error(r.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div id="ochish" className="scroll-mt-24 overflow-hidden rounded-3xl border-2 border-sun-400/50 bg-gradient-to-br from-sun-50 to-surface p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sun-400 text-2xl">🔓</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun-700">Preview · not your course</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">Unlock {courseName}</p>
          <p className="mt-1 text-sm text-neutral-600">
            You can see what’s inside below. Unlock to do the homework, vocabulary, topics and phrases of this course too.
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: "#F5C76A" }}>{priceText}</p>
          <p className="text-xs text-neutral-500">Bir martalik to‘lov · butun kurs ochiladi. Kursingizni almashtirish — faqat o‘qituvchi orqali.</p>
        </div>
      </div>

      {status === "pending" ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-sun-400/40 bg-surface px-3 py-1.5 text-xs font-medium text-sun-700">
          <span className="pulse-dot size-1.5 rounded-full bg-sun-400" />
          Payment sent — the course opens after your teacher confirms it
        </p>
      ) : !cardNumber ? (
        <div className="mt-4">
          <Notice tone="info">Payment details are coming soon. Please ask your teacher.</Notice>
        </div>
      ) : open ? (
        <div className="mt-4 space-y-4">
          {status === "rejected" ? <p className="text-xs text-red-700">Your last payment was not confirmed. Check the amount and send again.</p> : null}
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Send <b>{priceText}</b> to this card / Shu kartaga o‘tkazing:</p>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
              <span className="flex-1 whitespace-nowrap font-mono text-base font-semibold tracking-wide tabular-nums sm:text-lg">{formatCard(cardNumber)}</span>
              <button type="button" className={btn.small} onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
            </div>
            {holder ? <p className="text-xs text-neutral-500">Card holder: {holder}</p> : null}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Upload the receipt screenshot / Chek skrinshotini yuklang</p>
            <label className={`${btn.secondary} w-full cursor-pointer`}>
              {file ? "Change the photo" : "📎 Choose a screenshot"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(f ? URL.createObjectURL(f) : null);
                  e.target.value = "";
                }}
              />
            </label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Receipt" className="max-h-64 rounded-xl border border-neutral-200 object-contain" />
            ) : null}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Note (optional)"
              className="block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15"
            />
          </div>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void send()} disabled={busy !== null} className={`${btn.primary} h-11 flex-1`}>
              {busy ?? "I’ve paid — send the receipt"}
            </button>
            <button type="button" className={btn.secondary} disabled={busy !== null} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={`${btn.primary} mt-4 h-11 w-full`} onClick={() => setOpen(true)}>
          Unlock the course — {priceText}
        </button>
      )}
    </div>
  );
}
