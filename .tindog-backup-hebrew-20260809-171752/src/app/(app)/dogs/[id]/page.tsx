import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CatIcon,
  CheckCircle2Icon,
  DogIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MapPinIcon,
  VideoIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  Volume2Icon,
  ZapIcon,
} from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DOG_SIZE_LABELS, ENERGY_LEVEL_LABELS, LISTING_TYPE_LABELS } from "@/lib/constants";
import { formatAge } from "@/lib/deck";
import { computeMatchScore } from "@/lib/match-score";
import { publicDogMediaUrl, publicPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { Dog, DogPhoto, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Dog profile" };
type DogDetail = Dog & { dog_photos: DogPhoto[]; profiles: Profile };

export default async function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: viewer } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();
  const { data: dog } = await supabase.from("dogs").select("*, dog_photos(*), profiles(*)").eq("id", id).single<DogDetail>();
  if (!dog) notFound();

  const { data: favorite } = viewer?.role === "adopter"
    ? await supabase.from("favorites").select("dog_id").eq("user_id", user!.id).eq("dog_id", dog.id).maybeSingle()
    : { data: null };

  const photos = dog.dog_photos.slice().sort((a, b) => a.sort_order - b.sort_order);
  const isOwn = dog.owner_id === user!.id;
  const score = computeMatchScore(viewer ?? null, dog);
  const compatibility = [
    { ok: dog.good_with_kids, label: "Good with kids", icon: UsersIcon },
    { ok: dog.good_with_dogs, label: "Good with dogs", icon: DogIcon },
    { ok: dog.good_with_cats, label: "Good with cats", icon: CatIcon },
    { ok: dog.house_trained, label: "House trained", icon: HomeIcon },
    { ok: dog.vaccinated, label: "Vaccinated", icon: ShieldCheckIcon },
    { ok: dog.neutered, label: "Spayed / neutered", icon: CheckCircle2Icon },
  ].filter((item) => item.ok);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href={viewer?.role === "shelter_admin" ? "/dogs" : "/swipe"}><Button variant="ghost"><ArrowLeftIcon data-icon="inline-start" />Back</Button></Link>
        {!isOwn && viewer?.role === "adopter" && <FavoriteButton dogId={dog.id} initialFavorited={Boolean(favorite)} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {photos.length > 0 ? photos.map((photo, index) => (
              <div key={photo.id} className={`relative overflow-hidden rounded-3xl bg-muted ${index === 0 ? "aspect-[4/5] sm:row-span-2" : "aspect-square"}`}>
                <Image src={publicPhotoUrl(photo.storage_path)} alt={`${dog.name} photo ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority={index === 0} />
              </div>
            )) : <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 sm:col-span-2"><DogIcon className="size-24 text-primary/25" /></div>}
          </div>

          {dog.video_path && (
            <Card className="overflow-hidden border-white/80 bg-white/90">
              <CardContent className="p-3">
                <p className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold"><VideoIcon className="size-4 text-primary" />See {dog.name} in action</p>
                <video src={publicDogMediaUrl(dog.video_path)} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-cover" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-white/80 bg-white/92 shadow-lg shadow-rose-100/30">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{LISTING_TYPE_LABELS[dog.listing_type]}</Badge>
                {dog.gender && <Badge variant="secondary">{dog.gender === "female" ? "Female" : "Male"}</Badge>}
                {viewer?.role === "adopter" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><SparklesIcon className="size-3" />{score}% lifestyle fit</Badge>}
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Meet {dog.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground"><MapPinIcon className="size-4" />{dog.city} · {dog.breed || "Mixed breed"} · {formatAge(Number(dog.age_years))}</p>
              <div className="mt-5 flex flex-wrap gap-2"><Badge variant="secondary">{DOG_SIZE_LABELS[dog.size]}</Badge><Badge variant="secondary"><ZapIcon className="size-3" />{ENERGY_LEVEL_LABELS[dog.energy_level]}</Badge></div>

              {dog.bark_audio_path && (
                <div className="mt-5 rounded-2xl bg-gradient-to-r from-fuchsia-50 to-rose-50 p-4">
                  <p className="mb-2 flex items-center gap-2 font-semibold"><Volume2Icon className="size-4 text-primary" />Hear {dog.name} say hi</p>
                  <audio src={publicDogMediaUrl(dog.bark_audio_path)} controls preload="none" className="w-full" />
                </div>
              )}

              {dog.temperament && <div className="mt-5 rounded-2xl bg-rose-50 p-4"><p className="mb-1 flex items-center gap-2 font-semibold"><SparklesIcon className="size-4 text-primary" />Personality</p><p className="leading-relaxed text-rose-950">{dog.temperament}</p></div>}
              {dog.description && <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">{dog.description}</p>}
              {dog.special_needs && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Good to know:</strong> {dog.special_needs}</div>}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/90"><CardContent className="pt-5"><h2 className="font-semibold">A good fit for...</h2>{compatibility.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{compatibility.map(({ label, icon: Icon }) => <div key={label} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm"><Icon className="size-4 text-primary" />{label}</div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Compatibility details have not been added yet.</p>}</CardContent></Card>

          <Card className="border-primary/15 bg-gradient-to-br from-white to-rose-50">
            <CardContent className="flex items-start gap-3 pt-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><HeartHandshakeIcon className="size-5" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{dog.profiles.shelter_name || dog.profiles.display_name}</p>{dog.profiles.shelter_verified && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><ShieldCheckIcon className="size-3" />Verified shelter</Badge>}</div>
                {dog.profiles.shelter_about && <p className="mt-2 text-sm leading-6 text-muted-foreground">{dog.profiles.shelter_about}</p>}
                {viewer?.role === "adopter" && <p className="mt-2 text-sm text-muted-foreground">Swipe right in Discover to send your interest. If the shelter approves, TinDog celebrates the match and opens your private chat.</p>}
                {isOwn && <Link href={`/dogs/${dog.id}/edit`} className="mt-3 inline-block"><Button variant="outline" size="sm">Edit this listing</Button></Link>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
