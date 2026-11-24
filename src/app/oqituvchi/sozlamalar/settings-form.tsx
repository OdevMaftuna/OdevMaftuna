"use client";

import { useActionState, useState } from "react";
import { saveSettings, type SettingsState } from "@/app/actions/review";
import { FormError, SubmitButton } from "@/components/form";
import { Notice, btn } from "@/components/ui";

export function SettingsForm({
  language,
  showScore,
}: {
  language: "uz" | "en";
  showScore: boolean;
}) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, null);
  // Boshqariladigan maydonlar: saqlangandan keyin ham tanlov o'z joyida qoladi.
  const [lang, setLang] = useState(language);
  const [show, setShow] = useState(showScore);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="feedback_language" value={lang} />
      {show ? <input type="hidden" name="show_ai_score_immediately" value="on" /> : null}

      <fieldset>
        <legend className="text-sm font-semibold">AI izohlari tili</legend>
        <p className="mt-0.5 text-sm text-neutral-600">
          Xatolar izohi va tavsiyalar shu tilda yoziladi. Tuzatishlarning o‘zi har doim inglizcha.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: "uz", label: "O‘zbekcha", hint: "Boshlang‘ich daraja uchun tushunarliroq" },
              { value: "en", label: "Inglizcha", hint: "Yuqori daraja uchun qo‘shimcha mashq" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                lang === option.value ? "border-brand-700 bg-brand-50" : "border-neutral-300"
              }`}
            >
              <input
                type="radio"
                checked={lang === option.value}
                onChange={() => setLang(option.value)}
                className="mt-0.5 size-4 accent-brand-700"
              />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-neutral-600">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">AI balini ko‘rsatish</legend>
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-300 p-3">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="mt-0.5 size-5 accent-brand-700"
          />
          <span>
            <span className="block text-sm font-medium">
              AI balini o‘quvchiga darhol ko‘rsatish
            </span>
            <span className="block text-xs text-neutral-600">
              O‘chirilgan bo‘lsa, o‘quvchi xatolar va tavsiyalarni darhol ko‘radi, lekin ballni
              faqat siz javobni tekshirib saqlaganingizdan keyin ko‘radi.
            </span>
          </span>
        </label>
      </fieldset>

      <FormError message={state?.error} />
      {state?.saved ? <Notice tone="success">Sozlamalar saqlandi.</Notice> : null}
      <SubmitButton pendingText="Saqlanmoqda…" className={btn.primary}>
        Saqlash
      </SubmitButton>
    </form>
  );
}
