"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getSubmissionAiStatus, rerunAi } from "@/app/actions/review";
import { btn } from "@/components/ui";

export function RerunAiButton({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        className={btn.small}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await rerunAi(submissionId);
            if (result.error) setError(result.error);
          });
        }}
      >
        {pending ? "Yuborilmoqda…" : "AI’ni qayta ishga tushirish"}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** AI tekshirayotganda ko'rinadi; tugashi bilan sahifani yangilaydi. */
export function AiWaiting({ submissionId }: { submissionId: string }) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (stopped) return;
      let status: Awaited<ReturnType<typeof getSubmissionAiStatus>> = "pending";
      try {
        status = await getSubmissionAiStatus(submissionId);
      } catch {
        // keyingi safar yana so'raymiz
      }
      if (stopped) return;
      if (status !== "pending") router.refresh();
      else timer = setTimeout(check, 4_000);
    };
    timer = setTimeout(check, 3_000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [submissionId, router]);

  return (
    <div role="status" className="flex items-center gap-3 text-sm text-neutral-700">
      <span
        aria-hidden
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700"
      />
      AI javobni tekshirmoqda…
    </div>
  );
}
