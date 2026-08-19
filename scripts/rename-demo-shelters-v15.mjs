import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.API_URL;

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL / service role key.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MAPPING = [
  { person: "max", shelter: "אס.או.אס" },
  { person: "maya", shelter: "תנו לחיות לחיות" },
  { person: "noa", shelter: "צער בעלי חיים" },
  { person: "daniel", shelter: "יד4" },
];

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function firstName(value) {
  return normalized(value).split(/\s+/)[0] || "";
}

async function main() {
  console.log("🏠 TinDog V15 — demo shelter names");

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("*");

  if (error) throw error;

  const backupDir = path.resolve(".tindog-backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDir,
    `demo-shelter-names-v15-${stamp}.json`,
  );

  fs.writeFileSync(
    backupPath,
    JSON.stringify(profiles || [], null, 2),
    "utf8",
  );

  console.log(`📦 Profile backup: ${backupPath}`);

  let changed = 0;

  for (const item of MAPPING) {
    const candidates = (profiles || []).filter((profile) => {
      const display = firstName(profile.display_name);
      const shelter = firstName(profile.shelter_name);
      return display === item.person || shelter === item.person;
    });

    if (candidates.length === 0) {
      console.log(`⚠️ ${item.person}: לא נמצא פרופיל מתאים`);
      continue;
    }

    if (candidates.length > 1) {
      console.log(
        `⚠️ ${item.person}: נמצאו ${candidates.length} פרופילים; מעדכנת את כולם`,
      );
    }

    for (const profile of candidates) {
      const patch = {
        display_name: item.shelter,
      };

      if ("shelter_name" in profile) {
        patch.shelter_name = item.shelter;
      }

      if ("account_mode" in profile) {
        patch.account_mode =
          profile.account_mode === "adopter" ? "both" : profile.account_mode;
      }

      const { error: updateError } = await admin
        .from("profiles")
        .update(patch)
        .eq("id", profile.id);

      if (updateError) throw updateError;

      changed += 1;
      console.log(
        `✅ ${profile.display_name || item.person} → ${item.shelter}`,
      );
    }
  }

  console.log("");
  console.log(`🎉 V15 finished — ${changed} profile(s) updated.`);
  console.log("");
  console.log("Mapping:");
  console.log("  Max    → אס.או.אס");
  console.log("  Maya   → תנו לחיות לחיות");
  console.log("  Noa    → צער בעלי חיים");
  console.log("  Daniel → יד4");
}

main().catch((error) => {
  console.error("❌ V15 failed");
  console.error(error);
  process.exit(1);
});
