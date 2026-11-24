"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { setMyAvatar, updateMyProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { PasswordForm } from "@/app/parol/password-form";

/** Ism yonidagi ✏️ — ism va yoshni o'zgartirish oynasi. */
export function EditName({ name, age }: { name: string; age: number | null }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(name);
  const [years, setYears] = useState(age ? String(age) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="truncate">{name || "Student"}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit name"
          className="grid size-8 shrink-0 place-items-center rounded-full text-[#F5C76A] transition hover:bg-white/5"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 20h4L19 9l-4-4L4 16z" />
          </svg>
        </button>
      </span>
    );
  }
  const input = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-base font-normal outline-none focus:border-[#f1a93b]";
  return (
    <div className="mx-auto w-full max-w-sm space-y-2 text-left text-base font-normal">
      <input value={full} onChange={(e) => setFull(e.target.value)} placeholder="Full name" className={input} aria-label="Full name" />
      <input value={years} onChange={(e) => setYears(e.target.value)} placeholder="Age" inputMode="numeric" className={input} aria-label="Age" />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await updateMyProfile(full, years);
              if (r.error) setError(r.error);
              else setOpen(false);
            })
          }
          className="h-10 flex-1 rounded-xl text-sm font-bold text-[#1d1608] [background:linear-gradient(135deg,#f5c76a,#f1a93b)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-white/10 px-4 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

/** ID nusxasi. */
export function CopyId({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 py-1.5 text-sm font-bold tabular-nums text-neutral-300 transition hover:bg-white/10"
    >
      ID: {id}
      <span aria-hidden className="text-neutral-500">{done ? "✓" : "⧉"}</span>
    </button>
  );
}

/** Ochiladigan menyu qatori (parol, yordam). */
export function ExpandRow({ icon, label, tone = "dark", children }: { icon: ReactNode; label: string; tone?: "gold" | "dark"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cab-row overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-4 p-3.5 text-left">
        <RowIcon tone={tone}>{icon}</RowIcon>
        <span className="flex-1 text-[17px] font-bold">{label}</span>
        <span aria-hidden className={`text-xl text-neutral-500 transition ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open ? <div className="border-t border-white/5 p-4">{children}</div> : null}
    </div>
  );
}

export function RowIcon({ tone, children }: { tone: "gold" | "dark" | "red"; children: ReactNode }) {
  const cls =
    tone === "gold" ? "bg-[#3a2c12] text-[#F5C76A]" : tone === "red" ? "bg-red-500/15 text-red-400" : "bg-white/[0.07] text-neutral-300";
  return <span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xl ${cls}`}>{children}</span>;
}

export function PasswordPanel() {
  return <PasswordForm />;
}

/** Rasmni markazdan kvadrat qilib kesib, 320px JPEG'ga aylantiradi. */
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Rasmni o‘qib bo‘lmadi.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 320, 320);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("Rasmni o‘qib bo‘lmadi.");
  return blob;
}

/** Kabinetdagi katta avatar: 📷 bosib rasm yuklash, almashtirish yoki o'chirish. */
export function AvatarUpload({ userId, url, initial }: { userId: string; url: string | null; initial: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? url;

  const upload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      if (!/^image\//.test(file.type)) throw new Error("Faqat rasm yuklash mumkin.");
      const blob = await squareJpeg(file);
      setPreview(URL.createObjectURL(blob));
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: up } = await createClient().storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (up) throw new Error("Yuklab bo‘lmadi. Internetni tekshiring.");
      const r = await setMyAvatar(path);
      if (r.error) throw new Error(r.error);
      router.refresh();
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Xatolik.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <label className="group relative block cursor-pointer" aria-label="Profil rasmini yuklash">
        <span className="cab-avatar grid size-28 place-items-center overflow-hidden rounded-full text-5xl font-black" style={{ color: "#F5C76A" }}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className={`size-full object-cover transition ${busy ? "opacity-50" : "group-hover:opacity-80"}`} />
          ) : (
            initial
          )}
        </span>
        <span className="absolute bottom-0 right-0 grid size-10 place-items-center rounded-full border-4 border-[#0d1512] text-base transition group-hover:scale-110" style={{ backgroundColor: "#F5C76A" }}>
          {busy ? "…" : "📷"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
        />
      </label>
      {url && !busy ? (
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            const r = await setMyAvatar(null);
            setBusy(false);
            if (r.error) setError(r.error);
            else {
              setPreview(null);
              router.refresh();
            }
          }}
          className="mt-2 text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-300 hover:underline"
        >
          Rasmni olib tashlash
        </button>
      ) : (
        <p className="mt-2 text-[11px] text-neutral-500">{busy ? "Yuklanmoqda…" : "📷 bosib rasm qo‘ying — do‘stlaringiz xaritada ko‘radi"}</p>
      )}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
