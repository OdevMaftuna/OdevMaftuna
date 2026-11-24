"use client";

import { useActionState } from "react";
import { saveReview, type ReviewState } from "@/app/actions/review";
import { Field, FormError, SubmitButton, TextArea } from "@/components/form";
import { Notice, btn } from "@/components/ui";

export function ReviewForm({
  submissionId,
  maxScore,
  initialScore,
  initialComment,
  aiScore,
  reviewed,
}: {
  submissionId: string;
  maxScore: number;
  initialScore: string;
  initialComment: string;
  aiScore: string | null;
  reviewed: boolean;
}) {
  const [state, action] = useActionState<ReviewState, FormData>(
    saveReview.bind(null, submissionId),
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <Field
        label={`Ball (0–${maxScore})`}
        name="score"
        type="number"
        inputMode="decimal"
        min={0}
        max={maxScore}
        step="0.5"
        defaultValue={state?.values?.score ?? initialScore}
        placeholder={aiScore ?? ""}
        hint={
          aiScore
            ? `Bo‘sh qoldirsangiz, o‘quvchiga AI bali (${aiScore}) ko‘rsatiladi. Kech topshirish jarimasi siz yozgan ballga qo‘llanmaydi.`
            : "Bo‘sh qoldirsangiz, o‘quvchi ball ko‘rmaydi."
        }
      />
      <TextArea
        label="Izoh"
        name="comment"
        rows={4}
        maxLength={5000}
        defaultValue={state?.values?.comment ?? initialComment}
        placeholder="O‘quvchiga yozmoqchi bo‘lgan izohingiz"
      />
      <FormError message={state?.error} />
      {state?.saved ? <Notice tone="success">Baho saqlandi.</Notice> : null}
      <SubmitButton pendingText="Saqlanmoqda…" className={btn.primary}>
        {reviewed ? "O‘zgarishlarni saqlash" : "Saqlash va tekshirilgan deb belgilash"}
      </SubmitButton>
    </form>
  );
}
