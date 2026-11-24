/**
 * .env.local dagi kerakli sozlamalarni Vercel loyihasiga (production) yozadi.
 * Qiymatlar ekranga chiqarilmaydi.  Ishlatish:  node scripts/vercel-env.mjs
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_FALLBACK_MODEL",
];

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

for (const name of NAMES) {
  if (!env[name]) continue;
  spawnSync("npx.cmd", ["-y", "vercel@latest", "env", "rm", name, "production", "--yes"], { stdio: "ignore", shell: true });
  const r = spawnSync("npx.cmd", ["-y", "vercel@latest", "env", "add", name, "production"], {
    input: env[name],
    stdio: ["pipe", "ignore", "pipe"],
    shell: true,
  });
  console.log(`${name}: ${r.status === 0 ? "yozildi" : "XATO " + String(r.stderr).slice(0, 200)}`);
}
