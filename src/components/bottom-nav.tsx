"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

/**
 * Telefon uchun pastki menyu (ilovalardagi kabi): suzib turuvchi shisha panel, o'rtada NSP logosiga
 * o'xshash oltin olti burchakli asosiy tugma, faol bo'limda olti burchakli yashil fon va oltin nuqta.
 * Kompyuterda ko'rinmaydi (u yerda yuqoridagi menyu).
 */

export type IconName = "home" | "homework" | "trophy" | "practice" | "history" | "user" | "chart" | "users" | "more" | "tasks" | "eye";
export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

const HEX = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

function Icon({ name, active }: { name: IconName; active: boolean }) {
  const p = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2.2 : 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const fill = active ? "currentColor" : "none";
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill={active ? "currentColor" : "none"} fillOpacity={0.18} />
      </>
    ),
    homework: (
      <>
        <rect x="5" y="3.5" width="14" height="17.5" rx="2.5" fill={fill} fillOpacity={0.18} />
        <path d="M9 3.5h6v2.5H9zM8.5 11l2 2 4-4M8.5 17h7" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="currentColor" fillOpacity={0.25} />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4" />
      </>
    ),
    practice: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill={fill} fillOpacity={0.18} />
        <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5zM9 8h7M9 11.5h5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8.5" r="4" fill={fill} fillOpacity={0.18} />
        <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="8.5" fill={fill} fillOpacity={0.18} />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20h16" />
        <rect x="5.5" y="11" width="3" height="7" rx="1" fill={fill} fillOpacity={0.3} />
        <rect x="10.5" y="6" width="3" height="12" rx="1" fill={fill} fillOpacity={0.3} />
        <rect x="15.5" y="9" width="3" height="9" rx="1" fill={fill} fillOpacity={0.3} />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8.5" r="3.5" fill={fill} fillOpacity={0.18} />
        <path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 20a6 6 0 0 0-2.5-4.9" />
      </>
    ),
    tasks: (
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" fill={fill} fillOpacity={0.18} />
        <path d="M3.5 9h17M8 3v3M16 3v3M8 13h3M8 16.5h6" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill={fill} fillOpacity={0.18} />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    more: (
      <>
        <circle cx="5.5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="18.5" cy="12" r="1.6" fill="currentColor" />
      </>
    ),
  };
  return <svg {...p}>{paths[name]}</svg>;
}

