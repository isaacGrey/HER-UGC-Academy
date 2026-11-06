import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "Set BOOTSTRAP_ADMIN_EMAIL and a unique BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters.",
  );
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { count, error: checkError } = await client
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "ADMIN")
  .eq("status", "ACTIVE");
if (checkError) throw checkError;
if (count)
  throw new Error(
    "An active administrator already exists. Use the invitation flow.",
  );
const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
const { error: inviteError } = await client
  .from("invitations")
  .insert({ email, role: "ADMIN", token_hash: hash });
if (inviteError) throw inviteError;
const { data, error } = await client.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { invitation_hash: hash },
  user_metadata: { display_name: "Academy Administrator" },
});
if (error) throw error;
const { error: profileError } = await client
  .from("profiles")
  .update({ can_invite_admin: true })
  .eq("id", data.user.id);
if (profileError) throw profileError;
console.log(
  "Administrator created. Remove bootstrap password variables from the environment.",
);
