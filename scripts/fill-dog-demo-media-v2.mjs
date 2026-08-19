import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PHOTO_BUCKET = "dog-photos";
const MEDIA_BUCKET = "dog-media";
const DOG_LIMIT = Math.max(1, Math.min(100, Number(process.env.MEDIA_DOG_LIMIT || 50)));
const PHOTOS_PER_DOG = Math.max(1, Math.min(5, Number(process.env.MEDIA_PHOTOS_PER_DOG || 5)));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.API_URL;

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UA = process.env.WIKIMEDIA_USER_AGENT || "TinDogDemoMedia/2.0 (local educational demo)";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 14);

function cleanText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function sourcePage(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function extensionForMime(mime) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
  };
  return map[mime] || "bin";
}

async function fetchRetry(url, options = {}, label = "request") {
  let delay = 2500;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": UA,
        Accept: "*/*",
        ...(options.headers || {}),
      },
    });

    if (res.ok) return res;

    if (res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get("retry-after") || 0);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : delay;
      console.log(`  ⏳ ${label}: ${res.status}, waiting ${Math.round(waitMs / 1000)}s...`);
      await sleep(Math.min(waitMs, 60000));
      delay = Math.min(delay * 2, 30000);
      continue;
    }

    throw new Error(`${label} failed: HTTP ${res.status}`);
  }

  throw new Error(`${label} failed after retries`);
}

async function searchTitles(query, wanted = 120) {
  const titles = [];
  let offset = 0;

  while (titles.length < wanted && offset < 500) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      list: "search",
      srnamespace: "6",
      srlimit: "50",
      sroffset: String(offset),
      srsearch: query,
    });

    const res = await fetchRetry(`${COMMONS_API}?${params}`, {}, `search "${query}"`);
    const json = await res.json();
    const batch = json?.query?.search || [];
    if (!batch.length) break;

    titles.push(...batch.map((x) => x.title));
    offset += batch.length;
    await sleep(800);
  }

  return [...new Set(titles)].slice(0, wanted);
}

async function fileInfo(titles, thumbWidth = 900) {
  const out = [];

  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "imageinfo",
      titles: batch.join("|"),
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: String(thumbWidth),
    });

    const res = await fetchRetry(`${COMMONS_API}?${params}`, {}, "file metadata");
    const json = await res.json();

    for (const page of Object.values(json?.query?.pages || {})) {
      const info = page?.imageinfo?.[0];
      if (!info?.url) continue;

      const meta = info.extmetadata || {};
      out.push({
        title: page.title,
        mime: String(info.mime || ""),
        size: Number(info.size || 0),
        url: info.url,
        thumb: info.thumburl || info.url,
        source_page: sourcePage(page.title),
        artist: cleanText(meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons contributor"),
        license: cleanText(meta.LicenseShortName?.value || meta.UsageTerms?.value || "See source page"),
        license_url: String(meta.LicenseUrl?.value || ""),
      });
    }

    await sleep(900);
  }

  return out;
}

async function buildPool(queries, kind, wanted) {
  const result = [];
  const seen = new Set();

  for (const query of queries) {
    if (result.length >= wanted) break;

    const titles = await searchTitles(query, kind === "photo" ? 160 : 120);
    const infos = await fileInfo(titles);

    for (const item of infos) {
      if (seen.has(item.url)) continue;

      const ok =
        kind === "photo"
          ? ["image/jpeg", "image/png", "image/webp"].includes(item.mime)
          : kind === "audio"
            ? item.mime.startsWith("audio/")
            : item.mime.startsWith("video/");

      if (!ok) continue;
      if (kind === "audio" && item.size > 4 * 1024 * 1024) continue;
      if (kind === "video" && item.size > 12 * 1024 * 1024) continue;

      seen.add(item.url);
      result.push(item);
      if (result.length >= wanted) break;
    }
  }

  return result;
}

const downloaded = new Map();

async function getBytes(item, kind) {
  const key = kind === "photo" ? item.thumb : item.url;
  if (downloaded.has(key)) return downloaded.get(key);

  const res = await fetchRetry(key, {}, `${kind} download`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const mime = String(res.headers.get("content-type") || item.mime).split(";")[0];

  const value = { bytes, mime };
  downloaded.set(key, value);
  await sleep(1200);
  return value;
}

async function ensureBucket(name, sizeLimit) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const existing = (buckets || []).find((b) => b.name === name);

  if (!existing) {
    const { error: createError } = await admin.storage.createBucket(name, {
      public: true,
      fileSizeLimit: sizeLimit,
    });
    if (createError) throw createError;
  } else {
    await admin.storage.updateBucket(name, { public: true, fileSizeLimit: sizeLimit });
  }
}

