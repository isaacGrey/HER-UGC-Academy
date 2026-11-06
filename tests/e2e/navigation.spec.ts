import { test, expect } from "@playwright/test";
for (const [email, home, label, target] of [
  ["creator1@demo.her.test", "/dashboard", "My profile", "/profile"],
  [
    "brand1@demo.her.test",
    "/brand/dashboard",
    "Brand profile",
    "/brand/profile",
  ],
  ["admin@demo.her.test", "/admin", "Creators", "/admin/creators"],
]) {
  test(email + " preserves navigation shell and document", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/^Password/).fill(process.env.SEED_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(home);
    let documents = 0;
    page.on("request", (r) => {
      if (r.isNavigationRequest() && r.frame() === page.mainFrame())
        documents++;
    });
    const shell = await page.locator(".sidebar").elementHandle();
    await page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: label, exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(target);
    expect(await shell!.evaluate((el) => el.isConnected)).toBe(true);
    await page.goto("/creators");
    documents = 0;
    const header = await page.locator(".workspace-header").elementHandle();
    await page.locator(".searchbar input").fill("Nora");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/q=Nora/);
    expect(await header!.evaluate((el) => el.isConnected)).toBe(true);
    const directory = await page.locator(".opportunity-grid").elementHandle();
    await page.getByRole("link", { name: "View profile", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await directory!.evaluate((el) => el.isConnected)).toBe(true);
    expect(await header!.evaluate((el) => el.isConnected)).toBe(true);
    await page.getByRole("button", { name: "Close creator profile" }).click();
    await expect(page).toHaveURL(/\/creators\?q=Nora/);
    expect(await directory!.evaluate((el) => el.isConnected)).toBe(true);
    expect(await header!.evaluate((el) => el.isConnected)).toBe(true);
    expect(documents).toBe(0);
  });
}
