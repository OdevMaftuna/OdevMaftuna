import "server-only";
import { LESSON_AUDIO_BUCKET } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Lesson } from "./types";

/** Darsdagi barcha audio yo'llari. */
export function lessonAudioPaths(lesson: Lesson): string[] {
  const paths = [
    ...(lesson.kind === "reading" ? lesson.readings.map((r) => r.audio) : []),
    ...(lesson.kind === "multilevel" ? lesson.blocks.flatMap((b) => [b.audio, ...(b.images ?? [])]) : []),
    lesson.listening?.audio,
    lesson.speaking?.sampleAudio,
  ];
  return paths.filter((p): p is string => Boolean(p));
}

/** Yopiq bucketdagi audiolar uchun 6 soatlik imzolangan havolalar (RLS: faqat tizimga kirganlar). */
export async function lessonAudioUrls(lesson: Lesson): Promise<Record<string, string>> {
  const paths = lessonAudioPaths(lesson);
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage.from(LESSON_AUDIO_BUCKET).createSignedUrls(paths, 6 * 60 * 60);
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) out[item.path] = item.signedUrl;
  }
  return out;
}
