"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAiStatus } from "@/app/actions/submissions";

const FAST_MS = 3_000;
const SLOW_MS = 15_000;
/** Shuncha vaqtdan keyin kamroq so'raymiz va "biroz cho'zildi" deymiz. */
const SLOW_AFTER_MS = 60_000;

/**
 * Javob tekshirilayotganda ko'rinadi. Har 3 soniyada serverdan holatni so'raydi;
 * tekshiruv tugashi bilan sahifani yangilaydi va natija shu joyda paydo bo'ladi.
 */
export function AiPending({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();

    const check = async () => {
      if (stopped) return;
      let status: Awaited<ReturnType<typeof getAiStatus>> = "pending";
      try {
        status = await getAiStatus(assignmentId);
      } catch {
        // Tarmoq uzilgan bo'lishi mumkin — keyingi safar yana so'raymiz.
      }
      if (stopped) return;
      if (status !== "pending") {
        router.refresh();
        return;
      }
      const isSlow = Date.now() - started > SLOW_AFTER_MS;
      setSlow(isSlow);
      timer = setTimeout(check, isSlow ? SLOW_MS : FAST_MS);
    };

    timer = setTimeout(check, FAST_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [assignmentId, router]);

  return (
    <div role="status" className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700"
      />
      <div>
        <p className="font-medium">Checking your answers…</p>
        <p className="mt-0.5 text-sm text-neutral-600">
          {slow
            ? "This is taking a little longer. You can close the page — the result will appear here when it’s ready."
            : "It usually takes a few seconds. The result will appear here."}
        </p>
      </div>
    </div>
  );
}
