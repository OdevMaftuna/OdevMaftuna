"use client";

import { useState, useTransition } from "react";
import { decideTestPurchase, savePaymentSettings, saveTestPrice } from "@/app/actions/paid-tests";
import { Notice, btn } from "@/components/ui";

const field =
  "block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15";

export function PurchaseButtons({ purchaseId }: { purchaseId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const decide = (approve: boolean) => {
    if (!approve && !window.confirm("To‘lovni rad etasizmi? O‘quvchi qayta chek yuborishi kerak bo‘ladi.")) return;
    start(async () => {
      const r = await decideTestPurchase(purchaseId, approve);
      if (r.error) setError(r.error);
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button type="button" className={btn.primary} disabled={pending} onClick={() => decide(true)}>
        ✓ Pul tushdi — testni ochish
      </button>
      <button type="button" className={btn.danger} disabled={pending} onClick={() => decide(false)}>
        Rad etish
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}

export function PaymentSettingsForm({ card, holder }: { card: string; holder: string }) {
  const [c, setC] = useState(card.replace(/(\d{4})(?=\d)/g, "$1 "));
  const [h, setH] = useState(holder);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Karta raqami</span>
        <input value={c} onChange={(e) => setC(e.target.value)} inputMode="numeric" placeholder="8600 0000 0000 0000" className={`${field} font-mono tracking-wider`} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Karta egasi (ixtiyoriy)</span>
        <input value={h} onChange={(e) => setH(e.target.value)} maxLength={80} placeholder="Maftuna I." className={field} />
      </label>
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      <button
        type="button"
        className={btn.primary}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await savePaymentSettings(c, h);
            setMsg(r.error ? { tone: "error", text: r.error } : { tone: "success", text: "Saqlandi." });
          })
        }
      >
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </button>
    </div>
  );
}

export function PriceEditor({ testId, price }: { testId: string; price: number }) {
  const [value, setValue] = useState(String(price));
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const dirty = Number(value) !== price;
  return (
    <span className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value.replace(/\D/g, ""));
          setState("idle");
        }}
        inputMode="numeric"
        className="h-9 w-24 rounded-lg border border-neutral-300 bg-surface px-2 text-right tabular-nums outline-none focus:border-brand-500"
        aria-label="Narx (so‘m)"
      />
      <span className="text-xs text-neutral-500">so‘m</span>
      {dirty ? (
        <button
          type="button"
          className={btn.small}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await saveTestPrice(testId, Number(value));
              setState(r.error ? "error" : "saved");
            })
          }
        >
          Saqlash
        </button>
      ) : state === "saved" ? (
        <span className="text-xs text-emerald-700">✓</span>
      ) : null}
      {state === "error" ? <span className="text-xs text-red-700">xato</span> : null}
    </span>
  );
}
