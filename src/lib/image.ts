import { MAX_IMAGE_BYTES } from "@/lib/config";

/** Brauzerda rasmni yuklashdan oldin tekshirish va siqish. */

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;

export type PreparedImage = { blob: Blob; ext: string; contentType: string };

function detectType(file: File): string | null {
  if (EXT_BY_TYPE[file.type]) return file.type;
  // Ba'zi brauzerlar HEIC uchun turini bo'sh qoldiradi.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "heic") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

/**
 * Rasmni eng uzun tomoni 1600px bo'lgan JPEG'ga aylantiradi (daftar surati uchun yetarli,
 * hajmi esa odatda 10 barobar kichrayadi). Brauzer rasmni o'qiy olmasa (masalan HEIC),
 * asl fayl o'zgarishsiz yuboriladi.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const type = detectType(file);
  if (!type) {
    throw new Error("Faqat JPG, PNG, WEBP yoki HEIC rasm yuklash mumkin.");
  }

  let result: PreparedImage = { blob: file, ext: EXT_BY_TYPE[type], contentType: type };

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (context) {
      // Shaffof PNG qora bo'lib qolmasligi uchun oq fon.
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
      );
      if (blob && (blob.size < file.size || type === "image/heic")) {
        result = { blob, ext: "jpg", contentType: "image/jpeg" };
      }
    }
    bitmap.close();
  } catch {
    // O'qib bo'lmadi — asl fayl yuboriladi.
  }

  if (result.blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Rasm juda katta (5 MB dan oshmasin).");
  }
  return result;
}
