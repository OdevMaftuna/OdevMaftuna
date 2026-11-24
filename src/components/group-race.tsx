import type { CSSProperties } from "react";
import type { League, LeagueRow } from "@/lib/group-league";

/**
 * O'quvchi bosh sahifasi: "Guruh poygasi" — guruhdoshlar reytingi poyga ko'rinishida.
 * Tepada shohsupa (top-3), o'rtada "siz" uchun maqsad, pastda har bir o'quvchi o'z yo'lagida marraga (100%) chopadi.
 */

const MEDAL = ["🥇", "🥈", "🥉"];
const LANE = ["#f5c76a", "#cfd8dc", "#e0985a", "#3ddc97", "#5ab0ff", "#b388ff", "#ff7a9a", "#ffb347"];

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
const short = (n: string) => {
  const [a, b] = n.split(/\s+/);
  return b ? `${a} ${b[0]}.` : a;
};

function Face({ r, size, ring }: { r: LeagueRow; size: number; ring: string }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-black text-[#10201a]"
      style={{ width: size, height: size, fontSize: size * 0.36, background: ring, boxShadow: `0 0 0 2px ${ring}, 0 6px 18px -6px ${ring}` }}
    >
      {r.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.avatar} alt="" className="size-full object-cover" style={{ maxWidth: "none" }} />
      ) : (
        initials(r.name)
      )}
    </span>
  );
}

function Move({ v }: { v: number }) {
  if (!v) return null;
  return (
    <span className={`text-[11px] font-black tabular-nums ${v > 0 ? "text-[#3ddc97]" : "text-[#ff8a8a]"}`} title="Bir hafta oldingiga nisbatan">
      {v > 0 ? `▲${v}` : `▼${-v}`}
    </span>
  );
}

function Podium({ rows }: { rows: LeagueRow[] }) {
  // Tartib: 2 · 1 · 3 (klassik shohsupa).
  const order = [rows[1], rows[0], rows[2]];
  const H = [64, 92, 48];
  const idx = [1, 0, 2];
  return (
    <div className="mt-4 grid grid-cols-3 items-end gap-2">
      {order.map((r, k) =>
        r ? (
          <div key={r.id} className="flex flex-col items-center gap-1.5 stagger" style={{ "--i": k } as CSSProperties}>
            {idx[k] === 0 ? <span className="text-xl leading-none [animation:float_3s_ease-in-out_infinite]">👑</span> : null}
            <Face r={r} size={idx[k] === 0 ? 58 : 46} ring={LANE[idx[k]]} />
            <span className={`max-w-full truncate text-center text-[12px] font-bold ${r.me ? "text-[#f5c76a]" : "text-white"}`}>{r.me ? "Siz" : short(r.name)}</span>
            <div
              className="relative flex w-full flex-col items-center justify-start rounded-t-2xl pt-2 [animation:bar-grow_.9s_cubic-bezier(.2,.9,.3,1.2)_both] origin-bottom"
              style={{ height: H[k], background: `linear-gradient(180deg, ${LANE[idx[k]]}55, ${LANE[idx[k]]}12)`, borderTop: `2px solid ${LANE[idx[k]]}` }}
            >
              <span className="text-lg leading-none">{MEDAL[idx[k]]}</span>
              <span className="mt-0.5 text-[15px] font-black tabular-nums text-white">{r.rating}%</span>
            </div>
          </div>
        ) : (
          <div key={k} />
        ),
      )}
    </div>
  );
}

function Goal({ rows }: { rows: LeagueRow[] }) {
  const i = rows.findIndex((r) => r.me);
  if (i < 0) return null;
  const me = rows[i];
  let text: string;
  if (me.due === 0) text = "Poyga birinchi vazifangiz muddati tugagach boshlanadi — tayyorlaning! 🚦";
  else if (i === 0) text = rows.length > 1 ? `Siz yetakchisiz! 2-o‘rindan ${me.rating - rows[1].rating}% oldindasiz — tezlikni tushirmang 🔥` : "Siz yetakchisiz! 🔥";
  else if (me.done === 0) text = `Siz hali start chizig‘idasiz. Birinchi vazifani topshiring — bir zumda ${Math.max(1, i - rows.filter((r) => r.done > 0).length)} ta o‘rin yuqoriga chiqasiz! 🚀`;
  else {
    const gap = rows[i - 1].rating - me.rating;
    text = gap <= 0
      ? `Siz ${i + 1}-o‘rindasiz va ${i}-o‘rin bilan tengsiz — bitta a’lo vazifa sizni oldinga chiqaradi! 🚀`
      : `Siz ${i + 1}-o‘rindasiz. ${i}-o‘ringa atigi ${gap}% qoldi — keyingi vazifani a’lo topshiring va o‘zib keting! 🚀`;
  }
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#f5c76a]/40 bg-[#f5c76a]/10 px-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5c76a] text-[15px] font-black text-[#1d1608]">{i + 1}</span>
      <p className="text-[13px] font-semibold leading-snug text-white">{text}</p>
    </div>
  );
}

