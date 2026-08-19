import { createClient } from "@supabase/supabase-js";

const localUrl = process.env.LOCAL_SUPABASE_URL;
const localKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
const cloudUrl = process.env.CLOUD_SUPABASE_URL;
const cloudKey = process.env.CLOUD_SUPABASE_SERVICE_ROLE_KEY;

if (!localUrl || !localKey || !cloudUrl || !cloudKey) {
  console.error("Missing local/cloud Supabase credentials.");
  process.exit(1);
}

const local = createClient(localUrl, localKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const cloud = createClient(cloudUrl, cloudKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const shelterNames = new Map([
  ["maya@demo.tindog.app", "תנו לחיות לחיות"],
  ["daniel@demo.tindog.app", "יד4"],
  ["noa@demo.tindog.app", "צער בעלי חיים"],
  ["max@demo.tindog.app", "אס.או.אס"],
]);

const external = (value) => /^https?:\/\//i.test(String(value || ""));
const norm = (value) => String(value || "").trim().toLowerCase();

async function getAllAuthUsers(client) {
  const result = [];
  let page = 1;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    result.push(...(data.users || []));
    if (!data.users || data.users.length < 1000) break;
    page += 1;
  }
  return result;
}

async function updateCloudShelterNames() {
  const users = await getAllAuthUsers(cloud);
  let updated = 0;

  for (const user of users) {
    const email = norm(user.email);
    const shelter = shelterNames.get(email);
    if (!shelter) continue;

    const { error } = await cloud
      .from("profiles")
      .update({
        display_name: shelter,
        shelter_name: shelter,
        account_mode: "lister",
        role: "shelter_admin",
        shelter_verified: true,
      })
      .eq("id", user.id);

    if (error) throw error;
    updated += 1;
    console.log(`🏠 ${email} -> ${shelter}`);
  }

  return updated;
}

async function main() {
  console.log("☁️ TinDog V17 — sync current local media to cloud");
  console.log("");

  const { data: localDogs, error: localDogsError } = await local
    .from("dogs")
    .select("id,name,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true });

  if (localDogsError) throw localDogsError;

  const { data: cloudDogs, error: cloudDogsError } = await cloud
    .from("dogs")
    .select("id,name,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true });

  if (cloudDogsError) throw cloudDogsError;

  const { data: localPhotos, error: localPhotosError } = await local
    .from("dog_photos")
    .select("dog_id,storage_path,sort_order")
    .order("sort_order", { ascending: true });

  if (localPhotosError) throw localPhotosError;

  const photosByLocalDog = new Map();
  for (const photo of localPhotos || []) {
    const list = photosByLocalDog.get(photo.dog_id) || [];
    list.push(photo);
    photosByLocalDog.set(photo.dog_id, list);
  }

  const localByName = new Map();
  for (const dog of localDogs || []) {
    const key = norm(dog.name);
    if (!localByName.has(key)) localByName.set(key, dog);
  }

  let matched = 0;
  let photoRows = 0;
  let withVideo = 0;
  let withBark = 0;
  let missingLocalDog = 0;
  let skippedLocalOnlyPhotos = 0;

  for (const cloudDog of cloudDogs || []) {
    const localDog = localByName.get(norm(cloudDog.name));

    if (!localDog) {
      missingLocalDog += 1;
      console.log(`⚠️ ${cloudDog.name}: לא נמצא כלב מקביל ב-local`);
      continue;
    }

    matched += 1;

    const patch = {};
    if (external(localDog.video_path)) {
      patch.video_path = localDog.video_path;
      withVideo += 1;
    }
    if (external(localDog.bark_audio_path)) {
      patch.bark_audio_path = localDog.bark_audio_path;
      withBark += 1;
    }

    if (Object.keys(patch).length) {
      const { error } = await cloud
        .from("dogs")
        .update(patch)
        .eq("id", cloudDog.id);
      if (error) throw error;
    }

    const allLocalDogPhotos = photosByLocalDog.get(localDog.id) || [];
    const usablePhotos = allLocalDogPhotos.filter((p) =>
      external(p.storage_path),
    );

    skippedLocalOnlyPhotos += allLocalDogPhotos.length - usablePhotos.length;

    if (usablePhotos.length) {
      const { error: deleteError } = await cloud
        .from("dog_photos")
        .delete()
        .eq("dog_id", cloudDog.id);

      if (deleteError) throw deleteError;

      const rows = usablePhotos.map((p, index) => ({
        dog_id: cloudDog.id,
        storage_path: p.storage_path,
        sort_order: Number.isFinite(Number(p.sort_order))
          ? Number(p.sort_order)
          : index,
      }));

      const { error: insertError } = await cloud
        .from("dog_photos")
        .insert(rows);

      if (insertError) throw insertError;
      photoRows += rows.length;
    }

    console.log(
      `✅ ${cloudDog.name}: ${usablePhotos.length} תמונות` +
        `${external(localDog.video_path) ? " · וידאו" : ""}` +
        `${external(localDog.bark_audio_path) ? " · נביחה" : ""}`,
    );
  }

  console.log("");
  console.log("🏠 מעדכנת את שמות עמותות הדמו בענן...");
  const shelterProfiles = await updateCloudShelterNames();

  console.log("");
  console.log("🎉 CLOUD SYNC V17 FINISHED");
  console.log(`Dogs matched local -> cloud: ${matched}`);
  console.log(`Photo rows copied: ${photoRows}`);
  console.log(`Dogs with video copied: ${withVideo}`);
  console.log(`Dogs with bark copied: ${withBark}`);
  console.log(`Shelter profiles renamed: ${shelterProfiles}`);
  console.log(`Cloud dogs missing local match: ${missingLocalDog}`);
  console.log(
    `Local-only storage photos skipped (would not work online): ${skippedLocalOnlyPhotos}`,
  );
}

main().catch((error) => {
  console.error("❌ CLOUD SYNC V17 FAILED");
  console.error(error);
  process.exit(1);
});
