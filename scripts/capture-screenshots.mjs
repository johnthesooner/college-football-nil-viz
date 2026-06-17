/**
 * Capture page screenshots for the README using puppeteer-core driving the
 * locally-installed Chrome (no bundled browser download).
 *
 * Usage:
 *   1. Start the app:   npm run dev        (or `npm run start` after a build)
 *   2. Capture:         npm run screenshots
 *
 * Override the target with BASE_URL (default http://localhost:3010) and the
 * Chrome binary with CHROME_PATH.
 */
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "screenshots");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3010";
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PAGES = [
  { name: "home", path: "/", wait: "svg.recharts-surface" },
  { name: "timeline", path: "/timeline", wait: "svg.recharts-surface" },
  { name: "flow", path: "/flow", wait: 'svg[aria-label*="Sankey"]' },
  { name: "nil", path: "/nil", wait: "table tbody tr" },
  { name: "players", path: "/players", wait: "table tbody tr" },
  { name: "methodology", path: "/methodology", wait: "table" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    for (const p of PAGES) {
      const url = `${BASE_URL}${p.path}`;
      process.stdout.write(`capturing ${p.name.padEnd(12)} ${url} … `);
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      if (p.wait) {
        await page.waitForSelector(p.wait, { timeout: 15000 }).catch(() => {});
      }
      await sleep(700); // let chart animations settle
      const out = join(OUT_DIR, `${p.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log("done");
    }
  } finally {
    await browser.close();
  }
  console.log(`\nScreenshots written to docs/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
