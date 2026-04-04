import { chromium } from "playwright";
import { mkdirSync } from "fs";

const IPHONE_17_PRO = { width: 402, height: 874 }; // iPhone 17 Pro
const BASE = "http://localhost:3000";
const OUT = "/Users/server/elite_platform/screenshots";

const pages = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
  { name: "upgrade", path: "/upgrade" },
  { name: "bots", path: "/bots" },
  { name: "blog", path: "/blog" },
  { name: "blog-article", path: "/blog/cum-sa-incepi-trading" },
];

async function run() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Mobile viewport
  const mobilePage = await browser.newPage({
    viewport: IPHONE_17_PRO,
    deviceScaleFactor: 3,
    isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15",
  });

  console.log("=== MOBILE TESTS (iPhone 17 Pro) ===\n");

  for (const pg of pages) {
    try {
      await mobilePage.goto(`${BASE}${pg.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await mobilePage.screenshot({ path: `${OUT}/mobile-${pg.name}.png`, fullPage: true });

      // Check for overflow issues
      const overflowX = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      // Check for text truncation / overlap
      const issues: string[] = [];
      if (overflowX) issues.push("HORIZONTAL SCROLL detected (overflow-x)");

      // Check buttons are tappable (min 44px height)
      const smallButtons = await mobilePage.evaluate(() => {
        const buttons = document.querySelectorAll("button, a.accent-button, a.ghost-button");
        const small: string[] = [];
        buttons.forEach((btn) => {
          const rect = btn.getBoundingClientRect();
          if (rect.height > 0 && rect.height < 40 && rect.width > 0) {
            small.push(`${btn.textContent?.trim().slice(0, 30)} (${Math.round(rect.height)}px)`);
          }
        });
        return small;
      });

      if (smallButtons.length > 0) issues.push(`Small tap targets: ${smallButtons.join(", ")}`);

      // Check for text overflow
      const overflowText = await mobilePage.evaluate(() => {
        const els = document.querySelectorAll("h1, h2, h3, p, span");
        const overflow: string[] = [];
        els.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 5 && rect.width > 0) {
            overflow.push(`"${el.textContent?.trim().slice(0, 40)}..." (${Math.round(rect.right - window.innerWidth)}px overflow)`);
          }
        });
        return overflow.slice(0, 5);
      });

      if (overflowText.length > 0) issues.push(`Text overflow: ${overflowText.join("; ")}`);

      // Check font sizes
      const tinyText = await mobilePage.evaluate(() => {
        const els = document.querySelectorAll("p, span, li, td");
        let count = 0;
        els.forEach((el) => {
          const style = getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          if (size > 0 && size < 12) count++;
        });
        return count;
      });

      if (tinyText > 0) issues.push(`${tinyText} elements with font-size < 12px`);

      console.log(`📱 ${pg.name} (${pg.path})`);
      if (issues.length === 0) {
        console.log("   ✅ No issues found");
      } else {
        issues.forEach((i) => console.log(`   ⚠️ ${i}`));
      }
      console.log(`   📸 ${OUT}/mobile-${pg.name}.png\n`);
    } catch (e) {
      console.log(`📱 ${pg.name} (${pg.path})`);
      console.log(`   ❌ Failed: ${e}\n`);
    }
  }

  // Desktop check too
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log("=== DESKTOP TESTS (1440x900) ===\n");

  for (const pg of pages) {
    try {
      await desktopPage.goto(`${BASE}${pg.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await desktopPage.screenshot({ path: `${OUT}/desktop-${pg.name}.png`, fullPage: true });
      console.log(`🖥️ ${pg.name} — ✅ Screenshot saved`);
    } catch (e) {
      console.log(`🖥️ ${pg.name} — ❌ ${e}`);
    }
  }

  await browser.close();
  console.log("\nDone! Screenshots at:", OUT);
}

run().catch(console.error);
