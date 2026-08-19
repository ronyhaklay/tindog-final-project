import { createClient } from "@supabase/supabase-js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const UA = "TinDogEducationalDemo/9.0 (breed-matched dog media)";
const DOG_LIMIT = Math.max(1, Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 100)));

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
  const s = String(value || "");
  return Boolean(s) && !external(s) && !s.includes("/demo-");
}

function photoBreedKey(photoUrl) {
  try {
    const u = new URL(String(photoUrl || ""));
    if (u.hostname !== "images.dog.ceo") return null;
    const match = u.pathname.match(/\/breeds\/([^/]+)\//);
    if (!match) return null;
    const parts = match[1].split("-");
    return parts.length > 1
      ? `${parts[0]}/${parts.slice(1).join("-")}`
      : parts[0];
  } catch {
    return null;
  }
}

const BREED_ALIASES = [
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

function metadataBreedKey(raw) {
  const value = String(raw || "").toLowerCase();
  for (const [needle, key] of BREED_ALIASES) {
    if (value.includes(needle)) return key;
  }
  return null;
}

function breedPhrase(key) {
  if (!key) return null;
  const [base, sub] = key.split("/");
  if (!sub) {
    const direct = {
      germanshepherd: "German Shepherd",
      husky: "Siberian Husky",
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
      labrador: "Labrador Retriever",
    };
    return direct[base] || base.replace(/-/g, " ");
  }

  const words = sub.replace(/-/g, " ");
  const baseName =
    base === "retriever"
      ? "Retriever"
      : base === "collie"
        ? "Collie"
        : base === "pinscher"
          ? "Pinscher"
          : base === "spaniel"
            ? "Spaniel"
            : base === "terrier"
              ? "Terrier"
              : base === "hound"
                ? "Hound"
                : base === "bulldog"
                  ? "Bulldog"
                  : base;

  return `${words} ${baseName}`
    .split(" ")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : word)
    .join(" ");
}

async function api(params, label) {
  let delay = 700;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const qs = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      ...params,
    });

    const res = await fetch(`${COMMONS_API}?${qs}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });

    if (res.ok) return res.json();

    if (res.status === 429 || res.status >= 500) {
      await sleep(delay);
      delay *= 2;
      continue;
    }

    throw new Error(`${label}: HTTP ${res.status}`);
  }

  throw new Error(`${label}: failed after retries`);
}

async function imageInfo(titles) {
  const result = [];

  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const json = await api(
      {
        prop: "imageinfo",
        titles: batch.join("|"),
        iiprop: "url|mime|size|extmetadata",
      },
      "imageinfo",
    );

    for (const page of Object.values(json?.query?.pages || {})) {
      const info = page?.imageinfo?.[0];
      if (!info?.url) continue;

      const meta = info.extmetadata || {};
      result.push({
        title: String(page.title || ""),
        url: String(info.url),
        mime: String(info.mime || ""),
        size: Number(info.size || 0),
        description: clean(meta.ImageDescription?.value || meta.ObjectName?.value || ""),
        artist: clean(meta.Artist?.value || meta.Credit?.value || ""),
        license: clean(meta.LicenseShortName?.value || meta.UsageTerms?.value || ""),
        licenseUrl: String(meta.LicenseUrl?.value || ""),
      });
    }

    await sleep(250);
  }

  return result;
}

function significantTokens(phrase) {
  return String(phrase || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 4 && !["retriever", "shepherd"].includes(token));
}

async function exactBreedVideo(phrase) {
  if (!phrase) return null;

  const json = await api(
    {
      list: "search",
      srnamespace: "6",
      srlimit: "30",
      srsearch: `"${phrase}" dog filetype:video`,
    },
    `video search ${phrase}`,
  );

  const titles = (json?.query?.search || []).map((x) => x.title);
  const infos = await imageInfo(titles);
  const tokens = significantTokens(phrase);

  const matches = infos.filter((item) => {
    if (!item.mime.startsWith("video/")) return false;
    if (item.size > 80 * 1024 * 1024) return false;

    const haystack = `${item.title} ${item.description}`.toLowerCase();
    return tokens.length ? tokens.every((token) => haystack.includes(token)) : false;
  });

  return matches[0] || null;
}

async function barkPool() {
  const queries = [
    "dog barking filetype:audio",
    "dog bark filetype:audio",
    "dog woof filetype:audio",
    "dog howl filetype:audio",
    "dog growl filetype:audio",
  ];

  const titles = new Set();

  for (const query of queries) {
    try {
      const json = await api(
        {
          list: "search",
          srnamespace: "6",
          srlimit: "50",
          srsearch: query,
        },
        `bark search ${query}`,
      );

      for (const item of json?.query?.search || []) titles.add(item.title);
      await sleep(250);
    } catch {
      // Continue with the other searches.
    }
  }

  const infos = await imageInfo([...titles]);
  return infos.filter(
    (item) => item.mime.startsWith("audio/") && item.size < 15 * 1024 * 1024,
  );
}

async function main() {
  console.log("🎬 TinDog V9 — exact-breed video assignment");
  console.log("Generic mismatched dog videos will be removed.\\n");

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

  console.log("🔊 Building bark pool...");
  const barks = await barkPool();
  console.log(`   Found ${barks.length} usable dog sound files.\\n`);

  const videoCache = new Map();
  const attribution = [];
  let videoCount = 0;
  let videoCleared = 0;
  let barkCount = 0;

  for (let index = 0; index < dogs.length; index += 1) {
    const dog = dogs[index];
    const dogPhotos = (photosByDog.get(dog.id) || []).slice().sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
    const firstPhoto = dogPhotos[0]?.storage_path;

    const key = photoBreedKey(firstPhoto) || metadataBreedKey(dog.breed);
    const phrase = breedPhrase(key);

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
      if (video) {
        videoCount += 1;
        attribution.push({ dog: dog.name, type: "video", breed: phrase, ...video });
      } else {
        videoCleared += 1;
      }
    }

    if (!manualStorage(dog.bark_audio_path)) {
      if (barks.length) {
        const bark = barks[index % barks.length];
        patch.bark_audio_path = bark.url;
        barkCount += 1;
        attribution.push({ dog: dog.name, type: "bark", ...bark });
      } else {
        patch.bark_audio_path = null;
      }
    }

    const { error } = await admin.from("dogs").update(patch).eq("id", dog.id);
    if (error) throw error;

    console.log(
      `✅ ${String(index + 1).padStart(2, "0")}/${dogs.length} ${dog.name}: ` +
        `${video ? `video=${phrase}` : "no exact-breed video"} · ` +
        `${barks.length ? "bark" : "no bark"}`,
    );
  }

  console.log("\\n🎉 EXACT-BREED MEDIA V9 FINISHED");
  console.log(`Exact-breed videos assigned: ${videoCount}`);
  console.log(`Mismatched/generic videos cleared: ${videoCleared}`);
  console.log(`Bark sounds assigned: ${barkCount}`);
}

main().catch((error) => {
  console.error("\\n❌ EXACT-BREED MEDIA V9 FAILED");
  console.error(error);
  process.exit(1);
});
