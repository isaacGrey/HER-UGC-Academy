import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SEED_PASSWORD;
if (!url || !password || password.length < 12)
  throw new Error("Set Supabase variables and SEED_PASSWORD (12+ characters).");
if (
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname) &&
  process.env.ALLOW_DEVELOPMENT_SEED !== "true"
)
  throw new Error(
    "Remote seeding requires ALLOW_DEVELOPMENT_SEED=true. Never seed a production project.",
  );
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
async function check(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
async function member(email, name, role) {
  const existing = await check(
    db.from("profiles").select("id").eq("email", email).maybeSingle(),
  );
  if (existing) return existing.id;
  const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
  await check(db.from("invitations").insert({ email, role, token_hash: hash }));
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { invitation_hash: hash },
    user_metadata: { display_name: name },
  });
  if (error) throw error;
  return data.user.id;
}
const admin = await member(
  "admin@demo.her.test",
  "Demo Academy Admin",
  "ADMIN",
);
await check(
  db.from("profiles").update({ can_invite_admin: true }).eq("id", admin),
);
const names = [
  "Maya Linden",
  "Aria Vale",
  "Nora Bloom",
  "Elise Wren",
  "Ivy Marlow",
  "Zoe Haven",
  "Thea Rowan",
  "Lena Cove",
  "Amara Reed",
  "Sienna Park",
];
const industries = [
  "Beauty",
  "Lifestyle",
  "Travel",
  "Technology",
  "Health & Wellness",
];
const locations = [
  "Singapore",
  "London, UK",
  "Austin, US",
  "Melbourne, AU",
  "Toronto, CA",
];
const creators = [];
for (let i = 0; i < names.length; i++) {
  const id = await member(`creator${i + 1}@demo.her.test`, names[i], "CREATOR");
  creators.push(id);
  await check(
    db
      .from("creator_profiles")
      .update({
        headline: [
          "Story-led UGC & skincare creator",
          "Everyday moments, thoughtfully told",
          "Travel stories with a fresh perspective",
          "Making technology feel human",
          "Wellness content with intention",
        ][i % 5],
        bio: "Fictional development profile. I create thoughtful product stories with a natural voice, clear visuals, and a focus on the details that matter.",
        location: locations[i % 5],
        languages: ["English"],
        niches: [...new Set([industries[i % 5], "Lifestyle"])],
        platforms: ["TikTok", "Instagram"],
        verified: i % 3 !== 0,
        availability: "Available",
        website: "https://example.com",
        cohort: "Demo cohort 2026",
        academy_status: "Graduate",
      })
      .eq("id", id),
  );
  const account = await check(
    db
      .from("social_accounts")
      .upsert(
        {
          creator_id: id,
          platform: "TikTok",
          username: `her_demo_creator_${i + 1}`,
          profile_url: `https://www.tiktok.com/@her_demo_creator_${i + 1}`,
          connection_method: "MANUAL",
        },
        { onConflict: "creator_id,platform" },
      )
      .select("id")
      .single(),
  );
  const snapshots = await check(
    db
      .from("social_metric_snapshots")
      .select("id")
      .eq("social_account_id", account.id)
      .limit(1),
  );
  if (!snapshots.length)
    for (let month = 0; month < 4; month++)
      await check(
        db.from("social_metric_snapshots").insert({
          social_account_id: account.id,
          followers: 12000 + i * 4300 + month * 800,
          total_views: 400000 + i * 220000 + month * 40000,
          average_views: 18000 + i * 6500,
          engagement_rate: 4.2 + i * 0.4,
          video_count: 30 + i * 8,
          created_at: new Date(Date.UTC(2026, 7 + month, 1)).toISOString(),
        }),
      );
  const portfolio = await check(
    db.from("portfolio_items").select("id").eq("creator_id", id).limit(1),
  );
  if (!portfolio.length)
    await check(
      db.from("portfolio_items").insert({
        creator_id: id,
        title: "Demo · A considered daily ritual",
        description:
          "Fictional portfolio example for development. Replace with original creator work.",
        platform: "Website",
        url: "https://example.com",
        brand_name: "Demo brand",
        views: 45000 + i * 1000,
        likes: 2300,
        featured: true,
      }),
    );
}
const brandNames = [
  "Petal & Form",
  "Sunday Studio",
  "Roam Kindly",
  "Little Orbit",
  "Daywell Collective",
];
const brands = [];
for (let i = 0; i < brandNames.length; i++) {
  const id = await member(
    `brand${i + 1}@demo.her.test`,
    brandNames[i],
    "BRAND",
  );
  const membership = await check(
    db.from("brand_members").select("brand_id").eq("user_id", id).single(),
  );
  const brandId = membership.brand_id;
  brands.push(brandId);
  await check(
    db
      .from("brands")
      .update({
        name: brandNames[i],
        description:
          "Fictional development brand. We make considered products for everyday life and partner with creators who bring an honest, original perspective.",
        industry: industries[i],
        location: locations[i],
        website: "https://example.com",
        verified: true,
      })
      .eq("id", brandId),
  );
}
const titles = [
  "A fresh take on your skincare ritual",
  "Stories from your everyday essentials",
  "Your next weekend, beautifully told",
  "Make a useful app feel indispensable",
  "Little rituals for a better morning",
  "The beauty of a simple routine",
  "An honest review, in your own voice",
  "Pack light. Create something memorable.",
  "Bring a smarter workflow to life",
  "A thoughtful approach to daily wellness",
];
const opportunities = [];
for (let i = 0; i < titles.length; i++) {
  const title = `${titles[i]} · Demo`;
  const existing = await check(
    db.from("opportunities").select("id").eq("title", title).maybeSingle(),
  );
  const opportunity =
    existing ||
    (await check(
      db
        .from("opportunities")
        .insert({
          brand_id: brands[i % 5],
          title,
          summary:
            "Create natural, story-led content that makes everyday products feel personal.",
          description:
            "This is a fictional development brief. We are looking for creators with a warm, authentic voice to produce original vertical content. Share a clear product story and a genuine perspective.",
          content_requirements:
            "Two original vertical videos, 20–40 seconds each. Natural lighting and clear audio.",
          creator_requirements:
            "English-speaking creators with an original approach to storytelling.",
          deliverables: "2 videos and 3 still images",
          niches: [industries[i % 5]],
          platforms: ["TikTok", "Instagram"],
          compensation_min: 350 + i * 50,
          compensation_max: 700 + i * 100,
          external_platform: "Demo external platform",
          external_url: "https://example.com",
          status: i < 8 ? "LIVE" : "PENDING",
          featured: i < 2,
          approved_at: i < 8 ? new Date().toISOString() : null,
        })
        .select("id")
        .single(),
    ));
  opportunities.push(opportunity.id);
}
await check(
  db
    .from("saved_opportunities")
    .upsert(
      { user_id: creators[0], opportunity_id: opportunities[0] },
      { onConflict: "user_id,opportunity_id" },
    ),
);
await check(
  db
    .from("saved_brands")
    .upsert(
      { user_id: creators[0], brand_id: brands[0] },
      { onConflict: "user_id,brand_id" },
    ),
);
const brandOwner = await check(
  db.from("brand_members").select("user_id").eq("brand_id", brands[0]).single(),
);
await check(
  db
    .from("saved_creators")
    .upsert(
      { user_id: brandOwner.user_id, creator_id: creators[0] },
      { onConflict: "user_id,creator_id" },
    ),
);
console.log(
  "Demo seed complete: 1 admin, 10 creators, 5 brands, 10 opportunities, metrics, portfolios, and saved relationships. Password comes only from SEED_PASSWORD.",
);
