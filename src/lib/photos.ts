import { DOG_MEDIA_BUCKET, STORAGE_BUCKET } from "./constants";

function publicStorageUrl(bucket: string, storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export function publicPhotoUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return publicStorageUrl(STORAGE_BUCKET, storagePath);
}

export function publicDogMediaUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return publicStorageUrl(DOG_MEDIA_BUCKET, storagePath);
}
