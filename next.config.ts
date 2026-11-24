import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (PPR) ataylab o'chirilgan: bu ilovada har bir sahifa
  // kirgan foydalanuvchiga bog'liq va har so'rovda yangidan chiziladi,
  // oldindan chizib keshlaydigan narsa yo'q. Yoqilganda Supabase sessiya kodi
  // har bir sahifada "Date.now() while prerendering" xatosini logga yozardi.
  // Yopiq tizim: har bir javobga qidiruv tizimlari uchun taqiq sarlavhasi qo'shiladi
  // (sahifalardagi <meta name="robots"> va robots.txt ga qo'shimcha).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
