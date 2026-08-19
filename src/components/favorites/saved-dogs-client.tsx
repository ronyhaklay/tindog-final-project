"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Button } from "@/components/ui/button";
import { publicPhotoUrl } from "@/lib/photos";

type SavedDog = {
  id: string;
  name: string;
  breed?: string | null;
  city?: string | null;
  dog_photos?: Array<{ storage_path: string; sort_order?: number }> | null;
};

export function SavedDogsClient({ dogs }: { dogs: SavedDog[] }) {
  const [he, setHe] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setHe(root.dir === "rtl" || root.lang?.toLowerCase().startsWith("he"));
  }, []);

  return (
    <div dir={he ? "rtl" : "ltr"} className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookmarkIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {he ? "הכלבים ששמרתי" : "Saved dogs"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {he
              ? "כל הכלבים שסימנת כדי לחזור אליהם בהמשך."
              : "Your shortlist of dogs you want to revisit."}
          </p>
        </div>
      </div>

      {dogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-white/80 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SparklesIcon className="size-6" />
          </div>
          <p className="text-lg font-bold">
            {he ? "עדיין לא שמרת כלבים" : "No saved dogs yet"}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {he
              ? "לחצי על סימן השמירה בכרטיס של כלב והוא יופיע כאן."
              : "Tap the bookmark on a dog card and it will appear here."}
          </p>
          <Link href="/swipe">
            <Button>{he ? "חזרה לכלבים" : "Discover dogs"}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => {
            const cover = [...(dog.dog_photos || [])].sort(
              (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
            )[0];

            return (
              <article
                key={dog.id}
                className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-sm"
              >
                <div className="relative aspect-[4/5] bg-muted">
                  {cover ? (
                    <img
                      src={publicPhotoUrl(cover.storage_path)}
                      alt={dog.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {he ? "אין תמונה" : "No photo"}
                    </div>
                  )}

                  <div className="absolute right-3 top-3">
                    <FavoriteButton dogId={dog.id} initialFavorited compact />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16 text-white">
                    <h2 className="text-2xl font-black">{dog.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
                      <MapPinIcon className="size-3.5" />
                      {dog.city || ""} · {dog.breed || (he ? "מעורב" : "Mixed breed")}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <Link href={`/dogs/${dog.id}`}>
                    <Button variant="outline" className="w-full">
                      {he ? "תצוגה מלאה" : "Full profile"}
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
