const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

async function assertVisibleContent(page, route) {
  const bodyText = (await page.locator("body").innerText()).trim();
  if (!bodyText) {
    throw new Error(`Route ${route} rendered an empty body.`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  for (const route of publicRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await assertVisibleContent(page, route);
  }

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  const currentUrl = page.url();
  const bodyText = await page.locator("body").innerText();
  const redirectedToLogin = currentUrl.includes("/login");
  const showingEnvMessage = bodyText.includes("Setup required");

  if (!redirectedToLogin && !showingEnvMessage) {
    throw new Error(`Expected unauthenticated dashboard access to redirect to /login or show setup message. Received ${currentUrl}.`);
  }

  if (pageErrors.length) {
    throw new Error(`Page errors detected: ${pageErrors.join(" | ")}`);
  }

  if (consoleErrors.length) {
    throw new Error(`Console errors detected: ${consoleErrors.join(" | ")}`);
  }

  await browser.close();

  console.log(JSON.stringify({
    ok: true,
    checkedRoutes: [...publicRoutes, "/dashboard"],
    baseUrl,
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
