import Link from "next/link";

/**
 * Kurs bo'yicha filtr: "Hammasi | Beginner | Elementary | ...".
 * Tanlov URL'da `?kurs=<id>` bo'lib turadi (sahifani yangilasa ham saqlanadi).
 */
export function CourseTabs({
  basePath,
  courses,
  selectedId,
  counts,
  total,
  extraQuery,
}: {
  basePath: string;
  courses: { id: string; name: string }[];
  selectedId: string | null;
  /** Ixtiyoriy: har bir kurs yonida son (masalan vazifalar soni). */
  counts?: Record<string, number>;
  /** "Hammasi" yonidagi son (kursi yo'qlar ham kiradi). Berilmasa — kurslar yig'indisi. */
  total?: number;
  /** Ixtiyoriy: har havolaga qo'shiladigan boshqa filtrlar (masalan "guruh=men"). */
  extraQuery?: string;
}) {
  const items = [
    { id: null as string | null, name: "Hammasi" },
    ...courses.map((c) => ({ id: c.id as string | null, name: c.name })),
  ];
  const allCount = total ?? (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null);

  return (
    <nav aria-label="Kurslar" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((item) => {
        const active = item.id === selectedId;
        const count = item.id === null ? allCount : (counts?.[item.id] ?? null);
        return (
          <Link
            key={item.id ?? "all"}
            href={(() => {
              const qs = [item.id ? `kurs=${item.id}` : "", extraQuery ?? ""].filter(Boolean).join("&");
              return qs ? `${basePath}?${qs}` : basePath;
            })()}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
              active
                ? "border-brand-600 bg-brand-700 text-white"
                : "border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300 hover:text-brand-800"
            }`}
          >
            {item.name}
            {count !== null ? (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
