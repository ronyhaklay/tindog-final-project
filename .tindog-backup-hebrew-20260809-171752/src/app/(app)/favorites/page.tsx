import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { formatAge } from "@/lib/deck";
import { publicPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { Dog, DogPhoto, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Saved dogs" };

type FavoriteRow = {
  dog_id: string;
  created_at: string;
  dogs: Dog & { dog_photos: DogPhoto[]; profiles: Profile };
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "adopter") redirect("/shelter");

  const { data } = await supabase
    .from("favorites")
    .select("dog_id, created_at, dogs(*, dog_photos(*), profiles(*))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteRow[]>();

  const favorites = data ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookmarkIcon className="size-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved dogs</h1>
          <p className="text-sm text-muted-foreground">A quiet shortlist for dogs you want to revisit before sending a request.</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card className="border-dashed bg-white/75">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><SparklesIcon className="size-6" /></div>
            <p className="text-lg font-semibold">No saved dogs yet</p>
            <p className="max-w-md text-sm text-muted-foreground">Tap the bookmark on a dog card when someone catches your eye but you are not ready to swipe right yet.</p>
            <Link href="/swipe"><Button>Discover dogs</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ dog_id, dogs: dog }) => {
            const cover = dog.dog_photos.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <Card key={dog_id} className="group overflow-hidden border-white/80 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative h-64 bg-muted">
                  {cover ? (
                    <Image src={publicPhotoUrl(cover.storage_path)} alt={dog.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  ) : <div className="flex h-full items-center justify-center text-muted-foreground">No photo</div>}
                  <div className="absolute top-3 left-3"><Badge>{LISTING_TYPE_LABELS[dog.listing_type]}</Badge></div>
                  <div className="absolute top-3 right-3"><FavoriteButton dogId={dog.id} initialFavorited compact /></div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
                    <h2 className="text-2xl font-bold">{dog.name} <span className="text-lg font-normal text-white/85">{formatAge(Number(dog.age_years))}</span></h2>
                    <p className="flex items-center gap-1 text-sm text-white/90"><MapPinIcon className="size-3.5" />{dog.city} · {dog.breed || "Mixed breed"}</p>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{dog.temperament || dog.description || `Listed by ${dog.profiles.display_name}`}</p>
                  <Link href={`/dogs/${dog.id}`}><Button variant="outline" size="sm">View</Button></Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
