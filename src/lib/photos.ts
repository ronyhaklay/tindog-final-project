import { STORAGE_BUCKET } from "./constants";

// Builds the public URL for a photo stored in the dog-photos bucket.
export function publicPhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}
