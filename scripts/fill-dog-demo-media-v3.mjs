import { createClient } from "@supabase/supabase-js";

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

const DOG_LIMIT = Math.max(
  1,
  Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 50)),
);

const PHOTOS_PER_DOG = Math.max(
  1,
  Math.min(8, Number(process.env.MEDIA_PHOTOS_PER_DOG || 6)),
);

// Placedog explicitly provides dog placeholder photos for websites/projects.
// We store the URLs directly instead of downloading/uploading 300 files.
function photoUrl(dogIndex, photoIndex) {
  // Spread the requested IDs so neighbouring profiles do not get the same set.
  const imageId = ((dogIndex * 17 + photoIndex * 29 + 31) % 900) + 1;
  return `https://placedog.net/900/1100?id=${imageId}`;
}

// A few Wikimedia Commons dog sounds/videos. They are linked directly and
// streamed only when the user opens/plays the media.
const BARKS = [
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barking%20of%20a%20dog.ogg",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barking%20of%20a%20dog%202.ogg",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barking%20dog%20in%20Rome.ogg",
];

const VIDEOS = [
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/2015-11-11%20Labradoodle%20Berlin.webm",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Shiba%20hond%20die%20wil%20wandelen%2C%20-Oct%2C%202012%20a.ogv",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/2022-04-27%20STARA%20DOLINA%20Di%20Valle%20Vecchia%20CARNIVORA%20Canis%20lupus%20familiaris%20DOMA%C4%8CI%20PES.webm",
];

async function main() {
  console.log("🐶 TinDog Media V3");
  console.log("   No mass media downloads; adding direct demo URLs.\n");

  const { data: dogs, error: dogsError } = await admin
    .from("dogs")
    .select("id,name,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogsError) throw dogsError;
  if (!dogs?.length) {
    console.log("No dogs found.");
    return;
  }

  const { data: photos, error: photosError } = await admin
    .from("dog_photos")
    .select("id,dog_id,storage_path,sort_order");

  if (photosError) throw photosError;

  const byDog = new Map();
  for (const photo of photos || []) {
    const list = byDog.get(photo.dog_id) || [];
    list.push(photo);
    byDog.set(photo.dog_id, list);
  }

  let photosAdded = 0;
  let barksAdded = 0;
  let videosAdded = 0;

  for (let dogIndex = 0; dogIndex < dogs.length; dogIndex += 1) {
    const dog = dogs[dogIndex];
    const existing = (byDog.get(dog.id) || []).sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );

    // Only external demo rows count toward the new demo set.
    const external = existing.filter((p) =>
      String(p.storage_path || "").startsWith("https://placedog.net/"),
    );

    const needed = Math.max(0, PHOTOS_PER_DOG - external.length);
    const maxSort = existing.reduce(
      (max, p) => Math.max(max, Number(p.sort_order || 0)),
      -1,
    );

    for (let j = 0; j < needed; j += 1) {
      const storagePath = photoUrl(dogIndex, external.length + j);
      const duplicate = existing.some((p) => p.storage_path === storagePath);
      if (duplicate) continue;

      const { error } = await admin.from("dog_photos").insert({
        dog_id: dog.id,
        storage_path: storagePath,
        sort_order: maxSort + j + 1,
      });
      if (error) throw error;
      photosAdded += 1;
    }

    const barkMissing =
      !dog.bark_audio_path ||
      String(dog.bark_audio_path).includes("/demo-commons/") ||
      String(dog.bark_audio_path).includes("/demo-v2/");

    if (barkMissing) {
      const { error } = await admin
        .from("dogs")
        .update({ bark_audio_path: BARKS[dogIndex % BARKS.length] })
        .eq("id", dog.id);
      if (error) throw error;
      barksAdded += 1;
    }

    const videoMissing =
      !dog.video_path ||
      String(dog.video_path).includes("/demo-commons/") ||
      String(dog.video_path).includes("/demo-v2/");

    if (videoMissing) {
      const { error } = await admin
        .from("dogs")
        .update({ video_path: VIDEOS[dogIndex % VIDEOS.length] })
        .eq("id", dog.id);
      if (error) throw error;
      videosAdded += 1;
    }

    console.log(
      `✅ ${String(dogIndex + 1).padStart(2, "0")}/${dogs.length} ${dog.name}: ` +
        `${PHOTOS_PER_DOG} demo photos · bark · video`,
    );
  }

  const { count: photoCount, error: countError } = await admin
    .from("dog_photos")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  console.log("\n🎉 MEDIA V3 FINISHED");
  console.log(`Dogs processed: ${dogs.length}`);
  console.log(`Photo rows added: ${photosAdded}`);
  console.log(`Bark links added/repaired: ${barksAdded}`);
  console.log(`Video links added/repaired: ${videosAdded}`);
  console.log(`Total dog_photos rows now: ${photoCount ?? "unknown"}`);
}

main().catch((error) => {
  console.error("\n❌ MEDIA V3 FAILED");
  console.error(error);
  process.exit(1);
});
