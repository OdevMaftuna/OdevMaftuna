/**
 * Hisobot grafiklari (server tomonda chiziladigan SVG/HTML, kutubxonasiz).
 * Ranglar: bitta seriya — ko'k; holatlar — status ranglari (yashil/sariq/qizil), doim yozuv bilan.
 * Har bir nuqta/ustun/katakchada sichqoncha bilan ko'rinadigan izoh (<title>) bor.
 */

export const VIZ = {
  series: "#3987E5",
  grid: "#2C2C2A",
  axis: "#383835",
  muted: "#898781",
  good: "#0CA30C",
  warning: "#FAB219",
  critical: "#D03B3B",
  neutral: "#2A332F",
};

const fmt = (v: number | null, digits = 0) => (v === null ? "—" : `${v.toFixed(digits)}%`);
const shortDay = (d: string) => `${Number(d.slice(8, 10))}.${d.slice(5, 7)}`;

/** Kunlar bo'yicha o'rtacha ball (0–100%) — chiziqli grafik. */
export function LineChart({ points, label }: { points: { day: string; value: number | null }[]; label: string }) {
  const W = 640, H = 200, L = 36, R = 12, T = 14, B = 26;
  const iw = W - L - R, ih = H - T - B;
  const x = (i: number) => L + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => T + ih - (v / 100) * ih;
  const valid = points.map((p, i) => ({ ...p, i })).filter((p) => p.value !== null) as { day: string; value: number; i: number }[];
  const path = valid.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const step = Math.max(1, Math.ceil(points.length / 8));
  const last = valid.at(-1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? VIZ.axis : VIZ.grid} strokeWidth="1" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={VIZ.muted} className="tabular-nums">
            {v}%
          </text>
        </g>
      ))}
      {points.map((p, i) =>
        i % step === 0 || i === points.length - 1 ? (
          <text key={p.day + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={VIZ.muted} className="tabular-nums">
            {shortDay(p.day)}
          </text>
        ) : null,
      )}
      {path ? <path d={path} fill="none" stroke={VIZ.series} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {valid.map((p) => (
        <g key={p.i}>
          <circle cx={x(p.i)} cy={y(p.value)} r={p === last ? 5 : 4} fill={VIZ.series} stroke="#1A1A19" strokeWidth="2" />
          {/* katta, ko'rinmas nishon — sichqoncha osonroq tegadi */}
          <circle cx={x(p.i)} cy={y(p.value)} r="12" fill="transparent">
            <title>{`${shortDay(p.day)} — o‘rtacha ${fmt(p.value)}`}</title>
          </circle>
        </g>
      ))}
      {last ? (
        <text x={Math.min(x(last.i) + 8, W - R - 30)} y={y(last.value) - 10} fontSize="12" fontWeight="600" fill="#F0EFEC" className="tabular-nums">
          {fmt(last.value)}
        </text>
      ) : null}
    </svg>
  );
}

