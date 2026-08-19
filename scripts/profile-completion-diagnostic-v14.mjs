import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.API_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
if (!url || !key) process.exit(0);

const s = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await s
  .from("profiles")
  .select("id,display_name,city,bio,account_mode,household_type,activity_level,preferred_size,dog_experience,has_children_answered,has_other_pets_answered,shelter_name,profile_completed_at")
  .order("created_at", { ascending: true });

if (error) {
  console.log("⚠️ profile diagnostic skipped:", error.message);
  process.exit(0);
}

function complete(p) {
  return Boolean(
    p.display_name?.trim() && p.city?.trim() && p.bio?.trim() && p.account_mode &&
    p.household_type && p.activity_level && p.preferred_size && p.dog_experience &&
    p.has_children_answered && p.has_other_pets_answered &&
    (p.account_mode === "adopter" || p.shelter_name?.trim())
  );
}

console.log("\n🔎 Profile completion");
for (const p of data || []) {
  console.log(`   ${complete(p) ? "✅" : "⚠️"} ${p.display_name}: ${complete(p) ? "complete" : "must complete profile before matching"}`);
}
