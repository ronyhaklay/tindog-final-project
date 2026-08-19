import { createClient } from "@supabase/supabase-js";

const DOG_API = "https://dog.ceo/api";
const DOG_LIMIT = Math.max(1, Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 100)));
const MAX_PHOTOS = Math.max(1, Math.min(5, Number(process.env.MEDIA_PHOTOS_PER_DOG || 5)));

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

const VIDEO_BY_BREED = {
  husky: {
    video: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Howling%20Husky%20Dog.webm",
    bark: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Howling%20Husky%20Dog.webm",
  },
  labrador: {
    video: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Labrador%20barking%20on%20command.theora.ogv",
    bark: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Labrador%20barking%20on%20command.theora.ogv",
  },
  "pinscher/miniature": {
    video: "https://commons.wikimedia.org/wiki/Special:Redirect/file/-01-%20Miniature%20Pinscher%20puppy.webm",
    bark: null,
  },
  "retriever/golden": {
    video: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Golden%20retriever%20swimming%20the%20doggy%20paddle.webm",
    bark: null,
  },
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function isGenerated(value) {
  const s = String(value || "");
  return (
    /^https?:\/\//i.test(s) ||
    s.includes("/demo-commons/") ||
    s.includes("/demo-v2/") ||
    s.includes("/demo-v3/") ||
    s.includes("/demo-v4/") ||
    s.includes("placedog.net/")
  );
}

function extractDogCeoBreed(imageUrl) {
  try {
    const u = new URL(String(imageUrl || ""));
    if (u.hostname !== "images.dog.ceo") return null;
    const match = u.pathname.match(/\/breeds\/([^/]+)\//);
    if (!match) return null;

    const folder = match[1];
    const pieces = folder.split("-");
    if (pieces.length >= 2) return `${pieces[0]}/${pieces.slice(1).join("-")}`;
    return folder;
  } catch {
    return null;
  }
}

const ALIASES = [
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
];

function breedFromMetadata(rawBreed) {
  const value = normalize(rawBreed);
  for (const [needle, endpoint] of ALIASES) {
    if (value.includes(needle)) return endpoint;
  }
  return null;
}

function endpointForBreed(breedKey, count) {
  const parts = String(breedKey).split("/");
  if (parts.length === 2) {
    return `/breed/${parts[0]}/${parts[1]}/images/random/${count}`;
  }
  return `/breed/${parts[0]}/images/random/${count}`;
}

async function fetchDogImages(breedKey, count) {
  const endpoint = endpointForBreed(breedKey, Math.max(count * 3, 12));
  let delay = 600;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await fetch(`${DOG_API}${endpoint}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const arr = Array.isArray(json?.message) ? json.message : [];
      return [...new Set(arr)].slice(0, count);
    }

    if (res.status === 429 || res.status >= 500) {
      await sleep(delay);
      delay *= 2;
      continue;
    }
    break;
  }
  return [];
}

async function fetchOneRandomDog() {
  const res = await fetch(`${DOG_API}/breeds/image/random`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.status === "success" ? String(json.message) : null;
}

function manualMedia(value) {
  const s = String(value || "");
  return Boolean(s) && !/^https?:\/\//i.test(s) && !s.includes("/demo-");
}

async function main() {
  console.log("🐶 TinDog V7 — similar-looking galleries + conservative media");
  console.log("Up to 5 photos only when a confident breed match exists.\n");

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);
  if (dogError) throw dogError;

  const { data: allPhotos, error: photoError } = await admin
    .from("dog_photos")
    .select("id,dog_id,storage_path,sort_order");
  if (photoError) throw photoError;

  const photosByDog = new Map();
  for (const p of allPhotos || []) {
    const list = photosByDog.get(p.dog_id) || [];
    list.push(p);
    photosByDog.set(p.dog_id, list);
  }

  let multiPhotoDogs = 0;
  let onePhotoDogs = 0;
  let videoDogs = 0;
  let barkDogs = 0;

  for (let i = 0; i < dogs.length; i += 1) {
    const dog = dogs[i];
    const existing = (photosByDog.get(dog.id) || []).slice().sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );

    const manualPhotos = existing.filter((p) => !isGenerated(p.storage_path));
    if (manualPhotos.length) {
      console.log(`✅ ${dog.name}: manual shelter photos preserved (${manualPhotos.length})`);
      continue;
    }

    const currentMain = existing[0]?.storage_path || null;
    const exactBreedFromUrl = extractDogCeoBreed(currentMain);
    const metadataBreed = breedFromMetadata(dog.breed);
    const breedKey = exactBreedFromUrl || metadataBreed;

    let chosen = [];
    if (breedKey) {
      const sameBreed = await fetchDogImages(breedKey, MAX_PHOTOS);
      if (sameBreed.length >= 2) chosen = sameBreed;
    }

    if (chosen.length < 2) {
      const one =
        (currentMain && /^https?:\/\//i.test(currentMain) ? currentMain : null) ||
        (await fetchOneRandomDog());
      chosen = one ? [one] : [];
      onePhotoDogs += 1;
    } else {
      multiPhotoDogs += 1;
    }

    if (existing.length) {
      const ids = existing.map((p) => p.id);
      const { error } = await admin.from("dog_photos").delete().in("id", ids);
      if (error) throw error;
    }

    if (chosen.length) {
      const rows = chosen.map((storage_path, index) => ({
        dog_id: dog.id,
        storage_path,
        sort_order: index,
      }));
      const { error } = await admin.from("dog_photos").insert(rows);
      if (error) throw error;
    }

    const mapped = breedKey ? VIDEO_BY_BREED[breedKey] : null;
    const patch = {};
    if (!manualMedia(dog.video_path)) patch.video_path = mapped?.video || null;
    if (!manualMedia(dog.bark_audio_path)) patch.bark_audio_path = mapped?.bark || null;

    if (Object.keys(patch).length) {
      const { error } = await admin.from("dogs").update(patch).eq("id", dog.id);
      if (error) throw error;
    }

    if (mapped?.video) videoDogs += 1;
    if (mapped?.bark) barkDogs += 1;

    console.log(
      `✅ ${String(i + 1).padStart(2, "0")}/${dogs.length} ${dog.name}: ` +
        `${chosen.length} photo(s)` +
        `${breedKey ? ` · ${breedKey}` : " · no confident breed match"}` +
        `${mapped?.video ? " · video" : ""}` +
        `${mapped?.bark ? " · matching sound" : ""}`,
    );
    await sleep(100);
  }

  console.log("\n🎉 TINDOG V7 MEDIA FINISHED");
  console.log(`Profiles with 2-5 same-breed photos: ${multiPhotoDogs}`);
  console.log(`Profiles kept to one photo: ${onePhotoDogs}`);
  console.log(`Breed-matched videos restored: ${videoDogs}`);
  console.log(`Videos also used as matching sound: ${barkDogs}`);
}

main().catch((error) => {
  console.error("\n❌ TINDOG V7 MEDIA FAILED");
  console.error(error);
  process.exit(1);
});
