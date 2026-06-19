import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal, dependency-free `.env` loader for standalone `tsx` scripts.
 *
 * Next.js loads env files for the *app*, but a bare `tsx scripts/...` process
 * does not — so the ingestion script needs this. Reads `.env.local` then
 * `.env`; an already-set real env var always wins (so CI can pass the key
 * directly). No-ops cleanly when the files are absent.
 *
 * We never print or return the values — only populate `process.env`.
 */
export function loadEnv(cwd: string = process.cwd()): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(cwd, name);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const eq = line.indexOf("=");
      const key = line.slice(0, eq).trim();
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  }
}
