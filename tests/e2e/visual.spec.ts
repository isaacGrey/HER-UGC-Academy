import { test, expect } from "@playwright/test";
test.skip(!process.env.SEED_PASSWORD, "Requires fictional seed accounts");
test("HER design review at desktop and mobile widths", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("creator1@demo.her.test");
  await page.getByLabel(/^Password/).fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/opportunities");
    await expect(page.locator(".opportunity-card").first()).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/opportunities-${width}.png`,
      fullPage: true,
    });
    await page.goto("/analytics");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/analytics-${width}.png`,
      fullPage: true,
    });
  }
});
