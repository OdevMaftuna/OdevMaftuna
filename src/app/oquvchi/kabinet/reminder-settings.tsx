"use client";

import { useState } from "react";
import { readPrefs, writePrefs, type ReminderEvery, type ReminderPrefs, type ReminderTone } from "@/lib/reminder-prefs";

const EVERY: { value: ReminderEvery; label: string }[] = [
  { value: "30m", label: "Every 30 min" },
  { value: "2h", label: "Every 2 hours" },
  { value: "visit", label: "Only when I open the site" },
  { value: "off", label: "Off" },
];

const TONE: { value: ReminderTone; label: string; hint: string }[] = [
  { value: "soft", label: "😌 Calm", hint: "Friendly reminders, no angry stickers" },
  { value: "strict", label: "😡 Strict", hint: "Angry stickers — “Get up and study!”" },
];

/** Profil → Reminders: vazifa eslatmasi qanchalik tez-tez va qanday ohangda chiqadi (shu qurilmada saqlanadi). */
export function ReminderSettings({ age }: { age: number | null }) {
  // Faqat "Reminders" qatori ochilganda (brauzerda) chiziladi — localStorage'ni darhol o'qish xavfsiz.
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(() => (typeof window === "undefined" ? null : readPrefs(age)));
  const [saved, setSaved] = useState(false);

  if (!prefs) return null;
  const update = (next: ReminderPrefs) => {
    setPrefs(next);
    writePrefs(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };
  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
      active ? "border-[#f1a93b] bg-[#3a2c12] text-[#F5C76A]" : "border-white/10 text-neutral-300 hover:border-white/30"
    }`;

  return (
    <div className="space-y-4 text-sm">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">How often</legend>
        <div className="grid grid-cols-2 gap-2">
          {EVERY.map((o) => (
            <button key={o.value} type="button" aria-pressed={prefs.every === o.value} onClick={() => update({ ...prefs, every: o.value })} className={chip(prefs.every === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Style</legend>
        <div className="grid grid-cols-2 gap-2">
          {TONE.map((o) => (
            <button key={o.value} type="button" aria-pressed={prefs.tone === o.value} onClick={() => update({ ...prefs, tone: o.value })} className={chip(prefs.tone === o.value)}>
              {o.label}
              <span className="block text-[11px] font-normal text-neutral-500">{o.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-neutral-500" role="status">
        {saved ? "✓ Saved" : "Saved on this device."}
      </p>
    </div>
  );
}
