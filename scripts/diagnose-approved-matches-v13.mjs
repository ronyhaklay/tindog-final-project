import { createClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.API_URL;

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!url || !key) process.exit(0);

const s = createClient(url, key, {
  auth: { persistSession: false },
});

const { data: requests, error } = await s
  .from("match_requests")
  .select("id,status,requester_id,dog_id,updated_at,dogs(name,owner_id)")
  .order("updated_at", { ascending: false });

if (error) {
  console.log("⚠️ Could not read match diagnostics:", error.message);
  process.exit(0);
}

const approved = (requests || []).filter((x) => x.status === "approved");
const pending = (requests || []).filter((x) => x.status === "pending");

console.log("");
console.log("🔎 Match diagnostics");
console.log(`   approved requests: ${approved.length}`);
console.log(`   pending requests:  ${pending.length}`);

for (const row of approved.slice(0, 12)) {
  const dogName = row.dogs?.name || "dog";
  console.log(`   ✅ ${dogName} — approved — ${row.id}`);
}
