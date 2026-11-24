import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REQUIRE_PASSWORD_CHANGE } from "@/lib/config";
import { getPublicEnv } from "@/lib/env";
import { ROUTES, homeFor, isUnder, type Role } from "@/lib/routes";

/**
 * Har bir so'rovda ishlaydi (src/proxy.ts orqali):
 *  1. Supabase sessiyasini yangilaydi (cookie).
 *  2. Kirmagan foydalanuvchini kirish sahifasiga yuboradi.
 *  3. Nofaol hisobni tizimdan chiqaradi.
 *  4. Parolini almashtirmagan foydalanuvchini parol sahifasida ushlab turadi.
 *  5. Har kimni faqat o'z roli bo'limiga kiritadi.
 */
export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /** Yangilangan sessiya cookie'larini saqlagan holda yo'naltirish. */
  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  const path = request.nextUrl.pathname;

  // getClaims() tokenning imzosini tekshiradi (cookie'ga ko'r-ko'rona ishonmaydi) va kerak bo'lsa
  // sessiyani yangilaydi. Imzo kalitlari keshlangani uchun odatda tarmoqqa chiqmaydi — getUser()dan ancha tez.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const user = userId ? { id: userId } : null;

  if (!user) {
    return path === ROUTES.login || path === ROUTES.signup ? response : redirectTo(ROUTES.login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return redirectTo(ROUTES.login, "?xato=nofaol");
  }

  if (REQUIRE_PASSWORD_CHANGE && profile.must_change_password) {
    return path === ROUTES.changePassword
      ? response
      : redirectTo(ROUTES.changePassword);
  }

  const role = profile.role as Role;
  const home = homeFor(role);

  if (path === "/" || path === ROUTES.login || path === ROUTES.signup) {
    return redirectTo(home);
  }
  if (isUnder(path, ROUTES.teacher) && role !== "teacher") {
    return redirectTo(home);
  }
  if (isUnder(path, ROUTES.student) && role !== "student") {
    return redirectTo(home);
  }

  return response;
}
