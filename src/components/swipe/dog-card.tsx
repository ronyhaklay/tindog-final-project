"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CatIcon, CheckCircle2Icon, DogIcon, HomeIcon, InfoIcon, MapPinIcon, VideoIcon, ShieldCheckIcon, SparklesIcon, UsersIcon, Volume2Icon, ZapIcon } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { dogSizeLabel, energyLevelLabel, listingTypeLabel } from "@/lib/i18n";
import { formatAge } from "@/lib/deck";
import { publicDogMediaUrl, publicPhotoUrl } from "@/lib/photos";
import {
  hebrewBreed,
  hebrewCity,
  hebrewDescription,
  hebrewShelterName,
  hebrewSpecialNeeds,
  hebrewTemperament,
} from "@/lib/dog-hebrew";
import type { DeckDog } from "@/lib/types";

export function DogCard({ dog }: { dog: DeckDog }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [barking, setBarking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { locale, isHebrew } = useLanguage();
  const photos = dog.photo_paths;
  function nextPhoto(delta: number) {
    if (photos.length > 1) {
      setPhotoIndex((i) => (i + delta + photos.length) % photos.length);
    }
  }

  async function toggleBark() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setBarking(false);
      return;
    }
    try {
      await audio.play();
      setBarking(true);
    } catch {
      setBarking(false);
    }
  }
  const compatibility = [
    dog.good_with_kids && { label: isHebrew ? "ילדים" : "Kids", icon: UsersIcon }, dog.good_with_dogs && { label: isHebrew ? "כלבים" : "Dogs", icon: DogIcon },
    dog.good_with_cats && { label: isHebrew ? "חתולים" : "Cats", icon: CatIcon }, dog.house_trained && { label: isHebrew ? "מחונך לצרכים" : "House trained", icon: HomeIcon },
    dog.vaccinated && { label: isHebrew ? "מחוסן" : "Vaccinated", icon: ShieldCheckIcon },
  ].filter(Boolean) as { label: string; icon: typeof DogIcon }[];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[30px] bg-card shadow-2xl shadow-slate-200/70 ring-1 ring-foreground/10">
      <div className="relative min-h-0 flex-[1.3] bg-muted">
        {photos.length ? <Image src={publicPhotoUrl(photos[photoIndex])} alt={`${dog.name} photo ${photoIndex + 1}`} fill sizes="(max-width: 640px) 100vw, 520px" priority className="object-cover" draggable={false} /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50"><DogIcon className="size-20 text-primary/30" /></div>}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              data-no-swipe
              aria-label={isHebrew ? "תמונה קודמת" : "Previous photo"}
              className="absolute inset-y-0 left-0 z-10 w-1/3"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto(-1);
              }}
            />
            <button
              type="button"
              data-no-swipe
              aria-label={isHebrew ? "תמונה הבאה" : "Next photo"}
              className="absolute inset-y-0 right-0 z-10 w-1/3"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto(1);
              }}
            />
            <div className="absolute top-3 right-3 left-3 z-20 flex gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  data-no-swipe
                  aria-label={`${isHebrew ? "מעבר לתמונה" : "Go to photo"} ${i + 1}`}
                  className={`h-1 flex-1 rounded-full shadow transition ${
                    i === photoIndex ? "bg-white" : "bg-white/45 hover:bg-white/70"
                  }`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(i);
                  }}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-4 right-4 z-20"><FavoriteButton dogId={dog.id} initialFavorited={dog.is_favorited} compact /></div>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {dog.match_score && <Badge className="border-white/30 bg-emerald-500/90 text-white shadow-lg backdrop-blur hover:bg-emerald-500"><SparklesIcon className="size-3" />{dog.match_score}% {isHebrew ? "התאמה" : "fit"}</Badge>}
          <div className="flex gap-1.5">
            {dog.video_path && (
              <button
                type="button"
                data-no-swipe
                className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                }}
              >
                <VideoIcon className="size-3" />
                {isHebrew ? "וידאו" : "Video"}
              </button>
            )}
            {dog.bark_audio_path && (
              <>
                <audio
                  ref={audioRef}
                  src={publicDogMediaUrl(dog.bark_audio_path)}
                  preload="metadata"
                  onEnded={() => setBarking(false)}
                  onPause={() => setBarking(false)}
                />
                <button
                  type="button"
                  data-no-swipe
                  className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleBark();
                  }}
                >
                  <Volume2Icon className="size-3" />
                  {barking
                    ? isHebrew
                      ? "עצור"
                      : "Stop"
                    : isHebrew
                      ? "נביחה"
                      : "Bark"}
                </button>
              </>
            )}
          </div>
        </div>
        {showVideo && dog.video_path && (
          <div
            data-no-swipe
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 p-3"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={publicDogMediaUrl(dog.video_path)}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-full max-w-full rounded-2xl"
            />
            <button
              type="button"
              data-no-swipe
              aria-label={isHebrew ? "סגירת וידאו" : "Close video"}
              className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/95 text-lg font-black text-slate-900 shadow"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setShowVideo(false);
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-24 text-white">
          <div className="mb-2 flex items-center gap-2"><Badge className="border-white/20 bg-white/20 text-white backdrop-blur hover:bg-white/25">{listingTypeLabel(locale, dog.listing_type)}</Badge>{dog.gender && <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{dog.gender === "female" ? (isHebrew ? "נקבה" : "Female") : (isHebrew ? "זכר" : "Male")}</Badge>}</div>
          <h2 className="text-3xl font-black tracking-tight">{dog.name}</h2>
          <p className="mt-0.5 text-base font-semibold text-white/85">
            {formatAge(Number(dog.age_years), isHebrew ? "he" : "en")}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-white/90">
            <MapPinIcon className="size-4" />
            <span>{dog.city}</span>
            {dog.distance_km != null && (
              <>
                <span aria-hidden>·</span>
                <span className="font-semibold text-white">
                  {dog.distance_km <= 1
                    ? (isHebrew ? "פחות מק״מ ממך" : "less than 1 km away")
                    : (isHebrew ? `${dog.distance_km} ק״מ ממך` : `${dog.distance_km} km away`)}
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{dog.breed || (isHebrew ? "מעורב" : "Mixed breed")}</span>
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5 text-sm">
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{dogSizeLabel(locale, dog.size).split(" (")[0].split(" (")[0]}</Badge><Badge variant="secondary"><ZapIcon className="size-3" />{energyLevelLabel(locale, dog.energy_level)}</Badge>{compatibility.slice(0, 3).map(({ label, icon: Icon }) => <Badge key={label} variant="outline"><Icon className="size-3" />{label}</Badge>)}</div>
        {dog.temperament && <div className="rounded-xl bg-rose-50/70 p-3 text-rose-950"><p className="mb-1 flex items-center gap-1.5 font-semibold"><SparklesIcon className="size-4 text-primary" />{isHebrew ? "אישיות" : "Personality"}</p><p className="line-clamp-2">{isHebrew ? hebrewTemperament(dog) : dog.temperament}</p></div>}
        {dog.description && <p className="line-clamp-3 leading-relaxed text-muted-foreground">{isHebrew ? hebrewDescription(dog) : dog.description}</p>}
        {dog.special_needs && <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0" /><span><strong>{isHebrew ? "חשוב לדעת:" : "Good to know:"}</strong> {dog.special_needs}</span></p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1"><p className="min-w-0 truncate text-xs text-muted-foreground">{dog.shelter_verified ? "✓ " : ""}{dog.shelter_name || dog.owner_name}</p><Link data-no-swipe href={`/dogs/${dog.id}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}><Button type="button" variant="ghost" size="sm"><InfoIcon data-icon="inline-start" />{isHebrew ? "פרופיל מלא" : "Full profile"}</Button></Link></div>
      </div>
    </article>
  );
}
