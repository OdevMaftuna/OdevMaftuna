import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: "middleware" endi "proxy" deb ataladi.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Statik fayllar (rasm, belgi, audio), robots.txt va PWA fayllari (manifest, sw.js) dan tashqari HAMMA so'rovlar tekshiriladi.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sw.js|stickers/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|webm|woff2?)$).*)",
  ],
};
