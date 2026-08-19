import { createClient } from "@supabase/supabase-js";

const DOG_LIMIT = Math.max(1, Math.min(500, Number(process.env.MEDIA_DOG_LIMIT || 100)));

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

const GENERATED_PATTERNS = [
  "/demo-commons/",
  "/demo-v2/",
  "/demo-v3/",
  "/demo-v4/",
  "placedog.net/",
  "dog.ceo/",
  "source.unsplash.com/",
  "images.unsplash.com/",
  "pexels.com/",
  "wikimedia.org/",
  "commons.wikimedia.org/",
];

function str(v) {
  return String(v ?? "");
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(str(value));
}

function looksGenerated(value) {
  const s = str(value);
  return isExternalUrl(s) || GENERATED_PATTERNS.some((p) => s.includes(p));
}

function cleanBaseUrl(value) {
  const raw = str(value);
  if (!/^https?:\/\//i.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete("tindog_view");
    return parsed.toString();
  } catch {
    return raw.replace(/([?&])tindog_view=\d+(&?)/g, (_m, a, b) => (a === "?" && b ? "?" : b ? a : ""));
  }
}

async function tableExists(name) {
  const { error } = await admin.from(name).select("*").limit(1);
  if (!error) return true;
  const msg = str(error.message).toLowerCase();
  if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache")) {
    return false;
  }
  return true;
}

async function removeMediaRows(tableName, dogId) {
  try {
    const { error } = await admin.from(tableName).delete().eq("dog_id", dogId);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🐶 TinDog V6 — media consistency");
  console.log("- Demo dogs keep one real main photo only");
  console.log("- Repeated duplicate photos are removed");
  console.log("- Demo bark/video media are cleared unless you upload matched media manually\n");

  const { data: dogs, error: dogsError } = await admin
    .from("dogs")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogsError) throw dogsError;
  if (!dogs?.length) {
    console.log("No dogs found.");
    return;
  }

  const { data: photoRows, error: photoErr } = await admin
    .from("dog_photos")
    .select("id,dog_id,storage_path,sort_order");
  if (photoErr) throw photoErr;

  const photosByDog = new Map();
  for (const row of photoRows || []) {
    const arr = photosByDog.get(row.dog_id) || [];
    arr.push(row);
    photosByDog.set(row.dog_id, arr);
  }

  const dogRowKeys = new Set(Object.keys(dogs[0] || {}));
  const updatableNullableColumns = [
    "video_url",
    "video_path",
    "video_storage_path",
    "video_storage_key",
    "audio_url",
    "audio_path",
    "audio_storage_path",
    "audio_storage_key",
    "bark_url",
    "bark_path",
    "bark_storage_path",
    "bark_storage_key",
  ].filter((k) => dogRowKeys.has(k));

  const candidateTables = ["dog_videos", "dog_video", "dog_barks", "dog_sounds", "dog_audio"];
  const existingMediaTables = [];
  for (const table of candidateTables) {
    if (await tableExists(table)) existingMediaTables.push(table);
  }

  let changedDogs = 0;
  let removedPhotoRows = 0;
  let insertedPhotoRows = 0;
  let clearedDogColumns = 0;
  let clearedTableRows = 0;
  let preservedManual = 0;

  for (const dog of dogs) {
    const existing = (photosByDog.get(dog.id) || []).slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    const manualPhotos = existing.filter((r) => !looksGenerated(r.storage_path));

    if (manualPhotos.length > 0) {
      // Preserve manually managed photos exactly as they are.
      preservedManual += 1;
      continue;
    }

    const firstRealish = existing.find((r) => isExternalUrl(r.storage_path) && !str(r.storage_path).includes("placedog.net/"));
    const chosenPhoto = firstRealish ? cleanBaseUrl(firstRealish.storage_path) : null;

    if (!chosenPhoto) {
      console.log(`⚠️ ${dog.name}: no usable real photo URL found, leaving current photos as-is`);
      continue;
    }

    // Remove all generated photo rows for this demo dog.
    if (existing.length > 0) {
      const ids = existing.map((r) => r.id);
      const { error } = await admin.from("dog_photos").delete().in("id", ids);
      if (error) throw error;
      removedPhotoRows += ids.length;
    }

    const { error: insErr } = await admin.from("dog_photos").insert([
      { dog_id: dog.id, storage_path: chosenPhoto, sort_order: 0 },
    ]);
    if (insErr) throw insErr;
    insertedPhotoRows += 1;

    if (updatableNullableColumns.length > 0) {
      const patch = Object.fromEntries(updatableNullableColumns.map((k) => [k, null]));
      const { error } = await admin.from("dogs").update(patch).eq("id", dog.id);
      if (!error) clearedDogColumns += 1;
    }

    for (const table of existingMediaTables) {
      const removed = await removeMediaRows(table, dog.id);
      if (removed) clearedTableRows += 1;
    }

    changedDogs += 1;
    console.log(`✅ ${dog.name}: kept ONE main photo, removed repeated gallery copies, cleared demo audio/video`);
  }

  console.log("\n🎉 TinDog V6 finished");
  console.log(`Demo dogs normalized: ${changedDogs}`);
  console.log(`Manual-photo dogs preserved: ${preservedManual}`);
  console.log(`Photo rows removed: ${removedPhotoRows}`);
  console.log(`Photo rows inserted: ${insertedPhotoRows}`);
  console.log(`Dogs with audio/video columns cleared: ${clearedDogColumns}`);
  console.log(`Media-table delete operations applied: ${clearedTableRows}`);
}

main().catch((error) => {
  console.error("\n❌ TinDog V6 failed");
  console.error(error);
  process.exit(1);
});
