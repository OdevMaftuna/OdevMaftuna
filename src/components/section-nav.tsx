"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Panel ichidagi bo'limlar orasida o'tish (telefonda gorizontal suriladi). */
export function SectionNav({
  items,
  width = "max-w-5xl",
}: {
  width?: string;
  /** exact: faqat aynan shu manzilda faol (ichki sahifalarda emas). */
  items: { href: string; label: string; exact?: boolean }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="border-b border-brand-100 bg-surface">
      <div className={`mx-auto flex w-full ${width} gap-1 overflow-x-auto px-3`}>
        {items.map(({ href, label, exact }) => {
          const active =
            pathname === href || (!exact && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-[3px] px-3 py-3.5 text-sm transition ${
                active
                  ? "border-sun-400 font-semibold text-brand-800"
                  : "border-transparent font-medium text-neutral-600 hover:border-brand-100 hover:text-brand-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
