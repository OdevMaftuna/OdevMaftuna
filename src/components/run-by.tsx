/** "Run by Maftuna Ismoilova" — markaz rahbarining imzosi (har bir sahifa pastida va kirish sahifasida). */

export const OWNER_NAME = "Maftuna Ismoilova";

/**
 * Imzo kartochkasi: aylanib turuvchi oltin halqali "MI" avatari, "Run by", ism va lavozim.
 * `compact` — kichik variant (bitta qator).
 */
export function RunBy({ compact = false, className = "" }: { tone?: "dark" | "light"; compact?: boolean; className?: string }) {
  return (
    <div lang="en" className={`owner-card group relative inline-flex items-center gap-3 rounded-2xl ${compact ? "py-1.5 pl-1.5 pr-4" : "p-2.5 pr-5"} ${className}`}>
      <span aria-hidden className={`owner-ring relative grid shrink-0 place-items-center rounded-full ${compact ? "size-9" : "size-12"}`}>
        <span
          className={`grid place-items-center rounded-full font-bold tracking-wide ${compact ? "size-[30px] text-[11px]" : "size-[42px] text-sm"}`}
          style={{ backgroundColor: "#1d1608", color: "#F5C76A" }}
        >
          MI
        </span>
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Run by</span>
        <span className={`block font-bold ${compact ? "text-sm" : "text-[15px]"}`} style={{ color: "#F5C76A" }}>
          {OWNER_NAME}
        </span>
        {compact ? null : <span className="mt-0.5 block text-xs text-white/60">English teacher · NSP Language Center</span>}
      </span>
      <span
        aria-hidden
        className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full text-[10px] transition group-hover:rotate-45"
        style={{ backgroundColor: "#F1A93B", color: "#1d1608" }}
      >
        ✦
      </span>
    </div>
  );
}

/** Sahifalar pastidagi imzo: bezakli chiziq orasida imzo kartochkasi. */
export function SiteFooter({ width = "max-w-5xl" }: { width?: string }) {
  return (
    <footer className={`mx-auto w-full ${width} px-4 pb-8 pt-4`}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgb(241 169 59 / 0.45))" }} />
        <RunBy />
        <span aria-hidden className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgb(241 169 59 / 0.45), transparent)" }} />
      </div>
      <p lang="en" className="mt-3 text-center text-[11px] text-neutral-500">© NSP Language Center · Learn English with confidence</p>
    </footer>
  );
}
