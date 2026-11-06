import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
test.skip(!process.env.SEED_PASSWORD, "Requires the local Supabase seed");
test("private image upload, detail views, outbound click tracking, and CSRF protection", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("creator3@demo.her.test");
  await page.getByLabel(/^Password/).fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await page.goto("/profile");
  const file = {
    name: "test-avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXZkAAAAASUVORK5CYII=",
      "base64",
    ),
  };
  await page.getByLabel("Upload profile photo").setInputFiles(file);
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  await expect(
    page.getByText("Image uploaded.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View profile" }).click();
  const photo = page.getByRole("img", { name: "Nora Bloom profile photo" });
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  const rejected = await context.request.post("/api/upload", {
    headers: { origin: "https://attacker.invalid" },
    multipart: { bucket: "avatars", file },
  });
  expect(rejected.status()).toBe(403);
  await page.goto("/opportunities");
  await page.getByRole("link", { name: "View details" }).first().click();
  await expect(
    page.getByRole("heading", { name: "The opportunity", exact: true }),
  ).toBeVisible();
  const apply = page.getByRole("link", { name: /Apply on/ });
  const href = await apply.getAttribute("href");
  expect(href).toMatch(/\/api\/opportunities\/.+\/apply/);
  // Inspect the navigation response without requiring the external site's network availability.
  const response = await context.request.get(href!, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toMatch(/^https:\/\//);
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: events } = await db
    .from("analytics_events")
    .select("id")
    .eq("event", "EXTERNAL_APPLICATION_CLICKED")
    .eq("entity_id", href!.split("/")[3]);
  expect(events?.length).toBeGreaterThan(0);
  const { data: owner } = await db
    .from("profiles")
    .select("id")
    .eq("email", "creator3@demo.her.test")
    .single();
  const { data: profile } = await db
    .from("creator_profiles")
    .select("avatar_path")
    .eq("id", owner!.id)
    .single();
  if (profile?.avatar_path)
    await db.storage.from("avatars").remove([profile.avatar_path]);
  await db
    .from("creator_profiles")
    .update({ avatar_path: null })
    .eq("id", owner!.id);
  await page.goto("/brands");
  await page.getByRole("link", { name: "Explore brand" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Open opportunities" }),
  ).toBeVisible();
});
