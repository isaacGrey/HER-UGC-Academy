import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
const db = new PGlite();
let passed = 0;
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}',raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'service_role') $$;
 grant usage on schema auth to authenticated,anon,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;`);
for (const file of (await readdir("supabase/migrations")).sort()) {
  const sql = (await readFile(`supabase/migrations/${file}`, "utf8")).replace(
    "create extension if not exists pgcrypto;",
    "",
  );
  await db.exec(sql);
}
async function user(role, email) {
  const id = randomUUID();
  const hash = createHash("sha256").update(id).digest("hex");
  await db.query(
    "insert into public.invitations(email,role,token_hash) values($1,$2,$3)",
    [email, role, hash],
  );
  await db.query(
    "insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,$2,$3,$4)",
    [
      id,
      email,
      JSON.stringify({ invitation_hash: hash }),
      JSON.stringify({ display_name: email.split("@")[0] }),
    ],
  );
  return id;
}
const admin = await user("ADMIN", "admin@example.test");
const creator = await user("CREATOR", "creator@example.test");
const other = await user("CREATOR", "other@example.test");
const brand = await user("BRAND", "brand@example.test");
const brand2 = await user("BRAND", "brand2@example.test");
const brandId = (
  await db.query("select brand_id from brand_members where user_id=$1", [brand])
).rows[0].brand_id;
const otherBrand = (
  await db.query("select brand_id from brand_members where user_id=$1", [
    brand2,
  ])
).rows[0].brand_id;
async function asUser(id, fn) {
  await db.exec("begin");
  try {
    await db.query(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true)",
      [id],
    );
    await db.exec("set local role authenticated");
    const result = await fn();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
await test("public account creation requires a valid invitation", async () => {
  await assert.rejects(
    db.query("insert into auth.users(id,email) values($1,$2)", [
      randomUUID(),
      "uninvited@example.test",
    ]),
    /Valid invitation required/,
  );
});
await test("GoTrue can attach trusted metadata after insert within one transaction", async () => {
  const id = randomUUID();
  const email = "deferred@example.test";
  const hash = createHash("sha256").update(id).digest("hex");
  await db.query(
    "insert into invitations(email,role,token_hash) values($1,'CREATOR',$2)",
    [email, hash],
  );
  await db.exec("begin");
  await db.query("insert into auth.users(id,email) values($1,$2)", [id, email]);
  await db.query("update auth.users set raw_app_meta_data=$1 where id=$2", [
    JSON.stringify({ invitation_hash: hash }),
    id,
  ]);
  await db.exec("commit");
  assert.equal(
    (await db.query("select id from profiles where id=$1", [id])).rows.length,
    1,
  );
});
await test("invitation acceptance cannot be replayed", async () => {
  const inv = (
    await db.query(
      "select token_hash from invitations where email='creator@example.test'",
    )
  ).rows[0];
  await assert.rejects(
    db.query(
      "insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)",
      [
        randomUUID(),
        "creator@example.test",
        JSON.stringify({ invitation_hash: inv.token_hash }),
      ],
    ),
    /Valid invitation required/,
  );
});
await test("revoked and expired invitations fail atomically", async () => {
  for (const mode of ["expired", "revoked"]) {
    const email = `${mode}@example.test`;
    const hash = createHash("sha256").update(email).digest("hex");
    await db.query(
      `insert into invitations(email,role,token_hash,expires_at,revoked_at) values($1,'CREATOR',$2,$3,$4)`,
      [
        email,
        hash,
        mode === "expired" ? "2000-01-01" : "2030-01-01",
        mode === "revoked" ? "2020-01-01" : null,
      ],
    );
    await assert.rejects(
      db.query(
        "insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)",
        [randomUUID(), email, JSON.stringify({ invitation_hash: hash })],
      ),
      /Valid invitation required/,
    );
  }
});
await test("creator edits own profile but cannot edit another", async () => {
  await asUser(creator, async () => {
    assert.equal(
      (
        await db.query(
          "update creator_profiles set headline=$1 where id=$2 returning id",
          ["New headline", creator],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update creator_profiles set headline=$1 where id=$2 returning id",
          ["Attack", other],
        )
      ).rows.length,
      0,
    );
  });
});
await test("creator cannot self-verify or access private contacts of another creator", async () => {
  await assert.rejects(
    asUser(creator, () =>
      db.query("update creator_profiles set verified=true where id=$1", [
        creator,
      ]),
    ),
    /admin-controlled/,
  );
  await asUser(creator, async () =>
    assert.equal(
      (await db.query("select * from creator_contacts where id=$1", [other]))
        .rows.length,
      0,
    ),
  );
});
await test("creator cannot escalate role, audit access, or suspend accounts", async () => {
  await asUser(creator, async () => {
    assert.equal(
      (
        await db.query(
          "update profiles set role='ADMIN' where id=$1 returning id",
          [creator],
        )
      ).rows.length,
      0,
    );
    assert.equal((await db.query("select * from audit_logs")).rows.length, 0);
    assert.equal(
      (
        await db.query(
          "update profiles set status='SUSPENDED' where id=$1 returning id",
          [other],
        )
      ).rows.length,
      0,
    );
  });
});
await test("brand cannot modify another company", async () => {
  await asUser(brand, async () => {
    assert.equal(
      (
        await db.query(
          "update brands set name='Intruder' where id=$1 returning id",
          [otherBrand],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update brands set name='Demo company' where id=$1 returning id",
          [brandId],
        )
      ).rows.length,
      1,
    );
  });
});
let opportunity;
await test("brand creates draft and submits for approval", async () => {
  await asUser(brand, async () => {
    opportunity = (
      await db.query(
        "insert into opportunities(brand_id,title,summary,description,external_url) values($1,'Test campaign','Summary','Description','https://example.com/apply') returning id",
        [brandId],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          "update opportunities set status='PENDING' where id=$1 returning status",
          [opportunity],
        )
      ).rows[0].status,
      "PENDING",
    );
  });
});
await test("brand cannot approve its own opportunity", async () => {
  await asUser(brand, async () =>
    assert.equal(
      (
        await db.query(
          "update opportunities set status='LIVE' where id=$1 returning id",
          [opportunity],
        )
      ).rows.length,
      0,
    ),
  );
});
await test("pending opportunity is invisible to creators", async () => {
  await asUser(creator, async () =>
    assert.equal(
      (
        await db.query("select id from opportunities where id=$1", [
          opportunity,
        ])
      ).rows.length,
      0,
    ),
  );
});
await test("admin approval exposes listing and records immutable audit", async () => {
  await asUser(admin, async () => {
    await db.query("update opportunities set status='LIVE' where id=$1", [
      opportunity,
    ]);
    assert.ok(
      (
        await db.query("select id from audit_logs where entity_id=$1", [
          opportunity,
        ])
      ).rows.length > 0,
    );
  });
  await assert.rejects(
    asUser(admin, () => db.query("delete from audit_logs")),
    /permission denied/,
  );
  await asUser(creator, async () =>
    assert.equal(
      (
        await db.query("select id from opportunities where id=$1", [
          opportunity,
        ])
      ).rows.length,
      1,
    ),
  );
});
await test("saved opportunities are unique and owned", async () => {
  await asUser(creator, () =>
    db.query(
      "insert into saved_opportunities(user_id,opportunity_id) values($1,$2)",
      [creator, opportunity],
    ),
  );
  await assert.rejects(
    asUser(creator, () =>
      db.query(
        "insert into saved_opportunities(user_id,opportunity_id) values($1,$2)",
        [creator, opportunity],
      ),
    ),
    /unique/,
  );
  await asUser(other, async () =>
    assert.equal(
      (await db.query("select * from saved_opportunities")).rows.length,
      0,
    ),
  );
});
await test("brand can save creators and creator cannot use brand saves", async () => {
  await asUser(brand, () =>
    db.query("insert into saved_creators(user_id,creator_id) values($1,$2)", [
      brand,
      creator,
    ]),
  );
  await assert.rejects(
    asUser(creator, () =>
      db.query("insert into saved_creators(user_id,creator_id) values($1,$2)", [
        creator,
        other,
      ]),
    ),
    /row-level security/,
  );
});
await test("suspension blocks existing sessions and restoration restores access", async () => {
  await asUser(admin, () =>
    db.query("update profiles set status='SUSPENDED' where id=$1", [creator]),
  );
  await asUser(creator, async () => {
    assert.equal(
      (await db.query("select * from opportunities")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update creator_profiles set bio='Bypass' where id=$1 returning id",
          [creator],
        )
      ).rows.length,
      0,
    );
  });
  await asUser(admin, () =>
    db.query("update profiles set status='ACTIVE' where id=$1", [creator]),
  );
  await asUser(creator, async () =>
    assert.equal(
      (
        await db.query("select id from opportunities where id=$1", [
          opportunity,
        ])
      ).rows.length,
      1,
    ),
  );
});
await test("manual sources cannot be represented as API verified", async () => {
  await assert.rejects(
    asUser(creator, () =>
      db.query(
        "insert into social_accounts(creator_id,platform,username,profile_url,connection_method) values($1,'TikTok','demo','https://tiktok.com/@demo','OAUTH')",
        [creator],
      ),
    ),
    /protected/,
  );
  await assert.rejects(
    asUser(creator, () =>
      db.query(
        "insert into creator_earnings(creator_id,source,amount,period,verified) values($1,'OTHER',10,'2026-11-01',true)",
        [creator],
      ),
    ),
    /self-reported/,
  );
});
await test("ordinary administrators cannot invite other administrators", async () => {
  await assert.rejects(
    asUser(admin, () =>
      db.query(
        "insert into invitations(email,role,token_hash) values('escalation@example.test','ADMIN',$1)",
        ["a".repeat(64)],
      ),
    ),
    /Privileged administrator/,
  );
});
await test("billing defaults off and normal users cannot change it", async () => {
  assert.equal(
    (
      await db.query(
        "select enabled from feature_flags where id='brand_billing_enabled'",
      )
    ).rows[0].enabled,
    false,
  );
  await asUser(brand, async () =>
    assert.equal(
      (
        await db.query(
          "update feature_flags set enabled=true where id='brand_billing_enabled' returning id",
        )
      ).rows.length,
      0,
    ),
  );
});
await test("sensitive rate-limiter RPC is service-only", async () => {
  await assert.rejects(
    asUser(creator, () =>
      db.query("select consume_rate_limit('attack',10,60)"),
    ),
    /permission denied/,
  );
});
console.log(
  `\n${passed} database security integration tests passed. PostgreSQL engine: PGlite. Auth/storage schemas emulated; real GoTrue and Storage APIs require Supabase E2E.`,
);
await db.close();
