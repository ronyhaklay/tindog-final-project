// Fill existing TinDog dog profiles with freely-licensed demo media from Wikimedia Commons.
//
// Default behavior:
//   - keeps any existing media
//   - tops each dog up to 6 photos
//   - adds 1 short video if missing
//   - adds 1 bark/audio clip if missing
//   - writes attribution to public/demo-media-attribution.{json,html}
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/fill-dog-demo-media.mjs
//
// Optional:
//   MEDIA_PHOTOS_PER_DOG=5
//   MEDIA_DOG_LIMIT=50
//   FORCE_DEMO_MEDIA=1

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PHOTO_BUCKET = "dog-photos";
const MEDIA_BUCKET = "dog-media";

const PHOTOS_PER_DOG = Math.max(
  1,
  Math.min(6, Number(process.env.MEDIA_PHOTOS_PER_DOG || 6)),
);
const DOG_LIMIT = Math.max(
  1,
  Math.min(200, Number(process.env.MEDIA_DOG_LIMIT || 50)),
);
const FORCE = process.env.FORCE_DEMO_MEDIA === "1";

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.API_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const allowedLicense = (raw) => {
  const value = String(raw || "").toLowerCase().replace(/\s+/g, " ").trim();
  return (
    value.includes("cc0") ||
    value.includes("public domain") ||
    value.startsWith("cc by ") ||
    value.startsWith("cc by-sa ")
  );
};

const licensePriority = (raw) => {
  const value = String(raw || "").toLowerCase();
  if (value.includes("cc0") || value.includes("public domain")) return 0;
  if (value.startsWith("cc by ")) return 1;
  if (value.startsWith("cc by-sa ")) return 2;
  return 9;
};

const htmlToText = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function commonsPageUrl(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
}

function extForMime(mime, fallback = "bin") {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
  };
  return map[mime] || fallback;
}

function hashOf(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 14);
}

async function commonsSearchTitles(query, maxTitles = 90) {
  const titles = [];
  let srcontinue = null;

  while (titles.length < maxTitles) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      list: "search",
      srnamespace: "6",
      srlimit: "50",
      srsearch: query,
    });
    if (srcontinue) params.set("sroffset", srcontinue);

    const res = await fetch(`${COMMONS_API}?${params}`, {
      headers: {
        "User-Agent": "TinDogDemoMedia/1.0 (educational demo project)",
      },
    });
    if (!res.ok) throw new Error(`Commons search failed: ${res.status}`);
    const json = await res.json();
    const batch = json?.query?.search ?? [];
    titles.push(...batch.map((item) => item.title));

    const nextOffset = json?.continue?.sroffset;
    if (nextOffset == null || batch.length === 0) break;
    srcontinue = String(nextOffset);
    await sleep(100);
  }

  return [...new Set(titles)].slice(0, maxTitles);
}

async function commonsFileInfo(titles, thumbWidth = 1000) {
  const output = [];
  for (let start = 0; start < titles.length; start += 40) {
    const batch = titles.slice(start, start + 40);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "imageinfo",
      titles: batch.join("|"),
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: String(thumbWidth),
    });

    const res = await fetch(`${COMMONS_API}?${params}`, {
      headers: {
        "User-Agent": "TinDogDemoMedia/1.0 (educational demo project)",
      },
    });
    if (!res.ok) throw new Error(`Commons file info failed: ${res.status}`);
    const json = await res.json();

    for (const page of Object.values(json?.query?.pages ?? {})) {
      const info = page?.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      const license =
        meta.LicenseShortName?.value ||
        meta.UsageTerms?.value ||
        "";
      if (!allowedLicense(license)) continue;

      output.push({
        title: page.title,
        mime: info.mime || "",
        size: Number(info.size || 0),
        originalUrl: info.url,
        thumbUrl: info.thumburl || info.url,
        sourcePage: commonsPageUrl(page.title),
        license: htmlToText(license),
        licenseUrl: meta.LicenseUrl?.value || "",
        artist: htmlToText(
          meta.Artist?.value ||
            meta.Credit?.value ||
            meta.Attribution?.value ||
            "Wikimedia Commons contributor",
        ),
      });
    }
    await sleep(100);
  }
  return output;
}

function validForKind(item, kind) {
  if (!item.originalUrl || !item.mime) return false;
  if (kind === "photo") {
    return ["image/jpeg", "image/png", "image/webp"].includes(item.mime);
  }
  if (kind === "audio") {
    return item.mime.startsWith("audio/");
  }
  if (kind === "video") {
    return item.mime.startsWith("video/");
  }
  return false;
}

