/** Profil rasmining ommaviy manzili ("avatars" bucket — faqat o'qish ommaviy). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/avatars/${path}` : null;
}
