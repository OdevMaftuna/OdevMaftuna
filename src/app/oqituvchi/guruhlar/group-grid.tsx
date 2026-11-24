"use client";

import { useMemo, useState, useTransition } from "react";
import { addMember, decideMember, linkMember, removeMember, restoreMember, setCheck, setCurrentUnit } from "@/app/actions/groups";
import type { GridMember, SiteState } from "@/lib/groups";

const unitLabel = (u: string) => `Unit ${u}`;
const testTone = (p: number) => (p >= 80 ? "bg-[#0CA30C] text-white" : p >= 60 ? "bg-[#FAB219] text-[#1d1608]" : "bg-[#D03B3B] text-white");
const fmtPhone = (p: string | null) => (p && p.length === 12 ? `+${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 8)}-${p.slice(8, 10)}-${p.slice(10)}` : p ? `+${p}` : "");

const SITE: Record<SiteState, { label: string; cls: string; title: string }> = {
  none: { label: "hisob yo‘q", cls: "bg-[#D03B3B]/20 text-[#ff9a9a]", title: "Saytda hisobi yo‘q yoki bog‘lanmagan" },
  never: { label: "kirmagan", cls: "bg-[#FAB219]/20 text-[#FAB219]", title: "Hisobi bor, lekin hech kirmagan" },
  today: { label: "bugun", cls: "bg-[#22c55e]/25 text-[#7ddc5a]", title: "Bugun saytda bo‘lgan" },
  recent: { label: "yaqinda", cls: "bg-[#22c55e]/15 text-[#a6e88f]", title: "Oxirgi 3 kun ichida" },
  idle: { label: "", cls: "bg-white/10 text-white/60", title: "Uzoq vaqtdan beri kirmagan" },
};
const daysAgo = (iso: string | null) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / 86_400_000) : null);

