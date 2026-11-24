/** Support harakat turlari — server va brauzer uchun umumiy (support_actions.kind). */
export type ActionKind = "remind" | "call" | "explain" | "retake" | "note";

export const ACTION_LABEL: Record<ActionKind, string> = {
  remind: "📩 Eslatma",
  call: "📞 Qo‘ng‘iroq",
  explain: "📚 Tushuntirdi",
  retake: "💯 100 oldi",
  note: "📝 Izoh",
};
