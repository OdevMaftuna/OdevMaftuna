import { MAX_IMAGES_PER_SUBMISSION } from "@/lib/config";

/** Bazadagi submit_assignment() va muddat triggeri qaytaradigan xatolar → o'quvchiga tushunarli matn. */
export const DB_ERRORS: Record<string, string> = {
  DEADLINE_PASSED: "The deadline is over. The answer was not accepted.",
  ASSIGNMENT_NOT_AVAILABLE: "This task was not found or is not open yet.",
  EMPTY_SUBMISSION: "The answer is empty. Write text or upload a photo.",
  TEXT_TOO_LONG: "The text is too long (max 20,000 characters).",
  TOO_MANY_IMAGES: `You can upload up to ${MAX_IMAGES_PER_SUBMISSION} photos.`,
  INVALID_IMAGE_PATH: "One of the photos wasn’t uploaded. Please choose it again.",
  NOT_ALLOWED: "You are not allowed to do this.",
};

export function dbErrorMessage(message: string, fallback: string): string {
  const code = Object.keys(DB_ERRORS).find((key) => message.includes(key));
  return code ? DB_ERRORS[code] : fallback;
}