/** Ko'p kishilik guruhda: top-5 va "siz" atrofidagilar ochiq, qolgani "Hammasini ko'rish" ichida. */
function Track({ rows }: { rows: LeagueRow[] }) {
  if (rows.length <= 7) return <Lanes rows={rows} from={0} />;
  const me = rows.findIndex((r) => r.me);
  const near = me >= 5 ? [Math.max(5, me - 1), Math.min(rows.length, me + 2)] : null;
  return (
    <>
      <Lanes rows={rows.slice(0, 5)} from={0} />
      {near ? (
        <>
          <p className="my-1 text-center text-white/30">⋯</p>
          <Lanes rows={rows.slice(near[0], near[1])} from={near[0]} />
        </>
      ) : null}
      <details className="group mt-3">
        <summary className="cursor-pointer list-none rounded-full bg-white/[0.06] py-2 text-center text-[12.5px] font-bold text-white/75 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Hammasini ko‘rish ({rows.length}) ▾</span>
          <span className="hidden group-open:inline">Yopish ▴</span>
        </summary>
        <Lanes rows={rows} from={0} />
      </details>
    </>
  );
}

function Lanes({ rows, from }: { rows: LeagueRow[]; from: number }) {
  return (
    <ol className="mt-4 space-y-2.5">
      {rows.map((r, k) => {
        const i = from + k;
        const color = r.me ? "#f5c76a" : LANE[Math.min(i, LANE.length - 1)];
        const pos = Math.max(0, Math.min(100, r.rating));
        return (
          <li key={r.id} className={`rounded-2xl px-2.5 py-2 ${r.me ? "bg-[#f5c76a]/10 ring-1 ring-[#f5c76a]/50" : "bg-white/[0.03]"}`}>
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="w-5 text-center font-black tabular-nums text-white/50">{i + 1}</span>
              <span className={`min-w-0 flex-1 truncate font-bold ${r.me ? "text-[#f5c76a]" : "text-white"}`}>
                {r.name}
                {r.me ? <span className="ml-1.5 rounded-full bg-[#f5c76a] px-1.5 py-px text-[10px] font-black text-[#1d1608]">SIZ</span> : null}
              </span>
              <Move v={r.move} />
              <span className="w-10 text-right font-black tabular-nums text-white">{r.rating}%</span>
            </div>
            {/* Yo'lak: start → marra */}
            <div className="relative ml-7 mt-2 h-7">
              <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-white/[0.07]" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 [background:repeating-linear-gradient(90deg,rgba(255,255,255,.25)_0_6px,transparent_6px_12px)]" />
              <div
                className="absolute left-0 top-1/2 h-[6px] origin-left -translate-y-1/2 rounded-full [animation:bar-grow-x_1.1s_cubic-bezier(.2,.9,.3,1)_both]"
                style={{ width: `${pos}%`, background: `linear-gradient(90deg, ${color}22, ${color})`, animationDelay: `${i * 70}ms` }}
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[15px]" aria-hidden>
                🏁
              </span>
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
                style={{ left: `clamp(13px, ${pos}%, calc(100% - 22px))` }}
              >
                <Face r={r} size={26} ring={color} />
              </span>
              {r.due > 0 && r.done === 0 ? (
                <span className="absolute left-9 top-1/2 -translate-y-1/2 rounded-full bg-[#121a17] px-2 py-0.5 text-[10.5px] font-semibold text-white/55 ring-1 ring-white/10">🚦 start chizig‘ida</span>
              ) : null}
            </div>
            <p className="ml-7 mt-0.5 text-[10.5px] text-white/40">
              {r.due ? `${r.done}/${r.due} vazifa topshirilgan` : "hali vazifa yo‘q"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function GroupRace({ leagues }: { leagues: League[] }) {
  return (
    <>
      {leagues.map((l) => (
        <section
          key={l.groupId}
          className="relative overflow-clip rounded-[24px] border border-white/10 p-4"
          style={{ background: "radial-gradient(120% 70% at 50% 0%, #1d3a24 0%, #121a17 55%, #0d1310 100%)" }}
        >
          <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-[#f5c76a] opacity-[0.12] blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#7ddc5a]">🏁 GURUH POYGASI</p>
              <h2 className="truncate text-[18px] font-black text-white">{l.groupName}</h2>
              <p className="text-[11.5px] text-white/55">Oxirgi 30 kun · {l.tasks} ta vazifa · topshirilmagan vazifa 0%</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-bold text-white/70">{l.rows.length} ishtirokchi</span>
          </div>
          {l.tasks === 0 ? (
            <p className="relative mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-[13px] text-white/60">
              Poyga birinchi vazifa muddati tugagach boshlanadi. Hamma start chizig‘ida — kim birinchi bo‘ladi? 🚦
            </p>
          ) : (
            <div className="relative">
              {l.rows.length >= 3 ? <Podium rows={l.rows} /> : null}
              <Goal rows={l.rows} />
              <Track rows={l.rows} />
              {l.rows.some((r) => r.move) ? <p className="mt-3 text-center text-[11px] text-white/40">▲▼ — bir hafta oldingiga nisbatan o‘rin o‘zgarishi</p> : null}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