async function uploadForDog(dog, item, kind, slot) {
  const { bytes, mime } = await getBytes(item, kind);
  const ext = extensionForMime(mime);
  const bucket = kind === "photo" ? PHOTO_BUCKET : MEDIA_BUCKET;
  const folder = kind === "photo" ? "demo-v2/photos" : `demo-v2/${kind}`;
  const storagePath = `${dog.owner_id}/${folder}/${dog.id}-${slot}-${hash(item.url)}.${ext}`;

  const { error } = await admin.storage.from(bucket).upload(storagePath, bytes, {
    contentType: mime,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  return storagePath;
}

async function main() {
  console.log("🐶 TinDog media filler V2");
  console.log("   shared source pools + retry/backoff\n");

  await ensureBucket(PHOTO_BUCKET, 5 * 1024 * 1024);
  await ensureBucket(MEDIA_BUCKET, 15 * 1024 * 1024);

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("id,owner_id,name,breed,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogError) throw dogError;
  if (!dogs?.length) {
    console.log("No dogs found.");
    return;
  }

  const { data: existingPhotos, error: photoError } = await admin
    .from("dog_photos")
    .select("dog_id,storage_path,sort_order");
  if (photoError) throw photoError;

  const byDog = new Map();
  for (const photo of existingPhotos || []) {
    const list = byDog.get(photo.dog_id) || [];
    list.push(photo);
    byDog.set(photo.dog_id, list);
  }

  console.log("📷 Building photo pool...");
  const photoPool = await buildPool(
    ["dog portrait", "pet dog", "dog outdoors", "puppy portrait"],
    "photo",
    55,
  );
  console.log(`   ${photoPool.length} photo sources ready`);

  console.log("🔊 Building bark pool...");
  const audioPool = await buildPool(
    ["dog barking", "dog bark", "barking dog"],
    "audio",
    8,
  );
  console.log(`   ${audioPool.length} bark/audio sources ready`);

  console.log("🎬 Building video pool...");
  const videoPool = await buildPool(
    ["dog playing", "dog running", "pet dog"],
    "video",
    8,
  );
  console.log(`   ${videoPool.length} video sources ready\n`);

  if (photoPool.length < 5) {
    throw new Error("Could not build a usable dog photo pool. Wait a few minutes and rerun.");
  }

  const credits = [];
  let photoCount = 0;
  let audioCount = 0;
  let videoCount = 0;

  for (let index = 0; index < dogs.length; index += 1) {
    const dog = dogs[index];
    console.log(`[${index + 1}/${dogs.length}] ${dog.name}`);

    const current = (byDog.get(dog.id) || []).sort((a, b) => a.sort_order - b.sort_order);
    const needed = Math.max(0, PHOTOS_PER_DOG - current.length);
    const startSort = current.reduce((m, x) => Math.max(m, Number(x.sort_order || 0)), -1) + 1;

    for (let j = 0; j < needed; j += 1) {
      const source = photoPool[(index * PHOTOS_PER_DOG + j) % photoPool.length];

      try {
        const storagePath = await uploadForDog(dog, source, "photo", startSort + j);
        const { error } = await admin.from("dog_photos").insert({
          dog_id: dog.id,
          storage_path: storagePath,
          sort_order: startSort + j,
        });
        if (error) throw error;

        photoCount += 1;
        credits.push({ dog_name: dog.name, type: "photo", storage_path: storagePath, ...source });
      } catch (error) {
        console.warn(`  ⚠️ photo skipped: ${error.message}`);
      }
    }

    if (!dog.bark_audio_path && audioPool.length) {
      const source = audioPool[index % audioPool.length];
      try {
        const storagePath = await uploadForDog(dog, source, "audio", 0);
        const { error } = await admin.from("dogs").update({ bark_audio_path: storagePath }).eq("id", dog.id);
        if (error) throw error;
        audioCount += 1;
        credits.push({ dog_name: dog.name, type: "audio", storage_path: storagePath, ...source });
      } catch (error) {
        console.warn(`  ⚠️ bark skipped: ${error.message}`);
      }
    }

    if (!dog.video_path && videoPool.length) {
      const source = videoPool[index % videoPool.length];
      try {
        const storagePath = await uploadForDog(dog, source, "video", 0);
        const { error } = await admin.from("dogs").update({ video_path: storagePath }).eq("id", dog.id);
        if (error) throw error;
        videoCount += 1;
        credits.push({ dog_name: dog.name, type: "video", storage_path: storagePath, ...source });
      } catch (error) {
        console.warn(`  ⚠️ video skipped: ${error.message}`);
      }
    }

    console.log(`  ✅ photos: ${Math.min(PHOTOS_PER_DOG, current.length + needed)}`);
  }

  const publicDir = path.join(process.cwd(), "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    path.join(publicDir, "demo-media-attribution.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), items: credits }, null, 2),
    "utf8",
  );

  console.log("\n🎉 V2 finished");
  console.log(`   photos added: ${photoCount}`);
  console.log(`   bark clips added: ${audioCount}`);
  console.log(`   videos added: ${videoCount}`);
  console.log("   Refresh the site now.");
}

main().catch((error) => {
  console.error("\n❌ V2 failed:", error);
  process.exit(1);
});
