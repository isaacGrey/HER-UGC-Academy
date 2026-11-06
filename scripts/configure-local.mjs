import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const raw = await readFile(".local/supabase-status.json", "utf8");
const start = raw.indexOf("{");
const end = raw.lastIndexOf("}");
const status = JSON.parse(raw.slice(start, end + 1));
if (!status.API_URL?.includes("127.0.0.1"))
  throw new Error("Expected local Supabase");
const existing = await readFile(".env.local", "utf8").catch(() => null);
if (existing)
  throw new Error(".env.local already exists; refusing to overwrite it");
await writeFile(
  ".env.local",
  `NEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}\nSUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}\nSEED_PASSWORD=${randomBytes(24).toString("base64url")}\n`,
);
console.log(
  "Local Supabase environment configured. Credentials are stored only in ignored local files.",
);
