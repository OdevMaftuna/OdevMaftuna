"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Har bir sahifa almashganda mazmun yumshoq paydo bo'ladi (key = manzil). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}