async function searchCommonsMedia(
  queries,
  kind,
  wanted,
  { maxBytes, thumbWidth = 1000 } = {},
) {
  const combined = [];
  const seen = new Set();

  for (const query of queries) {
    if (combined.length >= wanted) break;
    try {
      const titles = await commonsSearchTitles(query, 100);
      const infos = await commonsFileInfo(titles, thumbWidth);
      for (const item of infos) {
        if (seen.has(item.originalUrl)) continue;
        if (!validForKind(item, kind)) continue;
        if (maxBytes && item.size && item.size > maxBytes && kind !== "photo") {
          continue;
        }
        seen.add(item.originalUrl);
        combined.push(item);
      }
    } catch (error) {
      console.warn(`  Commons query failed (${query}): ${error.message}`);
    }
  }

  combined.sort(
    (a, b) =>
      licensePriority(a.license) - licensePriority(b.license) ||
      a.size - b.size,
  );
  return combined.slice(0, wanted);
}

async function download(item, kind, maxBytes) {
  const sourceUrl = kind === "photo" ? item.thumbUrl : item.originalUrl;
  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "TinDogDemoMedia/1.0 (educational demo project)",
    },
  });
  if (!res.ok) throw new Error(`download ${res.status}`);

  const declared = Number(res.headers.get("content-length") || 0);
  if (maxBytes && declared && declared > maxBytes) {
    throw new Error(`file is too large (${declared} bytes)`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (maxBytes && bytes.byteLength > maxBytes) {
    throw new Error(`file is too large (${bytes.byteLength} bytes)`);
  }

  return {
    bytes,
    contentType: res.headers.get("content-type")?.split(";")[0] || item.mime,
    sourceUrl,
  };
}

async function ensureBuckets() {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;

  const names = new Set((buckets || []).map((b) => b.name));
  if (!names.has(PHOTO_BUCKET)) {
    const result = await admin.storage.createBucket(PHOTO_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (result.error) throw result.error;
  }

  if (!names.has(MEDIA_BUCKET)) {
    const result = await admin.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 35 * 1024 * 1024,
    });
    if (result.error) throw result.error;
  }
}

async function uploadDogAsset({
  dog,
  item,
  kind,
  slot,
  maxBytes,
}) {
  const downloaded = await download(item, kind, maxBytes);
  const ext = extForMime(downloaded.contentType, extForMime(item.mime));
  const signature = hashOf(`${item.originalUrl}:${slot}:${dog.id}`);
  const folder =
    kind === "photo" ? "demo-commons/photos" : `demo-commons/${kind}`;
  const storagePath = `${dog.owner_id}/${folder}/${dog.id}-${slot}-${signature}.${ext}`;
  const bucket = kind === "photo" ? PHOTO_BUCKET : MEDIA_BUCKET;

  const { error } = await admin.storage.from(bucket).upload(
    storagePath,
    downloaded.bytes,
    {
      contentType: downloaded.contentType,
      cacheControl: "3600",
      upsert: true,
    },
  );
  if (error) throw error;

  return storagePath;
}

function breedQueries(dog) {
  const breed = String(dog.breed || "").trim();
  const generic = [
    'dog portrait -drawing -painting -illustration -logo',
    'pet dog outdoors -drawing -painting -illustration -logo',
  ];

  if (!breed || /mixed|mix|unknown/i.test(breed)) return generic;

  const cleaned = breed.replace(/\bmix(ed)?\b/gi, "").trim();
  return [
    `"${cleaned}" dog -drawing -painting -illustration -logo`,
    `${cleaned} dog portrait -drawing -painting -illustration -logo`,
    ...generic,
  ];
}

function chooseRotating(pool, index, count) {
  if (!pool.length) return [];
  const picked = [];
  const used = new Set();
  for (let step = 0; step < pool.length * 2 && picked.length < count; step += 1) {
    const item = pool[(index * 7 + step * 3) % pool.length];
    if (used.has(item.originalUrl)) continue;
    used.add(item.originalUrl);
    picked.push(item);
  }
  return picked;
}

