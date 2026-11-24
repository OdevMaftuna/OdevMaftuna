"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestTestPurchase } from "@/app/actions/paid-tests";
import { Notice, btn, card } from "@/components/ui";
import { prepareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

const formatCard = (c: string) => c.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();

/** To'lov: kartaga o'tkazish → chek skrinshotini yuklash → o'qituvchi tasdiqlaydi. */
export function BuyPanel({
  testId,
  userId,
  priceText,
  card: cardNumber,
  holder,
}: {
  testId: string;
  userId: string;
  price: number;
  priceText: string;
  card: string;
  holder: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!cardNumber) {
    return (
      <Notice tone="info">
        Payment details are coming soon. Please ask your teacher. / To‘lov ma’lumotlari tez orada qo‘shiladi.
      </Notice>
    );
  }

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
      const path = `${userId}/${testId}-${crypto.randomUUID()}.${img.ext}`;
      const { error: upErr } = await createClient().storage.from("receipts").upload(path, img.blob, { contentType: img.contentType });
      if (upErr) throw new Error("Couldn’t upload the receipt. Check your internet and try again.");
      setBusy("Sending…");
      const r = await requestTestPurchase(testId, path, note);
      if (!r.ok) throw new Error(r.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${card} space-y-5 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Get access</p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: "#F5C76A" }}>{priceText}</p>
      </div>

      <ol className="space-y-5">
        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">1</span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">Send <b>{priceText}</b> to this card / Shu kartaga o‘tkazing:</p>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
              <span className="flex-1 whitespace-nowrap font-mono text-base font-semibold tracking-wide tabular-nums sm:text-lg">{formatCard(cardNumber)}</span>
              <button type="button" className={btn.small} onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
            </div>
            {holder ? <p className="text-xs text-neutral-500">Card holder: {holder}</p> : null}
            <p className="text-xs text-neutral-500">Click, Payme, Uzum yoki bank ilovasidan o‘tkazishingiz mumkin.</p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">2</span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">Upload the receipt screenshot / Chek skrinshotini yuklang</p>
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
              placeholder="Note (optional): e.g. paid from my mother’s card"
              className="block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15"
            />
          </div>
        </li>

        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">3</span>
          <p className="text-sm text-neutral-600">
            Your teacher checks the payment and the test opens here. / O‘qituvchi tasdiqlagach, test shu yerda ochiladi.
          </p>
        </li>
      </ol>

      {error ? <Notice tone="error">{error}</Notice> : null}
      <button type="button" onClick={() => void send()} disabled={busy !== null} className={`${btn.primary} h-12 w-full text-base`}>
        {busy ?? "I’ve paid — send the receipt"}
      </button>
    </div>
  );
}
