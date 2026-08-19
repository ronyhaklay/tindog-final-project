// Removes ONLY the extra human demo accounts accidentally introduced by the 50-user seed.
// Preserves: maya, daniel, noa, alex @demo.tindog.app
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-extra-demo-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const domain = "@demo.tindog.app";
const keep = new Set([
  "maya@demo.tindog.app",
  "daniel@demo.tindog.app",
  "noa@demo.tindog.app",
  "alex@demo.tindog.app",
]);

async function main() {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  const extras = data.users.filter((u) => u.email?.endsWith(domain) && !keep.has(u.email));
  if (extras.length === 0) {
    console.log("No extra demo human users found. Nothing to delete.");
    return;
  }

  console.log(`Deleting ${extras.length} extra demo human users...`);
  for (const user of extras) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    console.log(`Deleted ${user.email}`);
  }
  console.log("Cleanup complete. Preserved Maya, Daniel, Noa and Alex.");
}

main().catch((e) => { console.error(e); process.exit(1); });
