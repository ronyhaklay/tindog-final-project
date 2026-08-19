import { createClient } from "@supabase/supabase-js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const UA = "TinDogEducationalDemo/10.0";
const DOG_LIMIT = Math.max(1, Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 100)));

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function external(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function manualStorage(value) {
  const text = String(value || "");
  return Boolean(text) && !external(text) && !text.includes("/demo-");
}

function breedFromDogCeo(photoUrl) {
  try {
    const parsed = new URL(String(photoUrl || ""));
    if (parsed.hostname !== "images.dog.ceo") return null;

    const match = parsed.pathname.match(/\/breeds\/([^/]+)\//);
    if (!match) return null;

    const parts = match[1].split("-");
    return parts.length >= 2
      ? `${parts[0]}/${parts.slice(1).join("-")}`
      : parts[0];
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
  ["cocker spaniel", "spaniel/cocker"],
  ["samoyed", "samoyed"],
  ["rottweiler", "rottweiler"],
  ["chihuahua", "chihuahua"],
  ["dachshund", "dachshund"],
  ["beagle", "beagle"],
  ["boxer", "boxer"],
  ["pug", "pug"],
  ["malamute", "malamute"],
  ["poodle", "poodle"],
  ["terrier", "terrier"],
];

function breedFromMetadata(raw) {
  const text = String(raw || "").toLowerCase();
  for (const [needle, breed] of ALIASES) {
    if (text.includes(needle)) return breed;
  }
  return null;
}

function phraseForBreed(key) {
  const direct = {
    "retriever/golden": "Golden Retriever",
    labrador: "Labrador Retriever",
    "collie/border": "Border Collie",
    husky: "Siberian Husky",
    "pinscher/miniature": "Miniature Pinscher",
    germanshepherd: "German Shepherd",
    "spaniel/cocker": "Cocker Spaniel",
    samoyed: "Samoyed",
    rottweiler: "Rottweiler",
    chihuahua: "Chihuahua",
    dachshund: "Dachshund",
    beagle: "Beagle",
    boxer: "Boxer",
    pug: "Pug",
    malamute: "Malamute",
    poodle: "Poodle",
    terrier: "Terrier",
  };
  return direct[key] || null;
}

async function api(params, label) {
  let wait = 700;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const qs = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      ...params,
    });

    const response = await fetch(`${COMMONS_API}?${qs}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });

    if (response.ok) return response.json();

    if (response.status === 429 || response.status >= 500) {
      await sleep(wait);
      wait *= 2;
      continue;
    }

    throw new Error(`${label}: HTTP ${response.status}`);
  }

  throw new Error(`${label}: failed`);
}

async function fileInfo(titles) {
  if (!titles.length) return [];

  const json = await api(
    {
      prop: "imageinfo",
      titles: titles.slice(0, 40).join("|"),
      iiprop: "url|mime|size|extmetadata",
    },
    "file metadata",
  );

  const result = [];

  for (const page of Object.values(json?.query?.pages || {})) {
    const info = page?.imageinfo?.[0];
    if (!info?.url) continue;

    const metadata = info.extmetadata || {};

    result.push({
      title: String(page.title || ""),
      url: String(info.url),
      mime: String(info.mime || ""),
      size: Number(info.size || 0),
      description: clean(
        metadata.ImageDescription?.value ||
          metadata.ObjectName?.value ||
          "",
      ),
    });
  }

  return result;
}

async function exactBreedVideo(phrase) {
  if (!phrase) return null;

  const searches = [
    `"${phrase}" dog video`,
    `"${phrase}" playing`,
    `"${phrase}" running`,
    `"${phrase}" puppy video`,
  ];

  const tokens = phrase.toLowerCase().split(/\s+/).filter((t) => t.length >= 4);

  for (const query of searches) {
    const json = await api(
      {
        list: "search",
        srnamespace: "6",
        srlimit: "30",
        srsearch: query,
      },
      `video search ${phrase}`,
    );

    const infos = await fileInfo((json?.query?.search || []).map((item) => item.title));

    const match = infos.find((item) => {
      if (!item.mime.startsWith("video/")) return false;
      if (item.size > 100 * 1024 * 1024) return false;

      const haystack = `${item.title} ${item.description}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });

    if (match) return match;
    await sleep(250);
  }

  return null;
}

async function barkPool() {
  const searches = [
    "dog barking audio",
    "dog bark audio",
    "dog woof audio",
    "dog howl audio",
  ];

  const titles = new Set();

  for (const query of searches) {
    try {
      const json = await api(
        {
          list: "search",
          srnamespace: "6",
          srlimit: "40",
          srsearch: query,
        },
        query,
      );

      for (const item of json?.query?.search || []) {
        titles.add(item.title);
      }
    } catch {}
  }

  const infos = await fileInfo([...titles]);

  return infos.filter(
    (item) =>
      (item.mime.startsWith("audio/") || item.mime.startsWith("video/")) &&
      item.size < 25 * 1024 * 1024,
  );
}

async function main() {
  console.log("🎬 TinDog V10 — exact-breed videos only");

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("id,name,breed,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogError) throw dogError;

  const { data: photos, error: photoError } = await admin
    .from("dog_photos")
    .select("dog_id,storage_path,sort_order");

  if (photoError) throw photoError;

  const photosByDog = new Map();
  for (const photo of photos || []) {
    const list = photosByDog.get(photo.dog_id) || [];
    list.push(photo);
    photosByDog.set(photo.dog_id, list);
  }

  console.log("🔊 מחפשת קולות כלבים...");
  const barks = await barkPool();

  const videoCache = new Map();
  let exactVideos = 0;
  let clearedVideos = 0;
  let barksAssigned = 0;

  for (let index = 0; index < dogs.length; index += 1) {
    const dog = dogs[index];
    const dogPhotos = (photosByDog.get(dog.id) || []).slice().sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );

    const firstPhoto = dogPhotos[0]?.storage_path;
    const breedKey =
      breedFromDogCeo(firstPhoto) ||
      breedFromMetadata(dog.breed);

    const phrase = phraseForBreed(breedKey);

    let video = null;

    if (phrase) {
      if (!videoCache.has(phrase)) {
        try {
          videoCache.set(phrase, await exactBreedVideo(phrase));
        } catch {
          videoCache.set(phrase, null);
        }
      }

      video = videoCache.get(phrase);
    }

    const patch = {};

    if (!manualStorage(dog.video_path)) {
      patch.video_path = video?.url || null;
      if (video) exactVideos += 1;
      else clearedVideos += 1;
    }

    if (!manualStorage(dog.bark_audio_path)) {
      if (barks.length) {
        patch.bark_audio_path = barks[(index * 3 + 1) % barks.length].url;
        barksAssigned += 1;
      } else {
        patch.bark_audio_path = null;
      }
    }

    const { error } = await admin.from("dogs").update(patch).eq("id", dog.id);
    if (error) throw error;

    console.log(
      `✅ ${String(index + 1).padStart(2, "0")}/${dogs.length} ${dog.name}: ` +
        `${video ? `וידאו ${phrase}` : "ללא וידאו לא תואם"} · ` +
        `${barks.length ? "נביחה" : "ללא נביחה"}`,
    );
  }

  console.log("");
  console.log("🎉 EXACT-BREED MEDIA V10 FINISHED");
  console.log(`Exact-breed videos: ${exactVideos}`);
  console.log(`Mismatched videos removed: ${clearedVideos}`);
  console.log(`Bark sounds assigned: ${barksAssigned}`);
}

main().catch((error) => {
  console.error("❌ MEDIA V10 FAILED");
  console.error(error);
  process.exit(1);
});
