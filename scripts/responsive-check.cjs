const { chromium } = require("playwright");

const baseUrl = "http://localhost:8080";
const routes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const viewports = [
  { width: 375, height: 812, label: "mobile" },
  { width: 768, height: 900, label: "tablet" },
  { width: 1024, height: 900, label: "laptop" },
  { width: 1440, height: 900, label: "desktop" },
];

async function run() {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
  });

  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const route of routes) {
      const item = { viewport: vp.width, route, ok: true, issues: [] };
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(900);

        const checks = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const hasHorizontalOverflow =
            (doc && doc.scrollWidth > window.innerWidth + 1) ||
            (body && body.scrollWidth > window.innerWidth + 1);
          const hasVisibleButton = Array.from(document.querySelectorAll("button,a,input"))
            .some((el) => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
            });
          const tinyTextNodes = Array.from(document.querySelectorAll("body *"))
            .filter((el) => {
              const style = window.getComputedStyle(el);
              const fs = Number.parseFloat(style.fontSize || "0");
              return fs > 0 && fs < 10;
            }).length;
          return { hasHorizontalOverflow, hasVisibleButton, tinyTextNodes };
        });

        if (checks.hasHorizontalOverflow) item.issues.push("horizontal-overflow");
        if (!checks.hasVisibleButton) item.issues.push("no-visible-interactive-elements");
        if (checks.tinyTextNodes > 0) item.issues.push(`tiny-text-nodes:${checks.tinyTextNodes}`);
      } catch (e) {
        item.issues.push(`navigation-failed:${e.message}`);
      }

      item.ok = item.issues.length === 0;
      results.push(item);
    }

    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