/** Kunlar bo'yicha topshirganlar ulushi — ustunli grafik. */
export function ColumnChart({ points, label }: { points: { day: string; value: number | null; note?: string }[]; label: string }) {
  const W = 640, H = 170, L = 36, R = 12, T = 10, B = 26;
  const iw = W - L - R, ih = H - T - B;
  const n = Math.max(1, points.length);
  const slot = iw / n;
  const bw = Math.max(3, Math.min(22, slot - 2));
  const y = (v: number) => T + ih - (v / 100) * ih;
  const step = Math.max(1, Math.ceil(points.length / 8));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? VIZ.axis : VIZ.grid} strokeWidth="1" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={VIZ.muted}>
            {v}%
          </text>
        </g>
      ))}
      {points.map((p, i) => {
        const cx = L + slot * i + slot / 2;
        const v = p.value;
        const h = v === null ? 0 : Math.max(2, (v / 100) * ih);
        return (
          <g key={p.day + i}>
            {v !== null ? (
              <path
                d={`M${cx - bw / 2} ${T + ih} V${T + ih - h + 4} q0 -4 4 -4 H${cx + bw / 2 - 4} q4 0 4 4 V${T + ih} Z`}
                fill={v >= 80 ? VIZ.good : v >= 50 ? VIZ.warning : VIZ.critical}
              />
            ) : null}
            <rect x={L + slot * i} y={T} width={slot} height={ih} fill="transparent">
              <title>{`${shortDay(p.day)} — ${v === null ? "muddati hali kelmagan" : `${fmt(v)} topshirdi`}${p.note ? ` (${p.note})` : ""}`}</title>
            </rect>
            {i % step === 0 || i === points.length - 1 ? (
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={VIZ.muted}>
                {shortDay(p.day)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** Reyting: har bir o'quvchi — gorizontal chiziq (0–100%). */
export function RankBars({ rows }: { rows: { id: string; name: string; value: number | null; sub: string }[] }) {
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.id} className="grid grid-cols-[28px_minmax(0,9rem)_1fr_52px] items-center gap-2 text-sm sm:grid-cols-[28px_minmax(0,12rem)_1fr_56px]">
          <span className="text-center font-semibold tabular-nums" style={{ color: i < 3 ? "#F5C76A" : VIZ.muted }}>
            {i + 1}
          </span>
          <span className="min-w-0 truncate" title={r.sub}>
            {r.name}
          </span>
          <span className="relative h-3 overflow-hidden rounded-full" style={{ background: VIZ.grid }} title={`${r.name}: ${fmt(r.value)} · ${r.sub}`}>
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, r.value ?? 0))}%`, background: VIZ.series }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{fmt(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Donut (pie) diagramma: butunning qismlari. Markazda jami, yonida izoh (rang + nom + son + %). */
export function DonutChart({
  parts,
  centerLabel,
  label,
}: {
  parts: { key: string; label: string; value: number; color: string }[];
  centerLabel: string;
  label: string;
}) {
  const total = parts.reduce((t, p) => t + p.value, 0);
  const R = 70, r = 46, C = 90;
  const gap = total > 0 && parts.filter((p) => p.value > 0).length > 1 ? 0.025 : 0; // segmentlar orasida ingichka bo'shliq
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((t, q) => t + q.value, 0));
  const arcs = parts.map((p, i) => {
    const sweep = total ? (p.value / total) * Math.PI * 2 : 0;
    const base = -Math.PI / 2 + (total ? (starts[i] / total) * Math.PI * 2 : 0);
    const a0 = base + gap / 2;
    const a1 = base + sweep - gap / 2;
    if (p.value <= 0 || a1 <= a0) return { ...p, d: "" };
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const pt = (rad: number, ang: number) => `${(C + rad * Math.cos(ang)).toFixed(2)} ${(C + rad * Math.sin(ang)).toFixed(2)}`;
    const full = sweep >= Math.PI * 2 - 0.001;
    const d = full
      ? `M${C - R} ${C}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${C - r} ${C}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`
      : `M${pt(R, a0)}A${R} ${R} 0 ${big} 1 ${pt(R, a1)}L${pt(r, a1)}A${r} ${r} 0 ${big} 0 ${pt(r, a0)}Z`;
    return { ...p, d };
  });
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={label} className="shrink-0">
        <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke={VIZ.grid} strokeWidth={R - r} />
        {arcs.map((a) =>
          a.d ? (
            <path key={a.key} d={a.d} fill={a.color} fillRule="evenodd" className="donut-seg">
              <title>{`${a.label}: ${a.value} (${total ? Math.round((a.value / total) * 100) : 0}%)`}</title>
            </path>
          ) : null,
        )}
        <text x={C} y={C + 2} textAnchor="middle" fontSize="28" fontWeight="700" fill="#F0EFEC">
          {total}
        </text>
        <text x={C} y={C + 22} textAnchor="middle" fontSize="11" fill={VIZ.muted}>
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="min-w-0 flex-1">{p.label}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
            <span className="w-11 text-right text-xs tabular-nums text-neutral-500">{total ? Math.round((p.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ustunli grafik: toifalar bo'yicha son (masalan, ball oraliqlari). Har ustun tepasida qiymati. */
export function BarChart({ bars, label }: { bars: { key: string; label: string; value: number; color?: string; note?: string }[]; label: string }) {
  const W = 640, H = 220, L = 12, R = 12, T = 26, B = 40;
  const iw = W - L - R, ih = H - T - B;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const slot = iw / Math.max(1, bars.length);
  const bw = Math.min(72, slot * 0.62);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      <line x1={L} x2={W - R} y1={T + ih} y2={T + ih} stroke={VIZ.axis} strokeWidth="1" />
      {bars.map((b, i) => {
        const cx = L + slot * i + slot / 2;
        const h = b.value ? Math.max(4, (b.value / max) * ih) : 0;
        const y0 = T + ih - h;
        return (
          <g key={b.key}>
            {h ? (
              <path
                className="bar-grow"
                style={{ animationDelay: `${i * 70}ms` }}
                d={`M${cx - bw / 2} ${T + ih} V${y0 + 6} q0 -6 6 -6 H${cx + bw / 2 - 6} q6 0 6 6 V${T + ih} Z`}
                fill={b.color ?? VIZ.series}
              />
            ) : null}
            <text x={cx} y={y0 - 8} textAnchor="middle" fontSize="14" fontWeight="700" fill="#F0EFEC" className="tabular-nums">
              {b.value}
            </text>
            <text x={cx} y={H - 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#C3C2B7">
              {b.label}
            </text>
            {b.note ? (
              <text x={cx} y={H - 5} textAnchor="middle" fontSize="10.5" fill={VIZ.muted}>
                {b.note}
              </text>
            ) : null}
            <rect x={L + slot * i} y={T} width={slot} height={ih} fill="transparent">
              <title>{`${b.label}${b.note ? ` (${b.note})` : ""}: ${b.value}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/** Har bir o'quvchi uchun tayoqcha: o'z vaqtida / kech / qoldirgan — bitta ustunda ketma-ket. */
export function StackedBars({
  rows,
}: {
  rows: { id: string; name: string; parts: { key: string; label: string; value: number; color: string }[] }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.parts.reduce((t, p) => t + p.value, 0)));
  return (
    <ol className="space-y-2.5">
      {rows.map((r) => {
        const total = r.parts.reduce((t, p) => t + p.value, 0);
        return (
          <li key={r.id} className="grid grid-cols-[minmax(0,8rem)_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,11rem)_1fr_3rem]">
            <span className="min-w-0 truncate">{r.name}</span>
            <span className="flex h-4 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
              {r.parts.map((p) =>
                p.value ? (
                  <span
                    key={p.key}
                    className="bar-grow-x h-full first:rounded-l-md last:rounded-r-md"
                    style={{ flexGrow: p.value, flexBasis: 0, background: p.color }}
                    title={`${r.name} · ${p.label}: ${p.value}`}
                  />
                ) : null,
              )}
            </span>
            <span className="text-right text-xs tabular-nums text-neutral-500">{total}</span>
          </li>
        );
      })}
    </ol>
  );
}

const CELL: Record<string, { color: string; label: string }> = {
  ontime: { color: VIZ.good, label: "O‘z vaqtida" },
  late: { color: VIZ.warning, label: "Kech" },
  missed: { color: VIZ.critical, label: "Topshirmagan" },
  open: { color: "#3A4A43", label: "Ochiq (hali vaqt bor)" },
  upcoming: { color: VIZ.neutral, label: "Hali ochilmagan" },
  before: { color: "transparent", label: "Kursga qo‘shilishidan oldin" },
};

/** Davomat jadvali: qatorda o'quvchi, ustunda kun; rang — holat (pastda izoh). */
export function AttendanceGrid({
  students,
  days,
}: {
  students: { id: string; name: string; cells: { state: string; pct: number | null }[] }[];
  days: string[];
}) {
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <table className="border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-[1] bg-surface pr-2 text-left text-xs font-medium text-neutral-500">O‘quvchi</th>
              {days.map((d, i) => (
                <th key={d + i} className="w-5 text-center text-[10px] font-normal tabular-nums text-neutral-500">
                  {i % 2 === 0 ? Number(d.slice(8, 10)) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="sticky left-0 z-[1] max-w-36 truncate bg-surface pr-2 text-sm">{s.name}</td>
                {s.cells.map((c, i) => {
                  const meta = CELL[c.state];
                  return (
                    <td key={i} className="p-0">
                      <span
                        className="block size-5 rounded"
                        style={{ background: meta.color, border: c.state === "before" ? `1px dashed ${VIZ.axis}` : undefined }}
                        title={`${s.name} · ${shortDay(days[i])} — ${meta.label}${c.pct !== null ? `, ${Math.round(c.pct)}%` : ""}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
        {Object.entries(CELL).map(([k, v]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm" style={{ background: v.color, border: k === "before" ? `1px dashed ${VIZ.axis}` : undefined }} />
            {v.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