function SiteBadge({ m }: { m: GridMember }) {
  const s = SITE[m.site];
  const d = daysAgo(m.lastSeen);
  return (
    <span title={`${s.title}${m.lastSeen ? ` · oxirgi: ${new Date(m.lastSeen).toLocaleDateString("uz-UZ")}` : ""}`} className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black ${s.cls}`}>
      {m.site === "idle" ? `💤 ${d} kun` : m.site === "none" ? "⛔ " + s.label : m.site === "never" ? "⚠️ " + s.label : "🟢 " + s.label}
    </span>
  );
}

/** Bitta katakcha-belgi (mavzu yoki lug'at). Bosilganda darhol o'zgaradi, server xato qaytarsa — qaytadi. */
function Tick({ on, current, onToggle }: { on: boolean; current: boolean; onToggle: () => void }) {
  return (
    <td className={`border border-[#1f3d16] p-0 text-center ${current ? "bg-[#22c55e]/25" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`mx-auto my-1 grid size-[22px] place-items-center rounded-[5px] border-2 text-[13px] font-black transition active:scale-90 ${
          on ? "border-[#22c55e] bg-[#22c55e] text-[#062a20] shadow-[0_0_8px_rgba(34,197,94,.6)]" : "border-[#3f7a2a] bg-transparent hover:border-[#7ddc5a]"
        }`}
      >
        {on ? "✓" : ""}
      </button>
    </td>
  );
}

export function GroupGrid({
  groupId,
  title,
  units,
  testUnits,
  current,
  members: initial,
  accounts,
  canManage: isAdmin,
}: {
  groupId: string;
  title: string;
  units: string[];
  testUnits: string[];
  current: string | null;
  members: GridMember[];
  accounts: { id: string; name: string; course: string | null }[];
  /** Asosiy yoki support o'qituvchi: qo'shish/chiqarish/tasdiqlash/bog'lash. */
  canManage: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [cur, setCur] = useState(current);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const approved = rows.filter((r) => r.status === "approved");
  const waiting = rows.filter((r) => r.status === "pending");
  const gone = rows.filter((r) => r.status === "left");
  const testSet = useMemo(() => new Set(testUnits), [testUnits]);

  const recompute = (r: GridMember): GridMember => {
    const total = units.length * 2 + units.filter((u) => testSet.has(u)).length;
    const done = units.filter((u) => r.topic[u]).length + units.filter((u) => r.vocab[u]).length + units.filter((u) => testSet.has(u) && r.tests[u] != null).length;
    return { ...r, overall: total ? Math.round((done / total) * 100) : 0 };
  };

  const toggle = (id: string, kind: "topic" | "vocab", unit: string) => {
    const now = !rows.find((r) => r.id === id)?.[kind][unit];
    const apply = (v: boolean) => setRows((rs) => rs.map((r) => (r.id === id ? recompute({ ...r, [kind]: { ...r[kind], [unit]: v } }) : r)));
    apply(now);
    setCheck(id, kind, unit, now).then((r) => {
      if (!r.ok) {
        apply(!now);
        setMsg("Belgini saqlab bo‘lmadi — sahifani yangilang.");
      }
    });
  };

  const colTotal = (kind: "topic" | "vocab", u: string) => approved.filter((r) => r[kind][u]).length;
  const found = q.trim().length >= 2 ? accounts.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const counts = { none: approved.filter((r) => r.site === "none").length, never: approved.filter((r) => r.site === "never").length, active: approved.filter((r) => r.site === "today" || r.site === "recent").length };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {msg ? <p className="rounded-xl bg-[#D03B3B]/15 px-3 py-2 text-sm text-[#ff9a9a]">{msg}</p> : null}

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-[#7ddc5a]">🟢 Faol (3 kun): {counts.active}</span>
        <span className="rounded-full bg-[#FAB219]/20 px-3 py-1 text-[#FAB219]">⚠️ Hisobi bor, kirmagan: {counts.never}</span>
        <span className="rounded-full bg-[#D03B3B]/20 px-3 py-1 text-[#ff9a9a]">⛔ Saytda hisobi yo‘q: {counts.none}</span>
      </div>

      <div className="w-full max-w-full overflow-x-auto rounded-2xl border-2 border-[#1f3d16] bg-[#0f160f] shadow-[0_25px_50px_-30px_rgba(0,0,0,.9)]">
        <table className="w-max min-w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#2f6b1f] text-white">
              <th rowSpan={2} className="sticky left-0 z-20 min-w-[230px] border border-[#1f3d16] bg-[#2f6b1f] px-3 py-2 text-left align-bottom">
                <span className="block text-[11px] font-semibold text-white/70">Mavzular ketmaketligi</span>
                <span className="block text-[16px] font-black leading-tight">{title}</span>
                <span className="mt-1 block text-xs font-bold text-white/80">Ism familiyasi</span>
              </th>
              <th rowSpan={2} className="whitespace-nowrap border border-[#1f3d16] px-2 text-[11px] font-bold [writing-mode:vertical-rl] rotate-180">
                Saytda
              </th>
              <th rowSpan={2} className="whitespace-nowrap border border-[#1f3d16] px-2 text-[11px] font-bold [writing-mode:vertical-rl] rotate-180">
                Umumiy %
              </th>
              <th colSpan={units.length} className="border border-[#1f3d16] py-2 text-[15px] font-black">
                Mavzular jadvali
              </th>
              <th colSpan={units.length} className="border border-[#1f3d16] py-2 text-[15px] font-black">
                Lug‘atlar jadvali
              </th>
              <th colSpan={units.length} className="border border-[#1f3d16] py-2 text-[15px] font-black">
                Test natija jadvali
              </th>
            </tr>
            <tr className="bg-[#2f6b1f] text-white">
              {(["topic", "vocab", "test"] as const).flatMap((k) =>
                units.map((u) => (
                  <th key={`${k}-${u}`} className={`h-[86px] min-w-[34px] border border-[#1f3d16] px-1 align-bottom text-[11px] font-bold ${u === cur ? "bg-[#22c55e] text-[#062a20]" : ""}`}>
                    <button
                      type="button"
                      title={u === cur ? "Joriy unit (bosib olib tashlang)" : "Joriy unit qilish"}
                      onClick={() => {
                        const next = u === cur ? null : u;
                        setCur(next);
                        start(() => setCurrentUnit(groupId, next).then(() => undefined));
                      }}
                      className="rotate-180 pb-1 [writing-mode:vertical-rl] hover:underline"
                    >
                      {unitLabel(u)}
                    </button>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {approved.map((r, i) => (
              <tr key={r.id} className="bg-[#111a11] text-white hover:bg-[#172517]">
                <td className="sticky left-0 z-10 border border-[#1f3d16] bg-[#111a11] p-0">
                  <span className="flex items-center gap-2">
                    <span className="grid w-7 shrink-0 self-stretch place-items-center bg-[#2f6b1f] text-[11px] font-black">{i + 1}</span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="block truncate font-bold uppercase leading-tight">{r.name}</span>
                      {r.phone ? <span className="block text-[10px] text-white/45">{fmtPhone(r.phone)}</span> : null}
                    </span>
                    {isAdmin ? (
                      <span className="mr-1.5 flex shrink-0 gap-1">
                        <button type="button" title={r.studentId ? "Hisobni almashtirish" : "Saytdagi hisob bilan bog‘lash"} onClick={() => setLinkFor(linkFor === r.id ? null : r.id)} className="text-xs text-white/40 hover:text-[#7ddc5a]">
                          🔗
                        </button>
                        <button
                          type="button"
                          title="Guruhdan chiqarish (ketdi)"
                          onClick={() => {
                            if (!window.confirm(`${r.name} guruhdan ketdimi? U “Ketganlar” ro‘yxatiga o‘tadi (belgilari saqlanadi, qaytarish mumkin).`)) return;
                            setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "left", leftAt: new Date().toISOString() } : x)));
                            removeMember(r.id);
                          }}
                          className="text-xs text-white/30 hover:text-[#ff8a8a]"
                        >
                          ✕
                        </button>
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="border border-[#1f3d16] px-1 text-center">
                  <SiteBadge m={r} />
                </td>
                <td className="border border-[#1f3d16] px-1.5">
                  <span className="relative block h-5 w-16 overflow-hidden rounded-full bg-white/10">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2f6b1f] to-[#22c55e]" style={{ width: `${r.overall}%` }} />
                    <span className="relative grid h-full place-items-center text-[10px] font-black">{r.overall}%</span>
                  </span>
                </td>
                {units.map((u) => (
                  <Tick key={`t-${u}`} on={!!r.topic[u]} current={u === cur} onToggle={() => toggle(r.id, "topic", u)} />
                ))}
                {units.map((u) => (
                  <Tick key={`v-${u}`} on={!!r.vocab[u]} current={u === cur} onToggle={() => toggle(r.id, "vocab", u)} />
                ))}
                {units.map((u) => {
                  const p = r.tests[u];
                  return (
                    <td key={`x-${u}`} className={`border border-[#1f3d16] px-0.5 text-center ${u === cur ? "bg-[#22c55e]/25" : ""}`}>
                      {p != null ? <span className={`inline-block min-w-[30px] rounded px-1 py-0.5 text-[11px] font-black ${testTone(p)}`}>{p}</span> : testSet.has(u) ? <span className="text-white/20">—</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            {approved.length ? (
              <tr className="bg-[#2f6b1f]/40 text-[11px] font-black text-white/80">
                <td className="sticky left-0 z-10 border border-[#1f3d16] bg-[#1d3a14] px-3 py-1.5">Jami belgilar</td>
                <td className="border border-[#1f3d16]" />
                <td className="border border-[#1f3d16]" />
                {units.map((u) => (
                  <td key={`tt-${u}`} className="border border-[#1f3d16] text-center">
                    {colTotal("topic", u)}
                  </td>
                ))}
                {units.map((u) => (
                  <td key={`vt-${u}`} className="border border-[#1f3d16] text-center">
                    {colTotal("vocab", u)}
                  </td>
                ))}
                {units.map((u) => (
                  <td key={`xt-${u}`} className="border border-[#1f3d16] text-center">
                    {testSet.has(u) ? approved.filter((r) => r.tests[u] != null).length : ""}
                  </td>
                ))}
              </tr>
            ) : (
              <tr>
                <td colSpan={3 + units.length * 3} className="px-4 py-8 text-center text-sm text-white/60">
                  Guruhda hali o‘quvchi yo‘q — pastdan qo‘shing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#808a85]">
        ✓ Belgini bosib qo‘ying yoki olib tashlang — darhol saqlanadi. Sarlavhadagi “Unit …” — joriy unit (yashil ustun). Test natijalari o‘quvchi pullik testni topshirganda o‘zi tushadi (saytdagi hisobi bog‘langan bo‘lsa).
      </p>

      {/* HISOB BILAN BOG'LASH */}
      {isAdmin && linkFor ? (
        <div className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/[0.06] p-4">
          <p className="text-sm font-black text-white">🔗 {rows.find((r) => r.id === linkFor)?.name} — saytdagi hisobini tanlang</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Saytdagi ism (kamida 2 harf)…" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22c55e] focus:outline-none" />
          <ul className="mt-2 space-y-1">
            {found.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-1.5 text-sm">
                <span className="text-white">
                  {c.name} <span className="text-xs text-[#808a85]">· {c.course ?? "kurssiz"}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    start(async () => {
                      const r = await linkMember(linkFor, c.id);
                      if (r.error) setMsg(r.error);
                      else {
                        setRows((rs) => rs.map((x) => (x.id === linkFor ? { ...x, studentId: c.id, site: "never" } : x)));
                        setLinkFor(null);
                        setQ("");
                      }
                    })
                  }
                  className="rounded-full bg-[#22c55e] px-3 py-1 text-xs font-black text-[#062a20]"
                >
                  Bog‘lash
                </button>
              </li>
            ))}
          </ul>
          {rows.find((r) => r.id === linkFor)?.studentId ? (
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  await linkMember(linkFor, null);
                  setRows((rs) => rs.map((x) => (x.id === linkFor ? { ...x, studentId: null, site: "none", lastSeen: null } : x)));
                  setLinkFor(null);
                })
              }
              className="mt-2 text-xs font-bold text-[#ff9a9a] underline"
            >
              Bog‘lanishni olib tashlash
            </button>
          ) : null}
        </div>
      ) : null}

      {/* TASDIQ KUTAYOTGANLAR */}
      {waiting.length ? (
        <div className="rounded-2xl border border-[#FAB219]/40 bg-[#FAB219]/[0.07] p-4">
          <p className="text-sm font-black text-[#FAB219]">⏳ Tasdiq kutilmoqda · {waiting.length}</p>
          <ul className="mt-2 space-y-1.5">
            {waiting.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm text-white">
                <span>
                  <b>{r.name}</b> <span className="text-xs text-white/50">{fmtPhone(r.phone)}</span>
                </span>
                {isAdmin ? (
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)));
                        decideMember(r.id, true);
                      }}
                      className="rounded-full bg-[#22c55e] px-3 py-1 text-xs font-black text-[#062a20]"
                    >
                      ✓ Qabul qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRows((rs) => rs.filter((x) => x.id !== r.id));
                        decideMember(r.id, false);
                      }}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80"
                    >
                      Rad etish
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-[#FAB219]">asosiy / support o‘qituvchi tasdiqlaydi</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* KETGANLAR */}
      {gone.length ? (
        <details className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-4">
          <summary className="cursor-pointer text-sm font-black text-white">🚪 Ketganlar · {gone.length}</summary>
          <ul className="mt-2 space-y-1.5">
            {gone.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm text-white">
                <span>
                  <b>{r.name}</b> <span className="text-xs text-white/50">{fmtPhone(r.phone)}</span>
                  <span className="ml-2 text-xs text-white/40">ketdi: {r.leftAt ? new Date(r.leftAt).toLocaleDateString("uz-UZ") : "—"}</span>
                </span>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "approved", leftAt: null } : x)));
                      restoreMember(r.id);
                    }}
                    className="rounded-full border border-[#22c55e]/50 px-3 py-1 text-xs font-bold text-[#7ddc5a]"
                  >
                    ↩ Qaytarish
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {/* YANGI O'QUVCHI */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          start(async () => {
            const r = await addMember(groupId, { fullName: name, phone });
            if (r.error) setMsg(r.error);
            else if (r.id) {
              setRows((rs) => [...rs, { id: r.id!, studentId: r.studentId ?? null, name: name.trim(), phone: phone.replace(/\D/g, "").replace(/^(\d{9})$/, "998$1") || null, status: r.status ?? "pending", joinedAt: new Date().toISOString(), leftAt: null, site: r.studentId ? "never" : "none", lastSeen: null, topic: {}, vocab: {}, tests: {}, overall: 0 }]);
              setName("");
              setPhone("");
            }
          });
        }}
        className="rounded-2xl border border-white/[0.08] bg-[#121a17] p-4"
      >
        <p className="text-sm font-black text-white">➕ Yangi o‘quvchi qo‘shish</p>
        <p className="text-xs text-[#808a85]">
          Ism familiya va telefon. O‘quvchi saytda shu telefon bilan ro‘yxatdan o‘tsa yoki kabinetida raqamini kiritsa — “Siz shu guruhdasiz” deb chiqadi.
          {isAdmin ? " Siz qo‘shgan o‘quvchi darhol guruhga kiradi." : " So‘rov asosiy yoki support o‘qituvchiga boradi."}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism familiya" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22c55e] focus:outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22c55e] focus:outline-none" />
          <button type="submit" disabled={pending} className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-black text-[#062a20] disabled:opacity-50">
            {isAdmin ? "Qo‘shish" : "So‘rov yuborish"}
          </button>
        </div>
      </form>
    </div>
  );
}
