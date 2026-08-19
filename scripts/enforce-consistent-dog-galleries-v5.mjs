import { createClient } from "@supabase/supabase-js";

const DOG_LIMIT = Math.max(
  1,
  Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 50)),
);

const VIEWS_PER_DOG = Math.max(
  1,
  Math.min(8, Number(process.env.MEDIA_PHOTOS_PER_DOG || 6)),
);

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.API_URL;

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase URL / service role key.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getFallbackRealDogPhoto() {
  const response = await fetch("https://dog.ceo/api/breeds/image/random", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Dog CEO HTTP ${response.status}`);
  }
  const json = await response.json();
  if (json?.status !== "success" || !json?.message) {
    throw new Error("Dog CEO did not return a usable image.");
  }
  return String(json.message);
}

function isGeneratedDemoPhoto(value) {
  const path = String(value || "");
  return (
    /^https?:\/\//i.test(path) ||
    path.includes("/demo-commons/") ||
    path.includes("/demo-v2/") ||
    path.includes("/demo-v3/") ||
    path.includes("/demo-v4/") ||
    path.includes("placedog.net/")
  );
}

function cleanBaseUrl(value) {
  const raw = String(value || "");
  if (!/^https?:\/\//i.test(raw)) return raw;

  const parsed = new URL(raw);
  parsed.searchParams.delete("tindog_view");
  return parsed.toString();
}

function viewUrl(base, index) {
  const parsed = new URL(base);
  parsed.searchParams.set("tindog_view", String(index + 1));
  return parsed.toString();
}

async function main() {
  console.log("🐶 TinDog V5 — consistent dog galleries");
  console.log("   Generated demo profiles use ONE real dog consistently.\\n");

  const { data: dogs, error: dogsError } = await admin
    .from("dogs")
    .select("id,name,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogsError) throw dogsError;
  if (!dogs?.length) {
    console.log("No dogs found.");
    return;
  }

  const { data: rows, error: rowsError } = await admin
    .from("dog_photos")
    .select("id,dog_id,storage_path,sort_order");

  if (rowsError) throw rowsError;

  const byDog = new Map();
  for (const row of rows || []) {
    const list = byDog.get(row.dog_id) || [];
    list.push(row);
    byDog.set(row.dog_id, list);
  }

  let fixedProfiles = 0;
  let preservedManualProfiles = 0;
  let rowsRemoved = 0;
  let rowsAdded = 0;

  for (let index = 0; index < dogs.length; index += 1) {
    const dog = dogs[index];
    const existing = (byDog.get(dog.id) || []).slice().sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );

    const manual = existing.filter(
      (row) => !isGeneratedDemoPhoto(row.storage_path),
    );

    if (manual.length > 0) {
      const generatedIds = existing
        .filter((row) => isGeneratedDemoPhoto(row.storage_path))
        .map((row) => row.id);

      if (generatedIds.length) {
        const { error } = await admin
          .from("dog_photos")
          .delete()
          .in("id", generatedIds);
        if (error) throw error;
        rowsRemoved += generatedIds.length;
      }

      preservedManualProfiles += 1;
      console.log(
        `✅ ${dog.name}: kept ${manual.length} manually uploaded photo(s)`,
      );
      continue;
    }

    const firstExternal = existing.find((row) =>
      /^https?:\/\//i.test(String(row.storage_path || "")),
    );

    let basePhoto = firstExternal
      ? cleanBaseUrl(firstExternal.storage_path)
      : null;

    if (basePhoto && basePhoto.includes("placedog.net/")) {
      basePhoto = null;
    }

    if (!basePhoto) {
      basePhoto = await getFallbackRealDogPhoto();
    }

    const ids = existing.map((row) => row.id);
    if (ids.length) {
      const { error } = await admin.from("dog_photos").delete().in("id", ids);
      if (error) throw error;
      rowsRemoved += ids.length;
    }

    const inserts = Array.from({ length: VIEWS_PER_DOG }, (_, viewIndex) => ({
      dog_id: dog.id,
      storage_path: viewUrl(basePhoto, viewIndex),
      sort_order: viewIndex,
    }));

    const { error: insertError } = await admin
      .from("dog_photos")
      .insert(inserts);

    if (insertError) throw insertError;

    rowsAdded += inserts.length;
    fixedProfiles += 1;

    console.log(
      `✅ ${String(index + 1).padStart(2, "0")}/${dogs.length} ${dog.name}: ` +
        `${VIEWS_PER_DOG} views of the same real dog`,
    );
  }

  console.log("\\n🎉 CONSISTENT GALLERIES V5 FINISHED");
  console.log(`Generated profiles normalized: ${fixedProfiles}`);
  console.log(`Manual-photo profiles preserved: ${preservedManualProfiles}`);
  console.log(`Old/mixed photo rows removed: ${rowsRemoved}`);
  console.log(`Consistent gallery rows added: ${rowsAdded}`);
}

main().catch((error) => {
  console.error("\\n❌ CONSISTENT GALLERIES V5 FAILED");
  console.error(error);
  process.exit(1);
});
