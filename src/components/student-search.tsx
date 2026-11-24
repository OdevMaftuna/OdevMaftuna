"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { loadSearchIndex } from "@/app/actions/search";
import { KIND_LABEL, norm, score, type SearchItem, type SearchKind } from "@/lib/search";

type Indexed = SearchItem & { n: { t: string; x: string } };

/** Guruhlar tartibi va har guruhda ko'rsatiladigan eng ko'p natija. */
const ORDER: [SearchKind, number][] = [["section", 4], ["homework", 5], ["topic", 6], ["word", 8], ["test", 5], ["course", 4]];
const HINTS = ["past simple", "plurals", "house", "uy", "homework", "profile"];

/**
 * O'quvchi qidiruvi: sarlavhadagi 🔍 tugmasi (yoki "/" / Ctrl+K) oynani ochadi.
 * Indeks birinchi ochilganda bir marta yuklanadi va qidiruv brauzerning o'zida ishlaydi — tez va bepul.
 */
export function StudentSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Indexed[] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const load = () => {
    if (index || loading) return;
    setError(false);
    start(async () => {
      try {
        const items = await loadSearchIndex();
        setIndex(items.map((it) => ({ ...it, n: { t: norm(it.title), x: norm(`${it.sub ?? ""} ${it.extra ?? ""}`) } })));
      } catch {
        setError(true);
      }
    });
  };

  const show = () => {
    setOpen(true);
    load();
  };
  const close = () => {
    setOpen(false);
    setQ("");
    setActive(0);
  };

  // "/" yoki Ctrl+K — qidiruvni ochadi (matn yozilayotgan maydonda emas).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, loading]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const groups = useMemo(() => {
    if (!index) return [];
    const nq = norm(q);
    const pool: { it: Indexed; s: number }[] = nq
      ? index.map((it) => ({ it, s: score(it.n, nq) })).filter((x) => x.s > 0)
      : index.filter((it) => it.kind === "section" || it.kind === "homework").map((it) => ({ it, s: 1 }));
    pool.sort((a, b) => b.s - a.s || a.it.title.length - b.it.title.length);
    return ORDER.map(([kind, max]) => ({ kind, items: pool.filter((x) => x.it.kind === kind).slice(0, max).map((x) => x.it) })).filter((g) => g.items.length);
  }, [index, q]);
  const flat = groups.flatMap((g) => g.items);

  const go = (it: SearchItem) => {
    close();
    router.push(it.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active]);
    }
  };

  let n = -1;
  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search"
        className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/30 px-2.5 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <span aria-hidden>🔍</span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-white/25 px-1 text-[10px] text-white/60 md:inline">/</kbd>
      </button>

      {open
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[95] flex items-start justify-center bg-black/70 p-3 pt-[8vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}>
              <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#111a16] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)]">
                <div className="flex items-center gap-3 border-b border-white/10 px-4">
                  <span aria-hidden className="text-lg">🔍</span>
                  <input
                    ref={input}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Topics, words, homework… · Qidiring"
                    aria-label="Search"
                    className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/35"
                  />
                  <button type="button" onClick={close} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/60 hover:text-white">
                    Esc
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {error ? (
                    <p className="p-6 text-center text-sm text-red-300">
                      Couldn’t load search. <button type="button" className="underline" onClick={load}>Try again</button>
                    </p>
                  ) : !index ? (
                    <p className="p-6 text-center text-sm text-white/50" role="status">Loading…</p>
                  ) : flat.length === 0 ? (
                    <p className="p-6 text-center text-sm text-white/50">Nothing found for “{q}”. Hech narsa topilmadi.</p>
                  ) : (
                    groups.map((g) => (
                      <div key={g.kind} className="mb-1">
                        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                          {KIND_LABEL[g.kind].icon} {KIND_LABEL[g.kind].label}
                        </p>
                        <ul>
                          {g.items.map((it) => {
                            n += 1;
                            const i = n;
                            return (
                              <li key={`${it.kind}-${it.href}-${it.title}`}>
                                <Link
                                  href={it.href}
                                  onClick={close}
                                  onMouseEnter={() => setActive(i)}
                                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-white/[0.08]" : ""}`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span lang={it.kind === "word" || it.kind === "topic" ? "en" : undefined} className="block truncate text-[15px] font-semibold">
                                      {it.title}
                                    </span>
                                    {it.sub ? <span className="block truncate text-xs text-white/50">{it.sub}</span> : null}
                                  </span>
                                  <span aria-hidden className="text-white/30">›</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                  {index && !q ? (
                    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-2">
                      <span className="text-xs text-white/40">Try:</span>
                      {HINTS.map((h) => (
                        <button key={h} type="button" onClick={() => setQ(h)} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/70 hover:border-[#f1a93b]/60">
                          {h}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
