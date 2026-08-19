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

const BREED_ALIASES = [
  ["golden retriever", "retriever/golden"],
  ["labrador", "labrador"],
  ["border collie", "collie/border"],
  ["siberian husky", "husky"],
  ["husky", "husky"],
  ["miniature pinscher", "pinscher/miniature"],
  ["pinscher", "pinscher/miniature"],
  ["german shepherd", "germanshepherd"],
  ["samoyed", "samoyed"],
  ["rottweiler", "rottweiler"],
  ["dachshund", "dachshund"],
  ["chihuahua", "chihuahua"],
  ["beagle", "beagle"],
  ["boxer", "boxer"],
  ["pug", "pug"],
  ["malamute", "malamute"],
  ["cocker spaniel", "spaniel/cocker"],
  ["spaniel", "spaniel/cocker"],
  ["poodle", "poodle"],
  ["retriever", "retriever/golden"],
  ["terrier", "terrier"],
  ["canaan", "mixed"],
  ["mixed", "mixed"],
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function breedFromText(rawBreed) {
  const value = normalize(rawBreed);
  for (const [needle, endpoint] of BREED_ALIASES) {
    if (value.includes(needle)) return endpoint;
  }
  return null;
}

function extractBreedFromDogCeo(url) {
  try {
    const u = new URL(String(url || ""));
    if (u.hostname !== "images.dog.ceo") return null;
    const match = u.pathname.match(/\/breeds\/([^/]+)\//);
    if (!match) return null;

    const folder = match[1];
    const parts = folder.split("-");
    if (parts.length >= 2) {
      return `${parts[0]}/${parts.slice(1).join("-")}`;
    }
    return folder;
  } catch {
    return null;
  }
}

const BREED_VIDEO = {
  husky: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Howling%20Husky%20Dog.webm",
  labrador: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Labrador%20barking%20on%20command.theora.ogv",
  "pinscher/miniature": "https://commons.wikimedia.org/wiki/Special:Redirect/file/-01-%20Miniature%20Pinscher%20puppy.webm",
  "retriever/golden": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Golden%20retriever%20swimming%20the%20doggy%20paddle.webm",
  poodle: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Two%20poodles%20playing.ogv",
  terrier: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Throw%20the%20Stick!.ogv",
  mixed: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dog%20whimpering.webm",
};

const GENERIC_VIDEO_POOL = [
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Howling%20Husky%20Dog.webm",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Labrador%20barking%20on%20command.theora.ogv",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Golden%20retriever%20swimming%20the%20doggy%20paddle.webm",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Two%20poodles%20playing.ogv",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Throw%20the%20Stick!.ogv",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dog%20whimpering.webm",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/-01-%20Miniature%20Pinscher%20puppy.webm",
];

const BARK_POOL = [
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barking%20of%20a%20dog.ogg",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barking%20of%20a%20dog%202.ogg",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/George%20vuf%201996.ogg",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Labrador%20barking%20on%20command.theora.ogv",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Howling%20Husky%20Dog.webm",
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dog%20whimpering.webm",
];

function isManualPath(value) {
  const s = String(value || "");
  if (!s) return false;
  return !/^https?:\/\//i.test(s) && !s.includes("/demo-");
}

async function main() {
  console.log("🎬 TinDog V8 — video + bark for every dog");

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("id,name,breed,video_path,bark_audio_path")
    .order("created_at", { ascending: true });

  if (dogError) throw dogError;

  const { data: photos, error: photoError } = await admin
    .from("dog_photos")
    .select("dog_id,storage_path,sort_order");

  if (photoError) throw photoError;

  const firstPhotoByDog = new Map();
  for (const p of photos || []) {
    if (!firstPhotoByDog.has(p.dog_id)) {
      firstPhotoByDog.set(p.dog_id, p.storage_path);
    }
  }

  let updated = 0;

  for (let i = 0; i < dogs.length; i += 1) {
    const dog = dogs[i];
    const firstPhoto = firstPhotoByDog.get(dog.id);
    const photoBreed = extractBreedFromDogCeo(firstPhoto);
    const metadataBreed = breedFromText(dog.breed);
    const breedKey = photoBreed || metadataBreed || "mixed";

    const video =
      BREED_VIDEO[breedKey] ||
      GENERIC_VIDEO_POOL[i % GENERIC_VIDEO_POOL.length];

    // varied bark per dog; deliberately rotated
    const bark = BARK_POOL[(i * 2 + 1) % BARK_POOL.length];

    const patch = {};

    // preserve only truly manual shelter uploads
    if (!isManualPath(dog.video_path)) patch.video_path = video;
    if (!isManualPath(dog.bark_audio_path)) patch.bark_audio_path = bark;

    const { error } = await admin.from("dogs").update(patch).eq("id", dog.id);
    if (error) throw error;

    updated += 1;
    console.log(`✅ ${String(i+1).padStart(2,"0")}/${dogs.length} ${dog.name}: video + bark updated`);
  }

  console.log("");
  console.log(`🎉 DONE — updated ${updated} dogs with video and bark.`);
  console.log("Videos are breed-specific when possible, otherwise cute generic dog videos.");
  console.log("Barks are rotated so the dogs won't all use the exact same sound.");
}

main().catch((error) => {
  console.error("❌ FAILED");
  console.error(error);
  process.exit(1);
});
