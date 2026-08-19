"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CatIcon, CheckCircle2Icon, DogIcon, HomeIcon, InfoIcon, MapPinIcon, VideoIcon, ShieldCheckIcon, SparklesIcon, UsersIcon, Volume2Icon, ZapIcon } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOG_SIZE_LABELS, ENERGY_LEVEL_LABELS, LISTING_TYPE_LABELS } from "@/lib/constants";
import { formatAge } from "@/lib/deck";
import { publicPhotoUrl } from "@/lib/photos";
import type { DeckDog } from "@/lib/types";

export function DogCard({ dog }: { dog: DeckDog }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = dog.photo_paths;
  function nextPhoto(delta: number) { if (photos.length > 1) setPhotoIndex((i) => (i + delta + photos.length) % photos.length); }
  const compatibility = [
    dog.good_with_kids && { label: "Kids", icon: UsersIcon }, dog.good_with_dogs && { label: "Dogs", icon: DogIcon },
    dog.good_with_cats && { label: "Cats", icon: CatIcon }, dog.house_trained && { label: "House trained", icon: HomeIcon },
    dog.vaccinated && { label: "Vaccinated", icon: ShieldCheckIcon },
  ].filter(Boolean) as { label: string; icon: typeof DogIcon }[];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[30px] bg-card shadow-2xl shadow-slate-200/70 ring-1 ring-foreground/10">
      <div className="relative min-h-0 flex-[1.3] bg-muted">
        {photos.length ? <Image src={publicPhotoUrl(photos[photoIndex])} alt={`${dog.name} photo ${photoIndex + 1}`} fill sizes="(max-width: 640px) 100vw, 520px" priority className="object-cover" draggable={false} /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50"><DogIcon className="size-20 text-primary/30" /></div>}
        {photos.length > 1 && <><button type="button" aria-label="Previous photo" className="absolute inset-y-0 left-0 w-1/3" onClick={(e) => { e.stopPropagation(); nextPhoto(-1); }} /><button type="button" aria-label="Next photo" className="absolute inset-y-0 right-0 w-1/3" onClick={(e) => { e.stopPropagation(); nextPhoto(1); }} /><div className="absolute top-3 right-3 left-3 flex gap-1.5">{photos.map((p, i) => <span key={p} className={`h-1 flex-1 rounded-full shadow ${i === photoIndex ? "bg-white" : "bg-white/45"}`} />)}</div></>}
        <div className="absolute top-4 right-4 z-20"><FavoriteButton dogId={dog.id} initialFavorited={dog.is_favorited} compact /></div>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {dog.match_score && <Badge className="border-white/30 bg-emerald-500/90 text-white shadow-lg backdrop-blur hover:bg-emerald-500"><SparklesIcon className="size-3" />{dog.match_score}% fit</Badge>}
          <div className="flex gap-1.5">{dog.video_path && <Badge className="border-white/30 bg-black/45 text-white backdrop-blur"><VideoIcon className="size-3" />Video</Badge>}{dog.bark_audio_path && <Badge className="border-white/30 bg-black/45 text-white backdrop-blur"><Volume2Icon className="size-3" />Bark</Badge>}</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-24 text-white">
          <div className="mb-2 flex items-center gap-2"><Badge className="border-white/20 bg-white/20 text-white backdrop-blur hover:bg-white/25">{LISTING_TYPE_LABELS[dog.listing_type]}</Badge>{dog.gender && <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{dog.gender === "female" ? "Female" : "Male"}</Badge>}</div>
          <h2 className="text-3xl font-black tracking-tight">{dog.name}<span className="ml-2 text-xl font-medium text-white/85">{formatAge(Number(dog.age_years))}</span></h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90"><MapPinIcon className="size-4" />{dog.city} · {dog.breed || "Mixed breed"}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5 text-sm">
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{DOG_SIZE_LABELS[dog.size].split(" (")[0]}</Badge><Badge variant="secondary"><ZapIcon className="size-3" />{ENERGY_LEVEL_LABELS[dog.energy_level]}</Badge>{compatibility.slice(0, 3).map(({ label, icon: Icon }) => <Badge key={label} variant="outline"><Icon className="size-3" />{label}</Badge>)}</div>
        {dog.temperament && <div className="rounded-xl bg-rose-50/70 p-3 text-rose-950"><p className="mb-1 flex items-center gap-1.5 font-semibold"><SparklesIcon className="size-4 text-primary" />Personality</p><p className="line-clamp-2">{dog.temperament}</p></div>}
        {dog.description && <p className="line-clamp-3 leading-relaxed text-muted-foreground">{dog.description}</p>}
        {dog.special_needs && <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0" /><span><strong>Good to know:</strong> {dog.special_needs}</span></p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1"><p className="min-w-0 truncate text-xs text-muted-foreground">{dog.shelter_verified ? "✓ " : ""}{dog.shelter_name || dog.owner_name}</p><Link href={`/dogs/${dog.id}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}><Button type="button" variant="ghost" size="sm"><InfoIcon data-icon="inline-start" />Full profile</Button></Link></div>
      </div>
    </article>
  );
}
