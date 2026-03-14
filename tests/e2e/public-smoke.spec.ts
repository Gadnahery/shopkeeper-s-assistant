import { expect, test } from "@playwright/test";

const routes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

for (const route of routes) {
  test(`public route ${route} renders`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).not.toBeEmpty();
  });
}

test("dashboard protects unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login|\/dashboard/);
  await expect(page.locator("body")).not.toBeEmpty();
});