async function main() {
  console.log("🐶 TinDog demo media filler");
  console.log(`   photos per dog: ${PHOTOS_PER_DOG}`);
  console.log(`   dog limit: ${DOG_LIMIT}`);
  console.log("   source: Wikimedia Commons freely licensed media\n");

  await ensureBuckets();

  const { data: dogs, error: dogError } = await admin
    .from("dogs")
    .select("id,owner_id,name,breed,video_path,bark_audio_path,created_at")
    .order("created_at", { ascending: true })
    .limit(DOG_LIMIT);

  if (dogError) throw dogError;
  if (!dogs?.length) {
    console.log("No dogs found. Run your dog seed first, then rerun this script.");
    return;
  }

  const { data: existingPhotos, error: photoError } = await admin
    .from("dog_photos")
    .select("dog_id,storage_path,sort_order");
  if (photoError) throw photoError;

  const photosByDog = new Map();
  for (const photo of existingPhotos || []) {
    const list = photosByDog.get(photo.dog_id) || [];
    list.push(photo);
    photosByDog.set(photo.dog_id, list);
  }

  console.log("🔊 Finding bark clips...");
  let audioPool = await searchCommonsMedia(
    [
      "dog barking filetype:audio",
      "dog bark filetype:audio",
      "barking dog filetype:audio",
      "dog sound filetype:audio",
    ],
    "audio",
    30,
    { maxBytes: 2 * 1024 * 1024 },
  );

  if (audioPool.length < 4) {
    audioPool = await searchCommonsMedia(
      ["dog barking", "dog bark", "barking dog"],
      "audio",
      30,
      { maxBytes: 3 * 1024 * 1024 },
    );
  }
  console.log(`   found ${audioPool.length} eligible bark/audio files`);

  console.log("🎬 Finding short dog videos...");
  let videoPool = await searchCommonsMedia(
    [
      "dog playing filetype:video",
      "dog running filetype:video",
      "dog park filetype:video",
      "pet dog filetype:video",
    ],
    "video",
    35,
    { maxBytes: 6 * 1024 * 1024 },
  );

  if (videoPool.length < 4) {
    videoPool = await searchCommonsMedia(
      ["dog playing", "dog running", "pet dog"],
      "video",
      35,
      { maxBytes: 10 * 1024 * 1024 },
    );
  }
  console.log(`   found ${videoPool.length} eligible videos\n`);

  const sourceCredits = [];
  const photoPoolCache = new Map();
  let totalPhotosAdded = 0;
  let totalVideosAdded = 0;
  let totalAudioAdded = 0;

  for (let dogIndex = 0; dogIndex < dogs.length; dogIndex += 1) {
    const dog = dogs[dogIndex];
    console.log(`\n[${dogIndex + 1}/${dogs.length}] ${dog.name} (${dog.breed || "Mixed"})`);

    const currentPhotos = (photosByDog.get(dog.id) || []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const photosNeeded = FORCE
      ? PHOTOS_PER_DOG
      : Math.max(0, PHOTOS_PER_DOG - currentPhotos.length);

    if (FORCE && currentPhotos.length) {
      const { error } = await admin
        .from("dog_photos")
        .delete()
        .eq("dog_id", dog.id);
      if (error) throw error;
    }

    if (photosNeeded > 0) {
      const cacheKey = String(dog.breed || "mixed").toLowerCase().trim();
      let photoPool = photoPoolCache.get(cacheKey);

      if (!photoPool) {
        console.log("  📷 finding breed-compatible photos...");
        photoPool = await searchCommonsMedia(
          breedQueries(dog),
          "photo",
          28,
          { thumbWidth: 1000 },
        );
        photoPoolCache.set(cacheKey, photoPool);
      }

      if (!photoPool.length) {
        console.warn("  ⚠️ no eligible photos found; leaving existing photos as-is");
      } else {
        const candidates = chooseRotating(
          photoPool,
          dogIndex,
          Math.min(photoPool.length, photosNeeded + 8),
        );
        let inserted = 0;
        const startSort = FORCE
          ? 0
          : currentPhotos.reduce(
              (max, p) => Math.max(max, Number(p.sort_order || 0)),
              -1,
            ) + 1;

        for (let i = 0; i < candidates.length && inserted < photosNeeded; i += 1) {
          const item = candidates[i];
          try {
            const storagePath = await uploadDogAsset({
              dog,
              item,
              kind: "photo",
              slot: startSort + inserted,
              maxBytes: 4 * 1024 * 1024,
            });
            const { error } = await admin.from("dog_photos").insert({
              dog_id: dog.id,
              storage_path: storagePath,
              sort_order: startSort + inserted,
            });
            if (error) throw error;

            inserted += 1;
            totalPhotosAdded += 1;
            sourceCredits.push({
              dog_id: dog.id,
              dog_name: dog.name,
              media_type: "photo",
              storage_path: storagePath,
              source_page: item.sourcePage,
              source_file: item.originalUrl,
              artist: item.artist,
              license: item.license,
              license_url: item.licenseUrl,
            });
            process.stdout.write("  📷 +1 ");
          } catch (error) {
            console.warn(`\n  photo skipped: ${error.message}`);
          }
        }
        process.stdout.write("\n");
      }
    } else {
      console.log(`  📷 already has ${currentPhotos.length} photos`);
    }

    const currentVideo = FORCE ? null : dog.video_path;
    if (!currentVideo && videoPool.length) {
      const item = videoPool[dogIndex % videoPool.length];
      try {
        const storagePath = await uploadDogAsset({
          dog,
          item,
          kind: "video",
          slot: 0,
          maxBytes: 10 * 1024 * 1024,
        });
        const { error } = await admin
          .from("dogs")
          .update({ video_path: storagePath })
          .eq("id", dog.id);
        if (error) throw error;
        totalVideosAdded += 1;
        sourceCredits.push({
          dog_id: dog.id,
          dog_name: dog.name,
          media_type: "video",
          storage_path: storagePath,
          source_page: item.sourcePage,
          source_file: item.originalUrl,
          artist: item.artist,
          license: item.license,
          license_url: item.licenseUrl,
        });
        console.log("  🎬 video added");
      } catch (error) {
        console.warn(`  ⚠️ video skipped: ${error.message}`);
      }
    } else if (currentVideo) {
      console.log("  🎬 already has a video");
    } else {
      console.log("  ⚠️ no eligible video found");
    }

    const currentAudio = FORCE ? null : dog.bark_audio_path;
    if (!currentAudio && audioPool.length) {
      const item = audioPool[(dogIndex * 5) % audioPool.length];
      try {
        const storagePath = await uploadDogAsset({
          dog,
          item,
          kind: "audio",
          slot: 0,
          maxBytes: 3 * 1024 * 1024,
        });
        const { error } = await admin
          .from("dogs")
          .update({ bark_audio_path: storagePath })
          .eq("id", dog.id);
        if (error) throw error;
        totalAudioAdded += 1;
        sourceCredits.push({
          dog_id: dog.id,
          dog_name: dog.name,
          media_type: "audio",
          storage_path: storagePath,
          source_page: item.sourcePage,
          source_file: item.originalUrl,
          artist: item.artist,
          license: item.license,
          license_url: item.licenseUrl,
        });
        console.log("  🔊 bark/audio added");
      } catch (error) {
        console.warn(`  ⚠️ bark skipped: ${error.message}`);
      }
    } else if (currentAudio) {
      console.log("  🔊 already has bark/audio");
    } else {
      console.log("  ⚠️ no eligible bark clip found");
    }
  }

  const publicDir = path.join(process.cwd(), "public");
  await mkdir(publicDir, { recursive: true });

  const creditsPath = path.join(publicDir, "demo-media-attribution.json");
  await writeFile(
    creditsPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source: "Wikimedia Commons",
        note:
          "Demo media only. Each item retains the license shown on its Wikimedia Commons file page.",
        items: sourceCredits,
      },
      null,
      2,
    ),
    "utf8",
  );

  const htmlItems = sourceCredits
    .map(
      (item) => `<li>
        <strong>${item.dog_name}</strong> — ${item.media_type} —
        <a href="${item.source_page}" target="_blank" rel="noreferrer">source</a>
        — ${item.artist || "Wikimedia Commons contributor"}
        — ${item.license || "free license"}
        ${item.license_url ? `— <a href="${item.license_url}" target="_blank" rel="noreferrer">license</a>` : ""}
      </li>`,
    )
    .join("\n");

  await writeFile(
    path.join(publicDir, "demo-media-attribution.html"),
    `<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<title>TinDog demo media credits</title>
<style>
body{font-family:system-ui,sans-serif;max-width:980px;margin:40px auto;padding:0 20px;line-height:1.55}
li{margin:10px 0} a{color:#e91e63}
</style>
<h1>TinDog demo media credits</h1>
<p>Media was downloaded from Wikimedia Commons. License requirements remain attached to each source file.</p>
<ul>${htmlItems}</ul>
</html>`,
    "utf8",
  );

  console.log("\n✅ Demo media fill complete");
  console.log(`   dogs processed: ${dogs.length}`);
  console.log(`   photos added: ${totalPhotosAdded}`);
  console.log(`   videos added: ${totalVideosAdded}`);
  console.log(`   bark/audio clips added: ${totalAudioAdded}`);
  console.log("   credits: /demo-media-attribution.html");
}

main().catch((error) => {
  console.error("\n❌ Demo media fill failed:");
  console.error(error);
  process.exit(1);
});
