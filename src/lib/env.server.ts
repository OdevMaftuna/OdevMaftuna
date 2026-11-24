import "server-only";

/** Faqat serverda o'qiladigan maxfiy o'zgaruvchilar. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`.env.local faylida ${name} yetishmayapti.`);
  }
  return value;
}

export function getServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getGeminiEnv() {
  const model = required("GEMINI_MODEL");
  // Ixtiyoriy: asosiy model band bo'lsa (503 / javob kelmasa) shu modelga o'tiladi.
  const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim();
  return {
    apiKey: required("GEMINI_API_KEY"),
    models: fallback && fallback !== model ? [model, fallback] : [model],
  };
}
