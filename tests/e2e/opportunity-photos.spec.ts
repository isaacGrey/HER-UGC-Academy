import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/^Password/).fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/(admin|brand\/dashboard)$/);
}
test("blank creator website saves; opportunity photos and approval controls", async ({
  page,
  context,
}) => {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await login(page, "admin@demo.her.test");
  await page.goto("/admin/creators");
  await page.getByRole("link", { name: "Edit", exact: true }).first().click();
  await page.getByLabel("Website", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  const { data: owner } = await db
    .from("profiles")
    .select("id")
    .eq("email", "brand1@demo.her.test")
    .single();
  const { data: member } = await db
    .from("brand_members")
    .select("brand_id")
    .eq("user_id", owner!.id)
    .single();
  const { data: listing, error } = await db
    .from("opportunities")
    .insert({
      brand_id: member!.brand_id,
      title: "Photo regression opportunity",
      summary: "Photo regression test summary",
      description: "Photo regression test description",
      status: "DRAFT",
      external_url: "https://example.com",
    })
    .select("id")
    .single();
  expect(error).toBeNull();
  const id = listing!.id;
  try {
    await context.clearCookies();
    await login(page, "brand1@demo.her.test");
    await page.goto("/brand/opportunities/" + id + "/edit");
    const file = {
      name: "photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXZkAAAAASUVORK5CYII=",
        "base64",
      ),
    };
    for (const label of [
      "Upload cover photo",
      "Upload attachment 1",
      "Upload attachment 2",
      "Upload attachment 3",
    ]) {
      const input = page.getByLabel(label, { exact: true });
      await input.setInputFiles(file);
      const form = input.locator("xpath=ancestor::form");
      await form
        .getByRole("button", { name: "Upload image", exact: true })
        .click();
      await expect(
        form.getByText("Image uploaded.", { exact: true }),
      ).toBeVisible();
    }
    const invalid = await context.request.post("/api/upload", {
      headers: { origin: "http://localhost:3000" },
      multipart: {
        bucket: "opportunity-images",
        recordId: id,
        slot: "4",
        file,
      },
    });
    expect(invalid.status()).toBe(400);
    await db.from("opportunities").update({ status: "PENDING" }).eq("id", id);
    expect(
      (await db.from("opportunities").update({ featured: true }).eq("id", id))
        .error,
    ).not.toBeNull();
    await context.clearCookies();
    await login(page, "admin@demo.her.test");
    await page.goto("/admin/opportunities");
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "Photo regression opportunity" })
        .getByRole("button", { name: "Feature", exact: true }),
    ).toHaveCount(0);
    await db.from("opportunities").update({ status: "LIVE" }).eq("id", id);
    await page.goto("/opportunities");
    const cover = page.getByRole("img", {
      name: "Photo regression opportunity — cover photo",
    });
    await expect(cover).toBeVisible();
    await expect
      .poll(() => cover.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await page.goto("/opportunities/" + id);
    await expect(
      page.getByRole("img", { name: /Photo regression opportunity —/ }),
    ).toHaveCount(4);
  } finally {
    const { data: r } = await db
      .from("opportunities")
      .select("cover_path,photo_1,photo_2,photo_3")
      .eq("id", id)
      .single();
    if (r)
      await db.storage
        .from("opportunity-images")
        .remove(Object.values(r).filter(Boolean) as string[]);
    await db.from("opportunities").delete().eq("id", id);
  }
});

