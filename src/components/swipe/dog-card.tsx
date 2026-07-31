"use client";

import Image from "next/image";
import { useState } from "react";
import { DogIcon, MapPinIcon, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DOG_SIZE_LABELS,
  ENERGY_LEVEL_LABELS,
  LISTING_TYPE_LABELS,
} from "@/lib/constants";
import { formatAge } from "@/lib/deck";
import { publicPhotoUrl } from "@/lib/photos";
import type { DeckDog } from "@/lib/types";

// Presentational swipe card with a tap-through photo carousel.
export function DogCard({ dog }: { dog: DeckDog }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = dog.photo_paths;

  function nextPhoto(delta: number) {
    if (photos.length < 2) return;
    setPhotoIndex((i) => (i + delta + photos.length) % photos.length);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="relative aspect-[4/5] bg-muted">
        {photos.length > 0 ? (
          <Image
            src={publicPhotoUrl(photos[photoIndex])}
            alt={`${dog.name} photo ${photoIndex + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            priority
            className="object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <DogIcon className="size-16 text-muted-foreground" />
          </div>
        )}

        {/* invisible left/right tap zones for the carousel */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="absolute inset-y-0 left-0 w-1/3"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto(-1);
              }}
            />
            <button
              type="button"
              aria-label="Next photo"
              className="absolute inset-y-0 right-0 w-1/3"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto(1);
              }}
            />
            <div className="absolute top-2 right-0 left-0 flex justify-center gap-1 px-3">
              {photos.map((p, i) => (
                <span
                  key={p}
                  className={`h-1 flex-1 rounded-full ${
                    i === photoIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">
                {dog.name}
                <span className="ml-2 text-lg font-normal">
                  {formatAge(Number(dog.age_years))}
                </span>
              </h2>
              <p className="flex items-center gap-1 text-sm text-white/90">
                <MapPinIcon className="size-3.5" />
                {dog.city} · {dog.breed || "Mixed"}
              </p>
            </div>
            <Badge className="shrink-0">
              {LISTING_TYPE_LABELS[dog.listing_type]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{DOG_SIZE_LABELS[dog.size]}</Badge>
          <Badge variant="secondary">
            <ZapIcon className="size-3" />
            {ENERGY_LEVEL_LABELS[dog.energy_level]}
          </Badge>
        </div>
        {dog.temperament && (
          <p>
            <span className="font-medium">Temperament:</span> {dog.temperament}
          </p>
        )}
        {dog.special_needs && (
          <p>
            <span className="font-medium">Special needs:</span>{" "}
            {dog.special_needs}
          </p>
        )}
        {dog.description && (
          <p className="text-muted-foreground">{dog.description}</p>
        )}
        <p className="mt-auto pt-1 text-xs text-muted-foreground">
          Published by {dog.owner_name}
        </p>
      </div>
    </div>
  );
}
