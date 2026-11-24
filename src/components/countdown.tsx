"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min ${seconds} s`;
  return `${seconds} s`;
}

/**
 * Muddatgacha qolgan vaqt. Server soatiga tayanadi (serverNow), shuning uchun
 * telefon soati noto'g'ri bo'lsa ham to'g'ri ko'rsatadi. Vaqt tugaganda sahifani
 * yangilaydi. Bu faqat ko'rsatkich: haqiqiy tekshiruv serverda bajariladi.
 */
export function Countdown({
  dueAt,
  serverNow,
  onExpire,
}: {
  dueAt: string;
  serverNow: number;
  onExpire?: () => void;
}) {
  const router = useRouter();
  const due = new Date(dueAt).getTime();
  const [now, setNow] = useState(serverNow);
  const expired = useRef(false);

  useEffect(() => {
    const offset = serverNow - Date.now();
    const tick = () => {
      const current = Date.now() + offset;
      setNow(current);
      if (current >= due && !expired.current) {
        expired.current = true;
        onExpire?.();
        router.refresh();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [due, serverNow, onExpire, router]);

  const remaining = due - now;
  if (remaining <= 0) {
    return <span className="font-medium text-red-700">Time is up</span>;
  }
  const tone =
    remaining < 3600_000
      ? "text-red-700"
      : remaining < 3 * 3600_000
        ? "text-amber-700"
        : "text-neutral-800";
  return (
    <span className={`font-semibold tabular-nums ${tone}`}>
      {formatRemaining(remaining)}
    </span>
  );
}
