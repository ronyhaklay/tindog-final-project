"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import {
  MAX_PHOTOS_PER_DOG,
  MAX_PHOTO_SIZE_BYTES,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { publicPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";

// Uploads images straight from the browser to Supabase Storage
// (dog-photos/<user_id>/<uuid>.<ext>). The server never proxies the
// bytes; the form only submits the resulting storage paths.
export function PhotoUploader({
  initialPaths,
}: {
  initialPaths: string[];
}) {
  const [paths, setPaths] = useState<string[]>(initialPaths);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isHebrew } = useLanguage();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_PHOTOS_PER_DOG - paths.length;
    const selected = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(isHebrew ? `אפשר להעלות עד ${MAX_PHOTOS_PER_DOG} תמונות.` : `You can upload up to ${MAX_PHOTOS_PER_DOG} photos.`);
    }

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError(isHebrew ? "אפשר להעלות קבצי תמונה בלבד." : "Only image files are allowed.");
        return;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setError(isHebrew ? "כל תמונה יכולה להיות עד 5MB." : "Each photo must be at most 5MB.");
        return;
      }
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(isHebrew ? "צריך להתחבר כדי להעלות תמונות." : "You must be logged in to upload photos.");
        return;
      }

      const uploaded: string[] = [];
      for (const file of selected) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type });
        if (uploadError) {
          setError(isHebrew ? "ההעלאה נכשלה. נסו שוב." : "Upload failed. Please try again.");
          return;
        }
        uploaded.push(path);
      }
      setPaths((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(path: string) {
    setPaths((prev) => prev.filter((p) => p !== path));
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Submitted with the form and validated server-side */}
      <input type="hidden" name="photoPaths" value={JSON.stringify(paths)} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {paths.map((path) => (
          <div key={path} className="group relative aspect-square">
            <Image
              src={publicPhotoUrl(path)}
              alt={isHebrew ? "תמונת כלב" : "Dog photo"}
              fill
              sizes="120px"
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(path)}
              aria-label={isHebrew ? "הסרת תמונה" : "Remove photo"}
              className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        ))}

        {paths.length < MAX_PHOTOS_PER_DOG && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <ImagePlusIcon className="size-5" />
            <span className="text-xs">{uploading ? (isHebrew ? "מעלה..." : "Uploading...") : (isHebrew ? "הוספה" : "Add")}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {isHebrew ? `עד ${MAX_PHOTOS_PER_DOG} תמונות, עד 5MB לכל תמונה. התמונה הראשונה תהיה תמונת הקאבר.` : `Up to ${MAX_PHOTOS_PER_DOG} photos, 5MB each. The first photo is the cover.`}
      </p>
      {uploading && (
        <Button type="button" variant="ghost" size="sm" disabled>
          {isHebrew ? "מעלה..." : "Uploading..."}
        </Button>
      )}
    </div>
  );
}
