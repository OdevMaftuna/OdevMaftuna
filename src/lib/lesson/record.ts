"use client";

import { SPEAKING_BYTES_PER_SECOND } from "./types";

/**
 * Brauzerda yozilgan ovozni (webm/mp4) 16 kHz mono MP3 ga (32 kbit/s) aylantiradi.
 * Shu bilan birga: davomiylik va "ovozli" qism ulushi (jim yozuvni aniqlash uchun).
 */
export async function toSpeakingMp3(recorded: Blob): Promise<{ mp3: Blob; seconds: number; voiced: number }> {
  const AC: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await recorded.arrayBuffer());
  } finally {
    void ctx.close();
  }

  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * rate)), rate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const mono = (await offline.startRendering()).getChannelData(0);

  // Ovozli qism: 50 ms bo'laklar, RMS chegaradan baland bo'lganlari.
  const frame = rate / 20;
  let loud = 0;
  let frames = 0;
  for (let i = 0; i < mono.length; i += frame) {
    let sum = 0;
    const end = Math.min(mono.length, i + frame);
    for (let j = i; j < end; j++) sum += mono[j] * mono[j];
    if (Math.sqrt(sum / (end - i)) > 0.015) loud++;
    frames++;
  }

  const pcm = new Int16Array(mono.length);
  for (let i = 0; i < mono.length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const enc = new Mp3Encoder(1, rate, (SPEAKING_BYTES_PER_SECOND * 8) / 1000);
  const parts: BlobPart[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) parts.push(new Uint8Array(b));
  }
  const tail = enc.flush();
  if (tail.length) parts.push(new Uint8Array(tail));

  return {
    mp3: new Blob(parts, { type: "audio/mpeg" }),
    seconds: Math.round(decoded.duration),
    voiced: frames ? loud / frames : 0,
  };
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
