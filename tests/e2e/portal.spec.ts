import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SEED_PASSWORD,
);
const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: false }).fill(email);
  await page.getByLabel(/^Password/).fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|admin|brand\/dashboard)$/);
}
test("there is no public registration route", async ({ page }) => {
  await page.goto("/signup");
  // App Router can stream a not-found boundary after sending HTTP 200.
  // Verify the actual denial UI; the Auth API is tested independently below.
  await expect(
    page.getByRole("heading", { name: "This page isn’t here." }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});
test("unconfigured app explains setup without leaking private data", async ({
  page,
}) => {
  test.skip(configured, "Supabase configured");
  await page.goto("/creators");
  await expect(page).toHaveURL("/setup");
  await expect(
    page.getByRole("heading", { name: "Your portal is ready to connect." }),
  ).toBeVisible();
});
test.describe("real Supabase member flows", () => {
  test.skip(!configured, "Requires seeded local Supabase and SEED_PASSWORD");
  test("invitation claim succeeds once; expired and revoked invitations fail", async ({
    page,
  }) => {
    const db = admin();
    const email = `e2e-${Date.now()}@demo.her.test`;
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const { error } = await db
      .from("invitations")
      .insert({ email, role: "CREATOR", token_hash: hash });
    expect(error).toBeNull();
    await page.goto(`/invite/${token}`);
    await page
      .getByLabel("Your name / company name")
      .fill("E2E invited creator");
    await page.getByLabel("Create password").fill(process.env.SEED_PASSWORD!);
    await page.getByRole("button", { name: "Accept invitation" }).click();
    await expect(page).toHaveURL(/\/login\?invited=success/);
    await page.goto(`/invite/${token}`);
    await expect(
      page.getByRole("heading", { name: "This invitation is unavailable." }),
    ).toBeVisible();
    for (const mode of ["expired", "revoked"]) {
      const t = randomBytes(32).toString("hex");
      await db.from("invitations").insert({
        email: `${mode}-${Date.now()}@demo.her.test`,
        role: "CREATOR",
        token_hash: createHash("sha256").update(t).digest("hex"),
        expires_at:
          mode === "expired"
            ? "2000-01-01"
            : new Date(Date.now() + 86400000).toISOString(),
        revoked_at: mode === "revoked" ? new Date().toISOString() : null,
      });
      await page.goto(`/invite/${t}`);
      await expect(
        page.getByRole("heading", { name: "This invitation is unavailable." }),
      ).toBeVisible();
    }
  });
  test("creator edits own profile, saves opportunities, and cannot access admin", async ({
    page,
  }) => {
    await login(page, "creator1@demo.her.test");
    await page.goto("/profile");
    await page
      .getByLabel("Professional headline")
      .fill("Thoughtful stories, created with care");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByText("Profile saved.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Professional headline")).toHaveValue(
      "Thoughtful stories, created with care",
    );
    await page.goto("/opportunities");
    const save = page
      .getByRole("button", { name: "Save opportunity", exact: true })
      .first();
    await save.click();
    await expect(
      page
        .getByRole("button", { name: "Unsave opportunity", exact: true })
        .first(),
    ).toBeVisible();
    await page.goto("/saved");
    await expect(page.locator(".opportunity-card").first()).toBeVisible();
    await page.goto("/brands");
    await expect(page.locator(".card h3").first()).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL("/access-denied");
  });
  test("brand edits company, saves creators, creates and submits a draft", async ({
    page,
  }) => {
    await login(page, "brand1@demo.her.test");
    await page.goto("/brand/profile");
    await page
      .getByLabel("About your company")
      .fill("Fictional development brand partnering with thoughtful creators.");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByText("Brand saved.", { exact: true })).toBeVisible();
    await page.goto("/creators");
    await page
      .getByRole("button", { name: "Save creator", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Unsave creator", exact: true }).first(),
    ).toBeVisible();
    await page.goto("/brand/opportunities/new");
    const title = `E2E product story ${Date.now()}`;
    await page.getByLabel("Opportunity title").fill(title);
    await page
      .getByLabel("Short summary")
      .fill("A thoughtful original product story.");
    await page
      .getByLabel("Full brief")
      .fill(
        "Create two original short-form videos sharing a natural product story.",
      );
    await page.getByLabel("Beauty", { exact: true }).check();
    await page.getByLabel("TikTok", { exact: true }).check();
    await page.getByLabel("Minimum compensation").fill("300");
    await page.getByLabel("Maximum compensation").fill("600");
    await page
      .getByLabel("External application URL")
      .fill("https://example.com/apply");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByText("Opportunity saved.", { exact: true }),
    ).toBeVisible();
    await page.goto("/brand/opportunities");
    const card = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await card.getByRole("button", { name: "Submit for review" }).click();
    await expect(card.getByText("PENDING", { exact: true })).toBeVisible();
  });
  test("admin approves and suspends; an existing session loses access until restored", async ({
    browser,
  }) => {
    await admin()
      .from("profiles")
      .update({ status: "ACTIVE" })
      .eq("email", "creator2@demo.her.test");
    const adminContext = await browser.newContext();
    const creatorContext = await browser.newContext();
    const a = await adminContext.newPage();
    const c = await creatorContext.newPage();
    await login(a, "admin@demo.her.test");
    await login(c, "creator2@demo.her.test");
    await a.goto("/admin/opportunities?status=PENDING");
    await a.getByRole("button", { name: "Approve & publish" }).first().click();
    await expect(
      a.getByText("Change saved and recorded in the audit log."),
    ).toBeVisible();
    await a.goto("/admin/accounts?q=creator2");
    await a.getByRole("button", { name: "Suspend", exact: true }).click();
    await a
      .getByRole("dialog")
      .getByRole("button", { name: "Suspend", exact: true })
      .click();
    await expect(
      a.getByRole("table").getByText("SUSPENDED", { exact: true }),
    ).toBeVisible();
    await c.goto("/opportunities");
    await expect(c).toHaveURL("/access-denied");
    await a.getByRole("button", { name: "Restore", exact: true }).click();
    await expect(
      a.getByRole("table").getByText("ACTIVE", { exact: true }),
    ).toBeVisible();
    await c.goto("/opportunities");
    await expect(
      c.getByRole("heading", { name: "Your next opportunity starts here" }),
    ).toBeVisible();
    await adminContext.close();
    await creatorContext.close();
  });
  test("direct API writes reject cross-tenant edits and role escalation", async () => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const deniedSignup = await client.auth.signUp({
      email: `uninvited-${Date.now()}@demo.her.test`,
      password: process.env.SEED_PASSWORD!,
    });
    expect(deniedSignup.error).not.toBeNull();
    const { data: auth, error } = await client.auth.signInWithPassword({
      email: "creator1@demo.her.test",
      password: process.env.SEED_PASSWORD!,
    });
    expect(error).toBeNull();
    const { data: other } = await admin()
      .from("profiles")
      .select("id")
      .eq("email", "creator2@demo.her.test")
      .single();
    const edited = await client
      .from("creator_profiles")
      .update({ bio: "Attempted unauthorized edit" })
      .eq("id", other!.id)
      .select("id");
    expect(edited.data).toEqual([]);
    const escalated = await client
      .from("profiles")
      .update({ role: "ADMIN" })
      .eq("id", auth.user!.id)
      .select("id");
    expect(escalated.data).toEqual([]);
    const audit = await client.from("audit_logs").select("*");
    expect(audit.data).toEqual([]);
  });
  test("all workspaces and discovery layouts work at desktop and 360px", async ({
    page,
  }) => {
    test.slow();
    await login(page, "creator1@demo.her.test");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of [
        "/dashboard",
        "/creators",
        "/brands",
        "/opportunities",
        "/portfolio",
        "/socials",
        "/analytics",
        "/campaigns",
        "/earnings",
        "/saved",
        "/settings",
      ]) {
        await page.goto(route);
        await expect(page.locator("h1")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
      await page.goto("/opportunities");
      await page.screenshot({
        path: `test-results/opportunities-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole("link", { name: "My workspace" }).click();
    if (await page.getByRole("button", { name: "Sign out" }).isVisible())
      await page.getByRole("button", { name: "Sign out" }).click();
    await login(page, "brand1@demo.her.test");
    for (const route of [
      "/brand/dashboard",
      "/brand/profile",
      "/brand/creators",
      "/brand/creators/saved",
      "/brand/opportunities",
      "/brand/billing",
      "/brand/settings",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByRole("button", { name: "Sign out" }).click();
    await login(page, "admin@demo.her.test");
    for (const route of [
      "/admin",
      "/admin/creators",
      "/admin/brands",
      "/admin/accounts",
      "/admin/opportunities",
      "/admin/invitations",
      "/admin/plans",
      "/admin/settings",
      "/admin/audit-log",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
});