const isActive = (pathname: string, href: string, exact?: boolean) =>
  pathname === href || (!exact && pathname.startsWith(`${href}/`));

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2"
    >
      {/* Faol belgisi: tepada oltin nuqta */}
      <span
        aria-hidden
        className={`absolute top-0 h-1 rounded-full transition-all duration-300 ${active ? "w-5 opacity-100" : "w-0 opacity-0"}`}
        style={{ backgroundColor: "#F1A93B", boxShadow: "0 0 10px #F1A93B" }}
      />
      <span className="relative grid size-9 place-items-center">
        {/* Olti burchakli yashil fon (logodagi kabi) */}
        <span
          aria-hidden
          className={`absolute inset-0 transition duration-300 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          style={{ clipPath: HEX, background: "linear-gradient(150deg, #14a67a, #046b4e)" }}
        />
        <span className={`relative transition duration-200 ${active ? "text-white" : "text-neutral-500 group-active:scale-90 group-hover:text-neutral-300"}`}>
          <Icon name={item.icon} active={active} />
        </span>
      </span>
      <span className={`max-w-full truncate px-0.5 text-[10.5px] leading-tight transition ${active ? "font-bold" : "font-medium text-neutral-500"}`} style={active ? { color: "#F5C76A" } : undefined}>
        {item.label}
      </span>
    </Link>
  );
}

export function BottomNav({
  items,
  center,
  more,
  moreLabel = "More",
}: {
  /** 4 ta oddiy tugma (2 tasi chapda, 2 tasi o'ngda). Ko'proq bo'lsa — "more" ishlating. */
  items: NavItem[];
  /** O'rtadagi katta oltin tugma. */
  center: NavItem;
  /** Qo'shimcha bo'limlar: "Yana" tugmasi ochadigan ro'yxat (4-o'rindagi tugma o'rniga). */
  more?: { href: string; label: string; exact?: boolean }[];
  moreLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const left = items.slice(0, 2);
  const right = items.slice(2, more ? 3 : 4);
  const centerActive = isActive(pathname, center.href, center.exact);
  const moreActive = !!more?.some((m) => isActive(pathname, m.href, m.exact));

  return (
    <>
      {/* Menyu ostida kontent qolib ketmasligi uchun joy */}
      <div aria-hidden className="h-24 sm:hidden" />

      {more && open ? (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div
            className="bottom-sheet absolute inset-x-3 bottom-[96px] rounded-3xl border border-white/10 p-2 shadow-2xl"
            style={{ background: "rgb(14 28 23 / 0.97)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {more.map((m) => {
              const a = isActive(pathname, m.href, m.exact);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] ${a ? "bg-brand-700/40 font-semibold" : "hover:bg-white/5"}`}
                  style={a ? { color: "#F5C76A" } : undefined}
                >
                  {m.label}
                  <span className="text-neutral-500">›</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Main"
        className="fixed inset-x-3 z-50 sm:hidden"
        style={{ bottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div
          className="relative flex items-end rounded-[26px] border border-white/10 px-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          style={{ background: "linear-gradient(180deg, rgb(20 38 31 / 0.92), rgb(10 22 18 / 0.96))" }}
        >
          {/* Tepadagi oltin chiziq */}
          <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgb(241 169 59 / 0.6), transparent)" }} />

          {left.map((it) => (
            <Tab key={it.href} item={it} active={isActive(pathname, it.href, it.exact)} />
          ))}

          {/* O'rtadagi oltin olti burchak */}
          <Link href={center.href} aria-current={centerActive ? "page" : undefined} className="group relative flex flex-1 flex-col items-center pb-1.5">
            <span className="relative -mt-7 grid size-[60px] place-items-center">
              <span aria-hidden className="center-glow absolute inset-[-6px]" style={{ clipPath: HEX, background: "rgb(241 169 59 / 0.25)" }} />
              <span aria-hidden className="absolute inset-0" style={{ clipPath: HEX, background: "linear-gradient(150deg, #f5c76a, #f1a93b 55%, #c9822a)" }} />
              <span aria-hidden className="absolute inset-[3px]" style={{ clipPath: HEX, background: centerActive ? "linear-gradient(150deg, #14a67a, #046b4e)" : "linear-gradient(150deg, #f7d488, #f1a93b)" }} />
              <span className={`relative transition group-active:scale-90 ${centerActive ? "text-[#F5C76A]" : "text-[#1d1608]"}`}>
                <Icon name={center.icon} active />
              </span>
            </span>
            <span className="mt-0.5 text-[10.5px] font-bold" style={{ color: "#F5C76A" }}>
              {center.label}
            </span>
          </Link>

          {right.map((it) => (
            <Tab key={it.href} item={it} active={isActive(pathname, it.href, it.exact)} />
          ))}

          {more ? (
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2">
              <span
                aria-hidden
                className={`absolute top-0 h-1 rounded-full transition-all duration-300 ${moreActive || open ? "w-5 opacity-100" : "w-0 opacity-0"}`}
                style={{ backgroundColor: "#F1A93B", boxShadow: "0 0 10px #F1A93B" }}
              />
              <span className="relative grid size-9 place-items-center">
                <span
                  aria-hidden
                  className={`absolute inset-0 transition duration-300 ${moreActive || open ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  style={{ clipPath: HEX, background: "linear-gradient(150deg, #14a67a, #046b4e)" }}
                />
                <span className={`relative ${moreActive || open ? "text-white" : "text-neutral-500"}`}>
                  <Icon name="more" active={moreActive} />
                </span>
              </span>
              <span className={`text-[10.5px] leading-tight ${moreActive || open ? "font-bold" : "font-medium text-neutral-500"}`} style={moreActive || open ? { color: "#F5C76A" } : undefined}>
                {moreLabel}
              </span>
            </button>
          ) : null}
        </div>
      </nav>
    </>
  );
}
