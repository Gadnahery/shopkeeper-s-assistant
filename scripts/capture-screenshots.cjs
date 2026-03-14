const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8080";
const outputRoot = path.resolve(process.cwd(), "screenshots", "stitch-ui");
const viewport = { width: 1440, height: 1200 };
const publicRoutes = [
  { path: "/", file: "01-landing" },
  { path: "/login", file: "02-login" },
  { path: "/signup", file: "03-signup" },
  { path: "/forgot-password", file: "04-forgot-password" },
  { path: "/reset-password", file: "05-reset-password" },
];
const protectedRoutes = [
  { path: "/dashboard", file: "10-dashboard" },
  { path: "/sales", file: "11-sales" },
  { path: "/inventory", file: "12-inventory" },
  { path: "/inventory/add", file: "13-add-product" },
  { path: "/inventory/receive", file: "14-receive-stock" },
  { path: "/categories", file: "15-categories" },
  { path: "/orders", file: "16-orders" },
  { path: "/todo", file: "17-todo" },
  { path: "/customers", file: "18-customers" },
  { path: "/suppliers", file: "19-suppliers" },
  { path: "/expenses", file: "20-expenses" },
  { path: "/hrm", file: "21-hrm" },
  { path: "/reports", file: "22-reports" },
  { path: "/loyalty", file: "23-loyalty" },
  { path: "/notifications", file: "24-notifications" },
  { path: "/user-management", file: "25-user-management" },
  { path: "/assets", file: "26-assets" },
  { path: "/settings", file: "27-settings" },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function routeUrl(routePath) {
  return `${baseUrl}${routePath}`;
}

async function waitForApp(page, routePath) {
  await page.goto(routeUrl(routePath), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  await page.waitForTimeout(1200);
}

async function dismissRadixOverlays(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(250);
}

async function capture(page, dir, fileName) {
  await dismissRadixOverlays(page);
  await page.screenshot({
    path: path.join(dir, `${fileName}.png`),
    fullPage: true,
  });
}

async function signIn(page, email, password) {
  await waitForApp(page, "/login");

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard$/, { timeout: 60000 });
  await page.waitForTimeout(1500);
}

async function run() {
  ensureDir(outputRoot);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const includeProtected = process.env.SCREENSHOT_INCLUDE_PROTECTED === "true";
  const screenshotEmail = process.env.SCREENSHOT_EMAIL;
  const screenshotPassword = process.env.SCREENSHOT_PASSWORD;

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    viewport,
    public: [],
    protected: [],
    notes: [],
  };

  for (const route of publicRoutes) {
    await waitForApp(page, route.path);
    await capture(page, outputRoot, route.file);
    manifest.public.push({ ...route, file: `${route.file}.png` });
  }

  if (includeProtected) {
    if (!screenshotEmail || !screenshotPassword) {
      throw new Error("Protected screenshots require SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD.");
    }

    await signIn(page, screenshotEmail, screenshotPassword);

    for (const route of protectedRoutes) {
      await waitForApp(page, route.path);
      await capture(page, outputRoot, route.file);
      manifest.protected.push({ ...route, file: `${route.file}.png` });
    }

    manifest.notes.push("Protected routes were captured with an existing account supplied via environment variables.");
  } else {
    manifest.notes.push("Protected routes were skipped. Set SCREENSHOT_INCLUDE_PROTECTED=true with SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD to include them.");
  }

  fs.writeFileSync(path.join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2));

  await browser.close();

  console.log(JSON.stringify({
    outputRoot,
    totalScreenshots: manifest.public.length + manifest.protected.length,
    protectedCaptured: manifest.protected.length,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
