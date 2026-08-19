import { createClient } from "@supabase/supabase-js";

const DOG_API = "https://dog.ceo/api";
const DOG_LIMIT = Math.max(1, Math.min(100, Number(process.env.MEDIA_DOG_LIMIT || 50)));
const PHOTOS_PER_DOG = Math.max(1, Math.min(8, Number(process.env.MEDIA_PHOTOS_PER_DOG || 6)));

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BARKS = [
  "https://upload.wikimedia.org/wikipedia/commons/a/a2/Barking_of_a_dog.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/5/58/Barking_of_a_dog_2.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f0/Barking_dog_in_Rome.ogg",
];

const VIDEOS = [
  "https://upload.wikimedia.org/wikipedia/commons/2/21/Puppy_playing.webm",
  "https://upload.wikimedia.org/wikipedia/commons/4/4f/Howling_Husky_Dog.webm",
  "https://upload.wikimedia.org/wikipedia/commons/7/77/-01-_Miniature_Pinscher_puppy.webm",
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

async function fetchJson(endpoint) {
  let wait = 900;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = await fetch(`${DOG_API}${endpoint}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.status !== "success") {
        throw new Error(`Dog API returned non-success for ${endpoint}`);
      }
      return json.message;
    }

    if (res.status === 429 || res.status >= 500) {
      await sleep(wait);
      wait *= 2;
      continue;
    }

    throw new Error(`Dog API HTTP ${res.status} for ${endpoint}`);
  }

  throw new Error(`Dog API failed after retries for ${endpoint}`);
}

function allBreedCandidates(breedMap) {
  const candidates = [];
  for (const [breed, subs] of Object.entries(breedMap)) {
    candidates.push({
      key: breed,
      endpoint: `/breed/${breed}/images`,
      tokens: [breed],
    });
    for (const sub of subs || []) {
      candidates.push({
        key: `${breed}/${sub}`,
        endpoint: `/breed/${breed}/${sub}/images`,
        tokens: [breed, sub],
      });
    }
  }
  return candidates;
}

const ALIASES = [
  ["retriever", "retriever/golden"],
  ["golden", "retriever/golden"],
  ["labrador", "labrador"],
  ["lab", "labrador"],
  ["pinscher", "pinscher/miniature"],
  ["collie", "collie/border"],
  ["border collie", "collie/border"],
  ["german shepherd", "germanshepherd"],
  ["shepherd", "germanshepherd"],
  ["cocker", "spaniel/cocker"],
  ["spaniel", "spaniel/cocker"],
  ["corgi", "pembroke"],
  ["bulldog", "bulldog/english"],
  ["poodle", "poodle"],
  ["terrier", "terrier"],
  ["beagle", "beagle"],
  ["boxer", "boxer"],
  ["chihuahua", "chihuahua"],
  ["dachshund", "dachshund"],
  ["husky", "husky"],
  ["malamute", "malamute"],
  ["samoyed", "samoyed"],
  ["rottweiler", "rottweiler"],
  ["pug", "pug"],
  ["whippet", "whippet"],
];

function chooseBreedPath(rawBreed, candidates) {
  const breed = normalize(rawBreed);
  if (!breed) return null;

  for (const [needle, wanted] of ALIASES) {
    if (breed.includes(needle)) {
      const hit = candidates.find((c) => c.key === wanted);
      if (hit) return hit;
    }
  }

  const words = new Set(breed.split(" ").filter((w) => w.length >= 3));
  let best = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    let score = 0;
    for (const token of candidate.tokens) {
      if (words.has(token)) score += 3;
      else if (breed.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore > 0 ? best : null;
}

function isOldDemoPhoto(path) {
  const value = String(path || "");
  return (
    value.includes("/demo-commons/") ||
    value.includes("/demo-v2/") ||
    value.includes("/demo-v3/") ||
    value.includes("placedog.net/")
  );
}

function isOldDemoMedia(path) {
  const value = String(path || "");
  return (
    !value ||
    value.includes("/demo-commons/") ||
    value.includes("/demo-v2/") ||
    value.includes("/demo-v3/") ||
    value.includes("Special:Redirect/file")
  );
}

function pickDistinct(pool, seed, count) {
  if (!pool.length) return [];
  const picked = [];
  const seen = new Set();

  for (let step = 0; step < pool.length * 2 && picked.length < count; step += 1) {
    const index = (seed * 11 + step * 17) % pool.length;
    const item = pool[index];
    if (seen.has(item)) continue;
    seen.add(item);
    picked.push(item);
  }
  return picked;
}

async function main() {
  console.log("🐶 TinDog Real Media V4");
  console.log("   Replacing only old DEMO media, keeping manually uploaded media.\n");

  const breedMap = await fetchJson("/breeds/list/all");
  const candidates = allBreedCandidates(breedMap);
  const genericPool = await fetchJson("/breeds/image/random/50");

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("id,name,breed,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogError) throw dogError;
  if (!dogs?.length) {
    console.log("No dogs found.");
    return;
  }

  const { data: allPhotos, error: photoError } = await admin
    .from("dog_photos")
    .select("id,dog_id,storage_path,sort_order");

  if (photoError) throw photoError;

  const byDog = new Map();
  for (const photo of allPhotos || []) {
    const list = byDog.get(photo.dog_id) || [];
    list.push(photo);
    byDog.set(photo.dog_id, list);
  }

  const demoPhotoIds = (allPhotos || [])
    .filter((photo) => isOldDemoPhoto(photo.storage_path))
    .map((photo) => photo.id);

  for (let i = 0; i < demoPhotoIds.length; i += 100) {
    const ids = demoPhotoIds.slice(i, i + 100);
    const { error } = await admin.from("dog_photos").delete().in("id", ids);
    if (error) throw error;
  }

  const poolCache = new Map();
  let photosAdded = 0;
  let barksFixed = 0;
  let videosFixed = 0;

  for (let dogIndex = 0; dogIndex < dogs.length; dogIndex += 1) {
    const dog = dogs[dogIndex];
    const previous = (byDog.get(dog.id) || [])
      .filter((p) => !isOldDemoPhoto(p.storage_path))
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

    const needed = Math.max(0, PHOTOS_PER_DOG - previous.length);
    const chosenBreed = chooseBreedPath(dog.breed, candidates);

    let pool = genericPool;
    if (chosenBreed) {
      if (!poolCache.has(chosenBreed.key)) {
        try {
          const images = await fetchJson(chosenBreed.endpoint);
          poolCache.set(chosenBreed.key, Array.isArray(images) ? images : []);
          await sleep(120);
        } catch {
          poolCache.set(chosenBreed.key, []);
        }
      }
      const breedPool = poolCache.get(chosenBreed.key);
      if (breedPool?.length) pool = breedPool;
    }

    const selected = pickDistinct(pool, dogIndex + 1, needed);
    const maxSort = previous.reduce(
      (max, p) => Math.max(max, Number(p.sort_order || 0)),
      -1,
    );

    for (let j = 0; j < selected.length; j += 1) {
      const { error } = await admin.from("dog_photos").insert({
        dog_id: dog.id,
        storage_path: selected[j],
        sort_order: maxSort + j + 1,
      });
      if (error) throw error;
      photosAdded += 1;
    }

    if (isOldDemoMedia(dog.bark_audio_path)) {
      const { error } = await admin
        .from("dogs")
        .update({ bark_audio_path: BARKS[dogIndex % BARKS.length] })
        .eq("id", dog.id);
      if (error) throw error;
      barksFixed += 1;
    }

    if (isOldDemoMedia(dog.video_path)) {
      const { error } = await admin
        .from("dogs")
        .update({ video_path: VIDEOS[dogIndex % VIDEOS.length] })
        .eq("id", dog.id);
      if (error) throw error;
      videosFixed += 1;
    }

    console.log(
      `✅ ${String(dogIndex + 1).padStart(2, "0")}/${dogs.length} ${dog.name}` +
        ` — ${previous.length + selected.length} photos` +
        `${chosenBreed ? ` (${chosenBreed.key})` : " (mixed pool)"}`,
    );
  }

  console.log("\n🎉 REAL MEDIA V4 FINISHED");
  console.log(`Old demo photo rows removed: ${demoPhotoIds.length}`);
  console.log(`Real dog photos added: ${photosAdded}`);
  console.log(`Bark links added/repaired: ${barksFixed}`);
  console.log(`Video links added/repaired: ${videosFixed}`);
}

main().catch((error) => {
  console.error("\n❌ REAL MEDIA V4 FAILED");
  console.error(error);
  process.exit(1);
});
