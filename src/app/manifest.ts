import type { MetadataRoute } from "next";

/**
 * PWA manifest: saytni telefon/kompyuter bosh ekraniga ilova kabi qo'shish uchun.
 * Ochilganda brauzer paneli ko'rinmaydi (standalone), ikonka — NSP belgisi.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NSP Language Center",
    short_name: "NSP",
    description: "Ingliz tili: uy vazifalari, mashqlar, imtihon testlari va natijalar.",
    lang: "uz",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d1512",
    theme_color: "#046B4E",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Uy vazifa", url: "/oquvchi/vazifalar", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Imtihon testlari", url: "/oquvchi/testlar", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
