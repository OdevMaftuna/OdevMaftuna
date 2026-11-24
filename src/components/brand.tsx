import { useId } from "react";

/**
 * NSP brendi: logo (vektor) va yozuv.
 * Ranglar logodan olingan: yashil #046B4E, to'q sariq #F1A93B.
 */

type Tone = "color" | "light";

/**
 * Olti burchakli logo.
 *  - `color` — oq fon ustida: yashil olti burchak, oq kitob.
 *  - `light` — to'q yashil fon ustida: yashil gradientli olti burchak, oltin hoshiya, oq kitob.
 *    Ochiq (oq) katta yuza yo'q — telefonlarning "majburiy tungi rejimi" uni xiralashtirmaydi.
 */
export function LogoMark({
  size = 40,
  tone = "color",
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const light = tone === "light";
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="NSP logotipi"
    >
      {light ? (
        <defs>
          <linearGradient id={`${id}-hex`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14A67A" />
            <stop offset="100%" stopColor="#035A41" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d="M320 64 548 196v248L320 576 92 444V196Z"
        fill={light ? `url(#${id}-hex)` : "#046B4E"}
        stroke={light ? "#F1A93B" : "#046B4E"}
        strokeWidth={light ? 40 : 64}
        strokeLinejoin="round"
      />
      <circle cx="320" cy="217" r="37" fill="#F5C76A" />
      <path d="M163 266c58-3 108 10 145 34v162c-37-25-87-40-145-42Z" fill="#FFFFFF" />
      <path d="M477 266c-58-3-108 10-145 34v162c37-25 87-40 145-42Z" fill="#FFFFFF" />
    </svg>
  );
}

/** Logo + "NSP" yozuvi + ixtiyoriy kichik izoh (masalan "Language Center"). */
export function Brand({
  size = 40,
  tone = "color",
  subtitle,
  className = "",
}: {
  size?: number;
  tone?: Tone;
  subtitle?: string;
  className?: string;
}) {
  const light = tone === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-bold tracking-tight ${light ? "text-white" : "text-brand-800"}`}
          style={{ fontSize: Math.round(size * 0.48) }}
        >
          NSP
        </span>
        {subtitle ? (
          <span
            className={`mt-1 text-[11px] font-medium uppercase tracking-[0.14em] ${
              light ? "text-white/70" : "text-neutral-500"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
