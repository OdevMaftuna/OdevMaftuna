/** Ilova bo'yicha umumiy sozlamalar. */

/** Barcha sana/vaqt amallari shu vaqt zonasida bajariladi (Xorazm, UTC+5). */
export const APP_TIMEZONE = "Asia/Tashkent";

/** Interfeys tili: o'zbekcha (lotin). */
export const APP_LOCALE = "uz-Latn-UZ";

export const APP_NAME = "NSP";

/**
 * Birinchi kirishda (va parol tiklangandan keyin) o'quvchi parolini almashtirishi shartmi?
 * Hozircha O'CHIRILGAN: o'quvchi o'qituvchi bergan parol bilan to'g'ridan-to'g'ri kiradi.
 * Qayta yoqish uchun `true` qiling.
 */
export const REQUIRE_PASSWORD_CHANGE = false;

/** Yuklash cheklovlari (server tomonida ham tekshiriladi). */
export const MAX_IMAGES_PER_SUBMISSION = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const SUBMISSIONS_BUCKET = "submissions";
/** O'quvchilarning speaking ovozlari (AI tekshirgach yoki 3 kundan keyin o'chiriladi). */
export const SPEAKING_BUCKET = "speaking";
/** Kurs audiolari (doimiy). */
export const LESSON_AUDIO_BUCKET = "lesson-audio";
