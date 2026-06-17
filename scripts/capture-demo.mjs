/**
 * Capture a scripted walkthrough of the app as a sequence of viewport frames,
 * which `npm run demo:gif` then assembles into docs/screenshots/demo.gif via
 * ffmpeg. Drives the locally-installed Chrome with puppeteer-core (no bundled
 * browser download).
 *
 * Requires a running dev server (default http://localhost:3010). Override with
 * BASE_URL / CHROME_PATH.
 */
import { mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAME_DIR = join(__dirname, "..", ".demo-frames");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3010";
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Click the first button whose trimmed text equals `label`. */
async function clickButton(page, label) {
  await page.evaluate((l) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === l);
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, label);
}
async function clickButtonContains(page, label) {
  await page.evaluate((l) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(l));
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, label);
}

async function main() {
  rmSync(FRAME_DIR, { recursive: true, force: true });
  mkdirSync(FRAME_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
  });

  let frame = 0;
  const shot = async () => {
    const path = join(FRAME_DIR, `${String(frame).padStart(2, "0")}.png`);
    await browser.__page.screenshot({ path });
    frame += 1;
    process.stdout.write(`.`);
  };

  try {
    const page = await browser.newPage();
    browser.__page = page;
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    const go = async (path, waitSel) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
      if (waitSel) await page.waitForSelector(waitSel, { timeout: 15000 }).catch(() => {});
      await sleep(900);
    };

    // 1. Story
    await go("/", "svg.recharts-surface");
    await shot();

    // 2-3. Timeline: default, then filter to QB (shows reactivity)
    await go("/timeline", "svg.recharts-surface");
    await shot();
    await clickButton(page, "QB");
    await sleep(900);
    await shot();

    // 4-5. Flow: conference, then school-to-school toggle
    await go("/flow", 'svg[aria-label*="Sankey"]');
    await shot();
    await clickButtonContains(page, "School-to-school");
    await sleep(1100);
    await shot();

    // 6. NIL money view (disclaimer + table + badges)
    await go("/nil", "table tbody tr");
    await shot();

    // 7. Player explorer
    await go("/players", "table tbody tr");
    await shot();

    // 8. Methodology
    await go("/methodology", "table");
    await shot();

    console.log(`\n${frame} frames → ${FRAME_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
