import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ColumnChart, LineChart } from "@/components/charts";
import { summarize, type loadDirectorExtras, type GroupOverview, type GroupStudent, type Level } from "@/lib/group-overview";


/**
 * SUPPORT MARKAZI: butun guruh natijalari bitta joyda.
 *  - kim bajarmagan, kim bilan shug'ullanish kerak (sabablari bilan, chat/natija tugmalari);
 *  - guruhlar (o'qituvchilar) va kurslar bo'yicha solishtirish, trend, davomat xaritasi, yulduzlar;
 *  - asosiy o'qituvchi uchun qo'shimcha "Direktor paneli": tushum, yangi o'quvchilar, o'qituvchilar reytingi.
 */

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v)}%`);
const LEVEL: Record<Level, { label: string; cls: string; dot: string }> = {
  urgent: { label: "Shoshilinch", cls: "bg-[#D03B3B]/15 text-[#ff8a8a] border-[#D03B3B]/40", dot: "#ff5a5a" },
  watch: { label: "Kuzatish", cls: "bg-[#FAB219]/15 text-[#FAB219] border-[#FAB219]/40", dot: "#FAB219" },
  ok: { label: "Yaxshi", cls: "bg-[#0CA30C]/15 text-[#4fd14f] border-[#0CA30C]/40", dot: "#4fd14f" },
};

function Delta({ v, suffix = "%" }: { v: number | null; suffix?: string }) {
  if (v === null || Math.round(v) === 0) return null;
  const up = v > 0;
  return (
    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-black ${up ? "bg-[#3ddc97]/15 text-[#3ddc97]" : "bg-[#ff6a8a]/15 text-[#ff8aa3]"}`}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(v))}
      {suffix}
    </span>
  );
}

function Kpi({ icon, label, value, note, delta, accent, i }: { icon: string; label: string; value: string; note: string; delta?: ReactNode; accent: string; i: number }) {
  return (
    <div className="sp-rise relative overflow-clip rounded-[22px] border border-white/[0.07] bg-[#121a17] p-4" style={{ animationDelay: `${i * 70}ms` }}>
      <span aria-hidden className="absolute -right-6 -top-6 size-20 rounded-full opacity-30 blur-2xl" style={{ background: accent }} />
      <p className="relative flex items-center gap-1.5 text-xs font-semibold text-[#a3ada8]">
        <span className="text-base">{icon}</span> {label}
      </p>
      <p className="relative mt-1.5 text-3xl font-black tabular-nums text-white">
        {value}
        {delta}
      </p>
      <p className="relative mt-0.5 text-[11px] text-[#808a85]">{note}</p>
    </div>
  );
}

function Panel({ title, hint, children, right }: { title: ReactNode; hint?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/[0.07] bg-[#101714] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-black tracking-tight text-white">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-[#808a85]">{hint}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Avatar({ s, size = 40 }: { s: GroupStudent; size?: number }) {
  const ring = LEVEL[s.level].dot;
  return s.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={s.avatar} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${ring}` }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-[#1d2a24] font-black text-[#F5C76A]" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${ring}`, fontSize: size * 0.4 }}>
      {(s.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active ? "border-[#F5C76A] bg-[#F5C76A] text-[#1d1608]" : "border-white/10 text-[#a3ada8] hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

/** Ikki qatorli progress: topshirish (oltin) va o'rtacha ball (yashil). */
function GroupBar({ name, sub, completion, avg, urgent, href }: { name: string; sub: string; completion: number | null; avg: number | null; urgent: number; href?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <b className="min-w-0 truncate text-sm text-white">{name}</b>
        <span className="shrink-0 text-[11px] text-[#808a85]">
          {sub}
          {urgent ? <span className="ml-1.5 rounded-full bg-[#D03B3B]/20 px-1.5 py-0.5 font-bold text-[#ff8a8a]">🚨 {urgent}</span> : null}
        </span>
      </div>
      {[
        ["Topshirish", completion, "linear-gradient(90deg,#f1a93b,#F5C76A)"],
        ["O‘rtacha ball", avg, "linear-gradient(90deg,#0f8a63,#3ddc97)"],
      ].map(([l, v, bg]) => (
        <div key={String(l)} className="mt-1.5 flex items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] text-[#808a85]">{String(l)}</span>
          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span className="sp-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(2, Number(v ?? 0))}%`, background: String(bg) } as CSSProperties} />
          </span>
          <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-white">{pct(v as number | null)}</span>
        </div>
      ))}
    </>
  );
  return href ? (
    <Link href={href} scroll={false} className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-[#F5C76A]/40">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">{body}</div>
  );
}

const ago = (days: number | null) => (days === null ? "hech qachon" : days === 0 ? "bugun" : days === 1 ? "kecha" : `${days} kun oldin`);
const money = (n: number) => `${n.toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;

export type SupportParams = { davr?: string; guruh?: string; kurs?: string; hammasi?: string };

/** Ko'rinish (ma'lumot tashqaridan beriladi). */
export function SupportView({ data, extras, isAdmin, sp }: { data: GroupOverview; extras: Awaited<ReturnType<typeof loadDirectorExtras>> | null; isAdmin: boolean; sp: SupportParams }) {
  const me = { isAdmin };
  const period = data.period;

  const guruh = sp.guruh ?? "all";
  const kurs = sp.kurs ?? "all";
  const list = data.students.filter(
    (s) => (guruh === "all" || (guruh === "none" ? !s.teacherId : s.teacherId === guruh)) && (kurs === "all" || s.courseId === kurs),
  );
  const t = summarize(list, data.days);
  const href = (p: Partial<{ davr: string; guruh: string; kurs: string; hammasi: string }>) => {
    const q = new URLSearchParams();
    const v = { davr: period, guruh, kurs, ...p };
    if (v.davr !== "hafta") q.set("davr", v.davr);
    if (v.guruh !== "all") q.set("guruh", v.guruh);
    if (v.kurs !== "all") q.set("kurs", v.kurs);
    if (p.hammasi) q.set("hammasi", p.hammasi);
    const s = q.toString();
    return `/oqituvchi/support${s ? `?${s}` : ""}`;
  };

  const needs = list.filter((s) => s.level !== "ok");
  const showAll = sp.hammasi === "1";
  const pendingToday = list.filter((s) => s.pendingToday).sort((a, b) => a.name.localeCompare(b.name));
  const stars = [...list]
    .filter((s) => s.due > 0 && s.avg !== null && s.avg >= 60)
    .sort((a, b) => b.submitted / b.due - a.submitted / a.due || (b.avg ?? 0) - (a.avg ?? 0) || b.streak - a.streak)
    .slice(0, 5);
  const groups = [
    ...data.teachers.map((tc) => ({ id: tc.id, name: tc.name, rows: data.students.filter((s) => s.teacherId === tc.id) })),
    { id: "none", name: "Guruhsiz", rows: data.students.filter((s) => !s.teacherId) },
  ].filter((g) => g.rows.length);
  const byCourse = data.courses.map((c) => ({ ...c, rows: list.filter((s) => s.courseId === c.id) })).filter((c) => c.rows.length);
  const heat = (showAll ? list : list.slice(0, 25)).filter((s) => s.due > 0 || s.level !== "ok");
  const rank = me.isAdmin
    ? groups
        .map((g) => ({ ...g, sum: summarize(g.rows, data.days) }))
        .sort((a, b) => (b.sum.completion ?? -1) - (a.sum.completion ?? -1) || (b.sum.avg ?? -1) - (a.sum.avg ?? -1))
    : [];

  return (
    <section className="space-y-5">
      {/* HERO */}
      <div className="sp-hero relative overflow-clip rounded-[28px] p-5 sm:p-6">
        <span aria-hidden className="sc-glow sc-glow-1" />
        <span aria-hidden className="sc-glow sc-glow-2" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#F5C76A]">🛟 SUPPORT MARKAZI{me.isAdmin ? " · ASOSIY O‘QITUVCHI" : ""}</p>
            <h1 className="mt-1 text-[28px] font-black leading-tight tracking-tight text-white sm:text-[34px]">Butun guruh natijalari</h1>
            <p className="text-sm text-[#a3ada8]">
              {data.label} · {t.students} ta o‘quvchi · kim bilan shug‘ullanish kerakligini darhol ko‘ring
            </p>
          </div>
          <div className="flex rounded-full border border-white/10 bg-black/30 p-1">
            <Chip href={href({ davr: "hafta" })} active={period === "hafta"}>
              Hafta
            </Chip>
            <Chip href={href({ davr: "oy" })} active={period === "oy"}>
              Oy
            </Chip>
          </div>
        </div>
        <div className="relative mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <Chip href={href({ guruh: "all" })} active={guruh === "all"}>
            👥 Hammasi
          </Chip>
          {data.teachers.map((tc) => (
            <Chip key={tc.id} href={href({ guruh: tc.id })} active={guruh === tc.id}>
              {tc.name}
            </Chip>
          ))}
          <Chip href={href({ guruh: "none" })} active={guruh === "none"}>
            Guruhsiz
          </Chip>
        </div>
        <div className="relative mt-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <Chip href={href({ kurs: "all" })} active={kurs === "all"}>
            📚 Barcha kurslar
          </Chip>
          {data.courses.map((c) => (
            <Chip key={c.id} href={href({ kurs: c.id })} active={kurs === c.id}>
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi i={0} icon="✅" label="Topshirish" value={pct(t.completion)} delta={<Delta v={t.completionDelta} />} note={`${t.done}/${t.due} ta vazifa topshirildi`} accent="#F5C76A" />
        <Kpi i={1} icon="🎯" label="O‘rtacha ball" value={pct(t.avg)} delta={<Delta v={t.avgDelta} />} note="topshirilgan ishlar bo‘yicha" accent="#3ddc97" />
        <Kpi i={2} icon="🔥" label="Bugun faol" value={`${t.activeToday}/${t.students}`} note={`${t.practice} ta mashq tekshiruvi`} accent="#ff7a5a" />
        <Kpi i={3} icon="🚨" label="E‘tibor kerak" value={String(t.urgent + t.watch)} note={`${t.urgent} shoshilinch · ${t.watch} kuzatish`} accent="#ff5a5a" />
      </div>

      {/* DIREKTOR PANELI — faqat asosiy o'qituvchi */}
      {extras ? (
        <Panel title="👑 Direktor paneli" hint="Faqat sizga ko‘rinadi: tushum, o‘sish va o‘qituvchilar reytingi (shu davr, oldingi davrga nisbatan).">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi i={0} icon="💰" label="Tushum (testlar)" value={money(extras.revenue)} delta={<Delta v={extras.prevRevenue ? ((extras.revenue - extras.prevRevenue) / extras.prevRevenue) * 100 : null} />} note={`${extras.sales} ta tasdiqlangan xarid`} accent="#F5C76A" />
            <Kpi i={1} icon="⏳" label="Kutilayotgan to‘lov" value={String(extras.pending)} note="chek tekshirilishi kerak" accent="#FAB219" />
            <Kpi i={2} icon="🌱" label="Yangi o‘quvchilar" value={String(extras.newStudents)} delta={<Delta v={extras.newStudents - extras.prevNewStudents} suffix="" />} note={`oldingi davrda: ${extras.prevNewStudents}`} accent="#3ddc97" />
            <Kpi i={3} icon="🏫" label="Guruhlar" value={String(groups.length)} note={`${data.students.length} ta faol o‘quvchi`} accent="#b388ff" />
          </div>
          <h3 className="mb-2 mt-5 text-sm font-bold text-[#cfd6d2]">🏆 O‘qituvchilar reytingi</h3>
          <ol className="space-y-2">
            {rank.map((g, i) => (
              <li key={g.id} className="sp-rise flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-lg font-black" style={{ background: i === 0 ? "#F5C76A" : i === 1 ? "#cfd6dc" : i === 2 ? "#d08a4a" : "rgba(255,255,255,.08)", color: i < 3 ? "#1d1608" : "#fff" }}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={href({ guruh: g.id })} scroll={false} className="block truncate font-bold text-white hover:text-[#F5C76A]">
                    {g.name}
                  </Link>
                  <span className="text-[11px] text-[#808a85]">
                    {g.sum.students} o‘quvchi · bugun faol {g.sum.activeToday} · 🚨 {g.sum.urgent}
                  </span>
                </span>
                <span className="text-right text-xs">
                  <b className="block text-base tabular-nums text-[#F5C76A]">{pct(g.sum.completion)}</b>
                  <span className="text-[#808a85]">ball {pct(g.sum.avg)}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}

      {/* E'TIBOR KERAK */}
      <Panel
        title={
          <>
            🚨 Kim bilan shug‘ullanish kerak <span className="ml-1 rounded-full bg-[#D03B3B]/20 px-2 py-0.5 align-middle text-xs text-[#ff8a8a]">{needs.length}</span>
          </>
        }
        hint="Bajarilmagan vazifa, past ball, faolsizlik, uzilgan seriya va pasayish bo‘yicha avtomatik saralangan — eng muhimi tepada."
      >
        {needs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[#a3ada8]">🎉 Hamma yaxshi ketyapti — e’tibor talab qiladigan o‘quvchi yo‘q.</p>
        ) : (
          <ul className="grid gap-2.5 md:grid-cols-2">
            {(showAll ? needs : needs.slice(0, 12)).map((s, i) => (
              <li key={s.id} className="sp-rise rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <Avatar s={s} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <b className="min-w-0 truncate text-white">{s.name}</b>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${LEVEL[s.level].cls}`}>{LEVEL[s.level].label}</span>
                    </p>
                    <p className="truncate text-[11px] text-[#808a85]">
                      {s.courseName} · {s.teacherName} · oxirgi faollik: {ago(s.inactiveDays)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <b className="block text-lg tabular-nums text-white">{s.due ? `${s.submitted}/${s.due}` : "—"}</b>
                    <span className="text-[10px] text-[#808a85]">vazifa</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.reasons.map((r) => (
                    <span key={r} className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold text-[#cfd6d2]">
                      {r}
                    </span>
                  ))}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <Link href={`/oqituvchi/chat/${s.id}`} className="rounded-full px-3 py-1 text-xs font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)]">
                    💬 Yozish
                  </Link>
                  <Link href={`/oqituvchi/oquvchilar/${s.id}`} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#cfd6d2] hover:text-white">
                    📈 Natijalari
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!showAll && needs.length > 12 ? (
          <Link href={href({ hammasi: "1" })} scroll={false} className="mt-3 block text-center text-sm font-bold text-[#F5C76A] hover:underline">
            Yana {needs.length - 12} ta o‘quvchini ko‘rsatish ↓
          </Link>
        ) : null}
      </Panel>

      {/* BUGUNGI VAZIFA */}
      <Panel title={`⏰ Bugungi vazifani hali topshirmaganlar · ${pendingToday.length}`} hint="Muddati hali tugamagan vazifa — vaqtida eslatsangiz, ulguradi.">
        {pendingToday.length === 0 ? (
          <p className="text-sm text-[#a3ada8]">Hamma topshirgan yoki bugun vazifa yo‘q ✅</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingToday.map((s) => (
              <Link key={s.id} href={`/oqituvchi/chat/${s.id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-xs font-semibold text-[#e3e8e5] transition hover:border-[#F5C76A]/50" title={s.pendingToday?.title}>
                <Avatar s={s} size={24} />
                {s.name}
                <span className="text-[#808a85]">· {s.teacherName}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      {/* TREND */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="📈 O‘rtacha ball — kunlar bo‘yicha">
          <LineChart points={t.trend.map((d) => ({ day: d.day, value: d.avg }))} label="O‘rtacha ball kunlar bo‘yicha" />
        </Panel>
        <Panel title="📊 Topshirganlar ulushi" hint="Yashil 80%+ · sariq 50–79% · qizil 50% dan kam.">
          <ColumnChart points={t.trend.map((d) => ({ day: d.day, value: d.completion, note: d.due ? `${d.done}/${d.due}` : undefined }))} label="Topshirganlar ulushi" />
        </Panel>
      </div>

      {/* GURUHLAR VA KURSLAR */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="👩‍🏫 Guruhlar bo‘yicha" hint="Bossangiz — faqat shu guruh ko‘rsatiladi.">
          <div className="space-y-2">
            {groups.map((g) => {
              const s = summarize(g.rows, data.days);
              return <GroupBar key={g.id} name={g.name} sub={`${s.students} o‘quvchi`} completion={s.completion} avg={s.avg} urgent={s.urgent} href={href({ guruh: g.id })} />;
            })}
          </div>
        </Panel>
        <Panel title="📚 Kurslar bo‘yicha">
          <div className="space-y-2">
            {byCourse.map((c) => {
              const s = summarize(c.rows, data.days);
              return <GroupBar key={c.id} name={c.name} sub={`${s.students} o‘quvchi`} completion={s.completion} avg={s.avg} urgent={s.urgent} href={href({ kurs: c.id })} />;
            })}
          </div>
        </Panel>
      </div>

      {/* YULDUZLAR */}
      {stars.length ? (
        <Panel title={period === "oy" ? "⭐ Oyning yulduzlari" : "⭐ Haftaning yulduzlari"} hint="Eng ko‘p topshirgan va eng yuqori ball olganlar — maqtab qo‘ying!">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {stars.map((s, i) => (
              <Link key={s.id} href={`/oqituvchi/chat/${s.id}`} className="sp-rise flex flex-col items-center gap-1.5 rounded-2xl border border-[#F5C76A]/20 bg-[#F5C76A]/[0.05] p-3 text-center transition hover:border-[#F5C76A]/60" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="relative">
                  <Avatar s={{ ...s, level: "ok" }} size={48} />
                  <span className="absolute -right-2 -top-2 text-lg">{["🥇", "🥈", "🥉", "🏅", "🏅"][i]}</span>
                </span>
                <b className="w-full truncate text-sm text-white">{s.name}</b>
                <span className="text-[11px] text-[#a3ada8]">
                  {s.submitted}/{s.due} · {pct(s.avg)} · 🔥 {s.streak}
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

      {/* DAVOMAT XARITASI */}
      <Panel title="🗓 Davomat xaritasi" hint="Har bir katak — bir kun: yashil topshirdi · sariq kech · qizil bajarmadi · kulrang vazifa yo‘q. Eng muhimlari tepada.">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-[3px] text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[#101714] pr-2 text-left font-semibold text-[#808a85]">O‘quvchi</th>
                {data.days.map((d) => (
                  <th key={d} className="min-w-[18px] font-semibold text-[#626c67]">
                    {Number(d.slice(8, 10))}
                  </th>
                ))}
                <th className="pl-2 text-right font-semibold text-[#808a85]">Ball</th>
              </tr>
            </thead>
            <tbody>
              {heat.map((s) => (
                <tr key={s.id}>
                  <td className="sticky left-0 max-w-[140px] truncate bg-[#101714] pr-2">
                    <Link href={`/oqituvchi/oquvchilar/${s.id}`} className="flex items-center gap-1.5 text-[#e3e8e5] hover:text-[#F5C76A]">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: LEVEL[s.level].dot }} />
                      <span className="truncate">{s.name}</span>
                    </Link>
                  </td>
                  {s.days.map((c, i) => {
                    const bg = !c.due ? "rgba(255,255,255,.05)" : c.done < c.due ? "#D03B3B" : c.late ? "#FAB219" : "#0CA30C";
                    return <td key={i} title={`${data.days[i]} · ${c.due ? `${c.done}/${c.due} topshirdi` : "vazifa yo‘q"}`} className="h-[18px] rounded-[4px]" style={{ background: bg }} />;
                  })}
                  <td className="pl-2 text-right font-bold tabular-nums text-white">{pct(s.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && list.length > 25 ? (
          <Link href={href({ hammasi: "1" })} scroll={false} className="mt-3 block text-center text-sm font-bold text-[#F5C76A] hover:underline">
            Barcha {list.length} ta o‘quvchini ko‘rsatish ↓
          </Link>
        ) : null}
      </Panel>
    </section>
  );
}
